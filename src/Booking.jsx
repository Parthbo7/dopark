import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './supabase';

export default function Booking() {
  const navigate = useNavigate();
  const location = useLocation();
  const [vehicleType, setVehicleType] = useState(location.state?.vehicleType || '4_wheeler'); // '4_wheeler' or '2_wheeler'
  const STATION_ID = location.state?.stationId || 'd290f1ee-6c54-4b01-90e6-d701748f0851';
  const STATION_NAME = location.state?.stationName || 'Phoenix Palladium';

  // Real-time state
  const [slots, setSlots] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedSpotId, setSelectedSpotId] = useState(null);
  const [selectedBasementId, setSelectedBasementId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      console.log("=== Debugging Data Flow ===");
      console.log("Active vehicle_type:", vehicleType);
      
      // 1. Fetch Sections
      const { data: sectionsData, error: sectionErr } = await supabase
        .from('parking_sections')
        .select('*')
        .eq('station_id', STATION_ID)
        .order('name', { ascending: true });

      if (sectionErr) console.error("Sections Error:", sectionErr);

      if (!sectionErr && sectionsData) {
        setSections(sectionsData);
        if (sectionsData.length > 0 && !selectedBasementId) {
           setSelectedBasementId(sectionsData[0].section_id);
           console.log("Selected section_id initialized to:", sectionsData[0].section_id);
        } else {
           console.log("Active section_id:", selectedBasementId);
        }

        // Extract section IDs to fetch correct slots for station
        const sectionIds = sectionsData.map(s => s.section_id);

        if (sectionIds.length > 0) {
          // 2. Fetch Slots based on sections AND vehicle type
          const { data: slotsData, error: slotErr } = await supabase
            .from('parking_slots')
            .select('*')
            .in('section_id', sectionIds)
            .eq('vehicle_type', vehicleType)
            .order('slot_number', { ascending: true });

          if (slotErr) console.error("Slots Error:", slotErr);
          
          if (!slotErr && slotsData) {
            // 3. Fetch active bookings to show start times on occupied slots
            const { data: bData } = await supabase
              .from('bookings')
              .select('slot_id, start_time')
              .eq('status', 'active');

            // Merge start time into slots
            const mergedSlots = slotsData.map(s => {
               const activeB = bData?.find(b => b.slot_id === s.slot_id);
               return { ...s, activeStartTime: activeB?.start_time };
            });

            // Perform Natural Sort 
            const sortedSlots = mergedSlots.sort((a, b) => 
               a.slot_number.localeCompare(b.slot_number, undefined, { numeric: true, sensitivity: 'base' })
            );

            console.log("Fetched and naturally sorted slots with times:", sortedSlots.length);
            setSlots(sortedSlots);
            setSelectedSpotId(null);
          }
        }
      }
      
      setLoading(false);
    };

    fetchData();
  }, [vehicleType, STATION_ID]); // Re-fetch slots if vehicleType toggles


  // Subscribe to real-time changes
  useEffect(() => {
    const subscription = supabase
      .channel('public:parking_slots')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'parking_slots',
          filter: `station_id=eq.${STATION_ID}`
        },
        (payload) => {
          const updatedSlot = payload.new;
          // Update the specific slot in our local state instantly
          setSlots((currentSlots) => 
            currentSlots.map((slot) => 
               slot.slot_id === updatedSlot.slot_id ? updatedSlot : slot
            )
          );
          
          // If the slot we currently have selected suddenly gets taken by someone else
          if (updatedSlot.slot_id === selectedSpotId && updatedSlot.is_occupied) {
            setSelectedSpotId(null);
            alert("Sorry, the slot you were looking at was just booked by someone else!");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [selectedSpotId]);

  const handleSpotClick = (id, isOccupied) => {
    if (!isOccupied) {
       setSelectedSpotId(id);
    }
  };

  // Derive counts dynamically
  const availableCount = slots.filter(s => !s.is_occupied).length;

  return (
    <div className="bg-[#4a40e0] min-h-screen text-on-surface flex flex-col font-body">
      
      {/* Top App Bar */}
      <header className="flex items-center px-4 py-6 text-white no-line-rule tonal-nesting relative z-10 w-full max-w-md mx-auto md:max-w-2xl">
        <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white/10 transition-colors rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-white">arrow_back</span>
        </button>
        <h1 className="text-xl font-bold ml-4 tracking-wide">{STATION_NAME}</h1>
      </header>

      {/* Main Card Content */}
      <main className="flex-1 bg-surface-bright rounded-t-[2.5rem] w-full max-w-md mx-auto md:max-w-2xl shadow-2xl p-6 md:p-8 flex flex-col mt-2 relative z-20 overflow-y-auto custom-scrollbar pb-10">
        
        <div className="mb-6">
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">{STATION_NAME}</h2>
          <div className="flex items-center gap-1.5 text-on-surface-variant font-medium mt-1">
             <span className="material-symbols-outlined text-[#4a40e0] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
             <span className="text-sm">Lower Parel, Mumbai</span>
          </div>
        </div>

        {/* Vehicle Selection Pill Container */}
        <div className="flex bg-surface-container-lowest p-1.5 rounded-[1.25rem] mb-6 shadow-sm border border-outline-variant/10">
           <button 
             onClick={() => setVehicleType('4_wheeler')}
             className={`flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${vehicleType === '4_wheeler' ? 'bg-[#4a40e0] text-white shadow-md' : 'text-on-surface-variant hover:bg-surface-container-low'}`}>
               <span className="material-symbols-outlined text-base">directions_car</span>
               4 Wheeler
           </button>
           <button 
             onClick={() => setVehicleType('2_wheeler')}
             className={`flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${vehicleType === '2_wheeler' ? 'bg-[#4a40e0] text-white shadow-md' : 'text-on-surface-variant hover:bg-surface-container-low'}`}>
               <span className="material-symbols-outlined text-base">two_wheeler</span>
               2 Wheeler
           </button>
        </div>

        {/* Available Slots Status */}
        <div className="bg-[#4a40e0]/5 rounded-2xl p-5 flex items-center justify-between border border-[#4a40e0]/10 mb-6 shadow-sm">
            <div className="flex flex-col">
              <span className="text-[#4a40e0] text-[10px] uppercase font-extrabold tracking-widest mb-1">Real-Time Status</span>
              <span className="text-[#4a40e0] font-bold text-xl leading-none">
                  {loading ? 'Loading...' : `Available: ${availableCount} slots`}
              </span>
            </div>
            <div className="w-10 h-10 bg-indigo-100 text-[#4a40e0] rounded-xl flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>bar_chart</span>
            </div>
        </div>

        {/* Basements - Dynamic Layout mapping the sections */}
        {vehicleType === '4_wheeler' ? (

          <div className="space-y-3 mb-8">
              {sections.map(section => (
                 <div key={section.section_id} onClick={() => setSelectedBasementId(section.section_id)} className={`p-4 rounded-2xl flex items-center justify-between border shadow-sm transition-all cursor-pointer ${selectedBasementId === section.section_id ? 'border-[#4a40e0] bg-indigo-50/30 ring-2 ring-[#4a40e0]/10' : 'border-outline-variant/10 hover:shadow-md bg-surface-container-lowest'}`}>
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 text-tertiary rounded-full flex items-center justify-center">
                           <span className="material-symbols-outlined text-lg">layers</span>
                        </div>
                        <span className="font-bold text-on-surface text-[15px]">{section.name}</span>
                     </div>
                 </div>
              ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 mb-8">
             {sections.map(section => (
                 <div 
                    key={section.section_id} 
                    onClick={() => setSelectedBasementId(section.section_id)}
                    className={`p-5 rounded-[1.5rem] flex flex-col items-center justify-center border-2 transition-all cursor-pointer ${selectedBasementId === section.section_id ? 'border-[#4a40e0] bg-white shadow-lg shadow-[#4a40e0]/10' : 'border-transparent bg-surface-container-low text-on-surface-variant hover:bg-surface-container'}`}>
                     <span className={`font-bold text-sm ${selectedBasementId === section.section_id ? 'text-[#4a40e0]' : 'text-on-surface'}`}>{section.name}</span>
                 </div>
             ))}
          </div>
        )}

        {/* Spot Selection */}
        <div className="mb-4">
            <div className="flex justify-between items-end mb-4">
                <h3 className="text-lg font-bold text-on-surface tracking-tight">Select a Spot</h3>
                <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest">
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-surface-dim border border-outline-variant/30"></div> <span className="text-outline">Free</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[#5D50D6]"></div> <span className="text-outline">Full</span></div>
                </div>
            </div>

            {loading ? (
                 <div className="flex justify-center p-10"><div className="animate-spin w-8 h-8 rounded-full border-4 border-[#4a40e0]/30 border-t-[#4a40e0]"></div></div>
            ) : (
                <div className="grid grid-cols-4 gap-3 md:gap-4 flex-1">
                    {/* Only show slots for the active Basement/Section */}
                    {slots.filter(s => s.section_id === selectedBasementId).map((spot) => {
                        let btnClass = "py-4 md:py-6 rounded-xl font-bold flex flex-col items-center justify-center text-sm md:text-base transition-all font-mono shadow-sm ";
                        
                        const isSelected = selectedSpotId === spot.slot_id;
                        const isFull = spot.is_occupied;

                        if (isSelected) {
                            btnClass += "bg-[#4a40e0] border-2 border-[#14007e] text-white shadow-lg scale-105";
                        } else if (isFull) {
                            btnClass += "bg-[#5D50D6] text-white opacity-90 cursor-not-allowed";
                        } else {
                            btnClass += "bg-white text-on-surface-variant hover:bg-slate-50 cursor-pointer border border-outline-variant/10";
                        }

                        return (
                            <button 
                                key={spot.slot_id} 
                                onClick={() => handleSpotClick(spot.slot_id, isFull)}
                                className={btnClass}
                                disabled={isFull}
                            >
                                <span className="text-[11px] font-black">{spot.slot_number}</span>
                                {isFull && spot.activeStartTime && (
                                    <span className="text-[8px] font-bold mt-1 opacity-80">
                                        Since {new Date(spot.activeStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                )}
                                {isSelected && vehicleType === '2_wheeler' && <span className="material-symbols-outlined text-[12px] mt-1 text-white">check_circle</span>}
                            </button>
                        )
                    })}
                </div>
            )}
        </div>

        {/* Confirm Button */}
        <div className="mt-8 flex justify-center">
            {/* Find entire slot object to pass to confirmation page */}
            <button 
               onClick={() => {
                   if (!selectedSpotId) {
                      alert("Please select a spot first!");
                      return;
                   }
                   const specificSpot = slots.find(s => s.slot_id === selectedSpotId);
                   const specificBasement = sections.find(s => s.section_id === selectedBasementId)?.name;
                   
                   navigate('/confirmation', { 
                       state: { 
                           vehicleType: vehicleType, 
                           spotId: specificSpot.slot_id, 
                           spotName: specificSpot.slot_number, 
                           basement: specificBasement,
                           stationId: STATION_ID,
                           stationName: STATION_NAME,
                           stationAddress: location.state?.stationAddress || 'Pune',
                           stationLat: location.state?.stationLat,
                           stationLng: location.state?.stationLng,
                       } 
                   });
               }} 
               className={`w-full max-w-sm py-3 px-6 text-white font-extrabold text-[15px] rounded-2xl border-2 border-white/10 tracking-wide uppercase transition-all ${selectedSpotId ? 'bg-gradient-to-r from-[#4a40e0] to-[#5D50D6] shadow-[0px_8px_20px_rgba(74,64,224,0.3)] hover:brightness-110 active:scale-95' : 'bg-outline-variant/50 cursor-not-allowed'}`}>
               Proceed to Booking
            </button>
        </div>
      </main>

    </div>
  );
}
