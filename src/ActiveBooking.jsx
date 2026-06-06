import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from './supabase';

export default function ActiveBooking() {
  const navigate = useNavigate();
  const { activeBooking, fetchProfileAndCard } = useOutletContext();
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timerLabel, setTimerLabel] = useState('Ongoing Parking Time');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    const clock = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clock);
  }, []);

  // Live Timer based on activeBooking from context
  useEffect(() => {
    if (!activeBooking) return;

    const timer = setInterval(() => {
      const now = new Date();
      const start = new Date(activeBooking.start_time);
      const isStarted = now >= start;
      const dur = activeBooking.duration_hours || 1;
      
      let displaySec = 0;
      
      if (!isStarted) {
          displaySec = Math.floor((start - now) / 1000);
          setTimerLabel('STARTS IN');
      } else {
          displaySec = Math.floor((now - start) / 1000);
          setTimerLabel('SESSION ELAPSED');
      }
      
      const hrs = Math.floor(displaySec / 3600);
      const mins = Math.floor((displaySec % 3600) / 60);
      const secs = displaySec % 60;
      
      setElapsedTime(
        `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [activeBooking]);

  const handleCheckout = async () => {
    if (!activeBooking) return;
    setCheckoutLoading(true);
    
    try {
      const finalPrice = 40; 
      const endTime = new Date().toISOString();

      // 1. Update booking status
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ status: 'completed', end_time: endTime, total_price: finalPrice })
        .eq('booking_id', activeBooking.booking_id);

      if (bookingError) throw bookingError;

      // 2. Free up the slot
      await supabase
        .from('parking_slots')
        .update({ is_occupied: false })
        .eq('slot_id', activeBooking.slot_id);

      // 3. Update user card balance
      const { data: card } = await supabase
        .from('parking_cards')
        .select('*')
        .eq('user_id', activeBooking.user_id)
        .single();
      
      if (card) {
        await supabase
            .from('parking_cards')
            .update({ balance: card.balance - finalPrice })
            .eq('card_id', card.card_id);
      }

      // Refresh layout context state
      if (fetchProfileAndCard) {
        await fetchProfileAndCard();
      }

      navigate('/history');
    } catch (err) {
      console.error("Checkout failed:", err);
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800/40 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 lg:p-8 flex flex-col font-body">
      
      {/* Title & Clock Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-5 border-b border-slate-100 dark:border-slate-800/40">
        <div>
          <h2 className="text-xl font-extrabold text-[#4a40e0] tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            Active Parking Session
          </h2>
          <p className="text-slate-400 text-xs font-semibold mt-1">Track and manage your live parking status</p>
        </div>

        {activeBooking && (
          <div className="flex items-center gap-4 text-xs font-bold text-slate-500 bg-slate-50 dark:bg-slate-800/40 px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-700/10">
            <div className="flex flex-col sm:items-end">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Local Time</span>
              <span className="text-[#2B3674] dark:text-slate-200 mt-0.5">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Date</span>
              <span className="text-[#2B3674] dark:text-slate-200 mt-0.5">
                {currentTime.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
        )}
      </div>

      {!activeBooking ? (
        <div className="max-w-md mx-auto py-16 text-center flex flex-col items-center w-full">
          <div className="w-20 h-20 rounded-[2rem] bg-slate-50 dark:bg-slate-800 text-[#4a40e0] flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-700/30">
            <span className="material-symbols-outlined text-[40px]">notifications_off</span>
          </div>
          <h3 className="text-xl font-black text-[#2B3674] dark:text-slate-200 mb-2">No Active Session</h3>
          <p className="text-slate-400 text-sm font-medium leading-relaxed px-4">
            You don't have any active parking spots reserved right now. Start a new booking to track your vehicle in real-time.
          </p>
          
          <div className="flex flex-col w-full gap-3 mt-8">
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full bg-[#4a40e0] hover:bg-[#3b32b3] text-white py-4 rounded-2xl font-black text-sm shadow-lg shadow-[#4a40e0]/20 active:scale-95 transition-all cursor-pointer">
                Find Parking Spot
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Live Timer Card */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <div className="bg-gradient-to-br from-[#4a40e0]/5 to-indigo-50/10 dark:from-[#4a40e0]/10 dark:to-transparent rounded-[2rem] p-8 md:p-10 border border-[#4a40e0]/10 flex flex-col items-center justify-center relative overflow-hidden h-full min-h-[260px] shadow-sm">
              <div className="absolute top-6 right-6 flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-900/30">
                <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse"></div>
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 tracking-[0.1em]">LIVE SESSION</span>
              </div>

              <div className="relative z-10 flex flex-col items-center text-center mt-4">
                <div className="text-5xl md:text-6xl font-black text-[#2B3674] dark:text-slate-200 tracking-tighter mb-3 font-mono">
                  {elapsedTime}
                </div>
                <p className="text-slate-400 text-[11px] font-extrabold uppercase tracking-widest">{timerLabel}</p>
              </div>
            </div>
          </div>

          {/* Right Column: Details & Checkout Actions */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Zone & Slot Identifiers */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/10">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">PARKING ZONE</span>
                <div className="text-sm font-black text-[#2B3674] dark:text-slate-200 truncate">{activeBooking.parking_stations?.name || 'N/A'}</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/10">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">SLOT ID</span>
                <div className="text-sm font-black text-[#2B3674] dark:text-slate-200">{activeBooking.parking_slots?.slot_number || 'N/A'}</div>
              </div>
            </div>

            {/* Vehicle Insights Summary Card */}
            <div className="bg-slate-50 dark:bg-slate-800/20 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/50">
              <div className="flex items-center justify-between mb-5">
                <h4 className="text-xs font-black text-[#2B3674] dark:text-slate-200 uppercase tracking-widest">Vehicle Insights</h4>
                <span className="text-[10px] font-bold text-slate-400">ID: #{activeBooking.booking_id?.slice(0, 8)}</span>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-400">License Plate</span>
                  <span className="font-black text-[#2B3674] dark:text-slate-200">{activeBooking.vehicle_number}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-400">Entry Time</span>
                  <span className="font-black text-[#2B3674] dark:text-slate-200">
                    {new Date(activeBooking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-400">Estimated Fee</span>
                  <span className="font-black text-[#4a40e0] dark:text-indigo-400">₹40.00 / Hr</span>
                </div>
                
                <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex items-center justify-between">
                  <span className="text-sm font-bold text-[#2B3674] dark:text-slate-200">Total Amount Due</span>
                  <span className="text-xl font-black text-[#4a40e0] dark:text-indigo-400">₹{((activeBooking.duration_hours || 1) * 40).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Complete Payment / Actions */}
            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <button 
                onClick={handleCheckout}
                disabled={checkoutLoading}
                className="flex-1 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white py-4 px-6 rounded-xl font-black text-[13px] tracking-wide uppercase shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer">
                {checkoutLoading ? (
                  <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">payment</span>
                    Complete Payment
                  </>
                )}
              </button>
              
              <button 
                onClick={() => navigate('/booking', { state: { extend: true, bookingId: activeBooking.booking_id } })}
                className="flex-1 bg-white dark:bg-slate-800 text-[#4a40e0] dark:text-indigo-400 py-4 px-6 rounded-xl font-black text-[13px] tracking-wide uppercase border-2 border-[#4a40e0]/10 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-700/40 hover:border-[#4a40e0]/30 transition-all cursor-pointer">
                Extend Duration
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
