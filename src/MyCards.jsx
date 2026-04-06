import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function MyCards() {
  const navigate = useNavigate();
  const [cardData, setCardData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [autoPayEnabled, setAutoPayEnabled] = useState(true);
  const [lowBalAlert, setLowBalAlert] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: pData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (pData) setProfile(pData);

        const { data, error } = await supabase.from('parking_cards').select('*').eq('user_id', user.id).single();
        if (!error && data) {
          setCardData(data);
          setAutoPayEnabled(data.auto_pay_enabled);
        }
      } catch (err) { console.error(err); }
      finally { setIsLoading(false); }
    };
    fetchData();
  }, []);

  const vehicleNum = cardData?.vehicle_number || 'MH12 AB 1234';
  const balance = cardData?.balance || 0;

  return (
    <div className="bg-[#F8F9FE] min-h-screen text-[#1c1b1f] flex flex-col font-body">

      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 bg-white border-b border-slate-100 w-full max-w-md mx-auto md:max-w-2xl">
        <button onClick={() => navigate('/dashboard')} className="p-1.5 text-[#4a40e0] hover:bg-slate-50 rounded-xl cursor-pointer">
          <span className="material-symbols-outlined text-xl">menu</span>
        </button>
        <span className="text-lg font-extrabold tracking-tight text-[#4a40e0]">ParkPremium</span>
        <button onClick={() => navigate('/notifications')} className="relative p-1.5 text-[#4a40e0]">
          <span className="material-symbols-outlined text-xl">notifications</span>
          <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>
        </button>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto md:max-w-2xl overflow-y-auto custom-scrollbar pb-8">

        {isLoading ? (
          <div className="flex justify-center p-16"><div className="animate-spin w-8 h-8 rounded-full border-4 border-[#4a40e0]/30 border-t-[#4a40e0]"></div></div>
        ) : (
          <>
            {/* â”€â”€ MY WALLET SECTION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div className="px-5 pt-6">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400 mb-3 block">MY DOCARD</span>
              <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-3xl font-black text-[#1c1b1f] tracking-tight">₹{Number(balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h2>
                  <div className="w-10 h-10 rounded-xl bg-[#4a40e0]/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#4a40e0] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
                  </div>
                </div>

                {/* Add / Withdraw Buttons */}
                <div className="flex gap-3 mb-5">
                  <button className="flex-1 bg-[#4a40e0] hover:bg-[#3d34b8] text-white font-bold text-[13px] py-3 rounded-full transition-all active:scale-[0.97] shadow-md shadow-[#4a40e0]/20">
                    Add Money
                  </button>
                  <button className="flex-1 bg-white text-[#4a40e0] font-bold text-[13px] py-3 rounded-full border-2 border-[#4a40e0] hover:bg-[#f0effb] transition-all active:scale-[0.97]">
                    Withdraw
                  </button>
                </div>

                {/* Wallet Stats */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-slate-500">AutoPay</span>
                    <span className="text-emerald-500 font-bold text-[12px]">ENABLED</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-slate-500">Linked Cards</span>
                    <span className="font-bold text-[#1c1b1f]">2 Cards</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-slate-500">Last Recharge</span>
                    <span className="font-bold text-[#1c1b1f]">₹500</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-slate-500">Low Balance Alert</span>
                    <div 
                      onClick={() => setLowBalAlert(!lowBalAlert)} 
                      className={`w-12 h-6 rounded-full flex items-center p-0.5 cursor-pointer transition-colors ${lowBalAlert ? 'bg-[#4a40e0]' : 'bg-slate-300'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${lowBalAlert ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* â”€â”€ LINKED VEHICLE CARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div className="px-5 pt-6">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400 mb-3 block">LINKED VEHICLE CARD</span>
              <div className="rounded-[1.5rem] p-6 relative overflow-hidden text-white" style={{ background: 'linear-gradient(135deg, #6C63FF 0%, #4F46E5 40%, #7C3AED 100%)' }}>
                {/* Decorative glow */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>

                {/* Card Header */}
                <div className="flex items-center justify-between mb-1 relative z-10">
                  <span className="text-white/80 text-[11px] font-bold tracking-wider uppercase">LINKED VEHICLE CARD</span>
                  <span className="bg-white/20 backdrop-blur text-white text-[9px] font-extrabold uppercase px-3 py-1 rounded-full tracking-wider">PRIMARY</span>
                </div>

                {/* Vehicle Type */}
                <h3 className="text-xl font-black mb-1 relative z-10">{profile?.vehicle_type === '2_wheeler' ? '2 Wheeler' : '4 Wheeler'}</h3>
                
                <div className="flex items-center gap-2 mb-5 relative z-10">
                  <span className="material-symbols-outlined text-[14px] text-white/70" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                  <span className="text-white/80 text-[11px] font-bold">FAST EXIT</span>
                </div>

                {/* Number Plate */}
                <div className="text-[28px] font-black tracking-[0.18em] mb-5 relative z-10" style={{ fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace" }}>
                  {vehicleNum}
                </div>

                {/* Badges */}
                <div className="flex gap-2 relative z-10">
                  <span className="bg-white/15 backdrop-blur text-white text-[9px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    AUTO PAY : ACTIVE
                  </span>
                  <span className="bg-white/15 backdrop-blur text-white text-[9px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                    FAST EXIT : ENABLED
                  </span>
                </div>
              </div>
            </div>

            {/* â”€â”€ AUTO PAY TOGGLE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div className="px-5 pt-5">
              <div className="bg-white rounded-2xl p-5 flex items-center justify-between shadow-sm border border-slate-100">
                <div>
                  <div className="font-bold text-[14px] text-[#1c1b1f]">AutoPay</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Automatic deductions for parking</div>
                </div>
                <div 
                  onClick={() => setAutoPayEnabled(!autoPayEnabled)} 
                  className={`w-12 h-6 rounded-full flex items-center p-0.5 cursor-pointer transition-colors ${autoPayEnabled ? 'bg-[#4a40e0]' : 'bg-slate-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${autoPayEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
              </div>
            </div>

            {/* â”€â”€ SWITCH / ADD VEHICLE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div className="px-5 pt-4 pb-4 flex flex-col gap-3">
              <button className="w-full py-3.5 rounded-full border-2 border-[#4a40e0] text-[#4a40e0] font-bold text-[13px] hover:bg-[#f0effb] transition-all active:scale-[0.97]">
                Switch Vehicle
              </button>
              <button className="text-[#4a40e0] text-[13px] font-semibold hover:underline">
                Add New Vehicle
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
