import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { useNavigate } from 'react-router-dom';

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All'); // All, Today, This Week, This Month
  const [searchQuery, setSearchQuery] = useState('');
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
         return;
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

      // Apply Date Filters
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

  const formatDate = (timeString) => {
    if (!timeString) return "--";
    return new Date(timeString).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Client-side text filtering
  const filteredHistory = history.filter(item => {
    const stationName = item.parking_stations?.name?.toLowerCase() || '';
    const stationAddress = item.parking_stations?.address?.toLowerCase() || '';
    const slotNum = item.parking_slots?.slot_number?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return stationName.includes(query) || stationAddress.includes(query) || slotNum.includes(query);
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800/40 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 lg:p-8 flex flex-col font-body">
      
      {/* Title & Search bar row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 pb-5 border-b border-slate-100 dark:border-slate-800/40">
        <div>
          <h2 className="text-xl font-extrabold text-[#4a40e0] tracking-tight">Parking History</h2>
          <p className="text-slate-400 text-xs font-semibold mt-1">Review your past parking reservations and sessions</p>
        </div>

        <div className="relative w-full md:w-80 shrink-0">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
          <input 
             type="text" 
             placeholder="Search by station or slot" 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-2xl py-3 pl-11 pr-4 text-[13px] text-on-surface placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4a40e0]/20 focus:border-[#4a40e0]/30 transition-all"
          />
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 custom-scrollbar shrink-0">
        {['All', 'Today', 'This Week', 'This Month'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`whitespace-nowrap px-5 py-2.5 rounded-xl font-black text-xs transition-all tracking-wide ${
              filter === f 
                ? 'bg-[#4a40e0] text-white shadow-md shadow-[#4a40e0]/10' 
                : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700/60 cursor-pointer'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* History Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-8 h-8 rounded-full border-4 border-[#4a40e0]/30 border-t-[#4a40e0]"></div>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="max-w-md mx-auto py-16 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-700/30">
            <span className="material-symbols-outlined text-slate-400 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
          </div>
          <h3 className="font-extrabold text-on-surface text-base">No History Found</h3>
          <p className="text-slate-400 text-xs font-semibold mt-1">You haven't made any bookings matching this criteria yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHistory.map(item => (
            <div 
              key={item.booking_id} 
              onClick={() => {
                if (item.status === 'completed') {
                  navigate('/ticket', {
                    state: {
                      vehicleType: item.vehicle_type,
                      spot: item.parking_slots?.slot_number,
                      basement: item.basement || 'B1',
                      duration: item.duration_hours ? `${item.duration_hours} Hr` : '1 Hr',
                      paymentMethod: item.payment_method || 'Primary Card',
                      stationName: item.parking_stations?.name,
                      stationAddress: item.parking_stations?.address,
                      totalAmount: item.total_price || 40,
                      entryTime: item.start_time,
                      exitTime: item.end_time,
                      bookingId: item.booking_id,
                    }
                  });
                }
              }}
              className={`bg-slate-50 dark:bg-slate-800/20 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/50 shadow-sm flex flex-col justify-between transition-all ${
                item.status === 'completed' ? 'hover:shadow-md hover:border-[#4a40e0]/20 cursor-pointer active:scale-[0.99]' : ''
              }`}
            >
              <div>
                {/* Station Name & Status */}
                <div className="flex justify-between items-start gap-3 mb-4">
                  <div className="min-w-0">
                    <h3 className="font-black text-sm text-[#2B3674] dark:text-slate-200 leading-tight truncate">{item.parking_stations?.name || 'Unknown Station'}</h3>
                    <div className="flex items-center gap-1 mt-1 text-slate-400">
                      <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                      <span className="text-[10px] font-bold truncate max-w-[150px] uppercase tracking-wider">{item.parking_stations?.address || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0 gap-1.5">
                    <span className="font-black text-sm text-[#4a40e0] dark:text-indigo-400">
                      ₹{item.total_price || '0'}
                    </span>
                    <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                      item.status === 'completed' 
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/20' 
                        : item.status === 'cancelled' 
                        ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-500 dark:text-rose-400 border-rose-100 dark:border-rose-900/20' 
                        : 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/20'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>

                {/* Timing Specs */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-slate-400">schedule</span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">TIME</span>
                      <span className="font-extrabold text-xs text-[#2B3674] dark:text-slate-200 mt-1 truncate">{formatTime(item.start_time)}</span>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-slate-400">hourglass_bottom</span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">DURATION</span>
                      <span className="font-extrabold text-xs text-[#2B3674] dark:text-slate-200 mt-1 truncate">
                        {calculateDuration(item.start_time, item.end_time, item.status)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Meta */}
              <div className="flex items-center justify-between border-t border-slate-200/60 dark:border-slate-800 pt-3 text-[10px] font-bold text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">grid_view</span>
                  Slot: <span className="font-extrabold text-[#2B3674] dark:text-slate-200">{item.parking_slots?.slot_number || '--'}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                  {formatDate(item.start_time)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
