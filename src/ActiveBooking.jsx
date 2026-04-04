import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { useNavigate } from 'react-router-dom';

export default function ActiveBooking() {
  const navigate = useNavigate();
  const [activeBooking, setActiveBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [timerLabel, setTimerLabel] = useState('Ongoing Parking Time');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  console.log("ACTIVE_BOOKING_V2_LOADED", activeBooking);

  useEffect(() => {
    fetchActiveBooking();
    
    // Subscribe to booking changes (e.g. if Admin cancels it)
    const subscription = supabase
      .channel('active-booking-monitor')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
          if (payload.new && payload.new.status !== 'active') {
             fetchActiveBooking();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // Live Timer
  useEffect(() => {
    if (!activeBooking) return;

    const timer = setInterval(() => {
      const start = new Date(activeBooking.start_time);
      const now = new Date();
      const dur = activeBooking.duration_hours || 1;
      
      let diffSec = 0;
      if (now < start) {
          // It's a future booking
          diffSec = Math.floor((start - now) / 1000);
          setTimerLabel('Starts in');
      } else {
          // Session is active - timer should countdown the duration
          const totalDurationSec = dur * 3600;
          const elapsedFromStart = Math.floor((now - start) / 1000);
          diffSec = Math.max(0, totalDurationSec - elapsedFromStart);
          setTimerLabel('Ongoing Parking Time');
      }
      
      const hrs = Math.floor(diffSec / 3600);
      const mins = Math.floor((diffSec % 3600) / 60);
      const secs = diffSec % 60;
      
      setElapsedTime(
        `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [activeBooking]);

  const fetchActiveBooking = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          parking_stations(name, address),
          parking_slots(slot_number)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('start_time', { ascending: false })
        .maybeSingle();

      if (error) throw error;
      setActiveBooking(data);
    } catch (err) {
      console.error("Error fetching active booking:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!activeBooking) return;
    setCheckoutLoading(true);
    
    try {
      // 1. Calculate final price (e.g. ₹40 flat for now or dynamic)
      const finalPrice = 40; 
      const endTime = new Date().toISOString();

      // 2. Update booking status
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ status: 'completed', end_time: endTime, total_price: finalPrice })
        .eq('booking_id', activeBooking.booking_id);

      if (bookingError) throw bookingError;

      // 3. Free up the slot
      await supabase
        .from('parking_slots')
        .update({ is_occupied: false })
        .eq('slot_id', activeBooking.slot_id);

      // 4. Update user card balance
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

      navigate('/history');
    } catch (err) {
      console.error("Checkout failed:", err);
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="bg-[#F8F9FE] min-h-screen text-on-surface flex flex-col font-body">
      
      {/* Header */}
      <header className="bg-white px-6 py-6 shadow-sm flex items-center justify-between z-20">
          <button className="text-[#4a40e0] p-1 cursor-pointer" onClick={() => navigate('/dashboard')}>
             <span className="material-symbols-outlined text-[28px]">arrow_back</span>
          </button>
          <h1 className="text-xl font-extrabold text-[#4a40e0] tracking-tight">Active Session</h1>
          <button className="w-10 h-10 rounded-full bg-[#ECFDF5] text-[#10B981] flex items-center justify-center">
             <span className="material-symbols-outlined text-lg animate-pulse">check_circle</span>
          </button>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto px-6 pt-8 pb-10 flex flex-col items-center">
        
        {loading ? (
             <div className="flex flex-col items-center gap-4 py-20">
                <div className="animate-spin w-12 h-12 border-4 border-[#5D50D6]/30 border-t-[#5D50D6] rounded-full"></div>
                <span className="text-xs font-black text-[#A3AED0] uppercase tracking-widest">Querying Active Slots...</span>
             </div>
        ) : !activeBooking ? (
            <div className="bg-white rounded-[2.5rem] p-10 text-center flex flex-col items-center shadow-sm border border-outline-variant/10 w-full">
                <div className="w-20 h-20 rounded-[2rem] bg-[#F4F7FE] text-[#5D50D6] flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-[40px]">notifications_off</span>
                </div>
                <h3 className="text-2xl font-black text-[#2B3674] mb-2">No Active Session</h3>
                <p className="text-[#A3AED0] text-sm font-medium leading-relaxed px-4">There are currently no vehicles registered to an active parking spot.</p>
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="mt-8 bg-[#5D50D6] text-white px-10 py-4 rounded-2xl font-black text-sm shadow-lg shadow-[#5D50D6]/20 active:scale-95 transition-all">
                    Find Parking Spot
                </button>
            </div>
        ) : (
            <div className="w-full space-y-6">
                
                {/* Timer Card */}
                <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-outline-variant/10 flex flex-col items-center relative overflow-hidden">
                    {/* Animated Pulsing Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#5D50D6]/5 to-transparent opacity-20"></div>
                    <div className="absolute top-0 right-0 w-40 h-40 bg-[#5D50D6]/10 rounded-full blur-[80px] -mr-10 -mt-10"></div>
                    
                    <div className="relative z-10 flex flex-col items-center">
                        <span className="text-[10px] font-black text-[#5D50D6] uppercase tracking-[0.2em] mb-4 bg-indigo-50 px-4 py-1.5 rounded-full inline-block">LIVE TRACKING</span>
                        <div className="text-6xl font-black text-[#2B3674] tracking-tighter mb-2">{elapsedTime}</div>
                        <p className="text-[#A3AED0] text-[11px] font-bold uppercase tracking-widest">{timerLabel}</p>
                    </div>
                </div>

                {/* Location Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-outline-variant/10 flex flex-col gap-1">
                        <span className="text-[9px] font-black text-[#A3AED0] uppercase tracking-widest">Station ID</span>
                        <div className="text-sm font-black text-[#2B3674] truncate">{activeBooking.parking_stations?.name}</div>
                    </div>
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-outline-variant/10 flex flex-col gap-1">
                        <span className="text-[9px] font-black text-[#A3AED0] uppercase tracking-widest">Slot No.</span>
                        <div className="text-sm font-black text-[#2B3674]">{activeBooking.parking_slots?.slot_number}</div>
                    </div>
                </div>

                {/* Vehicle Details */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-outline-variant/10">
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="text-sm font-black text-[#2B3674] uppercase tracking-widest">Session Details</h4>
                        <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></div>
                             <span className="text-[10px] font-black text-[#10B981] uppercase tracking-widest">Active</span>
                        </div>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-[#A3AED0]">Vehicle No.</span>
                            <span className="text-sm font-black text-[#2B3674]">{activeBooking.vehicle_number}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-[#A3AED0]">Arrival Time</span>
                            <span className="text-sm font-black text-[#2B3674]">{new Date(activeBooking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-[#A3AED0]">Est. Price</span>
                            <span className="text-sm font-black text-[#5D50D6]">₹40 / Hr</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="pt-6 space-y-4">
                    <button 
                        onClick={handleCheckout}
                        disabled={checkoutLoading}
                        className="w-full bg-[#ff5b5b] hover:bg-[#ff4545] text-white py-5 rounded-2xl font-black text-sm shadow-xl shadow-red-500/10 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50">
                        {checkoutLoading ? (
                             <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></div>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-[20px]">exit_to_app</span>
                                CHECK OUT & PAY
                            </>
                        )}
                    </button>
                    <button 
                        className="w-full bg-white text-[#A3AED0] py-5 rounded-2xl font-black text-sm border border-[#E9EDF7] hover:border-[#5D50D6]/20 hover:text-[#2B3674] transition-all">
                        EXTEND PARKING TIME
                    </button>
                </div>

            </div>
        )}
      </main>
    </div>
  );
}
