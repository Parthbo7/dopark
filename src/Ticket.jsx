import { useNavigate, useLocation } from 'react-router-dom';

export default function Ticket() {
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve state passed from Confirmation page, provide defaults just in case
  const { 
      vehicleType = '4w', 
      spot = '010', 
      basement = 'B1',
      duration = '1 Hr',
      paymentMethod = 'ewallet'
  } = location.state || {};

  const displayVehicle = vehicleType === '4w' ? '4 Wheeler' : '2 Wheeler';
  const displaySpot = `${basement} - ${spot}`;
  
  // Quick payment method display mapper
  const getPaymentDisplay = (method) => {
      switch(method) {
          case 'upi': return 'UPI';
          case 'card': return 'Credit/Debit';
          case 'ewallet':
          default:
              return 'E-Wallet';
      }
  };

  return (
    <div className="bg-surface-bright min-h-screen text-on-surface flex flex-col font-body pb-32 overflow-hidden">
      
      {/* Top Header */}
      <header className="flex items-center px-4 py-6 relative z-10 w-full max-w-md mx-auto md:max-w-2xl bg-surface-bright">
        <button onClick={() => navigate('/dashboard')} className="p-2 text-primary hover:bg-slate-100 transition-colors rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-[17px] font-bold mx-auto -ml-2 text-on-surface">Booking Confirmed</h1>
        <div className="w-10"></div> {/* Spacer for centering */}
      </header>

      <main className="flex-1 w-full max-w-md mx-auto md:max-w-2xl px-5 relative z-20 space-y-6 flex flex-col items-center">
        
        {/* Celebration Header */}
        <div className="flex flex-col items-center mt-2 mb-2 text-center w-full">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-3xl mb-4 shadow-sm border border-indigo-100">
                🎉
            </div>
            <h2 className="text-[22px] font-extrabold text-on-surface mb-2">Congratulations!</h2>
            <p className="text-on-surface-variant text-sm font-medium">Your parking has been successfully booked</p>
        </div>

        {/* --- TICKET CARD --- */}
        <div className="w-full bg-white rounded-[1.5rem] shadow-[0px_12px_32px_rgba(74,64,224,0.08)] relative mt-2 border border-outline-variant/10">
            
            {/* Top half of ticket */}
            <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-xl font-extrabold text-on-surface tracking-tight mb-1">Phoenix Palladium</h2>
                        <div className="flex items-center gap-1.5 text-on-surface-variant font-medium">
                            <span className="material-symbols-outlined text-[13px]">location_on</span>
                            <span className="text-[11px] uppercase tracking-widest font-bold">Lower Parel, Mumbai</span>
                        </div>
                    </div>
                    <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest shadow-sm">
                        Active
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-y-6 gap-x-2">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-1">Slot</span>
                        <span className="text-[14px] font-extrabold text-on-surface">{displaySpot}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-1">Vehicle</span>
                        <span className="text-[14px] font-extrabold text-on-surface flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-[#4a40e0]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                {vehicleType === '4w' ? 'directions_car' : 'two_wheeler'}
                            </span>
                            {displayVehicle}
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-1">Date</span>
                        <span className="text-[14px] font-extrabold text-on-surface">Today</span>
                    </div>
                    
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-1">Duration</span>
                        <span className="text-[14px] font-extrabold text-on-surface">{duration}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-1">Entry</span>
                        <span className="text-[14px] font-extrabold text-on-surface">3:00 PM</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-1">Exit</span>
                        <span className="text-[14px] font-extrabold text-on-surface flex items-center gap-1">
                            4:00 PM
                        </span>
                    </div>
                </div>
            </div>

            {/* Ticket Separator */}
            <div className="relative">
                <div className="absolute left-0 -ml-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-surface-bright rounded-full border-r border-outline-variant/10"></div>
                <div className="absolute right-0 -mr-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-surface-bright rounded-full border-l border-outline-variant/10"></div>
                <div className="w-[85%] mx-auto border-t-[2px] border-dashed border-outline-variant/20"></div>
            </div>

            {/* Bottom half of ticket */}
            <div className="p-4 pt-6 pb-6 w-full mx-auto">
               <div className="bg-surface-container-low/50 rounded-2xl p-4 flex flex-col gap-3 border border-outline-variant/10">
                   <div className="flex justify-between items-center">
                       <span className="text-[13px] text-on-surface-variant font-medium">Booking ID</span>
                       <span className="text-[13px] font-bold text-on-surface">DPX123456</span>
                   </div>
                   <div className="flex justify-between items-center mb-1">
                       <span className="text-[13px] text-on-surface-variant font-medium">Paid via</span>
                       <span className="text-[13px] font-bold text-on-surface flex items-center gap-1.5 border border-outline-variant/20 px-2.5 py-0.5 rounded-lg bg-white">
                          <span className="material-symbols-outlined text-[14px] text-[#4a40e0]" style={{ fontVariationSettings: "'FILL' 1" }}>
                             {paymentMethod === 'ewallet' ? 'account_balance_wallet' : (paymentMethod === 'upi' ? 'payments' : 'credit_card')}
                          </span>
                          {getPaymentDisplay(paymentMethod)}
                       </span>
                   </div>
                   <div className="w-full border-t border-outline-variant/20 pt-3 flex justify-between items-center">
                       <span className="text-[14px] font-bold text-on-surface">Amount Paid</span>
                       <span className="text-[18px] font-extrabold text-[#4a40e0]">₹100</span>
                   </div>
               </div>
            </div>

        </div>
        {/* --- END TICKET CARD --- */}

        {/* Action Buttons */}
        <div className="w-full space-y-3 mt-4">
            <button className="w-full py-3.5 bg-[#6452f0] hover:bg-[#5D50D6] text-white font-bold text-[15px] rounded-2xl shadow-[0px_8px_20px_rgba(74,64,224,0.3)] active:scale-95 transition-all">
                View Directions
            </button>
            <button className="w-full py-3.5 bg-surface-container-highest hover:bg-surface-dim text-on-surface-variant font-bold text-[15px] rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all">
                <span className="material-symbols-outlined text-[18px]">download</span>
                Download Ticket
            </button>
        </div>

      </main>

      {/* Floating Bottom Nav */}
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-sm rounded-[1.5rem] bg-white/95 backdrop-blur-xl z-50 flex justify-around items-center px-2 py-2 shadow-2xl border border-outline-variant/10">
        <a className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors py-2 px-3" onClick={() => navigate('/dashboard')} href="#">
          <span className="material-symbols-outlined text-lg mb-1" style={{ fontVariationSettings: "'wght' 300" }}>search</span>
          <span className="text-[9px] font-bold uppercase tracking-widest mt-0.5">FIND</span>
        </a>
        <a className="flex flex-col items-center justify-center text-primary py-2 px-6 transition-all bg-indigo-50/80 rounded-2xl border border-indigo-100" href="#">
          <span className="material-symbols-outlined text-lg mb-1 block" style={{ fontVariationSettings: "'FILL' 1" }}>confirmation_number</span>
          <span className="text-[9px] font-bold uppercase tracking-widest mt-0.5 text-center leading-tight">MY<br/>BOOKINGS</span>
        </a>
        <a className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors py-2 px-3" href="#">
          <span className="material-symbols-outlined text-lg mb-1.5">account_balance_wallet</span>
          <span className="text-[9px] font-bold uppercase tracking-widest mt-0.5">WALLETS</span>
        </a>
        <a className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors py-2 px-3" href="#">
          <span className="material-symbols-outlined text-lg mb-1.5">person</span>
          <span className="text-[9px] font-bold uppercase tracking-widest mt-0.5">PROFILE</span>
        </a>
      </nav>

    </div>
  );
}
