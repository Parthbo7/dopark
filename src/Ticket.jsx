import { useNavigate, useLocation } from 'react-router-dom';
import { useRef, useCallback, useState } from 'react';
import * as htmlToImage from 'html-to-image';
import download from 'downloadjs';
import { QRCodeSVG } from 'qrcode.react';


export default function Ticket() {
  const navigate = useNavigate();
  const location = useLocation();
  const ticketRef = useRef(null);

  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const handleDownload = useCallback(() => {
    if (ticketRef.current === null) return;
    
    htmlToImage.toPng(ticketRef.current, { cacheBust: true, backgroundColor: '#F8F9FE' })
      .then((dataUrl) => {
        download(dataUrl, `parking-ticket-${new Date().getTime()}.png`);
        showToast('Ticket image downloaded successfully!');
      })
      .catch((err) => {
        console.error('oops, something went wrong!', err);
      });
  }, [ticketRef]);

  const handleShare = useCallback(() => {
    if (ticketRef.current === null) return;
    
    const qrText = `Booking ID: ${bookingId}\nStation: ${stationName}\nSpot: ${displaySpot}\nVehicle: ${displayVehicle} (${vehicleNumber})`;
    
    if (navigator.share) {
      htmlToImage.toBlob(ticketRef.current, { cacheBust: true, backgroundColor: '#F8F9FE' })
        .then((blob) => {
          const file = new File([blob], `parking-ticket-${bookingId}.png`, { type: 'image/png' });
          navigator.share({
            files: [file],
            title: 'Do Parking Ticket',
            text: qrText,
          }).catch((err) => {
            console.error('Error sharing:', err);
          });
        })
        .catch((err) => {
          console.error('Error rendering blob for share:', err);
          navigator.share({
            title: 'Do Parking Ticket',
            text: qrText,
          }).catch((err) => console.error(err));
        });
    } else {
      navigator.clipboard.writeText(qrText);
      showToast('Booking details copied to clipboard!');
    }
  }, [ticketRef, bookingId, stationName, displaySpot, displayVehicle, vehicleNumber]);


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
    stationLng,
    vehicleNumber = 'MH 12 AB 1234'
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
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800/40 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 lg:p-8 flex flex-col font-body">
      
      {/* Title Header */}
      <div className="mb-8 pb-5 border-b border-slate-100 dark:border-slate-800/40 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-[#4a40e0] tracking-tight">Booking Receipt</h2>
          <p className="text-slate-400 text-xs font-semibold mt-1">Details of your secured parking spot reservation</p>
        </div>
        
        <button 
          onClick={() => navigate('/dashboard')} 
          className="px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition text-xs font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">home</span>
          Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Celebration Header and Ticket Visual */}
        <div className="lg:col-span-7 flex flex-col items-center">
          
          {/* Celebration */}
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-full flex items-center justify-center text-3xl mb-3 shadow-sm border border-emerald-100 dark:border-emerald-900/10">
              🎉
            </div>
            <h3 className="text-lg font-black text-[#2B3674] dark:text-slate-200 tracking-tight">Booking Confirmed!</h3>
            <p className="text-slate-400 text-xs font-semibold mt-1">Your parking session has been successfully recorded</p>
          </div>

          {/* Ticket Card */}
          <div className="w-full max-w-[420px] bg-slate-50 dark:bg-slate-800/40 rounded-[2rem] shadow-[0px_10px_30px_rgba(74,64,224,0.04)] relative overflow-hidden border border-slate-100 dark:border-slate-800/30 p-1">
            <div ref={ticketRef} className="w-full bg-white dark:bg-slate-900 rounded-[1.8rem] relative overflow-hidden p-6 space-y-6">
              
              {/* Venue Info */}
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h4 className="text-base font-black text-[#2B3674] dark:text-slate-200 tracking-tight mb-1">{stationName}</h4>
                  <div className="flex items-center gap-1 text-slate-400">
                    <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold">{stationAddress}</span>
                  </div>
                </div>
                <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest border border-emerald-100 dark:border-emerald-905/30 h-fit shrink-0">
                  Active
                </span>
              </div>

              {/* Dashed Separator */}
              <div className="relative">
                <div className="absolute left-0 -ml-9 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-50 dark:bg-slate-800/80 rounded-full border border-slate-100 dark:border-slate-800/30"></div>
                <div className="absolute right-0 -mr-9 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-50 dark:bg-slate-800/80 rounded-full border border-slate-100 dark:border-slate-800/30"></div>
                <div className="w-[90%] mx-auto border-t-[2px] border-dashed border-slate-200/80 dark:border-slate-800"></div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-3 gap-y-5 gap-x-2.5">
                <div className="flex flex-col">
                  <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400 mb-1">SLOT</span>
                  <span className="text-xs font-black text-[#2B3674] dark:text-slate-200">{displaySpot}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400 mb-1">VEHICLE</span>
                  <span className="text-xs font-black text-[#2B3674] dark:text-slate-200 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-[#4a40e0]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {vehicleType === '2_wheeler' ? 'two_wheeler' : 'directions_car'}
                    </span>
                    {displayVehicle}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400 mb-1">DATE</span>
                  <span className="text-xs font-black text-[#2B3674] dark:text-slate-200">Today</span>
                </div>

                <div className="flex flex-col">
                  <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400 mb-1">DURATION</span>
                  <span className="text-xs font-black text-[#2B3674] dark:text-slate-200">{duration}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400 mb-1">ENTRY</span>
                  <span className="text-xs font-black text-[#2B3674] dark:text-slate-200">{entryDisplay}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400 mb-1">EXIT</span>
                  <span className="text-xs font-black text-[#2B3674] dark:text-slate-200">{exitDisplay}</span>
                </div>

                <div className="flex flex-col col-span-2">
                  <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400 mb-1">VEHICLE PLATE</span>
                  <span className="text-xs font-black text-[#2B3674] dark:text-slate-200 uppercase tracking-wider font-mono">{vehicleNumber}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400 mb-1">PAYMENT</span>
                  <span className="text-xs font-black text-[#2B3674] dark:text-slate-200">{paymentMethod}</span>
                </div>
              </div>

              {/* Dashed Separator */}
              <div className="relative">
                <div className="absolute left-0 -ml-9 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-50 dark:bg-slate-800/80 rounded-full border border-slate-100 dark:border-slate-800/30"></div>
                <div className="absolute right-0 -mr-9 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-50 dark:bg-slate-800/80 rounded-full border border-slate-100 dark:border-slate-800/30"></div>
                <div className="w-[90%] mx-auto border-t-[2px] border-dashed border-slate-200/80 dark:border-slate-800"></div>
              </div>

              {/* QR Code Section */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100/50 dark:border-slate-800/40">
                <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                  <QRCodeSVG 
                    value={JSON.stringify({ bookingId, station: stationName, spot: displaySpot, vehicle: displayVehicle, vehicleNumber })} 
                    size={120}
                    level="H"
                    includeMargin={false}
                    fgColor="#2B3674"
                  />
                </div>
                <span className="text-[10px] font-black tracking-widest text-[#2B3674] dark:text-slate-200 uppercase mt-3">ENTRY / EXIT PASS</span>
                <span className="text-[8px] font-semibold text-slate-400 mt-0.5 text-center">Scan this QR code at the parking barrier gates</span>
              </div>

              {/* Dashed Separator */}
              <div className="relative">
                <div className="absolute left-0 -ml-9 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-50 dark:bg-slate-800/80 rounded-full border border-slate-100 dark:border-slate-800/30"></div>
                <div className="absolute right-0 -mr-9 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-50 dark:bg-slate-800/80 rounded-full border border-slate-100 dark:border-slate-800/30"></div>
                <div className="w-[90%] mx-auto border-t-[2px] border-dashed border-slate-200/80 dark:border-slate-800"></div>
              </div>

              {/* Invoice Breakdown */}
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 space-y-2.5 border border-slate-100/50 dark:border-slate-800/55 text-xs font-semibold text-slate-400">
                <div className="flex justify-between items-center">
                  <span>Booking ID</span>
                  <span className="font-extrabold text-[#2B3674] dark:text-slate-200">{bookingId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Paid via</span>
                  <span className="font-extrabold text-[#2B3674] dark:text-slate-200 flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-700/60 text-[11px]">
                    <span className="material-symbols-outlined text-[13px] text-[#4a40e0] dark:text-indigo-400" style={{ fontVariationSettings: "'FILL' 1" }}>{paymentIcon}</span>
                    {paymentMethod === 'Primary Card' ? 'DoCard' : paymentMethod}
                  </span>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-750 pt-2.5 flex justify-between items-center text-sm">
                  <span className="font-bold text-[#2B3674] dark:text-slate-200">Amount Paid</span>
                  <span className="text-base font-black text-[#4a40e0] dark:text-indigo-400">₹{totalAmount}</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Right Column: Directions and download buttons */}
        <div className="lg:col-span-5 space-y-4 lg:pt-16">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400 block pl-1">Receipt Actions</span>
          
          <button
            onClick={() => {
              const lat = stationLat || 18.5204; 
              const lng = stationLng || 73.8567;
              window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
            }}
            className="w-full py-4 bg-[#4a40e0] hover:bg-[#3b32b3] text-white font-extrabold text-[13px] rounded-xl shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">explore</span>
            View Directions
          </button>
          
          <div className="flex gap-3">
            <button 
              onClick={handleDownload}
              className="flex-1 py-4 bg-white dark:bg-slate-800 text-[#4a40e0] dark:text-indigo-400 font-extrabold text-[13px] rounded-xl flex items-center justify-center gap-2 border-2 border-[#4a40e0]/10 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 active:scale-[0.98] transition-all shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">download</span>
              Download
            </button>
            <button 
              onClick={handleShare}
              className="flex-1 py-4 bg-white dark:bg-slate-800 text-[#4a40e0] dark:text-indigo-400 font-extrabold text-[13px] rounded-xl flex items-center justify-center gap-2 border-2 border-[#4a40e0]/10 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 active:scale-[0.98] transition-all shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">share</span>
              Share Pass
            </button>
          </div>

          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full py-4 bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-extrabold text-[13px] rounded-xl hover:bg-slate-100 dark:hover:bg-slate-850 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            Back to Dashboard
          </button>
        </div>

      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#2B3674] text-white px-6 py-3 rounded-full text-xs font-black shadow-xl flex items-center gap-2 border border-indigo-400/20">
          <span className="material-symbols-outlined text-sm text-[#4a40e0]" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
          {toast}
        </div>
      )}
    </div>
  );
}
