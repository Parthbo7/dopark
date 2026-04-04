import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabase';

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    avgTransaction: 0,
    activeWallets: 0,
    growthRate: 12.4
  });

  // Verify Admin
  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdminLoggedIn');
    if (isAdmin !== 'true') {
      navigate('/admin/login');
    }
  }, [navigate]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        // 1. Fetch Bookings for Revenue over time
        const { data: bookings } = await supabase
          .from('bookings')
          .select('total_price, start_time, status')
          .order('start_time', { ascending: true });

        if (bookings) {
          const total = bookings.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0);
          const avg = bookings.length > 0 ? Math.round(total / bookings.length) : 0;
          
          // Group by Date for the chart
          const grouped = bookings.reduce((acc, b) => {
            const date = new Date(b.start_time).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
            if (!acc[date]) acc[date] = { date, amount: 0, count: 0 };
            acc[date].amount += (Number(b.total_price) || 0);
            acc[date].count += 1;
            return acc;
          }, {});

          const chartArray = Object.values(grouped).slice(-10); // Last 10 days
          setRevenueData(chartArray);
          setStats(prev => ({ ...prev, totalRevenue: total, avgTransaction: avg }));
        }

        // 2. Fetch Active Wallets (Balance > 0)
        const { count: activeCards } = await supabase
          .from('parking_cards')
          .select('*', { count: 'exact', head: true })
          .gt('balance', 0);
        
        if (activeCards !== null) {
          setStats(prev => ({ ...prev, activeWallets: activeCards }));
        }

      } catch (err) {
        console.error("Analytics Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isAdminLoggedIn');
    navigate('/admin/login');
  };

  const maxVal = Math.max(...revenueData.map(d => d.amount), 1);

  return (
    <div className="min-h-screen bg-[#F4F7FE] flex font-body text-on-surface">
      
      {/* Sidebar */}
      <aside className="w-[300px] bg-white h-screen flex flex-col fixed left-0 top-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-50">
         <div className="p-8">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#5D50D6] flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-2xl">commute</span>
                </div>
                <div>
                    <h1 className="text-[#2B3674] font-black text-xl leading-none">Luminous</h1>
                    <h2 className="text-[#2B3674] font-black text-xl leading-none">Navigator</h2>
                </div>
            </div>
            <p className="text-[#A3AED0] text-[9px] font-black uppercase tracking-[0.2em]">Smart Parking Admin</p>
         </div>
         
         <nav className="flex-1 px-6 space-y-2 mt-8">
             <button onClick={() => navigate('/admin/dashboard')} className="w-full flex items-center gap-4 px-5 py-4 text-[#A3AED0] hover:bg-[#F4F7FE] hover:text-[#2B3674] rounded-2xl font-bold transition-all text-left">
                <span className="material-symbols-outlined text-[24px]">grid_view</span>
                <span className="text-[15px]">Dashboard</span>
             </button>
             <button onClick={() => navigate('/admin/slots')} className="w-full flex items-center gap-4 px-5 py-4 text-[#A3AED0] hover:bg-[#F4F7FE] hover:text-[#2B3674] rounded-2xl font-bold transition-all text-left">
                <span className="material-symbols-outlined text-[24px]">directions_car</span>
                <span className="text-[15px]">Slot Management</span>
             </button>
             <button className="w-full flex items-center gap-4 px-5 py-4 bg-[#F4F7FE] text-[#5D50D6] rounded-2xl font-bold transition-all text-left">
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>bar_chart</span>
                <span className="text-[15px]">Analytics</span>
             </button>
              <button onClick={() => navigate('/admin/users')} className="w-full flex items-center gap-4 px-5 py-4 text-[#A3AED0] hover:bg-[#F4F7FE] hover:text-[#2B3674] rounded-2xl font-bold transition-all text-left">
                <span className="material-symbols-outlined text-[24px]">group</span>
                <span className="text-[15px]">User Control</span>
             </button>
             <button className="w-full flex items-center gap-4 px-5 py-4 text-[#A3AED0] hover:bg-[#F4F7FE] hover:text-[#2B3674] rounded-2xl font-bold transition-all text-left">
                <span className="material-symbols-outlined text-[24px]">admin_panel_settings</span>
                <span className="text-[15px]">Security</span>
             </button>
         </nav>

         <div className="p-6 mt-auto border-t border-[#F4F7FE]">
             <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2 text-[#A3AED0] hover:text-[#FF5B5B] font-bold text-sm transition-colors">
                 <span className="material-symbols-outlined text-[20px]">logout</span>
                 Logout
             </button>
             <div className="mt-8 flex items-center gap-3 bg-[#F4F7FE] p-4 rounded-2xl">
                 <img src="https://i.pravatar.cc/150?u=admin" className="w-10 h-10 rounded-xl" alt="Admin" />
                 <div>
                    <div className="text-xs font-black text-[#2B3674]">Alex Astra</div>
                    <div className="text-[9px] text-[#A3AED0] font-bold uppercase tracking-widest">Chief Admin</div>
                 </div>
             </div>
         </div>
      </aside>

      {/* Main Area */}
      <main className="ml-[300px] flex-1 min-h-screen p-8">
          
          {/* Top Bar */}
          <header className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3 bg-white rounded-full px-6 py-3.5 w-[450px] shadow-sm border border-[#E9EDF7]/50">
                  <span className="material-symbols-outlined text-[#A3AED0]">search</span>
                  <input type="text" placeholder="Search analytics..." className="bg-transparent border-none outline-none w-full text-sm font-medium text-[#2B3674] placeholder:text-[#A3AED0]" />
              </div>
              <div className="flex items-center gap-6">
                  <span className="material-symbols-outlined text-[#A3AED0] cursor-pointer hover:text-[#2B3674]">card_giftcard</span>
                  <span className="material-symbols-outlined text-[#A3AED0] cursor-pointer hover:text-[#2B3674]">notifications</span>
                  <div className="bg-[#ECFDF5] px-4 py-2 rounded-full border border-[#D1FAE5] flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></div>
                      <span className="text-[10px] font-black text-[#047857] uppercase tracking-widest whitespace-nowrap">Operational Status: Optimal</span>
                  </div>
              </div>
          </header>

          {/* Breadcrumb & Title */}
          <div className="flex items-center justify-between mb-6">
              <div>
                  <div className="flex items-center gap-2 text-[10px] font-black text-[#A3AED0] uppercase tracking-widest mb-1">
                      <span>Analysis</span>
                      <span className="material-symbols-outlined text-xs">chevron_right</span>
                      <span className="text-[#5D50D6]">Revenue Overview</span>
                  </div>
                  <h2 className="text-3xl font-black text-[#2B3674] tracking-tight">Revenue Analysis</h2>
                  <p className="text-[#A3AED0] text-sm font-medium mt-1">Financial performance across all parking sectors.</p>
              </div>
              <div className="flex gap-4">
                  <button className="bg-white border border-[#E9EDF7] px-6 py-3 rounded-2xl font-bold text-[#2B3674] flex items-center gap-3 shadow-sm hover:bg-[#F4F7FE] transition-all">
                      <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                      {new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                  </button>
                  <button className="bg-[#5D50D6] text-white px-8 py-3 rounded-2xl font-black text-sm flex items-center gap-3 shadow-lg shadow-[#5D50D6]/20 active:scale-95 transition-all">
                      <span className="material-symbols-outlined text-[18px]">download</span>
                      Export Data
                  </button>
              </div>
          </div>

          {/* Top Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
              <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-[#E9EDF7]/30 flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                      <div className="text-[10px] font-black text-[#A3AED0] uppercase tracking-widest">Total Revenue</div>
                      <div className="text-4xl font-black text-[#2B3674]">₹{stats.totalRevenue.toLocaleString()}</div>
                      <div className="mt-4 px-2 py-1 bg-[#ECFDF5] text-[#10B981] text-[10px] font-black rounded-lg w-fit">+{stats.growthRate}%</div>
                  </div>
                  <div className="w-16 h-16 rounded-[1.5rem] bg-[#F4F7FE] text-[#5D50D6] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[32px]">payments</span>
                  </div>
              </div>

              <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-[#E9EDF7]/30 flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                      <div className="text-[10px] font-black text-[#A3AED0] uppercase tracking-widest">Average Transaction</div>
                      <div className="text-4xl font-black text-[#2B3674]">₹{stats.avgTransaction}</div>
                      <div className="mt-4 px-2 py-1 bg-[#EEF2FF] text-[#5D50D6] text-[10px] font-black rounded-lg w-fit">Optimal</div>
                  </div>
                  <div className="w-16 h-16 rounded-[1.5rem] bg-[#F4F7FE] text-[#5D50D6] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[32px]">analytics</span>
                  </div>
              </div>

              <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-[#E9EDF7]/30 flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                      <div className="text-[10px] font-black text-[#A3AED0] uppercase tracking-widest">Active Subscriptions</div>
                      <div className="text-4xl font-black text-[#2B3674]">{stats.activeWallets}</div>
                      <div className="mt-4 px-2 py-1 bg-[#FFFBEB] text-[#F59E0B] text-[10px] font-black rounded-lg w-fit">Growth</div>
                  </div>
                  <div className="w-16 h-16 rounded-[1.5rem] bg-[#F4F7FE] text-[#5D50D6] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[32px]">verified_user</span>
                  </div>
              </div>
          </div>

          {/* Revenue Dynamics Chart Section */}
          <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-[#E9EDF7]/40 mb-10">
              <div className="flex items-center justify-between mb-12">
                  <div>
                      <h3 className="text-2xl font-black text-[#2B3674]">Revenue Dynamics</h3>
                      <p className="text-[#A3AED0] text-sm font-medium">Weekly financial influx analysis for the current billing cycle.</p>
                  </div>
                  <div className="flex gap-2">
                       <button className="px-5 py-2.5 rounded-xl bg-[#F4F7FE] text-[#5D50D6] font-black text-[10px] uppercase border border-[#E9EDF7]">Daily</button>
                       <button className="px-5 py-2.5 rounded-xl text-[#A3AED0] font-black text-[10px] uppercase">Weekly</button>
                  </div>
              </div>

              {loading ? (
                 <div className="h-[250px] flex items-center justify-center bg-[#F4F7FE]/30 rounded-3xl animate-pulse">
                    <span className="text-xs font-black text-[#A3AED0] uppercase tracking-widest">Preparing Intelligence Map...</span>
                 </div>
              ) : (
                <div className="h-[280px] flex items-end justify-between px-6 pb-6 relative">
                    {/* Background Grid Lines */}
                    <div className="absolute inset-0 flex flex-col justify-between py-6 pointer-events-none opacity-5">
                        {[1, 2, 3, 4].map(i => <div key={i} className="w-full border-t border-[#2B3674]"></div>)}
                    </div>
                    
                    {revenueData.length === 0 ? (
                        <div className="w-full h-full flex items-center justify-center text-[#A3AED0] font-bold">No booking data available for this phase.</div>
                    ) : (
                        revenueData.map((d, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-4 flex-1 group">
                                <div className="relative w-12 flex justify-center">
                                    <div 
                                      className="w-10 rounded-xl bg-[#7158fe]/80 group-hover:bg-[#5D50D6] transition-all duration-500 cursor-pointer relative"
                                      style={{ height: `${(d.amount / maxVal) * 200}px` }}
                                    >
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#2B3674] text-white text-[9px] font-black px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
                                            ₹{d.amount.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                <span className="text-[10px] font-black text-[#A3AED0] uppercase tracking-tighter">{d.date}</span>
                            </div>
                        ))
                    )}
                </div>
              )}
          </div>

          {/* Daily Table Section */}
          <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-[#E9EDF7]/40 mb-10">
              <div className="flex items-center justify-between mb-10">
                  <h3 className="text-xl font-bold text-[#2B3674]">Daily Transactions</h3>
                  <button className="text-[#5D50D6] text-xs font-black uppercase tracking-widest hover:underline">View All History</button>
              </div>

              <div className="space-y-4">
                  <div className="grid grid-cols-4 px-8 pb-4 border-b border-[#F4F7FE] text-[10px] font-black text-[#A3AED0] uppercase tracking-widest">
                      <span>Date</span>
                      <span>Total Bookings</span>
                      <span>Revenue Amount</span>
                      <span>Growth %</span>
                  </div>
                  {revenueData.slice().reverse().map((d, i) => (
                    <div key={i} className="grid grid-cols-4 px-8 py-5 items-center hover:bg-[#F4F7FE]/50 rounded-2xl transition-all cursor-pointer border border-transparent hover:border-[#E9EDF7]/50">
                        <span className="text-sm font-bold text-[#2B3674]">{d.date}</span>
                        <div className="flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-[#5D50D6]"></div>
                           <span className="text-sm font-medium text-[#A3AED0]">{d.count} Bookings</span>
                        </div>
                        <span className="text-sm font-black text-[#2B3674]">₹{d.amount.toLocaleString()}</span>
                        <span className={`text-[11px] font-black ${i % 4 === 0 ? 'text-[#FF5B5B]' : 'text-[#10B981]'}`}>
                           {i % 4 === 0 ? '-' : '+'}{Math.floor(Math.random() * 15 + 1)}%
                        </span>
                    </div>
                  ))}
              </div>
          </div>

          {/* Bottom Summary Pairs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-[#F4F7FE] rounded-[3rem] p-10 border border-[#E9EDF7]/80 flex items-center justify-between border-b-[8px] border-b-[#5D50D6]">
                  <div>
                      <h4 className="text-lg font-black text-[#2B3674]">Peak Hour Efficiency</h4>
                      <p className="text-[#A3AED0] text-sm font-medium mt-1">11:00 AM - 02:00 PM</p>
                  </div>
                  <div className="text-right">
                      <div className="text-4xl font-black text-[#5D50D6]">88%</div>
                      <div className="text-[10px] font-black text-[#A3AED0] uppercase mt-1 tracking-widest">Utilization</div>
                  </div>
              </div>
              <div className="bg-[#EEF2FF] rounded-[3rem] p-10 border border-[#E9EDF7]/80 flex items-center gap-8 border-b-[8px] border-b-[#41D996]/50">
                  <div className="w-16 h-16 rounded-3xl bg-white text-[#5D50D6] flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-[32px]">electric_car</span>
                  </div>
                  <div>
                      <h4 className="text-lg font-black text-[#2B3674]">EV Station Revenue</h4>
                      <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-3xl font-black text-[#2B3674]">₹14,200</span>
                          <span className="text-[10px] font-bold text-[#A3AED0]">this month</span>
                      </div>
                  </div>
              </div>
          </div>

      </main>
    </div>
  );
}
