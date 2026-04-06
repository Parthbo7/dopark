import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabase';

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState([]);
  const [vehicleDistribution, setVehicleDistribution] = useState({ car: 0, bike: 0 });
  const [peakHours, setPeakHours] = useState([]);
  const [stationPerformance, setStationPerformance] = useState([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    avgTransaction: 0,
    activeWallets: 0,
    occupancyRate: 78,
    userRetention: 92,
    growthRate: 14.8
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
        // 1. Fetch Bookings for Revenue & Vehicle Distribution
        const { data: bookings } = await supabase
          .from('bookings')
          .select('*, parking_stations(name)')
          .order('start_time', { ascending: true });

        if (bookings) {
          const total = bookings.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0);
          const avg = bookings.length > 0 ? Math.round(total / bookings.length) : 0;
          
          // --- Group by Date (Chart) ---
          const dateGroup = bookings.reduce((acc, b) => {
            const date = new Date(b.start_time).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
            if (!acc[date]) acc[date] = { date, amount: 0, count: 0 };
            acc[date].amount += (Number(b.total_price) || 0);
            acc[date].count += 1;
            return acc;
          }, {});
          setRevenueData(Object.values(dateGroup).slice(-8));

          // --- Vehicle Distribution ---
          const distribution = bookings.reduce((acc, b) => {
            const type = b.vehicle_type === '2_wheeler' ? 'bike' : 'car';
            acc[type] += 1;
            return acc;
          }, { car: 0, bike: 0 });
          setVehicleDistribution(distribution);

          // --- Peak Hour Analysis ---
          const hourGroup = bookings.reduce((acc, b) => {
            const hour = new Date(b.start_time).getHours();
            acc[hour] = (acc[hour] || 0) + 1;
            return acc;
          }, {});
          const formattedPeak = Object.entries(hourGroup).map(([h, count]) => ({ hour: `${h}:00`, count }));
          setPeakHours(formattedPeak.slice(-12));

          // --- Station Performance ---
          const stationGroup = bookings.reduce((acc, b) => {
            const sName = b.parking_stations?.name || 'Unknown Zone';
            if (!acc[sName]) acc[sName] = { name: sName, revenue: 0, count: 0 };
            acc[sName].revenue += (Number(b.total_price) || 0);
            acc[sName].count += 1;
            return acc;
          }, {});
          setStationPerformance(Object.values(stationGroup).sort((a,b) => b.revenue - a.revenue));

          setStats(prev => ({ ...prev, totalRevenue: total, avgTransaction: avg }));
        }

        // 2. Card Metrics
        const { count: activeCards } = await supabase
          .from('parking_cards')
          .select('*', { count: 'exact', head: true })
          .gt('balance', 0);
        
        if (activeCards !== null) {
          setStats(prev => ({ ...prev, activeWallets: activeCards }));
        }

      } catch (err) {
        console.error("Advanced Analytics Error:", err);
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

  const maxRevenue = Math.max(...revenueData.map(d => d.amount), 1);
  const maxPeak = Math.max(...peakHours.map(d => d.count), 1);

  return (
    <div className="min-h-screen bg-[#F4F7FE] flex font-body text-on-surface">
      
      {/* Sidebar - Enhanced Nav */}
      <aside className="w-[280px] bg-white h-screen flex flex-col fixed left-0 top-0 shadow-lg z-50 transition-all">
         <div className="p-8">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#5D50D6] to-[#7367F0] flex items-center justify-center shadow-lg shadow-[#5D50D6]/20">
                    <span className="material-symbols-outlined text-white text-3xl">terminal_parking</span>
                </div>
                <div>
                    <h1 className="text-[#2B3674] font-black text-2xl tracking-tighter">DoPark</h1>
                    <span className="text-[10px] font-black text-[#A3AED0] uppercase tracking-[0.25em]">Central Command</span>
                </div>
            </div>
         </div>
         
         <nav className="flex-1 px-4 space-y-1.5 mt-4">
             <SidebarItem onClick={() => navigate('/admin/dashboard')} icon="dashboard" label="Dashboard" />
             <SidebarItem onClick={() => navigate('/admin/slots')} icon="space_dashboard" label="Slots Control" />
             <SidebarItem active icon="stacked_line_chart" label="Revenue Hub" />
             <SidebarItem onClick={() => navigate('/admin/users')} icon="groups_3" label="User Registry" />
             <SidebarItem onClick={() => navigate('/admin/security')} icon="gpp_good" label="Digital Vault" />
         </nav>

          <div className="px-6 py-8 mt-auto">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-3 py-4 bg-[#FF5B5B]/5 text-[#FF5B5B] hover:bg-[#FF5B5B] hover:text-white rounded-2xl font-black text-xs transition-all uppercase tracking-widest border border-[#FF5B5B]/10">
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  Terminate Session
              </button>
          </div>
      </aside>

      {/* Content Area */}
      <main className="ml-[280px] flex-1 p-8">
          
          {/* Enhanced Top Row */}
          <header className="flex items-center justify-between mb-8 pb-4 border-b border-[#E9EDF7]/40">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-[#A3AED0] uppercase tracking-[0.2em] mb-1">Intelligence Layer</span>
                <h2 className="text-3xl font-black text-[#2B3674] tracking-tight">Revenue Analytics</h2>
              </div>
              <div className="flex items-center gap-4">
                  <div className="bg-white/80 backdrop-blur-md border border-[#E9EDF7] px-5 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></div>
                      <span className="text-[11px] font-bold text-[#2B3674] uppercase tracking-widest">System Health: Nominal</span>
                  </div>
                  <button className="bg-[#5D50D6] text-white px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-2 shadow-xl shadow-[#5D50D6]/20 active:scale-95 transition-all">
                      <span className="material-symbols-outlined text-[18px]">file_download</span>
                      GENERATE REPORT
                  </button>
              </div>
          </header>

          {/* Core Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <MetricCard label="GROSS REVENUE" value={`₹${stats.totalRevenue.toLocaleString()}`} icon="currency_rupee" color="indigo" growth={`+${stats.growthRate}%`} />
              <MetricCard label="AVG TRANSACTION" value={`₹${stats.avgTransaction}`} icon="query_stats" color="emerald" growth="OPTIMAL" />
              <MetricCard label="USER RETENTION" value={`${stats.userRetention}%`} icon="person_celebrate" color="amber" growth="HIGH" />
              <MetricCard label="ACTIVE DOCARDS" value={stats.activeWallets} icon="id_card" color="rose" growth="GROWING" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* MAIN REVENUE CHART (LONG) */}
              <div className="lg:col-span-2 bg-white rounded-[3rem] p-10 shadow-sm border border-[#E9EDF7]/40 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#5D50D6]/5 rounded-full blur-[90px] -mr-32 -mt-32 transition-transform group-hover:scale-110"></div>
                  
                  <div className="flex items-center justify-between mb-10 relative z-10">
                      <div>
                          <h3 className="text-xl font-black text-[#2B3674]">Income Trajectory</h3>
                          <p className="text-[#A3AED0] text-[11px] font-bold uppercase tracking-widest mt-1">Real-time daily inflow</p>
                      </div>
                      <div className="flex bg-[#F4F7FE] p-1 rounded-xl border border-[#E9EDF7]">
                          <button className="px-5 py-2 rounded-lg bg-white shadow-sm text-[#5D50D6] font-black text-[10px] uppercase">Daily</button>
                          <button className="px-5 py-2 rounded-lg text-[#A3AED0] font-black text-[10px] uppercase">Monthly</button>
                      </div>
                  </div>

                  <div className="h-[280px] flex items-end justify-between px-4 pb-4 relative z-10">
                      {revenueData.map((d, idx) => (
                          <div key={idx} className="flex flex-col items-center gap-4 flex-1 group/bar">
                              <div className="relative w-full flex justify-center">
                                  <div 
                                    className="w-12 rounded-[1rem] bg-[#5D50D6]/10 group-hover/bar:bg-[#5D50D6]/20 transition-all duration-300 absolute inset-0 bottom-0 top-0 mb-[-30px]"
                                  ></div>
                                  <div 
                                    className="w-10 rounded-[1rem] bg-gradient-to-t from-[#5D50D6] to-[#7367F0] shadow-lg shadow-[#5D50D6]/10 transition-all duration-700 cursor-pointer relative z-10 group-hover/bar:brightness-110"
                                    style={{ height: `${(d.amount / maxRevenue) * 220}px` }}
                                  >
                                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#2B3674] text-white text-[10px] font-black px-3 py-2 rounded-xl opacity-0 group-hover/bar:opacity-100 transition-all -translate-y-2 group-hover/bar:translate-y-0 whitespace-nowrap shadow-2xl z-20">
                                          ₹{d.amount.toLocaleString()}
                                      </div>
                                  </div>
                              </div>
                              <span className="text-[11px] font-black text-[#A3AED0] mt-8">{d.date}</span>
                          </div>
                      ))}
                  </div>
              </div>

              {/* VEHICLE DISTRIBUTION (DONUT) */}
              <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-[#E9EDF7]/40 flex flex-col items-center">
                  <h3 className="text-lg font-black text-[#2B3674] w-full text-left mb-2">Category Split</h3>
                  <p className="text-[#A3AED0] text-[10px] font-black uppercase tracking-widest w-full text-left mb-10">Vehicle Inflow Bias</p>
                  
                  <div className="relative w-48 h-48 flex items-center justify-center mb-8">
                      <svg className="w-full h-full transform -rotate-90">
                          <circle cx="96" cy="96" r="80" fill="transparent" stroke="#F4F7FE" strokeWidth="18"/>
                          <circle 
                            cx="96" cy="96" r="80" fill="transparent" stroke="#5D50D6" strokeWidth="20" 
                            strokeDasharray={`${(vehicleDistribution.car / (vehicleDistribution.car + vehicleDistribution.bike || 1)) * 502} 502`}
                            strokeLinecap="round"
                          />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                          <div className="text-3xl font-black text-[#2B3674]">
                            {Math.round((vehicleDistribution.car / (vehicleDistribution.car + vehicleDistribution.bike || 1)) * 100)}%
                          </div>
                          <span className="text-[9px] font-black text-[#A3AED0] uppercase">4 Wheeler</span>
                      </div>
                  </div>

                  <div className="w-full space-y-4">
                      <DistributionRow label="Car (4W)" value={vehicleDistribution.car} color="#5D50D6" />
                      <DistributionRow label="Bike (2W)" value={vehicleDistribution.bike} color="#41D996" />
                  </div>
              </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
              
              {/* STATION PERFORMANCE TABLE */}
              <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-[#E9EDF7]/40">
                  <h3 className="text-xl font-black text-[#2B3674] mb-8">Top Revenue Generators</h3>
                  <div className="space-y-4">
                      {stationPerformance.slice(0, 5).map((station, i) => (
                          <div key={i} className="flex items-center justify-between p-5 bg-[#F4F7FE]/30 rounded-3xl border border-transparent hover:border-[#E9EDF7] transition-all group">
                              <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#2B3674] font-black shadow-sm group-hover:bg-[#5D50D6] group-hover:text-white transition-all">
                                      {i + 1}
                                  </div>
                                  <div>
                                      <div className="text-sm font-black text-[#2B3674]">{station.name}</div>
                                      <div className="text-[10px] font-bold text-[#A3AED0] uppercase tracking-widest">{station.count} Bookings</div>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <div className="text-sm font-black text-[#5D50D6]">₹{station.revenue.toLocaleString()}</div>
                                  <div className="text-[10px] font-black text-[#10B981]">MAX PROFIT</div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              {/* PEAK HOURS GRAPH */}
              <div className="bg-[#111C44] rounded-[3rem] p-10 shadow-xl border border-white/5 relative overflow-hidden group/dark">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-[#7367F0]/20 rounded-full blur-[100px] -mr-40 -mt-40"></div>
                  <h3 className="text-xl font-black text-white relative z-10">Time Vector Analysis</h3>
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mt-1 relative z-10 mb-10">Peak Session Loads</p>
                  
                  <div className="h-[240px] flex items-end justify-between px-2 pb-2 relative z-10">
                      {peakHours.map((h, i) => (
                          <div key={i} className="flex flex-col items-center gap-4 flex-1 group/pk">
                              <div 
                                className="w-2 mx-auto rounded-full bg-white/10 hover:bg-[#7367F0] transition-all duration-300 relative group-hover/pk:w-3"
                                style={{ height: `${(h.count / maxPeak) * 180}px` }}
                              >
                                  {i % 3 === 0 && <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-white/40 font-black text-[8px]">{h.count}</div>}
                              </div>
                              <span className="text-[8px] font-black text-white/30 uppercase group-hover/pk:text-white transition-all">{h.hour}</span>
                          </div>
                      ))}
                  </div>
                  
                  <div className="mt-8 flex items-center justify-between relative z-10 pt-6 border-t border-white/5">
                      <div className="flex flex-col">
                          <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Recommended Surge</span>
                          <div className="text-lg font-black text-[#41D996]">Optimal Control</div>
                      </div>
                      <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white/60">
                          <span className="material-symbols-outlined text-[20px]">dynamic_form</span>
                      </div>
                  </div>
              </div>
          </div>

      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black transition-all text-left ${active ? 'bg-[#5D50D6]/5 text-[#5D50D6]' : 'text-[#A3AED0] hover:bg-[#F4F7FE] hover:text-[#2B3674]'}`}>
        <span className={`material-symbols-outlined text-[24px] ${active ? 'fill-[1]' : ''}`} style={active ? { fontVariationSettings: "'FILL' 1" } : {}}>{icon}</span>
        <span className="text-[13px] tracking-tight">{label}</span>
    </button>
  );
}

function MetricCard({ label, value, icon, color, growth }) {
  const colors = {
    indigo: 'from-[#5D50D6] to-[#7367F0]',
    emerald: 'from-[#10B981] to-[#059669]',
    amber: 'from-[#F59E0B] to-[#D97706]',
    rose: 'from-[#FF5B5B] to-[#E11D48]'
  };
  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-[#E9EDF7]/30 flex flex-col justify-between group hover:shadow-xl hover:shadow-[#5D50D6]/5 transition-all">
        <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colors[color]} flex items-center justify-center text-white shadow-lg`}>
                <span className="material-symbols-outlined text-[24px]">{icon}</span>
            </div>
            <span className={`text-[10px] font-black tracking-widest ${growth.startsWith('+') ? 'text-[#10B981]' : 'text-[#A3AED0]'}`}>{growth}</span>
        </div>
        <div>
            <div className="text-[9px] font-black text-[#A3AED0] uppercase tracking-[0.15em] mb-1">{label}</div>
            <div className="text-3xl font-black text-[#2B3674] tracking-tighter">{value}</div>
        </div>
    </div>
  );
}

function DistributionRow({ label, value, color }) {
  return (
    <div className="w-full flex items-center justify-between p-4 bg-[#F4F7FE]/50 rounded-2xl">
        <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
            <span className="text-[11px] font-black text-[#2B3674] uppercase tracking-widest">{label}</span>
        </div>
        <span className="text-xs font-black text-[#2B3674]">{value}</span>
    </div>
  );
}
