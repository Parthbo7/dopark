import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from './supabase';
import { createNotification } from './notificationService';

export default function ActiveBooking() {
  const navigate = useNavigate();
  const { activeBooking, cardData, fetchProfileAndCard } = useOutletContext();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [extendHours, setExtendHours] = useState(1);
  const [extendLoading, setExtendLoading] = useState(false);
  const [timerState, setTimerState] = useState({
    label: 'Ongoing Parking Time',
    elapsedTime: '00:00:00',
    colorMode: 'normal',
    badgeText: 'LIVE SESSION'
  });

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
      const dur = activeBooking.duration_hours || 1;
      const end = new Date(start.getTime() + dur * 60 * 60 * 1000);
      
      let displaySec = 0;
      let label = '';
      let colorMode = 'normal';
      let badgeText = 'LIVE SESSION';
      
      if (now < start) {
        displaySec = Math.floor((start - now) / 1000);
        label = 'STARTS IN';
        colorMode = 'normal';
        badgeText = 'UPCOMING';
      } else if (now >= start && now < end) {
        displaySec = Math.floor((end - now) / 1000);
        label = 'TIME REMAINING';
        badgeText = 'LIVE SESSION';
        
        const remainingMinutes = displaySec / 60;
        if (remainingMinutes < 10) {
          colorMode = 'critical';
        } else if (remainingMinutes < 30) {
          colorMode = 'warning';
        } else {
          colorMode = 'normal';
        }
      } else {
        displaySec = Math.floor((now - end) / 1000);
        label = 'OVERTIME';
        colorMode = 'overtime';
        badgeText = 'SESSION EXPIRED';
      }
      
      const hrs = Math.floor(displaySec / 3600);
      const mins = Math.floor((displaySec % 3600) / 60);
      const secs = displaySec % 60;
      
      setTimerState({
        label,
        elapsedTime: `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`,
        colorMode,
        badgeText
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeBooking]);

  const getTimerStyles = () => {
    switch (timerState.colorMode) {
      case 'warning':
        return {
          cardBg: 'bg-gradient-to-br from-amber-500/5 to-amber-50/10 dark:from-amber-500/10 dark:to-transparent',
          cardBorder: 'border-amber-500/30',
          textClass: 'text-amber-600 dark:text-amber-400',
          badgeBg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/30',
          badgeText: 'text-amber-600 dark:text-amber-450',
          indicatorDot: 'bg-amber-500'
        };
      case 'critical':
        return {
          cardBg: 'bg-gradient-to-br from-rose-500/5 to-rose-50/10 dark:from-rose-500/10 dark:to-transparent animate-pulse',
          cardBorder: 'border-rose-550/30',
          textClass: 'text-rose-600 dark:text-rose-400',
          badgeBg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-150 dark:border-rose-900/30',
          badgeText: 'text-rose-605 dark:text-rose-400',
          indicatorDot: 'bg-rose-500'
        };
      case 'overtime':
        return {
          cardBg: 'bg-gradient-to-br from-rose-500/10 to-red-550/20 dark:from-rose-950/30 dark:to-rose-900/10 animate-pulse',
          cardBorder: 'border-rose-600/50',
          textClass: 'text-rose-650 dark:text-rose-400 font-extrabold',
          badgeBg: 'bg-rose-100 dark:bg-rose-900/60 border-rose-250 dark:border-rose-800/40',
          badgeText: 'text-rose-700 dark:text-rose-300',
          indicatorDot: 'bg-rose-600 animate-ping'
        };
      case 'normal':
      default:
        return {
          cardBg: 'bg-gradient-to-br from-[#4a40e0]/5 to-indigo-50/10 dark:from-[#4a40e0]/10 dark:to-transparent',
          cardBorder: 'border-[#4a40e0]/10',
          textClass: 'text-[#2B3674] dark:text-slate-200',
          badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/30',
          badgeText: 'text-emerald-600 dark:text-emerald-400',
          indicatorDot: 'bg-emerald-500'
        };
    }
  };

  const timerStyles = getTimerStyles();
  const elapsedTime = timerState.elapsedTime;
  const timerLabel = timerState.label;

  const handleExtend = async () => {
    if (!activeBooking) return;
    setExtendLoading(true);
    
    try {
      const extensionCost = extendHours * 40;
      
      // Fetch card from DB to prevent race conditions
      const { data: card, error: cardErr } = await supabase
        .from('parking_cards')
        .select('*')
        .eq('user_id', activeBooking.user_id)
        .single();
        
      if (cardErr) throw cardErr;
      if (!card || card.balance < extensionCost) {
        alert("Insufficient balance in your DoCard! Please top up first.");
        setExtendLoading(false);
        return;
      }
      
      const currentEndTime = new Date(activeBooking.end_time);
      const newEndTime = new Date(currentEndTime.getTime() + extendHours * 60 * 60 * 1000).toISOString();
      const newTotalPrice = (activeBooking.total_price || 0) + extensionCost;
      const newDuration = (activeBooking.duration_hours || 1) + extendHours;

      // Update booking
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ 
          end_time: newEndTime, 
          total_price: newTotalPrice,
          duration_hours: newDuration
        })
        .eq('booking_id', activeBooking.booking_id);

      if (bookingError) throw bookingError;

      // Deduct balance from card
      const { error: cardUpdateErr } = await supabase
        .from('parking_cards')
        .update({ balance: card.balance - extensionCost })
        .eq('card_id', card.card_id);
        
      if (cardUpdateErr) throw cardUpdateErr;

      // Insert notification
      await createNotification({
        userId: activeBooking.user_id,
        type: 'booking',
        title: 'Booking Extended',
        message: `Your booking at ${activeBooking.parking_stations?.name || 'Parking Station'} was extended by ${extendHours} hour(s).`,
        icon: 'add_time',
        metadata: { booking_id: activeBooking.booking_id, extend_hours: extendHours }
      });

      // Refresh layout context state
      if (fetchProfileAndCard) {
        await fetchProfileAndCard();
      }
      
      setIsExtendModalOpen(false);
      alert("Session extended successfully!");
    } catch (err) {
      console.error("Extension failed:", err);
      alert("An error occurred while extending the booking.");
    } finally {
      setExtendLoading(false);
    }
  };

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
            <div className={`${timerStyles.cardBg} rounded-[2rem] p-8 md:p-10 border ${timerStyles.cardBorder} flex flex-col items-center justify-center relative overflow-hidden h-full min-h-[260px] shadow-sm transition-all duration-500`}>
              <div className={`absolute top-6 right-6 flex items-center gap-2 ${timerStyles.badgeBg} px-3 py-1.5 rounded-full border transition-all duration-500`}>
                <div className={`w-2.5 h-2.5 rounded-full ${timerStyles.indicatorDot} transition-all duration-500`}></div>
                <span className={`text-[10px] font-black ${timerStyles.badgeText} tracking-[0.1em] transition-all duration-500`}>
                  {timerState.badgeText}
                </span>
              </div>

              <div className="relative z-10 flex flex-col items-center text-center mt-4">
                <div className={`text-5xl md:text-6xl font-black ${timerStyles.textClass} tracking-tighter mb-3 font-mono transition-all duration-500`}>
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
                onClick={() => setIsExtendModalOpen(true)}
                className="flex-1 bg-white dark:bg-slate-800 text-[#4a40e0] dark:text-indigo-400 py-4 px-6 rounded-xl font-black text-[13px] tracking-wide uppercase border-2 border-[#4a40e0]/10 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-700/40 hover:border-[#4a40e0]/30 transition-all cursor-pointer">
                Extend Duration
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Extend Duration Modal */}
      {isExtendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsExtendModalOpen(false)}
          ></div>
          
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800/40 shadow-2xl p-6 md:p-8 max-w-md w-full relative z-10 animate-fade-in font-body">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/40">
              <div>
                <h3 className="text-lg font-black text-[#2B3674] dark:text-slate-200 tracking-tight flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#4a40e0]" style={{ fontVariationSettings: "'FILL' 1" }}>add_time</span>
                  Extend Booking
                </h3>
                <p className="text-slate-400 text-xs font-semibold mt-1">Add more hours to your active session</p>
              </div>
              <button 
                onClick={() => setIsExtendModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 p-1.5 rounded-lg transition flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="space-y-5">
              <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-4 border border-slate-150/40 dark:border-slate-800/60 text-xs font-semibold text-slate-400 space-y-2">
                <div className="flex justify-between">
                  <span>Parking station</span>
                  <span className="font-extrabold text-[#2B3674] dark:text-slate-200 truncate max-w-[200px]">
                    {activeBooking.parking_stations?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Slot ID</span>
                  <span className="font-extrabold text-[#2B3674] dark:text-slate-200">
                    {activeBooking.parking_slots?.slot_number}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Current Expiry</span>
                  <span className="font-extrabold text-rose-500">
                    {new Date(activeBooking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2.5">
                  Select Additional Hours
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((hr) => (
                    <button
                      key={hr}
                      onClick={() => setExtendHours(hr)}
                      className={`py-3 rounded-xl border text-xs font-black transition-all ${
                        extendHours === hr
                          ? 'bg-[#4a40e0] border-[#3b32b3] text-white shadow-md'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-750'
                      }`}
                    >
                      +{hr} Hr{hr > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl p-4 border border-indigo-100/30 space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-400 font-semibold">
                  <span>Hourly Rate</span>
                  <span className="font-bold text-[#2B3674] dark:text-slate-350">₹40.00 / Hr</span>
                </div>
                <div className="flex justify-between text-slate-400 font-semibold">
                  <span>Extension Cost</span>
                  <span className="font-extrabold text-[#4a40e0] dark:text-indigo-400">₹{extendHours * 40}</span>
                </div>
                <div className="border-t border-indigo-100/40 dark:border-slate-800 pt-2.5 flex justify-between font-bold text-slate-400">
                  <span>Your Card Balance</span>
                  <span className={`font-extrabold ${cardData?.balance < (extendHours * 40) ? 'text-rose-500' : 'text-emerald-500'}`}>
                    ₹{cardData?.balance || 0}
                  </span>
                </div>
              </div>

              {cardData?.balance < (extendHours * 40) && (
                <p className="text-[10px] text-rose-500 font-extrabold text-center">
                  ⚠️ Insufficient balance. Please top up your wallet first!
                </p>
              )}
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setIsExtendModalOpen(false)}
                className="flex-1 py-3.5 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-xl transition text-xs font-black tracking-wider uppercase cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExtend}
                disabled={extendLoading || cardData?.balance < (extendHours * 40)}
                className="flex-1 py-3.5 bg-[#4a40e0] hover:bg-[#3b32b3] disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl shadow-md transition text-xs font-black tracking-wider uppercase flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {extendLoading ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div>
                ) : (
                  <>Confirm (+₹{extendHours * 40})</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
