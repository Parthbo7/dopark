-- Dynamic Space Optimization System Definition
-- Run this script in the Supabase SQL Editor.

-- 1. Augment Slot Structure
ALTER TABLE parking_slots 
ADD COLUMN IF NOT EXISTS base_type VARCHAR(50), 
ADD COLUMN IF NOT EXISTS current_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS capacity_units INT DEFAULT 3,
ADD COLUMN IF NOT EXISTS parent_slot_id UUID REFERENCES parking_slots(slot_id),
ADD COLUMN IF NOT EXISTS is_flexible BOOLEAN DEFAULT true;

UPDATE parking_slots 
SET base_type = slot_type, 
    current_type = slot_type,
    capacity_units = CASE WHEN slot_type ILIKE 'car%' THEN 3 ELSE 1 END
WHERE base_type IS NULL OR current_type IS NULL;

-- 2. Configuration & Logging
CREATE TABLE IF NOT EXISTS app_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

INSERT INTO app_settings (setting_key, setting_value) 
VALUES ('space_optimisation_enabled', 'false'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS slot_conversions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_slot_id UUID REFERENCES parking_slots(slot_id),
    original_type VARCHAR(50),
    converted_type VARCHAR(50),
    split_child_ids UUID[],
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 3. Optimization RPC Function
CREATE OR REPLACE FUNCTION run_dynamic_space_optimization()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_enabled BOOLEAN;
    target_car_slot RECORD;
    i INT;
    new_bike_slot_id UUID;
    created_bike_slots UUID[];
    merge_parent RECORD;
BEGIN
    SELECT (setting_value::text)::boolean INTO is_enabled 
    FROM app_settings WHERE setting_key = 'space_optimisation_enabled';
    
    IF NOT is_enabled THEN
        RETURN;
    END IF;

    -- LOGIC BRANCH A: High Bike Demand (Split 1 Car -> 3 Bikes)
    -- We assume current demand requires more bikes. This can be complex, but for POC we do 1 conversion per run.
    SELECT * INTO target_car_slot 
    FROM parking_slots 
    WHERE current_type ILIKE 'car%' AND is_occupied = false AND is_flexible = true AND parent_slot_id IS NULL
    LIMIT 1 FOR UPDATE;

    IF FOUND THEN
        UPDATE parking_slots SET is_occupied = true, current_type = 'split_parent' WHERE slot_id = target_car_slot.slot_id;

        created_bike_slots := ARRAY[]::UUID[];
        FOR i IN 1..3 LOOP
            INSERT INTO parking_slots (slot_number, slot_type, is_occupied, base_type, current_type, capacity_units, parent_slot_id, is_flexible)
            VALUES (target_car_slot.slot_number || '_B' || i, 'Bike', false, 'bike', 'bike', 1, target_car_slot.slot_id, true) 
            RETURNING slot_id INTO new_bike_slot_id;

            created_bike_slots := array_append(created_bike_slots, new_bike_slot_id);
        END LOOP;

        INSERT INTO slot_conversions (parent_slot_id, original_type, converted_type, split_child_ids, reason)
        VALUES (target_car_slot.slot_id, 'car', 'bike_split', created_bike_slots, 'High bike demand: Split 1 Car into 3 Bikes');
        
        RETURN; 
    END IF;

    -- LOGIC BRANCH B: High Car Demand (Merge 3 Empty Bikes back to 1 Car)
    -- Look for a parent car slot whose 3 bike children are all unoccupied
    FOR merge_parent IN 
        SELECT parent_slot_id, count(*) as child_count 
        FROM parking_slots 
        WHERE parent_slot_id IS NOT NULL AND is_occupied = false 
        GROUP BY parent_slot_id HAVING count(*) = 3
    LOOP
        -- Delete the 3 child bike slots
        DELETE FROM parking_slots WHERE parent_slot_id = merge_parent.parent_slot_id;
        
        -- Restore the parent car slot
        UPDATE parking_slots SET is_occupied = false, current_type = 'car' WHERE slot_id = merge_parent.parent_slot_id;

        INSERT INTO slot_conversions (parent_slot_id, original_type, converted_type, reason)
        VALUES (merge_parent.parent_slot_id, 'bike_split', 'car', 'High car demand: Merged 3 Bikes back to Car');
        
        RETURN;
    END LOOP;
END;
$$;
