import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabase';

export default function AdminSlots() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stations, setStations] = useState([]);
  const [selectedStationId, setSelectedStationId] = useState('all');
  const [sections, setSections] = useState([]);
  const [selectedSectionId, setSelectedSectionId] = useState('all');
  const [slots, setSlots] = useState([]);
  const [activeMenuSlotId, setActiveMenuSlotId] = useState(null);
  const [activeBookings, setActiveBookings] = useState([]);

  // Verify Admin
  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdminLoggedIn');
    if (isAdmin !== 'true') {
      navigate('/admin/login');
    }
  }, [navigate]);

  // Initial Fetch
  useEffect(() => {
    const fetchInitial = async () => {
      setLoading(true);
      const { data: stationsData } = await supabase.from('parking_stations').select('*').order('name');
      if (stationsData) setStations(stationsData);
      
      const { data: sectionsData } = await supabase.from('parking_sections').select('*');
      if (sectionsData) setSections(sectionsData);
      
      const { data: slotsData } = await supabase.from('parking_slots').select('*');
      if (slotsData) {
         const sorted = slotsData.sort((a, b) => 
            a.slot_number.localeCompare(b.slot_number, undefined, { numeric: true })
         );
         setSlots(sorted);
      }

      const { data: bookingsData } = await supabase.from('bookings').select('slot_id, end_time').eq('status', 'active');
      if (bookingsData) {
         setActiveBookings(bookingsData);
      }
      
      setLoading(false);
    };
    fetchInitial();

    // Real-time Subscriptions
    const subscription = supabase
      .channel('admin_live_slots')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'parking_slots' },
        (payload) => {
          setSlots((currentSlots) => 
            currentSlots.map((slot) => 
              slot.slot_id === payload.new.slot_id ? payload.new : slot
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isAdminLoggedIn');
    navigate('/admin/login');
  };

  const updateSlotStatus = async (slotId, status) => {
    // Map status string to DB occupation logic
    // Usually is_occupied true as 'Parked' or 'Booked'. 
    // In our DB schema we only have 'is_occupied' (Parked vs Free). 
    const isOccupied = status !== 'FREE';
    
    // Optimistic Update
    setSlots(prev => prev.map(s => s.slot_id === slotId ? { ...s, is_occupied: isOccupied } : s));
    setActiveMenuSlotId(null);
    
    await supabase.from('parking_slots').update({ is_occupied: isOccupied }).eq('slot_id', slotId);
  };

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getRemainingTimeString = (slotId) => {
    const activeBooking = activeBookings.find(b => b.slot_id === slotId);
    if (!activeBooking || !activeBooking.end_time) return null;
    
    const end = new Date(activeBooking.end_time);
    const diffMs = end - currentTime;
    
    if (diffMs <= 0) return 'Expired';
    
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    
    if (hours > 0) return `${hours}h ${mins}m left`;
    return `${mins}m left`;
  };

  // Filter logic
  const filteredSections = sections.filter(sec => 
    selectedStationId === 'all' || sec.station_id === selectedStationId
  );

  const filteredSlots = slots.filter(s => {
    // 1. Filter by Section selection
    if (selectedSectionId !== 'all') {
      return s.section_id === selectedSectionId;
    }
    
    // 2. If Section is 'all', filter by Station selection
    if (selectedStationId !== 'all') {
      const stationSectionIds = filteredSections.map(f => f.section_id);
      return stationSectionIds.includes(s.section_id);
    }

    return true; // Global view
  });

  return (
    <div className="min-h-screen bg-[#F8F9FD] flex font-body text-on-surface">
      
      {/* Sidebar */}
      <aside className="w-[300px] bg-white h-screen flex flex-col fixed left-0 top-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-50">
         <div className="p-8">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#5D50D6] flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-2xl">commute</span>
                </div>
                <div>
                    <h1 className="text-[#2B3674] font-black text-xl leading-none">Luminous</h1>
                    <h2 className="text-[#2B3674] font-black text-xl leading-none">Navigator</h2>
                </div>
            </div>
            <p className="text-[#A3AED0] text-[9px] font-black uppercase tracking-[0.2em]">Smart Parking Admin</p>
         </div>
         
         <nav className="flex-1 px-6 space-y-2 mt-8">
             <button onClick={() => navigate('/admin/dashboard')} className="w-full flex items-center gap-4 px-5 py-4 text-[#A3AED0] hover:bg-[#F4F7FE] hover:text-[#2B3674] rounded-2xl font-bold transition-all text-left">
                <span className="material-symbols-outlined text-[24px]">grid_view</span>
                <span className="text-[15px]">Dashboard</span>
             </button>
             <button className="w-full flex items-center gap-4 px-5 py-4 bg-[#F4F7FE] text-[#5D50D6] rounded-2xl font-bold transition-all text-left">
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>directions_car</span>
                <span className="text-[15px]">Slot Management</span>
             </button>
             <button onClick={() => navigate('/admin/analytics')} className="w-full flex items-center gap-4 px-5 py-4 text-[#A3AED0] hover:bg-[#F4F7FE] hover:text-[#2B3674] rounded-2xl font-bold transition-all text-left">
                <span className="material-symbols-outlined text-[24px]">bar_chart</span>
                <span className="text-[15px]">Analytics</span>
             </button>
             <button onClick={() => navigate('/admin/users')} className="w-full flex items-center gap-4 px-5 py-4 text-[#A3AED0] hover:bg-[#F4F7FE] hover:text-[#2B3674] rounded-2xl font-bold transition-all text-left">
                <span className="material-symbols-outlined text-[24px]">group</span>
                <span className="text-[15px]">User Control</span>
             </button>
              <button onClick={() => navigate('/admin/security')} className="w-full flex items-center gap-4 px-5 py-4 text-[#A3AED0] hover:bg-[#F4F7FE] hover:text-[#2B3674] rounded-2xl font-bold transition-all text-left">
                <span className="material-symbols-outlined text-[24px]">admin_panel_settings</span>
                <span className="text-[15px]">Security</span>
             </button>
         </nav>

         <div className="p-6 mt-auto">

             
             <button className="flex items-center gap-3 px-4 py-2 text-[#A3AED0] hover:text-[#2B3674] font-bold text-sm transition-colors mb-2">
                 <span className="material-symbols-outlined text-[20px]">help</span>
                 Support
             </button>
             <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2 text-[#A3AED0] hover:text-[#FF5B5B] font-bold text-sm transition-colors">
                 <span className="material-symbols-outlined text-[20px]">logout</span>
                 Logout
             </button>
         </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-[300px] flex-1 flex flex-col p-8">
          
          {/* Header */}
          <header className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3 bg-white rounded-full px-6 py-4 w-[500px] shadow-sm border border-[#E9EDF7]/50">
                  <span className="material-symbols-outlined text-[#A3AED0]">search</span>
                  <input type="text" placeholder="Search locations or vehicle IDs..." className="bg-transparent border-none outline-none w-full text-sm font-medium text-[#2B3674] placeholder:text-[#A3AED0]" />
              </div>

              <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-[#F4F7FE] px-4 py-2 rounded-full border border-[#E9EDF7]">
                      <div className="w-2 h-2 rounded-full bg-[#41D996] animate-pulse"></div>
                      <span className="text-[10px] text-[#2B3674] font-black uppercase tracking-widest">AI LIVE</span>
                  </div>
                  <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#A3AED0] hover:text-[#2B3674] shadow-sm"><span className="material-symbols-outlined">notifications</span></button>
                  <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#A3AED0] hover:text-[#2B3674] shadow-sm"><span className="material-symbols-outlined">settings</span></button>
                  <div className="flex items-center gap-3 ml-2 pl-4 border-l border-outline-variant/20">
                      <div className="text-right">
                          <div className="font-bold text-[#2B3674] text-sm">Admin Astra</div>
                          <div className="text-[10px] text-[#A3AED0] font-bold">System Manager</div>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#5D50D6] to-[#7158fe] p-[2px] shadow-sm">
                          <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                              <img src="https://i.pravatar.cc/150?u=astra" alt="Admin" className="w-full h-full object-cover" />
                          </div>
                      </div>
                  </div>
              </div>
          </header>

          <div className="flex items-center justify-between mb-8">
              <div>
                  <h2 className="text-[28px] font-black text-[#2B3674] tracking-tight">Live Slot Management</h2>
                  <p className="text-[#A3AED0] text-sm font-medium mt-1">Managing {slots.length} real-time spots in Mall Main Parking</p>
              </div>
              <div className="flex gap-4">
                  <button className="bg-white px-6 py-3 rounded-2xl font-bold text-[#2B3674] flex items-center gap-2 shadow-sm hover:shadow-md transition-all active:scale-95">
                      <span className="material-symbols-outlined text-[18px]">refresh</span>
                      Refresh
                  </button>
                  <button className="bg-white px-6 py-3 rounded-2xl font-bold text-[#2B3674] flex items-center gap-2 shadow-sm hover:shadow-md transition-all active:scale-95">
                      <span className="material-symbols-outlined text-[18px]">download</span>
                      Export
                  </button>
              </div>
          </div>

          {/* Selection Filters */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm mb-8 flex items-center gap-8 border border-[#E9EDF7]/30">
              
              {/* Station Filter */}
              <div className="flex flex-col gap-3">
                  <span className="text-[10px] font-black text-[#A3AED0] uppercase tracking-widest">Select Station</span>
                  <div className="relative group min-w-[260px]">
                      <select 
                        value={selectedStationId}
                        onChange={(e) => {
                            setSelectedStationId(e.target.value);
                            setSelectedSectionId('all'); // Reset section when station changes
                        }}
                        className="w-full bg-[#F4F7FE] border-none rounded-xl px-4 py-3.5 font-bold text-[#2B3674] appearance-none cursor-pointer focus:ring-2 focus:ring-[#5D50D6]/20 transition-all"
                      >
                          <option value="all">Global System (All Stations)</option>
                          {stations.map(st => <option key={st.station_id} value={st.station_id}>{st.name}</option>)}
                      </select>
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#A3AED0]">domain</span>
                  </div>
              </div>

              {/* Section Filter */}
              <div className="flex flex-col gap-3">
                  <span className="text-[10px] font-black text-[#A3AED0] uppercase tracking-widest">Select Sector</span>
                  <div className="relative group min-w-[240px]">
                      <select 
                        value={selectedSectionId}
                        onChange={(e) => setSelectedSectionId(e.target.value)}
                        className="w-full bg-[#F4F7FE] border-none rounded-xl px-4 py-3.5 font-bold text-[#2B3674] appearance-none cursor-pointer focus:ring-2 focus:ring-[#5D50D6]/20 transition-all"
                      >
                          <option value="all">All Sectors {selectedStationId !== 'all' ? 'in Station' : ''}</option>
                          {filteredSections.map(sec => <option key={sec.section_id} value={sec.section_id}>{sec.name}</option>)}
                      </select>
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#A3AED0]">keyboard_arrow_down</span>
                  </div>
              </div>

              <div className="ml-auto bg-[#F4F7FE] px-8 py-4 rounded-2xl flex gap-8">
                  <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-lg bg-[#E0E7FF] border-2 border-white shadow-sm"></div>
                      <span className="text-[13px] font-bold text-[#2B3674]">Free</span>
                  </div>
                  <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-lg bg-[#C7D2FE] border-2 border-white shadow-sm"></div>
                      <span className="text-[13px] font-bold text-[#2B3674]">Booked</span>
                  </div>
                  <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-lg bg-[#5D50D6] border-2 border-white shadow-sm"></div>
                      <span className="text-[13px] font-bold text-[#2B3674]">Parked</span>
                  </div>
              </div>
          </div>

          {/* Slot Grid */}
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 mb-8">
              {loading ? (
                  <div className="col-span-full flex justify-center py-20"><div className="animate-spin w-10 h-10 rounded-full border-4 border-[#5D50D6]/30 border-t-[#5D50D6]"></div></div>
              ) : filteredSlots.map(slot => (
                  <div key={slot.slot_id} className="relative">
                      <div className={`bg-white rounded-3xl p-5 border-t-[6px] shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-2 ${slot.is_occupied ? 'border-[#5D50D6]' : 'border-[#E0E7FF]'}`}>
                          <div className="w-full flex justify-between items-center mb-1">
                              <span className="text-[9px] font-black text-[#A3AED0] uppercase">Slot</span>
                              <span className="material-symbols-outlined text-[14px] text-[#A3AED0]">directions_car</span>
                          </div>
                          <span className="text-2xl font-black text-[#2B3674]">{slot.slot_number}</span>
                          
                          {slot.is_occupied && (
                              <span className="text-[10px] font-bold text-[#A3AED0]">
                                  {getRemainingTimeString(slot.slot_id) || '--'}
                              </span>
                          )}
                          
                          <button 
                            onClick={() => setActiveMenuSlotId(activeMenuSlotId === slot.slot_id ? null : slot.slot_id)}
                            className={`mt-2 flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${slot.is_occupied ? 'bg-[#5649CC] text-white' : 'bg-[#F4F7FE] text-[#5D50D6]'}`}>
                              {slot.is_occupied ? 'Parked' : 'Free'}
                              <span className="material-symbols-outlined text-[12px]">{activeMenuSlotId === slot.slot_id ? 'expand_less' : 'expand_more'}</span>
                          </button>
                      </div>

                      {activeMenuSlotId === slot.slot_id && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-[#E9EDF7] z-[100] py-2 overflow-hidden animate-in fade-in slide-in-from-top-2">
                             {['FREE', 'BOOKED', 'PARKED'].map(option => (
                                 <button 
                                   key={option}
                                   onClick={() => updateSlotStatus(slot.slot_id, option)}
                                   className="w-full px-4 py-2.5 text-[10px] font-bold uppercase text-left hover:bg-[#F4F7FE] text-[#2B3674] flex items-center gap-3 transition-colors"
                                 >
                                    <div className={`w-2 h-2 rounded-full ${option === 'FREE' ? 'bg-[#E0E7FF]' : option === 'BOOKED' ? 'bg-[#C7D2FE]' : 'bg-[#5D50D6]'}`}></div>
                                    {option}
                                 </button>
                             ))}
                          </div>
                      )}
                  </div>
              ))}
          </div>

          {/* Bottom Alert Section */}
          <div className="flex gap-8 mt-auto">
              {/* Alert Card */}
              <div className="flex-[2] bg-gradient-to-br from-[#5D50D6] to-[#7158fe] rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-xl shadow-[#5D50D6]/20">
                  <div className="relative z-10">
                      <div className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full inline-block text-[10px] font-black uppercase tracking-widest mb-6">Peak Occupancy Alert</div>
                      <h3 className="text-4xl font-black leading-tight max-w-md mb-8">Sector A is nearing 90% occupancy capacity.</h3>
                      <div className="flex gap-4">
                          <button className="bg-white text-[#5D50D6] px-8 py-4 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all active:scale-95">Open Traffic Protocol</button>
                          <button className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-2xl font-black text-sm border border-white/20 transition-all active:scale-95">Dismiss</button>
                      </div>
                  </div>
                  {/* Background Accents */}
                  <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-[100px]"></div>
                  <div className="absolute top-1/2 right-12 -translate-y-1/2 opacity-20 transform scale-[2]">
                    <span className="material-symbols-outlined text-[100px]">warning</span>
                  </div>
              </div>

              {/* Status Card */}
              <div className="flex-1 bg-white rounded-[2.5rem] p-10 shadow-sm border border-[#E9EDF7]/30 flex flex-col">
                  <h3 className="text-xl font-bold text-[#2B3674] mb-8">Zone Health</h3>
                  <div className="space-y-8">
                      <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-[#ECFDF5] text-[#10B981] flex items-center justify-center">
                                  <span className="material-symbols-outlined">sensors</span>
                              </div>
                              <div>
                                  <div className="font-bold text-[#2B3674] text-sm">Sensors Active</div>
                                  <div className="text-[11px] text-[#A3AED0]">144/144 Online</div>
                              </div>
                          </div>
                          <span className="text-[11px] font-black text-[#10B981] uppercase">OK</span>
                      </div>
                      <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] text-[#5D50D6] flex items-center justify-center">
                                  <span className="material-symbols-outlined">router</span>
                              </div>
                              <div>
                                  <div className="font-bold text-[#2B3674] text-sm">Gateway Link</div>
                                  <div className="text-[11px] text-[#A3AED0]">Fast 5G Priority</div>
                              </div>
                          </div>
                          <span className="text-[11px] font-black text-[#5D50D6] uppercase tracking-wide">94ms</span>
                      </div>
                  </div>
                  
                  <button className="w-full mt-auto py-4 border-t border-[#E9EDF7] text-[10px] font-black text-[#5D50D6] uppercase tracking-[0.2em] hover:text-[#4a40e0] transition-colors">
                      Full Diagnostics Report
                  </button>
              </div>
          </div>

      </main>

    </div>
  );
}
