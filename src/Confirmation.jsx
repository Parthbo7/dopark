import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './supabase';
import { NotifyPresets } from './notificationService';

export default function Confirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { vehicleType = '4_wheeler', spotName = '006', basement = 'B1', stationId, spotId } = location.state || {};
  
  const [durationOption, setDurationOption] = useState('1 Hr');
  const [durationValue, setDurationValue] = useState(1);
  const [startTimeOption, setStartTimeOption] = useState('Starts Now');
  const [customStartTime, setCustomStartTime] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [cardData, setCardData] = useState(null);
  const [loadingCard, setLoadingCard] = useState(true);

  const parkingFeePerHr = 80;
  const parkingFee = Math.round(parkingFeePerHr * durationValue);
  const serviceFee = 10;
  const taxes = 10;
  const totalAmount = parkingFee + serviceFee + taxes;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: cData } = await supabase.from('parking_cards').select('*').eq('user_id', user.id).single();
          if (cData) setCardData(cData);
        }
      } catch (err) { console.error(err); }
      finally { setLoadingCard(false); }
    };
    fetchData();
  }, []);

  const displaySpot = `${basement} - ${spotName}`;
  const vehicleNum = cardData?.vehicle_number || 'MH12 AB 1234';
  const balance = cardData?.balance || 0;

  const handleConfirmAndPay = async () => {
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Must be logged in!");

      if (!cardData || cardData.balance < totalAmount) {
        throw new Error("Insufficient Balance in DoCard");
      }

      const { error: deductionErr } = await supabase
        .from('parking_cards')
        .update({ balance: cardData.balance - totalAmount })
        .eq('card_id', cardData.card_id);
      if (deductionErr) throw deductionErr;

      let startTime = new Date();
      if (startTimeOption === '+15m') {
        startTime = new Date(startTime.getTime() + 15 * 1000 * 60);
      } else if (startTimeOption === 'Custom' && customStartTime) {
        const [hours, minutes] = customStartTime.split(':').map(Number);
        
        // Create a new date at current local time but with requested hours/minutes
        const customDate = new Date();
        customDate.setHours(hours, minutes, 0, 0);
        
        // If the custom time is in the past, assume it's for tomorrow
        if (customDate < new Date()) {
          customDate.setDate(customDate.getDate() + 1)
        }
        startTime = customDate;
      }
      const endTime = new Date(startTime.getTime() + durationValue * 60 * 60 * 1000);

      const { data: bookingData, error: bookingErr } = await supabase
        .from('bookings')
        .insert([{
          user_id: user.id,
          station_id: stationId || null,
          slot_id: spotId || null,
          vehicle_type: vehicleType,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          duration_hours: durationValue,
          total_price: totalAmount,
          payment_method: 'Primary Card',
          status: 'active'
        }])
        .select()
        .single();
        
      if (bookingErr) throw bookingErr;

      await supabase.from('parking_slots').update({ is_occupied: true }).eq('slot_id', spotId);

      // Fire session-started notification
      NotifyPresets.sessionStarted(user.id, location.state?.stationName || 'Parking Station');

      navigate('/ticket', {
        state: {
          vehicleType,
          spot: spotName,
          basement,
          duration: `${durationValue} Hr`,
          paymentMethod: 'Primary Card',
          stationName: location.state?.stationName || 'Phoenix Palladium',
          stationAddress: location.state?.stationAddress || 'Pune',
          stationLat: location.state?.stationLat,
          stationLng: location.state?.stationLng,
          totalAmount,
          entryTime: startTime.toISOString(),
          exitTime: endTime.toISOString(),
          bookingId: bookingData?.booking_id
        }
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800/40 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 lg:p-8 flex flex-col font-body">

      {/* ── HEADER ─────────────────────────────────────────── */}
      <header className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition text-slate-500 cursor-pointer flex items-center justify-center">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h2 className="text-xl font-extrabold text-on-surface tracking-tight">Booking Confirmation</h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">Confirm details and pay securely</p>
        </div>
      </header>

      {/* ── MAIN CONTENT GRID ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-16 lg:pb-0">

        {/* Left Column (7 cols): Venue, Vehicle, Time, Duration */}
        <div className="lg:col-span-7 space-y-6">
          {/* Parking Venue Details */}
          <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-6 border border-slate-100/60 dark:border-slate-700/10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-primary text-[8px] font-extrabold uppercase tracking-widest mb-1 block">PARKING VENUE</span>
                <h3 className="text-lg font-black text-on-surface tracking-tight">{location.state?.stationName || 'Phoenix Palladium'}</h3>
              </div>
              <div className="w-9 h-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
              </div>
            </div>

            {/* Slot & Date Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">SLOT</span>
                <span className="font-extrabold text-sm text-on-surface">{displaySpot}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">DATE</span>
                <span className="font-extrabold text-sm text-on-surface">Today</span>
              </div>
            </div>
          </div>

          {/* Linked Vehicle Card (Gradient) */}
          <div className="rounded-2xl p-6 relative overflow-hidden text-white shadow-md" style={{ background: 'linear-gradient(135deg, #6C63FF 0%, #4F46E5 40%, #7C3AED 100%)' }}>
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full blur-lg"></div>

            <div className="flex items-center justify-between mb-1 relative z-10">
              <span className="text-white/70 text-[9px] font-bold tracking-wider uppercase">LINKED VEHICLE CARD</span>
              <span className="bg-white/20 backdrop-blur text-white text-[8px] font-extrabold px-2.5 py-0.5 rounded-full tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                FAST EXIT
              </span>
            </div>

            <h3 className="text-base font-black mb-3 relative z-10">{vehicleType === '4_wheeler' ? '4 Wheeler' : '2 Wheeler'}</h3>

            {/* Number plate */}
            <div className="text-[22px] font-black tracking-[0.12em] mb-4 relative z-10" style={{ fontFamily: "'JetBrains Mono','Roboto Mono',monospace" }}>
              {vehicleNum}
            </div>

            {/* DoCard Balance */}
            <div className="flex items-center justify-between relative z-10 pt-3 border-t border-white/15">
              <div>
                <span className="text-white/60 text-[9px] font-bold tracking-wider uppercase block">DOCARD BALANCE</span>
                <span className="text-lg font-black">₹{loadingCard ? '...' : Number(balance).toLocaleString('en-IN')}</span>
              </div>
              <div className="w-8 h-8 bg-white/15 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-[16px] text-white/80" style={{ fontVariationSettings: "'FILL' 1" }}>credit_card</span>
              </div>
            </div>
          </div>

          {/* Start Time Selection */}
          <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-6 border border-slate-100/60 dark:border-slate-700/10">
            <span className="text-xs font-bold text-on-surface mb-3 block">Select Start Time</span>
            <div className="flex gap-2.5">
              {['Starts Now', '+15m', 'Custom'].map(option => (
                <button 
                  key={option}
                  onClick={() => setStartTimeOption(option)}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all border cursor-pointer ${startTimeOption === option ? 'bg-primary border-primary text-white shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-100 hover:bg-slate-50'}`}
                >
                  {option}
                </button>
              ))}
            </div>
            {startTimeOption === 'Custom' && (
              <input 
                type="time" value={customStartTime} onChange={e => setCustomStartTime(e.target.value)}
                className="w-full p-3 mt-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 font-bold text-on-surface focus:border-primary outline-none text-sm"
              />
            )}
          </div>

          {/* Duration Selection */}
          <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-6 border border-slate-100/60 dark:border-slate-700/10">
            <span className="text-xs font-bold text-on-surface mb-3 block">Select Duration</span>
            <div className="flex gap-2.5">
              {['1 Hr', '2 Hr', 'Custom'].map(option => (
                <button 
                  key={option}
                  onClick={() => {
                    setDurationOption(option);
                    if (option === '1 Hr') setDurationValue(1);
                    if (option === '2 Hr') setDurationValue(2);
                  }}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all border cursor-pointer ${durationOption === option ? 'bg-primary border-primary text-white shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-100 hover:bg-slate-50'}`}
                >
                  {option}
                </button>
              ))}
            </div>
            {durationOption === 'Custom' && (
              <div className="flex items-center justify-between p-4 mt-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-on-surface">Total Hours:</span>
                <div className="flex items-center gap-4">
                  <button onClick={() => setDurationValue(prev => Math.max(1, prev-1))} className="w-8 h-8 rounded-full border bg-white dark:bg-slate-800 font-black text-sm flex items-center justify-center cursor-pointer hover:bg-slate-50">-</button>
                  <span className="font-extrabold text-sm text-primary">{durationValue}</span>
                  <button onClick={() => setDurationValue(prev => prev+1)} className="w-8 h-8 rounded-full border bg-white dark:bg-slate-800 font-black text-sm flex items-center justify-center cursor-pointer hover:bg-slate-50">+</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Billing Summary, AutoPay banner, Actions */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-6 border border-slate-100/60 dark:border-slate-700/10">
            <h3 className="font-bold text-on-surface text-sm mb-4">Payment Summary</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Parking Fee</span>
                <span className="font-semibold text-on-surface">₹{parkingFee}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Service Fee</span>
                <span className="font-semibold text-on-surface">₹{serviceFee}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-200/50">
                <span className="text-slate-500">Taxes</span>
                <span className="font-semibold text-on-surface">₹{taxes}</span>
              </div>
            </div>
            <div className="flex justify-between items-center pt-3">
              <span className="font-extrabold text-xs text-on-surface">Total Amount</span>
              <span className="font-black text-lg text-primary">₹{totalAmount}</span>
            </div>
          </div>

          {/* AutoPay Banner */}
          <div className="bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl p-5 flex items-start gap-3.5 border border-primary/10">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 text-primary">
              <span className="material-symbols-outlined text-base">info</span>
            </div>
            <div>
              <h4 className="font-bold text-xs text-on-surface mb-0.5">Seamless Auto-Checkout</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed">Payment will be deducted automatically from your linked DoCard for a frictionless parking experience.</p>
            </div>
          </div>

          {/* Desktop/Tablet Inline Action Button */}
          <div className="hidden lg:block">
            <button 
              onClick={handleConfirmAndPay} 
              disabled={isProcessing}
              className={`w-full py-3.5 text-white font-extrabold text-xs rounded-xl tracking-wide uppercase transition-all shadow-md ${isProcessing ? 'bg-primary/50' : 'bg-gradient-to-r from-primary to-[#6C63FF] hover:brightness-110 active:scale-95 cursor-pointer'}`}
            >
              {isProcessing ? 'Finalizing Booking...' : `Confirm & Pay ₹${totalAmount}`}
            </button>
          </div>
        </div>

      </div>

      {/* ── MOBILE FIXED BOTTOM BAR (visible on <1024px) ────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-100 dark:border-slate-800/80 z-40 flex justify-center">
        <button 
          onClick={handleConfirmAndPay} 
          disabled={isProcessing}
          className={`w-full max-w-md py-3.5 text-white font-extrabold text-xs rounded-xl tracking-wide uppercase transition-all shadow-md ${isProcessing ? 'bg-primary/50' : 'bg-gradient-to-r from-primary to-[#6C63FF] hover:brightness-110 active:scale-95 cursor-pointer'}`}
        >
          {isProcessing ? 'Finalizing Booking...' : `Confirm & Pay ₹${totalAmount}`}
        </button>
      </div>

    </div>
  );
}
