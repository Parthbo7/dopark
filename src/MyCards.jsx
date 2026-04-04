import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function MyCards() {
  const navigate = useNavigate();
  // We'll store the full card object from the DB
  const [cardData, setCardData] = useState(null);
  
  // Local states for instant UI toggling
  const [autoPayEnabled, setAutoPayEnabled] = useState(true);
  const [notifyEnabled, setNotifyEnabled] = useState(true);
  const [maxPayment, setMaxPayment] = useState(500);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch the card data when the component loads
  useEffect(() => {
    const fetchCardSettings = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return; // Not logged in

        const { data, error } = await supabase
          .from('parking_cards')
          .select('*')
          .eq('user_id', user.id)
          .single(); // Get the primary card

        if (error && error.code !== 'PGRST116') {
             console.error("Error fetching card:", error);
        } else if (data) {
             // Populate real DB values into our UI states!
             setCardData(data);
             setAutoPayEnabled(data.auto_pay_enabled);
             setNotifyEnabled(data.notify_before_payment);
             setMaxPayment(data.max_auto_payment);
        }
      } catch (err) {
         console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCardSettings();
  }, []);

  // Update Database when clicking Save Changes
  const handleSaveChanges = async () => {
    if (!cardData) return;
    setIsSaving(true);
    
    try {
        const { error } = await supabase
          .from('parking_cards')
          .update({
             auto_pay_enabled: autoPayEnabled,
             notify_before_payment: notifyEnabled,
             max_auto_payment: maxPayment
          })
          .eq('card_id', cardData.card_id);

        if (error) throw error;
        alert("Settings safely saved to Database!");
    } catch (err) {
        alert("Failed to save changes: " + err.message);
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="bg-[#F8F9FE] min-h-screen text-on-surface flex flex-col font-body pb-6 font-sans">
      
      {/* Header */}
      <header className="flex items-center px-4 py-6 bg-white shadow-sm relative z-10 w-full max-w-md mx-auto md:max-w-2xl text-[#1c1b1f]">
        <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 text-[#4a40e0] hover:bg-slate-50 transition-colors rounded-full flex items-center justify-center cursor-pointer">
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        <h1 className="text-xl font-bold ml-2 tracking-tight">Auto Pay Settings</h1>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-md mx-auto md:max-w-2xl px-5 pt-8 flex flex-col relative z-20">
        
        {isLoading ? (
            <div className="flex justify-center p-10"><div className="animate-spin w-8 h-8 rounded-full border-4 border-[#4a40e0]/30 border-t-[#4a40e0]"></div></div>
        ) : (
          <>
            {/* Do Card Section */}
            <div className="mb-8">
                <h2 className="text-[#49454f] text-[11px] font-extrabold tracking-widest uppercase mb-3 ml-2">DO CARD</h2>
                
                <div className="bg-white rounded-[2rem] border-2 border-[#5D50D6] shadow-[0_8px_24px_rgba(93,80,214,0.08)] p-6 flex flex-col relative overflow-hidden">
                    
                    {/* Card Top Row */}
                    <div className="flex items-center justify-between mb-6 pb-6 border-b border-outline-variant/10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                                <span className="material-symbols-outlined text-[#4a40e0] text-[22px]">credit_card</span>
                            </div>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="font-bold text-[16px] text-on-surface">Primary Card</span>
                                    {cardData?.is_active && (
                                       <span className="bg-indigo-50 text-[#4a40e0] text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider">ACTIVE</span>
                                    )}
                                </div>
                                <span className="text-[#4a40e0] text-[12px] font-medium tracking-wide">
                                    {/* DYNAMIC DB BALANCE HERE! */}
                                    Available Balance: ₹{cardData?.balance || '0.00'}
                                </span>
                            </div>
                        </div>
                        {/* Checkmark Circle */}
                        <div className="w-6 h-6 rounded-full bg-[#5D50D6] flex items-center justify-center text-white shrink-0 shadow-sm shadow-[#5D50D6]/30">
                            <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                        </div>
                    </div>

                    {/* Auto Pay Toggle Row */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex flex-col">
                            <span className="font-bold text-[15px] text-on-surface mb-0.5">Enable Auto Pay</span>
                            <span className="text-on-surface-variant text-[13px]">Simplify your parking payments</span>
                        </div>
                        {/* Toggle */}
                        <div 
                            onClick={() => setAutoPayEnabled(!autoPayEnabled)} 
                            className={`w-14 h-8 rounded-full flex items-center p-1 cursor-pointer transition-colors ${autoPayEnabled ? 'bg-[#5D50D6]' : 'bg-surface-container-highest'}`}
                        >
                            <div className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300 ${autoPayEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </div>
                    </div>

                    {/* Payment Buttons */}
                    <div className="flex flex-col gap-3">
                        <button className="w-full bg-[#5D50D6] hover:bg-[#4a40e0] transition-colors py-4 rounded-2xl flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(93,80,214,0.2)] active:scale-[0.98]">
                            <span className="material-symbols-outlined text-white text-[20px]">payments</span>
                            <span className="text-white font-bold text-[14px]">Online Payment</span>
                        </button>
                        <button className="w-full bg-[#f0effb] hover:bg-[#e6e4f8] transition-colors py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98]">
                            <span className="material-symbols-outlined text-[#4a40e0] text-[20px]">qr_code_scanner</span>
                            <span className="text-[#4a40e0] font-bold text-[14px]">Scan QR for Manual Payment</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Limits & Alerts Section */}
            <div>
                <h2 className="text-[#49454f] text-[11px] font-extrabold tracking-widest uppercase mb-3 ml-2">LIMITS & ALERTS</h2>
                
                <div className="flex flex-col gap-3">
                    {/* Max Auto Payment */}
                    <div className="bg-white rounded-2xl p-5 flex items-center justify-between shadow-sm border border-outline-variant/5">
                        <div className="flex items-center gap-4 text-on-surface">
                            <span className="material-symbols-outlined text-[20px] text-outline-variant">horizontal_rule</span>
                            <span className="font-bold text-[14px]">Max Auto Payment</span>
                        </div>
                        <button 
                            onClick={() => {
                                const newMax = prompt("Enter new Max Auto Payment limit", maxPayment);
                                if (newMax && !isNaN(newMax)) setMaxPayment(Number(newMax));
                            }}
                            className="bg-[#f0effb] text-[#4a40e0] font-bold text-[14px] px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors hover:bg-[#e6e4f8]"
                        >
                            ₹{maxPayment} <span className="material-symbols-outlined text-[14px]">edit</span>
                        </button>
                    </div>

                    {/* Notify Before Payment */}
                    <div className="bg-white rounded-2xl p-5 flex items-center justify-between shadow-sm border border-outline-variant/5 mb-8">
                        <div className="flex items-center gap-4 text-on-surface">
                            <span className="material-symbols-outlined text-[20px] text-outline-variant">notifications_active</span>
                            <span className="font-bold text-[14px]">Notify before payment</span>
                        </div>
                        <div 
                            onClick={() => setNotifyEnabled(!notifyEnabled)} 
                            className={`w-14 h-8 rounded-full flex items-center p-1 cursor-pointer transition-colors ${notifyEnabled ? 'bg-[#5D50D6]' : 'bg-surface-container-highest'}`}
                        >
                            <div className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300 ${notifyEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="mt-auto flex justify-center pb-6">
                 <button 
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                    className={`w-full text-white font-bold text-[15px] py-4 rounded-[1.25rem] shadow-[0_12px_24px_rgba(93,80,214,0.3)] transition-all active:scale-[0.98] ${isSaving ? 'bg-[#a39dfa]' : 'bg-[#5D50D6] hover:bg-[#4a40e0]'}`}
                 >
                     {isSaving ? 'Saving...' : 'Save Changes'}
                 </button>
            </div>
          </>
        )}

      </main>
    </div>
  );
}
