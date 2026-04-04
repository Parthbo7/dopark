import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './supabase';

export default function Confirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { vehicleType = '4_wheeler', spotName = '006', basement = 'B1', stationId, spotId } = location.state || {};
  
  // State declarations
  const [durationOption, setDurationOption] = useState('1 Hr');
  const [durationValue, setDurationValue] = useState(1);
  const [startTimeOption, setStartTimeOption] = useState('Starts Now');
  const [customStartTime, setCustomStartTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('docard');
  const [autoPay, setAutoPay] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // States for Card balance
  const [cardData, setCardData] = useState(null);
  const [loadingCard, setLoadingCard] = useState(true);

  // Derived calculation
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
          // Fetch Card Balance
          const { data: cData } = await supabase.from('parking_cards').select('*').eq('user_id', user.id).single();
          if (cData) {
            setCardData(cData);
            setAutoPay(cData.auto_pay_enabled);
          }
        }
      } catch (err) {
        console.error("Fetch Data Error:", err);
      } finally {
        setLoadingCard(false);
      }
    };
    fetchData();
  }, []);

  const displaySpot = `${basement} - ${spotName}`;

  const handleConfirmAndPay = async () => {
    setIsProcessing(true);
    
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Must be logged in!");

        if (paymentMethod === 'docard') {
            if (!cardData || cardData.balance < totalAmount) {
               throw new Error("Insufficient Balance in Primary Card");
            }
            
            const { error: deductionErr } = await supabase
                .from('parking_cards')
                .update({ balance: cardData.balance - totalAmount })
                .eq('card_id', cardData.card_id);
                
            if (deductionErr) throw deductionErr;
        }

        // Calculate user's specific start time
        let startTime = new Date();
        if (startTimeOption === '+15m') {
            startTime = new Date(startTime.getTime() + 15 * 60 * 1000);
        } else if (startTimeOption === 'Custom' && customStartTime) {
            const [hours, minutes] = customStartTime.split(':');
            startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        }

        const endTime = new Date(startTime.getTime() + durationValue * 60 * 60 * 1000);

        // 1. Create the Actual Booking in the Database
        const { error: bookingErr } = await supabase
            .from('bookings')
            .insert([{
                user_id: user.id,
                station_id: stationId || null, 
                slot_id: spotId || null,
                vehicle_type: vehicleType,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(), 
                duration_hours: durationValue, // Use the dedicated duration column
                total_price: totalAmount,
                payment_method: paymentMethod === 'docard' ? 'Primary Card' : paymentMethod.toUpperCase(),
                status: 'active'
            }]);

        if (bookingErr) throw bookingErr;
        
        // 2. Mark the Physical Slot as OCCUPIED
        await supabase
            .from('parking_slots')
            .update({ is_occupied: true })
            .eq('slot_id', spotId);

        navigate('/ticket', { 
           state: { 
              vehicleType, 
              spot: spotName, 
              basement, 
              duration: `${durationValue} Hr`, 
              paymentMethod: paymentMethod === 'docard' ? 'Primary Card' : paymentMethod.toUpperCase() 
           } 
        });
    } catch(err) {
        alert(err.message);
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="bg-surface-bright min-h-screen text-on-surface flex flex-col font-body pb-32">
      <header className="bg-[#5D50D6] rounded-b-[2.5rem] pt-6 pb-10 px-4 text-white relative z-10 w-full max-w-md mx-auto md:max-w-2xl shadow-md">
        <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 transition-colors rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-white">arrow_back</span>
            </button>
            <h1 className="text-[17px] font-bold mx-auto -ml-2">Confirm Booking</h1>
            <div className="w-10"></div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto md:max-w-2xl px-5 -mt-6 relative z-20 space-y-4">
        <div className="bg-white rounded-[1.5rem] p-6 shadow-[0px_8px_24px_rgba(74,64,224,0.06)] border border-outline-variant/10">
            <div className="flex justify-between items-start mb-6">
                <div>
                   <span className="text-[#4a40e0] text-[9px] font-extrabold uppercase tracking-widest mb-1 block">Parking Venue</span>
                   <h2 className="text-xl font-extrabold text-on-surface">{location.state?.stationName || 'Phoenix Palladium'}</h2>
                </div>
                <div className="w-10 h-10 bg-[#4a40e0]/10 text-[#4a40e0] rounded-xl flex items-center justify-center">
                   <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                </div>
            </div>

            <div className="flex justify-between items-center border-t border-b border-outline-variant/10 py-5 mb-6 px-1">
                 <div className="flex flex-col items-center flex-1">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase mb-1.5">Slot</span>
                    <span className="font-extrabold text-[#2a2f32] text-sm">{displaySpot}</span>
                 </div>
                 <div className="w-px h-8 bg-outline-variant/20"></div>
                 <div className="flex flex-col items-center flex-1">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase mb-1.5">Vehicle</span>
                    <span className="font-extrabold text-[#2a2f32] text-sm">{vehicleType === '4_wheeler' ? '4W' : '2W'}</span>
                 </div>
                 <div className="w-px h-8 bg-outline-variant/20"></div>
                 <div className="flex flex-col items-center flex-1">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase mb-1.5">Date</span>
                    <span className="font-extrabold text-[#2a2f32] text-sm">Today</span>
                 </div>
            </div>

            <div className="mb-6">
                <span className="text-xs font-bold text-on-surface mb-3 block px-1">Select Start Time</span>
                <div className="flex gap-3 mb-4">
                    {['Starts Now', '+15m', 'Custom'].map(option => (
                        <button 
                        key={option}
                        onClick={() => setStartTimeOption(option)}
                        className={`flex-1 py-3 pb-3 rounded-2xl font-black text-[12px] transition-all border-2 ${startTimeOption === option ? 'bg-indigo-50 border-[#4a40e0] text-[#4a40e0]' : 'bg-surface-container-low text-on-surface-variant border-transparent'}`}>
                         {option}
                        </button>
                    ))}
                </div>
                {startTimeOption === 'Custom' && (
                    <input 
                       type="time" 
                       value={customStartTime}
                       onChange={(e) => setCustomStartTime(e.target.value)}
                       className="w-full p-4 bg-indigo-50/30 rounded-2xl border mb-4 font-bold text-on-surface focus:border-[#4a40e0] outline-none"
                    />
                )}
            </div>

            <div>
                <span className="text-xs font-bold text-on-surface mb-3 block px-1">Select Duration</span>
                <div className="flex gap-3 mb-4">
                    {['1 Hr', '2 Hr', 'Custom'].map(option => (
                        <button 
                        key={option}
                        onClick={() => {
                            setDurationOption(option);
                            if (option === '1 Hr') setDurationValue(1);
                            if (option === '2 Hr') setDurationValue(2);
                        }}
                        className={`flex-1 py-3.5 rounded-2xl font-black text-[13px] transition-all border-2 ${durationOption === option ? 'bg-indigo-50 border-[#4a40e0] text-[#4a40e0]' : 'bg-surface-container-low text-on-surface-variant border-transparent'}`}>
                         {option}
                        </button>
                    ))}
                </div>
                {durationOption === 'Custom' && (
                    <div className="flex items-center justify-between p-4 bg-indigo-50/30 rounded-2xl border mb-4">
                        <span className="text-xs font-bold text-on-surface">Total Hours:</span>
                        <div className="flex items-center gap-4">
                            <button onClick={() => setDurationValue(prev => Math.max(1, prev-1))} className="w-8 h-8 rounded-full border bg-white font-black text-xl flex items-center justify-center">-</button>
                            <span className="font-extrabold text-lg text-[#4a40e0]">{durationValue}</span>
                            <button onClick={() => setDurationValue(prev => prev+1)} className="w-8 h-8 rounded-full border bg-white font-black text-xl flex items-center justify-center">+</button>
                        </div>
                    </div>
                )}
            </div>
        </div>

        <div className="bg-white rounded-[1.5rem] p-6 shadow-[0px_8px_24px_rgba(74,64,224,0.06)] border border-outline-variant/10">
            <h3 className="font-bold text-on-surface mb-5 px-1">Order Summary</h3>
            <div className="space-y-4 mb-5 text-[14px]">
                <div className="flex justify-between items-center text-on-surface-variant px-1">
                    <span>Parking Fee ({durationValue} Hr)</span>
                    <span className="font-semibold text-on-surface">₹{parkingFee}</span>
                </div>
                <div className="flex justify-between items-center text-on-surface-variant px-1">
                    <span>Service Fee</span>
                    <span className="font-semibold text-on-surface">₹{serviceFee}</span>
                </div>
                <div className="flex justify-between items-center text-on-surface-variant px-1 border-b border-outline-variant/10 pb-4">
                    <span>Taxes</span>
                    <span className="font-semibold text-on-surface">₹{taxes}</span>
                </div>
            </div>
            <div className="flex justify-between items-center pt-2 px-1">
                <span className="font-extrabold text-[15px] text-on-surface">Grand Total</span>
                <span className="font-extrabold text-[22px] text-[#4a40e0]">₹{totalAmount}</span>
            </div>
        </div>

        <div className="pt-2">
            <h3 className="font-bold text-on-surface mb-3 px-1">Payment Method</h3>
            <div onClick={() => setPaymentMethod('docard')} className={`p-4 rounded-2xl flex items-center justify-between border-2 transition-all cursor-pointer ${paymentMethod === 'docard' ? 'bg-indigo-50 border-[#4a40e0]' : 'bg-white border-transparent'}`}>
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white text-[#4a40e0] rounded-xl flex items-center justify-center shadow-sm">
                        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>credit_card</span>
                    </div>
                    <div>
                    <div className="font-bold text-on-surface text-[14px]">DoCard Wallet Balance</div>
                    <div className="text-[10px] text-on-surface-variant font-bold leading-none mt-0.5">
                        {loadingCard ? 'Updating balance...' : `Current: ₹${cardData?.balance || '0.00'}`}
                    </div>
                    </div>
                </div>
                {paymentMethod === 'docard' && <span className="material-symbols-outlined text-[#4a40e0] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
            </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/90 backdrop-blur-xl border-t z-50 flex justify-center">
           <button onClick={handleConfirmAndPay} disabled={isProcessing} className={`w-full max-w-sm py-4 text-white font-extrabold text-[15px] rounded-2xl shadow-[0px_8px_24px_rgba(74,64,224,0.3)] active:scale-95 transition-all ${isProcessing ? 'bg-[#a39dfa]' : 'bg-[#4a40e0]'}`}>
               {isProcessing ? 'Finalizing Booking...' : `Confirm & Pay ₹${totalAmount}`}
           </button>
      </div>
    </div>
  );
}
