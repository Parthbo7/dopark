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
    <div className="bg-[#F8F9FE] min-h-screen text-[#1c1b1f] flex flex-col font-body">

      {/* ── HEADER ─────────────────────────────────────────── */}
      <header className="bg-gradient-to-r from-[#5D50D6] to-[#6C63FF] rounded-b-[2rem] pt-5 pb-8 px-5 text-white relative z-10 w-full max-w-md mx-auto md:max-w-2xl shadow-lg">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 transition-colors rounded-xl">
            <span className="material-symbols-outlined text-white">arrow_back</span>
          </button>
          <h1 className="text-[17px] font-extrabold mx-auto -ml-2 tracking-tight">Booking Confirmation</h1>
          <div className="w-10"></div>
        </div>
      </header>

      {/* ── MAIN CONTENT ───────────────────────────────────── */}
      <main className="flex-1 w-full max-w-md mx-auto md:max-w-2xl px-5 -mt-4 relative z-20 space-y-4 pb-32 overflow-y-auto custom-scrollbar">

        {/* ── PARKING VENUE CARD ────────────────────────── */}
        <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-5">
            <div>
              <span className="text-[#4a40e0] text-[9px] font-extrabold uppercase tracking-widest mb-1.5 block">PARKING VENUE</span>
              <h2 className="text-xl font-black text-[#1c1b1f] tracking-tight">{location.state?.stationName || 'Phoenix Palladium'}</h2>
            </div>
            <div className="w-10 h-10 bg-[#4a40e0]/10 text-[#4a40e0] rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
            </div>
          </div>

          {/* Slot / Date Row */}
          <div className="flex gap-6 mb-5">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">SLOT</span>
              <span className="font-extrabold text-[15px] text-[#1c1b1f]">{displaySpot}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">DATE</span>
              <span className="font-extrabold text-[15px] text-[#1c1b1f]">Today</span>
            </div>
          </div>

          {/* ── VEHICLE CARD (Gradient) ──────────────────── */}
          <div className="rounded-[1.25rem] p-5 relative overflow-hidden text-white mb-2" style={{ background: 'linear-gradient(135deg, #6C63FF 0%, #4F46E5 40%, #7C3AED 100%)' }}>
            {/* Glow effects */}
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full blur-lg"></div>

            <div className="flex items-center justify-between mb-1 relative z-10">
              <span className="text-white/70 text-[10px] font-bold tracking-wider uppercase">LINKED VEHICLE CARD</span>
              <span className="bg-white/20 backdrop-blur text-white text-[8px] font-extrabold px-2.5 py-1 rounded-full tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                FAST EXIT
              </span>
            </div>

            <h3 className="text-lg font-black mb-3 relative z-10">{vehicleType === '4_wheeler' ? '4 Wheeler' : '2 Wheeler'}</h3>

            {/* Number plate */}
            <div className="text-[24px] font-black tracking-[0.15em] mb-4 relative z-10" style={{ fontFamily: "'JetBrains Mono','Roboto Mono',monospace" }}>
              {vehicleNum}
            </div>

            {/* Badges */}
            <div className="flex gap-2 mb-4 relative z-10">
              <span className="bg-white/15 backdrop-blur text-white text-[8px] font-bold px-2.5 py-1.5 rounded-full flex items-center gap-1">
                <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                AUTO PAY : ACTIVE
              </span>
              <span className="bg-white/15 backdrop-blur text-white text-[8px] font-bold px-2.5 py-1.5 rounded-full flex items-center gap-1">
                <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                FAST EXIT : ENABLED
              </span>
            </div>

            {/* DoCard Balance */}
            <div className="flex items-center justify-between relative z-10 pt-3 border-t border-white/15">
              <div>
                <span className="text-white/60 text-[9px] font-bold tracking-wider uppercase block">DOCARD BALANCE</span>
                <span className="text-xl font-black">₹{loadingCard ? '...' : Number(balance).toLocaleString('en-IN')}</span>
              </div>
              <div className="w-9 h-9 bg-white/15 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px] text-white/80" style={{ fontVariationSettings: "'FILL' 1" }}>credit_card</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── START TIME ────────────────────────────────── */}
        <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-100">
          <span className="text-xs font-bold text-[#1c1b1f] mb-3 block">Select Start Time</span>
          <div className="flex gap-3 mb-2">
            {['Starts Now', '+15m', 'Custom'].map(option => (
              <button 
                key={option}
                onClick={() => setStartTimeOption(option)}
                className={`flex-1 py-3 rounded-full font-bold text-[12px] transition-all border-2 ${startTimeOption === option ? 'bg-[#4a40e0] border-[#4a40e0] text-white shadow-md shadow-[#4a40e0]/20' : 'bg-slate-50 text-slate-500 border-transparent'}`}
              >
                {option}
              </button>
            ))}
          </div>
          {startTimeOption === 'Custom' && (
            <input 
              type="time" value={customStartTime} onChange={e => setCustomStartTime(e.target.value)}
              className="w-full p-3.5 mt-2 bg-slate-50 rounded-xl border border-slate-200 font-bold text-[#1c1b1f] focus:border-[#4a40e0] outline-none"
            />
          )}
        </div>

        {/* ── DURATION ──────────────────────────────────── */}
        <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-100">
          <span className="text-xs font-bold text-[#1c1b1f] mb-3 block">Select Duration</span>
          <div className="flex gap-3">
            {['1 Hr', '2 Hr', 'Custom'].map(option => (
              <button 
                key={option}
                onClick={() => {
                  setDurationOption(option);
                  if (option === '1 Hr') setDurationValue(1);
                  if (option === '2 Hr') setDurationValue(2);
                }}
                className={`flex-1 py-3 rounded-full font-bold text-[12px] transition-all border-2 ${durationOption === option ? 'bg-[#4a40e0] border-[#4a40e0] text-white shadow-md shadow-[#4a40e0]/20' : 'bg-slate-50 text-slate-500 border-transparent'}`}
              >
                {option}
              </button>
            ))}
          </div>
          {durationOption === 'Custom' && (
            <div className="flex items-center justify-between p-4 mt-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-[#1c1b1f]">Total Hours:</span>
              <div className="flex items-center gap-4">
                <button onClick={() => setDurationValue(prev => Math.max(1, prev-1))} className="w-8 h-8 rounded-full border bg-white font-black text-lg flex items-center justify-center">-</button>
                <span className="font-extrabold text-lg text-[#4a40e0]">{durationValue}</span>
                <button onClick={() => setDurationValue(prev => prev+1)} className="w-8 h-8 rounded-full border bg-white font-black text-lg flex items-center justify-center">+</button>
              </div>
            </div>
          )}
        </div>

        {/* ── PAYMENT SUMMARY ──────────────────────────── */}
        <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-[#1c1b1f] text-[15px] mb-5">Payment Summary</h3>
          <div className="space-y-3.5 text-[13px]">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Parking Fee</span>
              <span className="font-semibold text-[#1c1b1f]">₹{parkingFee}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Service Fee</span>
              <span className="font-semibold text-[#1c1b1f]">₹{serviceFee}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <span className="text-slate-500">Taxes</span>
              <span className="font-semibold text-[#1c1b1f]">₹{taxes}</span>
            </div>
          </div>
          <div className="flex justify-between items-center pt-4">
            <span className="font-extrabold text-[15px] text-[#1c1b1f]">Total Amount</span>
            <span className="font-black text-[22px] text-[#4a40e0]">₹{totalAmount}</span>
          </div>
        </div>

        {/* ── AUTO-CHECKOUT BANNER ─────────────────────── */}
        <div className="bg-gradient-to-r from-[#EEF2FF] to-[#E8E4FE] rounded-[1.25rem] p-5 flex items-start gap-3.5 border border-[#4a40e0]/10">
          <div className="w-9 h-9 rounded-full bg-[#4a40e0]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-[#4a40e0] text-[18px]">info</span>
          </div>
          <div>
            <h4 className="font-bold text-[13px] text-[#1c1b1f] mb-1">Seamless Auto-Checkout</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">Payment will be deducted automatically from your linked DoCard for a frictionless parking experience.</p>
          </div>
        </div>

      </main>

      {/* ── FIXED CONFIRM BUTTON ───────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/95 backdrop-blur-xl border-t border-slate-100 z-50 flex justify-center">
        <button 
          onClick={handleConfirmAndPay} 
          disabled={isProcessing}
          className={`w-full max-w-sm py-4 text-white font-extrabold text-[15px] rounded-full shadow-[0px_8px_24px_rgba(74,64,224,0.3)] active:scale-[0.97] transition-all ${isProcessing ? 'bg-[#a39dfa]' : 'bg-gradient-to-r from-[#4a40e0] to-[#6C63FF] hover:brightness-110'}`}
        >
          {isProcessing ? 'Finalizing Booking...' : `Confirm & Pay ₹${totalAmount}`}
        </button>
      </div>
    </div>
  );
}
