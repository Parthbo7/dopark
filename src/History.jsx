import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { useNavigate } from 'react-router-dom';

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All'); // All, Today, This Week, This Month
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
  }, [filter]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
         setLoading(false);
         return; // Or redirect
      }

      let query = supabase
        .from('bookings')
        .select(`
          *,
          parking_stations(name, address),
          parking_slots(slot_number)
        `)
        .eq('user_id', user.id)
        .order('start_time', { ascending: false });

      // Apply Filters
      const now = new Date();
      if (filter === 'Today') {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        query = query.gte('start_time', startOfToday);
      } else if (filter === 'This Week') {
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).toISOString();
        query = query.gte('start_time', startOfWeek);
      } else if (filter === 'This Month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        query = query.gte('start_time', startOfMonth);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setHistory(data || []);
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = (start, end, status) => {
    if (!start) return "--";
    const startTimeDate = new Date(start);
    const endTimeDate = (status === 'active' || !end) ? new Date() : new Date(end);
    
    const diffMs = Math.abs(endTimeDate - startTimeDate);
    if (diffMs < 60000) return "< 1 min";
    
    const hrs = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const formatTime = (timeString) => {
    if (!timeString) return "--";
    return new Date(timeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-[#F8F9FE] min-h-screen text-on-surface flex flex-col font-body pb-10">
      
      {/* Top Header & Search */}
      <header className="bg-white px-4 pt-4 pb-4 shadow-sm relative z-20 w-full max-w-md mx-auto md:max-w-2xl">
          <div className="flex items-center justify-between mb-4">
              <button className="text-[#4a40e0] p-1 cursor-pointer" onClick={() => navigate('/dashboard')}>
                 <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'wght' 300" }}>menu</span>
              </button>
              <h1 className="text-xl font-extrabold text-[#4a40e0] tracking-tight">Do Parking</h1>
              <div className="w-10 h-10 rounded-full bg-teal-800 overflow-hidden border-2 border-transparent">
                  <span className="material-symbols-outlined text-white text-2xl flex items-center justify-center w-full h-full">person</span>
              </div>
          </div>
          
          <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant text-[20px]">search</span>
              <input 
                 type="text" 
                 placeholder="Search by location or date" 
                 className="w-full bg-white border border-outline-variant/20 rounded-2xl py-3.5 pl-11 pr-4 text-[14px] text-on-surface placeholder:text-outline-variant shadow-[0_2px_8px_rgba(0,0,0,0.02)] focus:outline-none focus:border-[#5D50D6]/30"
              />
          </div>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto md:max-w-2xl px-4 pt-6 relative z-10 space-y-5">
        
        {/* Title Section */}
        <div>
            <h2 className="text-[26px] font-extrabold text-[#1c1b1f] leading-tight">Parking History</h2>
            <p className="text-[#49454f] text-[13px] font-medium mt-1">View all your past parking sessions</p>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
            {['All', 'Today', 'This Week', 'This Month'].map(f => (
                <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`whitespace-nowrap px-6 py-2 rounded-full font-bold text-[13px] transition-all capitalize ${filter === f ? 'bg-[#5D50D6] text-white shadow-sm' : 'bg-[#e9eaef] text-[#49454f] hover:bg-[#e0e2e8]'}`}>
                    {f}
                </button>
            ))}
        </div>

        {/* History Cards */}
        <div className="space-y-4">
            {loading ? (
                <div className="flex justify-center p-10"><div className="animate-spin w-10 h-10 border-4 border-[#4a40e0] border-t-transparent rounded-full"></div></div>
            ) : history.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center flex flex-col items-center border border-outline-variant/10">
                    <span className="material-symbols-outlined text-4xl text-[#4a40e0]/50 mb-3" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
                    <h3 className="font-bold text-on-surface text-lg">No History Found</h3>
                    <p className="text-on-surface-variant text-sm">You haven't made any bookings {filter !== 'All' ? 'in this period' : 'yet'}.</p>
                </div>
            ) : (
                history.map(item => (
                    <div key={item.booking_id} className="bg-white rounded-3xl p-5 shadow-[0_4px_16px_rgba(74,64,224,0.04)] border border-outline-variant/10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex-1 pr-2">
                               <h3 className="font-extrabold text-[16px] text-on-surface leading-tight mb-1.5">{item.parking_stations?.name || 'Unknown Station'}</h3>
                               <div className="flex items-center gap-1.5 text-on-surface-variant">
                                   <span className="material-symbols-outlined text-[14px] text-outline">location_on</span>
                                   <span className="text-[11px] font-medium tracking-wide">{item.parking_stations?.address || 'N/A'}</span>
                               </div>
                            </div>
                            <div className="flex flex-col items-end gap-1.5">
                                <span className={`font-extrabold text-[18px] leading-none ${item.status === 'completed' ? 'text-[#4a40e0]' : 'text-[#4a40e0]/80'}`}>
                                    ₹{item.total_price || '0'}
                                </span>
                                <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${item.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : item.status === 'cancelled' ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
                                    {item.status}
                                </span>
                            </div>
                        </div>

                        {/* Time & Duration Blocks */}
                        <div className="flex gap-3 mb-4">
                            <div className="flex-1 bg-[#f7f8fc] rounded-2xl p-3 flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${item.status === 'completed' ? 'bg-indigo-50 text-[#5D50D6]' : 'bg-surface-container-low text-outline'}`}>
                                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold text-outline uppercase tracking-widest leading-none mb-0.5">Time</span>
                                    <span className={`font-bold text-[13px] ${item.status === 'completed' ? 'text-on-surface' : 'text-outline'}`}>{formatTime(item.start_time)}</span>
                                </div>
                            </div>
                            <div className="flex-1 bg-[#f7f8fc] rounded-2xl p-3 flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${item.status === 'completed' ? 'bg-indigo-50 text-[#5D50D6]' : 'bg-surface-container-low text-outline'}`}>
                                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>hourglass_bottom</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold text-outline uppercase tracking-widest leading-none mb-0.5">Duration</span>
                                    <span className={`font-bold text-[13px] ${item.status === 'active' ? 'text-[#ffb700]' : item.status === 'completed' ? 'text-[#4a40e0]' : 'text-outline'} tracking-wide`}>
                                      {calculateDuration(item.start_time, item.end_time, item.status)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Row - Slot & Payment Method */}
                        <div className="flex items-center justify-between border-t border-outline-variant/10 pt-4 px-1">
                            <div className="flex items-center gap-2">
                               <span className="material-symbols-outlined text-[16px] text-outline">grid_view</span>
                               <span className="text-[12px] font-medium text-on-surface-variant">Slot: <span className="font-extrabold text-on-surface">{item.parking_slots?.slot_number || '--'}</span></span>
                            </div>
                            <div className="flex items-center gap-2">
                               <span className="material-symbols-outlined text-[16px] text-outline">payments</span>
                               <span className="text-[12px] font-extrabold text-on-surface">{item.payment_method || 'UPI'}</span>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
      </main>
    </div>
  );
}
