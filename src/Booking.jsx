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
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800/40 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 lg:p-8 flex flex-col font-body">
      
      {/* Header / Title */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition text-slate-500 cursor-pointer flex items-center justify-center">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h2 className="text-xl font-extrabold text-on-surface tracking-tight">{STATION_NAME}</h2>
          <div className="flex items-center gap-1 text-slate-400 text-xs font-semibold mt-0.5">
            <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
            <span>{location.state?.stationAddress || 'Lower Parel, Mumbai'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Toggles, Info, and Floors */}
        <div className="lg:col-span-5 space-y-6">
          {/* Vehicle Selection Pill Container */}
          <div className="flex bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700/30">
             <button 
               onClick={() => setVehicleType('4_wheeler')}
               className={`flex-1 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${vehicleType === '4_wheeler' ? 'bg-[#4a40e0] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                 <span className="material-symbols-outlined text-sm">directions_car</span>
                 4 Wheeler
             </button>
             <button 
               onClick={() => setVehicleType('2_wheeler')}
               className={`flex-1 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${vehicleType === '2_wheeler' ? 'bg-[#4a40e0] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                 <span className="material-symbols-outlined text-sm">two_wheeler</span>
                 2 Wheeler
             </button>
          </div>

          {/* Available Slots Status */}
          <div className="bg-[#4a40e0]/5 rounded-2xl p-5 flex items-center justify-between border border-[#4a40e0]/10 shadow-sm">
              <div className="flex flex-col">
                <span className="text-[#4a40e0] text-[9px] uppercase font-extrabold tracking-widest mb-1">Real-Time Status</span>
                <span className="text-[#4a40e0] font-black text-lg leading-none">
                    {loading ? 'Loading...' : `Available: ${availableCount} slots`}
                </span>
              </div>
              <div className="w-9 h-9 bg-indigo-100 text-[#4a40e0] rounded-xl flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>bar_chart</span>
              </div>
          </div>

          {/* Floors/Basements Selector */}
          <div className="space-y-3">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block pl-1">Select Floor</span>
              {vehicleType === '4_wheeler' ? (
                <div className="space-y-2.5">
                    {sections.map(section => (
                       <div key={section.section_id} onClick={() => setSelectedBasementId(section.section_id)} className={`p-4 rounded-xl flex items-center justify-between border shadow-sm transition-all cursor-pointer ${selectedBasementId === section.section_id ? 'border-[#4a40e0] bg-indigo-50/20 ring-2 ring-[#4a40e0]/5' : 'border-slate-100 bg-white dark:bg-slate-800 hover:shadow-md'}`}>
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-indigo-50 dark:bg-slate-700 text-[#4a40e0] rounded-full flex items-center justify-center">
                                 <span className="material-symbols-outlined text-base">layers</span>
                              </div>
                              <span className="font-bold text-on-surface text-sm">{section.name}</span>
                           </div>
                       </div>
                    ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                   {sections.map(section => (
                       <div 
                          key={section.section_id} 
                          onClick={() => setSelectedBasementId(section.section_id)}
                          className={`p-4 rounded-xl flex flex-col items-center justify-center border transition-all cursor-pointer ${selectedBasementId === section.section_id ? 'border-[#4a40e0] bg-indigo-50/20 text-[#4a40e0] font-bold' : 'border-slate-100 bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50'}`}>
                           <span className="font-bold text-xs">{section.name}</span>
                       </div>
                   ))}
                </div>
              )}
          </div>
        </div>

        {/* Right Column: Spot Selection and Actions */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex justify-between items-end pb-3 border-b border-slate-100 dark:border-slate-800/50">
              <h3 className="font-extrabold text-on-surface text-base tracking-tight">Select a Spot</h3>
              <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-slate-100 border border-slate-200"></div> <span>Free</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#5D50D6]"></div> <span>Full</span></div>
              </div>
          </div>

          {loading ? (
               <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 rounded-full border-4 border-[#4a40e0]/30 border-t-[#4a40e0]"></div></div>
          ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {/* Only show slots for the active Basement/Section */}
                  {slots.filter(s => s.section_id === selectedBasementId).map((spot) => {
                      let btnClass = "py-3.5 rounded-xl font-bold flex flex-col items-center justify-center text-xs transition-all font-mono border ";
                      
                      const isSelected = selectedSpotId === spot.slot_id;
                      const isFull = spot.is_occupied;

                      if (isSelected) {
                          btnClass += "bg-[#4a40e0] border-[#14007e] text-white shadow-md scale-102";
                      } else if (isFull) {
                          btnClass += "bg-[#5D50D6] border-transparent text-white opacity-80 cursor-not-allowed";
                      } else {
                          btnClass += "bg-white dark:bg-slate-800 text-slate-600 border-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer";
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
                                  <span className="text-[8px] font-bold mt-1 opacity-70">
                                      Since {new Date(spot.activeStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                              )}
                              {isSelected && vehicleType === '2_wheeler' && <span className="material-symbols-outlined text-[10px] mt-0.5 text-white">check_circle</span>}
                          </button>
                      )
                  })}
              </div>
          )}

          {/* Action Footer */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800/50 flex justify-end">
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
                 className={`w-full sm:w-auto sm:px-10 py-3.5 text-white font-extrabold text-[13px] rounded-xl tracking-wide uppercase transition-all shadow-md ${selectedSpotId ? 'bg-gradient-to-r from-[#4a40e0] to-[#5D50D6] shadow-[#4a40e0]/20 hover:brightness-110 active:scale-95 cursor-pointer' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                 Proceed to Booking
              </button>
          </div>
        </div>
      </div>
    </div>
  );
}
