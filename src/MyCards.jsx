import { useNavigate, useOutletContext } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from './supabase';

export default function MyCards() {
  const navigate = useNavigate();
  const { profile, cardData, fetchProfileAndCard } = useOutletContext();
  const [lowBalAlert, setLowBalAlert] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const vehicleNum = profile?.vehicle_number || 'MH12 AB 1234';
  const balance = cardData?.balance || 0;
  const autoPayEnabled = cardData?.auto_pay_enabled || false;

  const handleAddMoney = async () => {
    if (!cardData) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('parking_cards')
        .update({ balance: cardData.balance + 500 })
        .eq('card_id', cardData.card_id);
      
      if (error) throw error;
      
      if (fetchProfileAndCard) {
        await fetchProfileAndCard();
      }
    } catch (err) {
      console.error("Failed to add money:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!cardData || cardData.balance < 500) {
      alert("Insufficient balance to withdraw ₹500!");
      return;
    }
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('parking_cards')
        .update({ balance: cardData.balance - 500 })
        .eq('card_id', cardData.card_id);
      
      if (error) throw error;
      
      if (fetchProfileAndCard) {
        await fetchProfileAndCard();
      }
    } catch (err) {
      console.error("Failed to withdraw money:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleAutoPay = async () => {
    if (!cardData) return;
    try {
      const { error } = await supabase
        .from('parking_cards')
        .update({ auto_pay_enabled: !autoPayEnabled })
        .eq('card_id', cardData.card_id);
      
      if (error) throw error;
      
      if (fetchProfileAndCard) {
        await fetchProfileAndCard();
      }
    } catch (err) {
      console.error("Failed to toggle AutoPay:", err);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800/40 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 lg:p-8 flex flex-col font-body">
      
      {/* Title Header */}
      <div className="mb-8 pb-5 border-b border-slate-100 dark:border-slate-800/40">
        <h2 className="text-xl font-extrabold text-[#4a40e0] tracking-tight">DoCard & Wallet</h2>
        <p className="text-slate-400 text-xs font-semibold mt-1">Manage your linked vehicle smart card, wallet balance, and AutoPay settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Linked Vehicle Card Visual */}
        <div className="lg:col-span-6 space-y-6">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400 block pl-1">Linked Vehicle Card</span>
          
          <div className="rounded-[2rem] p-6 md:p-8 relative overflow-hidden text-white shadow-lg shadow-[#4a40e0]/10 flex flex-col justify-between min-h-[220px] md:min-h-[260px]" style={{ background: 'linear-gradient(135deg, #6C63FF 0%, #4F46E5 45%, #7C3AED 100%)' }}>
            {/* Decorative glows */}
            <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-white/5 rounded-full blur-xl"></div>

            {/* Card Top Row */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xl text-white/95">local_parking</span>
                <span className="text-[11px] font-black tracking-widest uppercase text-white/90">DoCard Smart Pay</span>
              </div>
              <span className="bg-white/20 backdrop-blur text-white text-[9px] font-black uppercase px-3.5 py-1 rounded-full tracking-wider border border-white/10">
                Primary
              </span>
            </div>

            {/* Vehicle Details */}
            <div className="my-6 relative z-10">
              <h3 className="text-lg font-black tracking-tight">{profile?.vehicle_type === '2_wheeler' ? '2 Wheeler' : '4 Wheeler'} Spot-Pass</h3>
              
              {/* Number Plate Display */}
              <div className="text-2xl md:text-3xl font-black tracking-[0.15em] mt-3 mb-1 text-white/95 uppercase" style={{ fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace" }}>
                {vehicleNum}
              </div>
              <div className="flex items-center gap-1 text-white/70 text-[10px] font-bold">
                <span className="material-symbols-outlined text-[13px]">bolt</span>
                <span>FAST EXIT ENABLED</span>
              </div>
            </div>

            {/* Bottom Info Pill Badges */}
            <div className="flex flex-wrap gap-2 relative z-10">
              <span className="bg-white/15 backdrop-blur text-white text-[9px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/5">
                <span className="material-symbols-outlined text-[11px]">check_circle</span>
                AutoPay: {autoPayEnabled ? 'Active' : 'Disabled'}
              </span>
              <span className="bg-white/15 backdrop-blur text-white text-[9px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/5">
                <span className="material-symbols-outlined text-[11px]">payments</span>
                Bal: ₹{Number(balance).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Vehicle Switch Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button className="flex-grow py-3.5 rounded-xl border-2 border-[#4a40e0]/10 dark:border-slate-800 text-[#4a40e0] dark:text-indigo-400 font-extrabold text-[12px] uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all active:scale-[0.98] cursor-pointer">
              Switch Vehicle
            </button>
            <button className="flex-grow py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 font-extrabold text-[12px] uppercase tracking-wider hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all active:scale-[0.98] cursor-pointer">
              Add New Vehicle
            </button>
          </div>
        </div>

        {/* Right Column: Wallet Controls & Settings */}
        <div className="lg:col-span-6 space-y-6">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400 block pl-1">Wallet Management</span>
          
          <div className="bg-slate-50 dark:bg-slate-800/30 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800/50 space-y-6">
            
            {/* Wallet Balance Card */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">AVAILABLE BALANCE</span>
                <h2 className="text-3xl font-black text-[#2B3674] dark:text-slate-200 tracking-tight">
                  ₹{Number(balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </h2>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#4a40e0]/10 text-[#4a40e0] flex items-center justify-center border border-[#4a40e0]/10 shadow-sm shrink-0">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
              </div>
            </div>

            {/* Quick Balance Recharge / Withdraw Buttons */}
            <div className="flex gap-3">
              <button 
                onClick={handleAddMoney}
                disabled={actionLoading}
                className="flex-1 bg-[#4a40e0] hover:bg-[#3d34b8] disabled:bg-indigo-300 text-white font-extrabold text-[12px] uppercase tracking-wider py-3.5 rounded-xl transition-all active:scale-[0.98] shadow-md shadow-[#4a40e0]/10 flex items-center justify-center gap-1.5 cursor-pointer">
                {actionLoading ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm font-black">add</span>
                    Recharge ₹500
                  </>
                )}
              </button>
              <button 
                onClick={handleWithdraw}
                disabled={actionLoading || balance < 500}
                className="flex-1 bg-white dark:bg-slate-800 text-[#4a40e0] dark:text-indigo-400 border-2 border-[#4a40e0]/10 dark:border-slate-700 hover:border-[#4a40e0]/20 disabled:opacity-40 disabled:cursor-not-allowed font-extrabold text-[12px] uppercase tracking-wider py-3.5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer">
                Withdraw ₹500
              </button>
            </div>

            {/* Settings Toggles List */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-5 space-y-4">
              
              {/* AutoPay Settings */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-sm text-[#2B3674] dark:text-slate-200">AutoPay Gate Deductions</div>
                  <div className="text-[11px] text-slate-400 font-semibold mt-0.5">Deduct fees automatically on fast exits</div>
                </div>
                <div 
                  onClick={toggleAutoPay} 
                  className={`w-12 h-6 rounded-full flex items-center p-0.5 cursor-pointer transition-colors duration-300 ${autoPayEnabled ? 'bg-[#4a40e0]' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${autoPayEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
              </div>

              {/* Low Balance Alert Settings */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-sm text-[#2B3674] dark:text-slate-200">Low Balance Warnings</div>
                  <div className="text-[11px] text-slate-400 font-semibold mt-0.5">Notify when card falls below ₹100</div>
                </div>
                <div 
                  onClick={() => setLowBalAlert(!lowBalAlert)} 
                  className={`w-12 h-6 rounded-full flex items-center p-0.5 cursor-pointer transition-colors duration-300 ${lowBalAlert ? 'bg-[#4a40e0]' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${lowBalAlert ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
