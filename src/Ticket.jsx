import { useNavigate, useLocation } from 'react-router-dom';
import { useRef, useCallback } from 'react';
import * as htmlToImage from 'html-to-image';
import download from 'downloadjs';

export default function Ticket() {
  const navigate = useNavigate();
  const location = useLocation();
  const ticketRef = useRef(null);

  const handleDownload = useCallback(() => {
    if (ticketRef.current === null) return;
    
    htmlToImage.toPng(ticketRef.current, { cacheBust: true, backgroundColor: '#F8F9FE' })
      .then((dataUrl) => {
        download(dataUrl, `parking-ticket-${new Date().getTime()}.png`);
      })
      .catch((err) => {
        console.error('oops, something went wrong!', err);
      });
  }, [ticketRef]);

  const {
    vehicleType = '4_wheeler',
    spot = '010',
    basement = 'B1',
    duration = '1 Hr',
    paymentMethod = 'Primary Card',
    stationName = 'Phoenix Palladium',
    stationAddress = 'Pune',
    totalAmount = 0,
    entryTime,
    exitTime,
    bookingId: realBookingId,
    stationLat,
    stationLng
  } = location.state || {};

  const displayVehicle = vehicleType === '2_wheeler' ? '2 Wheeler' : '4 Wheeler';
  const displaySpot = `${basement} – ${spot}`;
  const bookingId = realBookingId || ('DPX' + Math.floor(100000 + Math.random() * 900000));

  const formatTime = (iso) => {
    if (!iso) return '--:--';
    return new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const entryDisplay = formatTime(entryTime);
  const exitDisplay = formatTime(exitTime);

  const paymentIcon = paymentMethod === 'UPI' ? 'payments' : paymentMethod === 'Credit/Debit' ? 'credit_card' : 'account_balance_wallet';

  return (
    <div className="bg-[#F8F9FE] min-h-screen text-[#1c1b1f] flex flex-col font-body">

      {/* ── HEADER ──────────────────────────────── */}
      <header className="flex items-center px-5 py-5 w-full max-w-md mx-auto md:max-w-2xl">
        <button onClick={() => navigate('/dashboard')} className="p-2 text-[#4a40e0] hover:bg-slate-50 rounded-xl transition cursor-pointer">
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        <h1 className="text-[17px] font-extrabold mx-auto -ml-2 tracking-tight">Booking Confirmed</h1>
        <div className="w-10"></div>
      </header>

      {/* ── MAIN CONTENT ────────────────────────── */}
      <main className="flex-1 w-full max-w-md mx-auto md:max-w-2xl px-5 flex flex-col items-center pb-28">

        {/* ── Celebration ─────────────────────── */}
        <div className="flex flex-col items-center mt-2 mb-6 text-center">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-4xl mb-4 shadow-sm border border-indigo-100">
            🎉
          </div>
          <h2 className="text-2xl font-black text-[#1c1b1f] mb-1.5 tracking-tight">Congratulations!</h2>
          <p className="text-slate-500 text-sm font-medium">Your parking has been successfully booked</p>
        </div>

        {/* ── TICKET CARD (REF ATTACHED) ───────── */}
        <div ref={ticketRef} className="w-full bg-white rounded-[1.75rem] shadow-[0px_12px_40px_rgba(74,64,224,0.08)] relative overflow-hidden border border-slate-100 p-1">
          <div className="w-full bg-white rounded-[1.5rem] relative overflow-hidden">

          {/* Top Section — Venue */}
          <div className="p-6 pb-5">
            <div className="flex justify-between items-start mb-1">
              <div>
                <h3 className="text-xl font-black text-[#1c1b1f] tracking-tight mb-1">{stationName}</h3>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                  <span className="text-[11px] uppercase tracking-widest font-bold">{stationAddress}</span>
                </div>
              </div>
              <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border border-emerald-100 h-fit">
                Active
              </span>
            </div>
          </div>

          {/* Dashed Separator with cutouts */}
          <div className="relative">
            <div className="absolute left-0 -ml-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#F8F9FE] rounded-full"></div>
            <div className="absolute right-0 -mr-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#F8F9FE] rounded-full"></div>
            <div className="w-[85%] mx-auto border-t-[2px] border-dashed border-slate-200/60"></div>
          </div>

          {/* Details Grid */}
          <div className="p-6 pt-5">
            <div className="grid grid-cols-3 gap-y-6 gap-x-3">
              {/* Row 1 */}
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-[0.12em] font-bold text-slate-400 mb-1.5">SLOT</span>
                <span className="text-[15px] font-black text-[#1c1b1f]">{displaySpot}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-[0.12em] font-bold text-slate-400 mb-1.5">VEHICLE</span>
                <span className="text-[15px] font-black text-[#1c1b1f] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#4a40e0]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {vehicleType === '2_wheeler' ? 'two_wheeler' : 'directions_car'}
                  </span>
                  {displayVehicle}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-[0.12em] font-bold text-slate-400 mb-1.5">DATE</span>
                <span className="text-[15px] font-black text-[#1c1b1f]">Today</span>
              </div>

              {/* Row 2 */}
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-[0.12em] font-bold text-slate-400 mb-1.5">DURATION</span>
                <span className="text-[15px] font-black text-[#1c1b1f]">{duration}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-[0.12em] font-bold text-slate-400 mb-1.5">ENTRY</span>
                <span className="text-[15px] font-black text-[#1c1b1f]">{entryDisplay}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-[0.12em] font-bold text-slate-400 mb-1.5">EXIT</span>
                <span className="text-[15px] font-black text-[#1c1b1f]">{exitDisplay}</span>
              </div>
            </div>
          </div>

          {/* Dashed Separator */}
          <div className="relative">
            <div className="absolute left-0 -ml-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#F8F9FE] rounded-full"></div>
            <div className="absolute right-0 -mr-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#F8F9FE] rounded-full"></div>
            <div className="w-[85%] mx-auto border-t-[2px] border-dashed border-slate-200/60"></div>
          </div>

          {/* Payment Info */}
          <div className="p-6 pt-5">
            <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-slate-500">Booking ID</span>
                <span className="text-[13px] font-bold text-[#1c1b1f]">{bookingId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-slate-500">Paid via</span>
                <span className="text-[13px] font-bold text-[#1c1b1f] flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-100">
                  <span className="material-symbols-outlined text-[14px] text-[#4a40e0]" style={{ fontVariationSettings: "'FILL' 1" }}>{paymentIcon}</span>
                  {paymentMethod === 'Primary Card' ? 'DoCard' : paymentMethod}
                </span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                <span className="text-[14px] font-bold text-[#1c1b1f]">Amount Paid</span>
                <span className="text-xl font-black text-[#4a40e0]">₹{totalAmount}</span>
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* ── ACTION BUTTONS ─────────────────── */}
        <div className="w-full space-y-3 mt-6">
          <button
            onClick={() => {
              const lat = stationLat || 18.5204; 
              const lng = stationLng || 73.8567;
              window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
            }}
            className="w-full py-4 bg-[#4a40e0] hover:bg-[#3b32b3] text-white font-bold text-[14px] rounded-2xl shadow-lg active:scale-[0.98] transition-all"
          >
            View Directions
          </button>
          <button 
            onClick={handleDownload}
            className="w-full py-4 bg-white text-[#4a40e0] font-bold text-[14px] rounded-2xl flex items-center justify-center gap-2 border-2 border-[#4a40e0]/10 hover:bg-slate-50 active:scale-[0.98] transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
            Download Ticket
          </button>
        </div>
      </main>
    </div>
  );
}

function NavBtn({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition ${active ? 'text-[#4a40e0] bg-indigo-50' : 'text-slate-400 hover:text-slate-600'}`}>
      <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: active ? "'FILL' 1" : "'wght' 500" }}>{icon}</span>
      <span className="text-[9px] font-bold uppercase tracking-widest leading-tight text-center">{label}</span>
    </button>
  );
}
