import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Notifications() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All');

  const tabs = ['All', 'Parking', 'Payments', 'Alerts'];

  return (
    <div className="bg-surface-bright min-h-screen text-on-surface flex flex-col font-body pb-[100px] overflow-hidden">
      
      {/* Top Header - Purple */}
      <header className="bg-[#5D50D6] rounded-b-[2.5rem] pt-6 pb-12 px-4 text-white relative z-10 w-full max-w-md mx-auto md:max-w-2xl shadow-md">
        <div className="flex items-center justify-between">
            <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white/10 transition-colors rounded-xl flex items-center justify-center">
               <span className="material-symbols-outlined text-white">arrow_back</span>
            </button>
            <h1 className="text-[17px] font-bold">Notifications</h1>
            <button className="p-2 hover:bg-white/10 transition-colors rounded-xl flex items-center justify-center">
               <span className="material-symbols-outlined text-white">more_vert</span>
            </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto md:max-w-2xl px-5 -mt-6 relative z-20 space-y-4">
        
        {/* Category Pills */}
        <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar pb-2 pt-1 mb-2">
            {tabs.map(tab => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-[13px] transition-all shadow-sm ${activeTab === tab ? 'bg-[#5D50D6] text-white' : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low border border-outline-variant/10'}`}>
                    {tab}
                </button>
            ))}
        </div>

        <div className="space-y-4">
            {/* Notification 1 - Urgent / Actionable */}
            <div className="bg-surface-bright rounded-3xl p-5 shadow-[0px_4px_16px_rgba(74,64,224,0.06)] border border-[#5D50D6]/20">
                <div className="flex gap-4">
                    <div className="w-12 h-12 bg-[#5D50D6]/10 text-[#5D50D6] rounded-full flex items-center justify-center shrink-0 mt-1">
                        <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>directions_car</span>
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                            <h3 className="font-bold text-on-surface text-[15px] leading-tight pr-2">Parking Time Ending Soon</h3>
                            <span className="text-[#5D50D6] text-[10px] font-bold uppercase tracking-widest whitespace-nowrap mt-0.5">2 MIN AGO</span>
                        </div>
                        <p className="text-on-surface-variant text-[13px] leading-relaxed mb-4">
                           Your parking session at Phoenix Palladium will expire in 10 minutes.
                        </p>
                        <button className="w-full py-2.5 bg-[#5D50D6] hover:bg-[#4a40e0] text-white font-bold text-[13px] rounded-xl shadow-md transition-colors">
                           Extend Time
                        </button>
                    </div>
                </div>
            </div>

            {/* Notification 2 */}
            <div className="bg-white rounded-3xl p-5 shadow-[0px_4px_16px_rgba(74,64,224,0.03)] border border-outline-variant/10">
                <div className="flex gap-4">
                    <div className="w-12 h-12 bg-surface-container-low text-on-surface-variant rounded-full flex items-center justify-center shrink-0 mt-1">
                        <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                            <h3 className="font-bold text-on-surface text-[15px] leading-tight">Payment Successful</h3>
                            <span className="text-outline text-[10px] uppercase font-bold tracking-widest whitespace-nowrap mt-0.5">11:20 AM</span>
                        </div>
                        <p className="text-on-surface-variant text-[13px] leading-relaxed mb-3">
                           ₹100 deducted from your E-Wallet.
                        </p>
                        <button className="text-[#5D50D6] font-bold text-[11px] uppercase tracking-widest hover:underline text-left">
                           VIEW RECEIPT
                        </button>
                    </div>
                </div>
            </div>

            {/* Notification 3 */}
            <div className="bg-white rounded-3xl p-5 shadow-[0px_4px_16px_rgba(74,64,224,0.03)] border border-outline-variant/10">
                <div className="flex gap-4">
                    <div className="w-12 h-12 bg-surface-container-low text-[#2a2f32] rounded-full flex items-center justify-center shrink-0 mt-1 font-extrabold text-xl font-mono">
                        P
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                            <h3 className="font-bold text-on-surface text-[15px] leading-tight pr-4">Slot Reserved Successfully</h3>
                            <span className="text-outline text-[10px] uppercase font-bold tracking-widest whitespace-nowrap mt-0.5">11:20 AM</span>
                        </div>
                        <p className="text-on-surface-variant text-[13px] leading-relaxed">
                           Your parking slot B1 - 010 has been reserved at Phoenix Palladium.
                        </p>
                    </div>
                </div>
            </div>

            {/* Notification 4 */}
            <div className="bg-white rounded-3xl p-5 shadow-[0px_4px_16px_rgba(74,64,224,0.03)] border border-outline-variant/10">
                <div className="flex gap-4">
                    <div className="w-12 h-12 bg-surface-container-low text-on-surface-variant rounded-full flex items-center justify-center shrink-0 mt-1">
                        <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                            <h3 className="font-bold text-on-surface text-[15px] leading-tight">Auto Pay Executed</h3>
                            <span className="text-outline text-[10px] uppercase font-bold tracking-widest whitespace-nowrap mt-0.5">11:00 AM</span>
                        </div>
                        <p className="text-on-surface-variant text-[13px] leading-relaxed">
                           ₹80 automatically debited for your parking session.
                        </p>
                    </div>
                </div>
            </div>

            <div className="pt-4 pb-1">
                <span className="text-[10px] font-bold text-outline-variant tracking-widest uppercase pl-2">YESTERDAY</span>
            </div>

            {/* Notification 5 */}
            <div className="bg-white rounded-3xl p-5 shadow-[0px_4px_16px_rgba(74,64,224,0.03)] border border-outline-variant/10">
                <div className="flex gap-4">
                    <div className="w-12 h-12 bg-surface-container-low text-on-surface-variant rounded-full flex items-center justify-center shrink-0 mt-1">
                        <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                            <h3 className="font-bold text-on-surface text-[15px] leading-tight">New Parking Zone Added</h3>
                        </div>
                        <p className="text-on-surface-variant text-[13px] leading-relaxed">
                           Explore the new automated parking bay at Bandra Kurla Complex.
                        </p>
                    </div>
                </div>
            </div>

            {/* End of notifications */}
            <div className="mt-6 mb-8 py-8 border-2 border-dashed border-outline-variant/20 rounded-3xl flex flex-col items-center justify-center">
               <div className="w-12 h-12 bg-surface-bright rounded-full flex items-center justify-center mb-2">
                   <span className="material-symbols-outlined text-outline-variant/50 text-2xl">notifications_off</span>
               </div>
               <span className="text-outline-variant text-[13px] font-medium">No more notifications yet</span>
            </div>
            
        </div>
      </main>

      {/* Floating Bottom Nav */}
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-sm rounded-[1.5rem] bg-white/95 backdrop-blur-xl z-50 flex justify-around items-center px-2 py-3 shadow-[0px_20px_40px_rgba(74,64,224,0.15)] border border-outline-variant/10">
        <a className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors py-2 px-3" onClick={() => navigate('/dashboard')} href="#">
          <span className="material-symbols-outlined text-[26px] mb-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
          <span className="text-[9px] font-bold uppercase tracking-widest mt-0.5">HOME</span>
        </a>
        <a className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors py-2 px-3" onClick={() => navigate('/dashboard')} href="#">
          <span className="material-symbols-outlined text-[26px] mb-0.5" style={{ fontVariationSettings: "'wght' 600" }}>local_parking</span>
          <span className="text-[9px] font-bold uppercase tracking-widest mt-0.5">PARKING</span>
        </a>
        <a className="flex flex-col items-center justify-center text-[#5D50D6] py-1.5 px-6 transition-all bg-indigo-50/80 rounded-2xl border border-[#5D50D6]/10" href="#">
          <span className="material-symbols-outlined text-[26px] mb-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>notifications</span>
          <span className="text-[9px] font-bold uppercase tracking-widest mt-0.5">ALERTS</span>
        </a>
        <a className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors py-2 px-3" href="#">
          <span className="material-symbols-outlined text-[26px] mb-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
          <span className="text-[9px] font-bold uppercase tracking-widest mt-0.5">PROFILE</span>
        </a>
      </nav>

    </div>
  );
}
