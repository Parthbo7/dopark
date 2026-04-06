-- Run this in your Supabase SQL Editor to match your exact Database Schema Diagram

-- 1. PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  phone_number TEXT,
  vehicle_type TEXT,
  vehicle_number TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ( auth.uid() = id );
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ( auth.uid() = id );

-- Automatic Profile Creation Trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone_number, vehicle_type, vehicle_number, email)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'phone', 
    new.raw_user_meta_data->>'vehicle_type', 
    new.raw_user_meta_data->>'vehicle_number',
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. PARKING STATIONS TABLE
CREATE TABLE IF NOT EXISTS public.parking_stations (
  station_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  rating NUMERIC,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. PARKING SECTIONS TABLE (e.g. Basement B1, B2)
CREATE TABLE IF NOT EXISTS public.parking_sections (
  section_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID REFERENCES public.parking_stations(station_id) ON DELETE CASCADE,
  name TEXT NOT NULL
);

-- 4. PARKING SLOTS TABLE
CREATE TABLE IF NOT EXISTS public.parking_slots (
  slot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES public.parking_sections(section_id) ON DELETE CASCADE,
  slot_number TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  is_occupied BOOLEAN DEFAULT false
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.parking_slots;

-- 5. PRICING TABLE
CREATE TABLE IF NOT EXISTS public.pricing (
  pricing_id SERIAL PRIMARY KEY,
  station_id UUID REFERENCES public.parking_stations(station_id) ON DELETE CASCADE,
  vehicle_type TEXT NOT NULL,
  price_per_hour NUMERIC NOT NULL
);

-- 6. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.bookings (
  booking_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  slot_id UUID REFERENCES public.parking_slots(slot_id),
  station_id UUID REFERENCES public.parking_stations(station_id),
  vehicle_number TEXT,
  vehicle_type TEXT,
  start_time TIMESTAMP DEFAULT NOW(),
  end_time TIMESTAMP,
  total_price NUMERIC,
  payment_method TEXT DEFAULT 'UPI',
  status TEXT DEFAULT 'active'
);

-- 7. ATOMIC BOOKING LOGIC (RPC Function for Booking)
CREATE OR REPLACE FUNCTION book_parking_slot(
  p_user_id UUID, 
  p_slot_id UUID, 
  p_station_id UUID,
  p_vehicle_type TEXT,
  p_vehicle_number TEXT
) RETURNS JSON AS $$
DECLARE
  v_is_occupied BOOLEAN;
  v_booking_id UUID;
BEGIN
  -- Locking the row to prevent concurrent double bookings
  SELECT is_occupied INTO v_is_occupied 
  FROM public.parking_slots 
  WHERE slot_id = p_slot_id FOR UPDATE;

  IF v_is_occupied THEN
    RAISE EXCEPTION 'Slot is already occupied';
  END IF;

  -- Update slot to occupied
  UPDATE public.parking_slots SET is_occupied = true WHERE slot_id = p_slot_id;

  -- Create booking
  INSERT INTO public.bookings (user_id, slot_id, station_id, vehicle_number, vehicle_type, start_time, status)
  VALUES (p_user_id, p_slot_id, p_station_id, p_vehicle_number, p_vehicle_type, NOW(), 'active')
  RETURNING booking_id INTO v_booking_id;

  RETURN json_build_object('success', true, 'booking_id', v_booking_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. CHECKOUT LOGIC (RPC Function for Ending Parking)
CREATE OR REPLACE FUNCTION complete_parking_booking(p_booking_id UUID) RETURNS JSON AS $$
DECLARE
  v_booking RECORD;
  v_duration_hours NUMERIC;
  v_rate NUMERIC;
  v_total_price NUMERIC;
BEGIN
  SELECT * INTO v_booking FROM public.bookings WHERE booking_id = p_booking_id FOR UPDATE;

  IF v_booking.status != 'active' THEN
    RAISE EXCEPTION 'Booking is not active';
  END IF;

  -- Calculate duration in hours (minimum 1 hour)
  v_duration_hours := GREATEST(1, CEIL(EXTRACT(EPOCH FROM (NOW() - v_booking.start_time)) / 3600.0));
  
  -- Get pricing for that specific station and vehicle type
  SELECT price_per_hour INTO v_rate 
  FROM public.pricing 
  WHERE station_id = v_booking.station_id AND vehicle_type = v_booking.vehicle_type
  LIMIT 1;
  
  -- Default rate if none found
  IF v_rate IS NULL THEN
    v_rate := 50; 
  END IF;

  v_total_price := v_duration_hours * v_rate;

  -- Free slot
  UPDATE public.parking_slots SET is_occupied = false WHERE slot_id = v_booking.slot_id;

  -- Update booking
  UPDATE public.bookings 
  SET end_time = NOW(), status = 'completed', total_price = v_total_price 
  WHERE booking_id = p_booking_id;

  -- Note: Since the provided ER diagram does not show a Wallets table, 
  -- wallet deduction logic is excluded here. Payment processing should 
  -- happen before or during this step depending on the gateway.

  RETURN json_build_object('success', true, 'total_price', v_total_price, 'duration_hours', v_duration_hours);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- DUMMY SEED DATA (Run this to populate stations, sections, slots, and pricing)
-- ============================================================================

-- A. Insert Station
INSERT INTO public.parking_stations (station_id, name, address, city, latitude, longitude, rating) 
VALUES ('d290f1ee-6c54-4b01-90e6-d701748f0851', 'Phoenix Palladium', 'Lower Parel', 'Mumbai', 18.9950, 72.8245, 4.8) 
ON CONFLICT DO NOTHING;

-- B. Insert Sections
INSERT INTO public.parking_sections (section_id, station_id, name)
VALUES 
('11111111-1111-1111-1111-111111111111', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'Basement B1'),
('22222222-2222-2222-2222-222222222222', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'Basement B2')
ON CONFLICT DO NOTHING;

-- C. Insert Pricing
INSERT INTO public.pricing (station_id, vehicle_type, price_per_hour) VALUES 
('d290f1ee-6c54-4b01-90e6-d701748f0851', '4_wheeler', 80), 
('d290f1ee-6c54-4b01-90e6-d701748f0851', '2_wheeler', 40)
ON CONFLICT DO NOTHING;

-- D. Insert 4W Slots in B1
INSERT INTO public.parking_slots (section_id, slot_number, vehicle_type, is_occupied) VALUES 
('11111111-1111-1111-1111-111111111111', '001', '4_wheeler', false),
('11111111-1111-1111-1111-111111111111', '002', '4_wheeler', false),
('11111111-1111-1111-1111-111111111111', '003', '4_wheeler', false),
('11111111-1111-1111-1111-111111111111', '004', '4_wheeler', false),
('11111111-1111-1111-1111-111111111111', '005', '4_wheeler', true),
('11111111-1111-1111-1111-111111111111', '006', '4_wheeler', false),
('11111111-1111-1111-1111-111111111111', '007', '4_wheeler', false),
('11111111-1111-1111-1111-111111111111', '008', '4_wheeler', false),
('11111111-1111-1111-1111-111111111111', '009', '4_wheeler', false),
('11111111-1111-1111-1111-111111111111', '010', '4_wheeler', false),
('11111111-1111-1111-1111-111111111111', '011', '4_wheeler', true),
('11111111-1111-1111-1111-111111111111', '012', '4_wheeler', false);

-- E. Insert 2W Slots in B1
INSERT INTO public.parking_slots (section_id, slot_number, vehicle_type, is_occupied) VALUES 
('11111111-1111-1111-1111-111111111111', 'B01', '2_wheeler', true),
('11111111-1111-1111-1111-111111111111', 'B02', '2_wheeler', false),
('11111111-1111-1111-1111-111111111111', 'B03', '2_wheeler', false),
('11111111-1111-1111-1111-111111111111', 'B04', '2_wheeler', false),
('11111111-1111-1111-1111-111111111111', 'B05', '2_wheeler', true),
('11111111-1111-1111-1111-111111111111', 'B06', '2_wheeler', true),
('11111111-1111-1111-1111-111111111111', 'B07', '2_wheeler', false),
('11111111-1111-1111-1111-111111111111', 'B08', '2_wheeler', false),
('11111111-1111-1111-1111-111111111111', 'B09', '2_wheeler', false),
('11111111-1111-1111-1111-111111111111', 'B10', '2_wheeler', false),
('11111111-1111-1111-1111-111111111111', 'B11', '2_wheeler', true),
('11111111-1111-1111-1111-111111111111', 'B12', '2_wheeler', false);

-- ============================================================================
-- HIGH STREET PHOENIX STATION (STATION 2)
-- ============================================================================

INSERT INTO public.parking_stations (station_id, name, address, city, latitude, longitude, rating) 
VALUES ('b47a9ef4-d83a-4db5-9e6b-123456789abc', 'High Street Phoenix Parking', 'Lower Parel', 'Mumbai', 18.9955, 72.8250, 4.5) 
ON CONFLICT DO NOTHING;

INSERT INTO public.parking_sections (section_id, station_id, name)
VALUES 
('33333333-3333-3333-3333-333333333333', 'b47a9ef4-d83a-4db5-9e6b-123456789abc', 'Ground Level'),
('44444444-4444-4444-4444-444444444444', 'b47a9ef4-d83a-4db5-9e6b-123456789abc', 'Level 2')
ON CONFLICT DO NOTHING;

INSERT INTO public.pricing (station_id, vehicle_type, price_per_hour) VALUES 
('b47a9ef4-d83a-4db5-9e6b-123456789abc', '4_wheeler', 100), 
('b47a9ef4-d83a-4db5-9e6b-123456789abc', '2_wheeler', 50)
ON CONFLICT DO NOTHING;

INSERT INTO public.parking_slots (section_id, slot_number, vehicle_type, is_occupied) VALUES 
('33333333-3333-3333-3333-333333333333', 'C01', '4_wheeler', false),
('33333333-3333-3333-3333-333333333333', 'C02', '4_wheeler', false),
('33333333-3333-3333-3333-333333333333', 'C03', '4_wheeler', true),
('33333333-3333-3333-3333-333333333333', 'C04', '4_wheeler', false),
('33333333-3333-3333-3333-333333333333', 'C05', '4_wheeler', false),
('33333333-3333-3333-3333-333333333333', 'C06', '4_wheeler', false),
('33333333-3333-3333-3333-333333333333', 'C07', '2_wheeler', false),
('33333333-3333-3333-3333-333333333333', 'C08', '2_wheeler', false),
('33333333-3333-3333-3333-333333333333', 'C09', '2_wheeler', false),
('33333333-3333-3333-3333-333333333333', 'C10', '2_wheeler', false);


-- ============================================================================
-- 9. DO CARDS (Auto Pay Wallets) FEATURE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.parking_cards (
  card_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance NUMERIC DEFAULT 0,
  auto_pay_enabled BOOLEAN DEFAULT true,
  max_auto_payment NUMERIC DEFAULT 500,
  notify_before_payment BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT one_primary_card_per_user UNIQUE (user_id)
);

ALTER TABLE public.parking_cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view and edit own cards" ON public.parking_cards;
CREATE POLICY "Users can view and edit own cards" ON public.parking_cards FOR ALL USING ( auth.uid() = user_id );

-- Backfill Script: Give all existing users a Primary Card with 5000 ₹ Balance!
INSERT INTO public.parking_cards (user_id, balance)
SELECT id, 5000 FROM public.profiles 
WHERE id NOT IN (SELECT user_id FROM public.parking_cards)
ON CONFLICT DO NOTHING;

-- Trigger to auto-create wallet for new users
CREATE OR REPLACE FUNCTION public.handle_new_card()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.parking_cards (user_id, balance)
  VALUES (new.id, 5000);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_wallet ON public.profiles;
CREATE TRIGGER on_auth_user_created_wallet
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_card();


-- ============================================================================
-- 10. ADMIN AUTHENTICATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.admin_credentials (email, password)
VALUES ('admin@doparking.com', 'admin123')
ON CONFLICT (email) DO NOTHING;


-- ============================================================================
-- 11. NOTIFICATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,           -- booking, payment, entry_exit, alert, session
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  icon TEXT DEFAULT 'info',     -- Material icon name
  status TEXT DEFAULT 'unread', -- unread / read / dismissed
  action_url TEXT,              -- Optional deep-link (e.g. /history, /my-cards)
  metadata JSONB DEFAULT '{}', -- Extra data (booking_id, amount, slot, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own notifications" ON public.notifications;
CREATE POLICY "Users see own notifications" ON public.notifications
  FOR ALL USING ( auth.uid() = user_id );

-- Enable realtime on notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;


-- ============================================================================
-- 11b. TRIGGER: Auto-notify on NEW BOOKING
-- ============================================================================

CREATE OR REPLACE FUNCTION public.notify_on_booking_insert()
RETURNS trigger AS $$
DECLARE
  v_station_name TEXT;
  v_slot_number TEXT;
BEGIN
  SELECT name INTO v_station_name FROM public.parking_stations WHERE station_id = NEW.station_id;
  SELECT slot_number INTO v_slot_number FROM public.parking_slots WHERE slot_id = NEW.slot_id;

  -- Slot reserved notification
  INSERT INTO public.notifications (user_id, type, title, message, icon, metadata)
  VALUES (
    NEW.user_id,
    'booking',
    'Slot Reserved Successfully',
    'Your slot ' || COALESCE(v_slot_number, '') || ' at ' || COALESCE(v_station_name, 'Station') || ' is confirmed.',
    'local_parking',
    jsonb_build_object('booking_id', NEW.booking_id, 'station', v_station_name, 'slot', v_slot_number)
  );

  -- Payment notification
  IF NEW.total_price IS NOT NULL AND NEW.total_price > 0 THEN
    INSERT INTO public.notifications (user_id, type, title, message, icon, action_url, metadata)
    VALUES (
      NEW.user_id,
      'payment',
      'Payment Successful',
      '₹' || NEW.total_price || ' deducted via ' || COALESCE(NEW.payment_method, 'Wallet') || '.',
      'account_balance_wallet',
      '/history',
      jsonb_build_object('amount', NEW.total_price, 'method', NEW.payment_method, 'booking_id', NEW.booking_id)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_booking_notify ON public.bookings;
CREATE TRIGGER trg_booking_notify
  AFTER INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_booking_insert();


-- ============================================================================
-- 11c. TRIGGER: Auto-notify on BOOKING STATUS CHANGE (completed / cancelled)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.notify_on_booking_update()
RETURNS trigger AS $$
DECLARE
  v_station_name TEXT;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;

  SELECT name INTO v_station_name FROM public.parking_stations WHERE station_id = NEW.station_id;

  IF NEW.status = 'completed' THEN
    INSERT INTO public.notifications (user_id, type, title, message, icon, action_url, metadata)
    VALUES (
      NEW.user_id,
      'entry_exit',
      'Exit Confirmed',
      'Your session at ' || COALESCE(v_station_name, 'Station') || ' is complete. Total bill: ₹' || COALESCE(NEW.total_price::TEXT, '0') || '.',
      'logout',
      '/history',
      jsonb_build_object('booking_id', NEW.booking_id, 'total', NEW.total_price)
    );
  ELSIF NEW.status = 'cancelled' THEN
    INSERT INTO public.notifications (user_id, type, title, message, icon, metadata)
    VALUES (
      NEW.user_id,
      'booking',
      'Reservation Cancelled',
      'Your reservation at ' || COALESCE(v_station_name, 'Station') || ' has been cancelled.',
      'event_busy',
      jsonb_build_object('booking_id', NEW.booking_id)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_booking_status_notify ON public.bookings;
CREATE TRIGGER trg_booking_status_notify
  AFTER UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_booking_update();


-- ============================================================================
-- 11d. TRIGGER: Low Balance Warning on wallet deduction
-- ============================================================================

CREATE OR REPLACE FUNCTION public.notify_low_balance()
RETURNS trigger AS $$
BEGIN
  IF NEW.balance < 200 AND OLD.balance >= 200 THEN
    INSERT INTO public.notifications (user_id, type, title, message, icon, action_url, metadata)
    VALUES (
      NEW.user_id,
      'payment',
      'Low Wallet Balance',
      'Your DoCard balance is ₹' || NEW.balance || '. Recharge to avoid payment failures.',
      'warning',
      '/my-cards',
      jsonb_build_object('balance', NEW.balance)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_low_balance ON public.parking_cards;
CREATE TRIGGER trg_low_balance
  AFTER UPDATE ON public.parking_cards
  FOR EACH ROW EXECUTE FUNCTION public.notify_low_balance();
