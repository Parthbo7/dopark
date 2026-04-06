import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabase';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalUsers: 0,
    activeSessions: 0,
    totalBookings: 0,
    occupancyRate: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [aiAutomation, setAiAutomation] = useState(true);
  const [spaceOptimisation, setSpaceOptimisation] = useState(false);

  // Verify Admin
  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdminLoggedIn');
    if (isAdmin !== 'true') {
      navigate('/admin/login');
    }
  }, [navigate]);

  // Fetch Dashboard Data
  useEffect(() => {
     // Whenever spaceOptimisation changes, theoretically we'd update `app_settings` 
     // and invoke the space optimization logic on the backend.
     if (spaceOptimisation) {
        supabase.rpc('run_dynamic_space_optimization').then(({ error }) => {
            if(error && error.code !== 'PGRST202') console.error("Optimization RPC Error:", error);
        });
     }
  }, [spaceOptimisation]);
  useEffect(() => {
    const fetchDashboardStats = async () => {
      setLoading(true);
      
      // 1. Total Revenue & Bookings
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('total_price, status');
      
      if (bookingsData) {
        const totalRev = bookingsData.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0);
        const active = bookingsData.filter(b => b.status === 'active').length;
        setStats(prev => ({ 
          ...prev, 
          totalRevenue: totalRev, 
          totalBookings: bookingsData.length,
          activeSessions: active
        }));
      }

      // 2. Total Users
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      if (userCount !== null) setStats(prev => ({ ...prev, totalUsers: userCount }));

      // 3. Occupancy Rate
      const { data: slotsData } = await supabase.from('parking_slots').select('is_occupied');
      if (slotsData) {
        const occupied = slotsData.filter(s => s.is_occupied).length;
        const rate = slotsData.length > 0 ? Math.round((occupied / slotsData.length) * 100) : 0;
        setStats(prev => ({ ...prev, occupancyRate: rate }));
      }

      // 4. Recent Activity (Join Profiles & Slots)
      const { data: recent } = await supabase
        .from('bookings')
        .select(`
          booking_id,
          total_price,
          status,
          start_time,
          vehicle_number,
          profiles (full_name),
          parking_slots (slot_number)
        `)
        .order('start_time', { ascending: false })
        .limit(6);
        
      if (recent) setRecentBookings(recent);

      setLoading(false);
    };

    fetchDashboardStats();

    // 5. Setup Realtime Sync for Live Updates
    const bookingsSubscription = supabase
      .channel('admin-bookings-update')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, (payload) => {
        console.log('Live Booking Change:', payload);
        fetchDashboardStats(); // Refresh stats and list on any change
      })
      .subscribe();

    const slotsSubscription = supabase
      .channel('admin-slots-update')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parking_slots' }, () => {
        fetchDashboardStats(); 
      })
      .subscribe();

    return () => {
      supabase.removeChannel(bookingsSubscription);
      supabase.removeChannel(slotsSubscription);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isAdminLoggedIn');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex font-body text-on-surface">
      
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
             <button onClick={() => navigate('/admin/dashboard')} className="w-full flex items-center gap-4 px-5 py-4 bg-[#F4F7FE] text-[#5D50D6] rounded-2xl font-bold transition-all text-left">
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>grid_view</span>
                <span className="text-[15px]">Dashboard</span>
             </button>
             <button onClick={() => navigate('/admin/slots')} className="w-full flex items-center gap-4 px-5 py-4 text-[#A3AED0] hover:bg-[#F4F7FE] hover:text-[#2B3674] rounded-2xl font-bold transition-all text-left">
                <span className="material-symbols-outlined text-[24px]">directions_car</span>
                <span className="text-[15px]">Slot Management</span>
             </button>
             <button onClick={() => navigate('/admin/analytics')} className="w-full flex items-center gap-4 px-5 py-4 text-[#A3AED0] hover:bg-[#F4F7FE] hover:text-[#2B3674] rounded-2xl font-bold transition-all text-left">
                <span className="material-symbols-outlined text-[24px]">bar_chart</span>
                <span className="text-[15px]">Analytics</span>
             </button>
             <button onClick={() => navigate('/admin/users')} className="w-full flex items-center gap-4 px-5 py-4 text-[#A3AED0] hover:bg-[#F4F7FE] hover:text-[#2B3674] rounded-2xl font-bold transition-all text-left">
                <span className="material-symbols-outlined text-[24px]">group</span>
                <span className="text-[15px]">User Control</span>
             </button>
              <button onClick={() => navigate('/admin/security')} className="w-full flex items-center gap-4 px-5 py-4 text-[#A3AED0] hover:bg-[#F4F7FE] hover:text-[#2B3674] rounded-2xl font-bold transition-all text-left">
                <span className="material-symbols-outlined text-[24px]">admin_panel_settings</span>
                <span className="text-[15px]">Security</span>
             </button>
         </nav>

         <div className="p-6 mt-auto">

             <button className="flex items-center gap-3 px-4 py-2 text-[#A3AED0] hover:text-[#2B3674] font-bold text-sm transition-colors mb-2">
                 <span className="material-symbols-outlined text-[20px]">help</span>
                 Support
             </button>
             <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2 text-[#A3AED0] hover:text-[#FF5B5B] font-bold text-sm transition-colors">
                 <span className="material-symbols-outlined text-[20px]">logout</span>
                 Logout
             </button>
         </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-[300px] flex-1 flex flex-col h-screen overflow-hidden">
          
          {/* Top Navbar */}
          <header className="h-[80px] bg-white border-b border-outline-variant/10 flex items-center justify-between px-8 py-4 z-10 shrink-0">
              <div className="flex items-center gap-4 bg-surface-container-lowest border border-outline-variant/20 rounded-full px-5 py-2.5 w-[400px] shadow-sm">
                  <span className="material-symbols-outlined text-on-surface-variant/50">search</span>
                  <input type="text" placeholder="Search parking area, slot, vehicle..." className="bg-transparent border-none outline-none w-full text-sm font-medium" />
              </div>

              <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-[#F4F7FE] px-4 py-2 rounded-full border border-[#E9EDF7]">
                      <div className="w-2 h-2 rounded-full bg-[#41D996] animate-pulse"></div>
                      <span className="text-[10px] text-[#2B3674] font-black uppercase tracking-widest">AI LIVE</span>
                  </div>
                  <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#A3AED0] hover:text-[#2B3674] shadow-sm"><span className="material-symbols-outlined">notifications</span></button>
                  <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#A3AED0] hover:text-[#2B3674] shadow-sm"><span className="material-symbols-outlined">settings</span></button>
                  <div className="flex items-center gap-3 ml-2 pl-4 border-l border-outline-variant/20">
                      <div className="text-right">
                          <div className="font-bold text-[#2B3674] text-sm">Admin Astra</div>
                          <div className="text-[10px] text-[#A3AED0] font-bold">System Manager</div>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#5D50D6] to-[#7158fe] p-[2px] shadow-sm">
                          <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                              <img src="https://i.pravatar.cc/150?u=astra" alt="Admin" className="w-full h-full object-cover" />
                          </div>
                      </div>
                  </div>
              </div>
          </header>

          {/* Dashboard Content */}
          <div className="flex-1 overflow-y-auto p-8">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                    <div className="animate-spin w-12 h-12 rounded-full border-4 border-[#5D50D6]/30 border-t-[#5D50D6]"></div>
                    <div className="text-[10px] font-black text-[#A3AED0] uppercase tracking-widest">Aggregating System Intelligence...</div>
                </div>
              ) : (
                <>
                  <div className="mb-10">
                      <h2 className="text-[28px] font-black text-[#2B3674] tracking-tight">System Overview</h2>
                      <p className="text-[#A3AED0] text-sm font-medium mt-1">Real-time performance metrics across all parking zones</p>
                  </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-[#E9EDF7]/50 flex flex-col gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#F4F7FE] text-[#5D50D6] flex items-center justify-center">
                          <span className="material-symbols-outlined text-[28px]">payments</span>
                      </div>
                      <div>
                          <div className="text-[10px] font-black text-[#A3AED0] uppercase tracking-widest mb-1">Total Revenue</div>
                          <div className="text-3xl font-black text-[#2B3674]">₹{stats.totalRevenue.toLocaleString()}</div>
                      </div>
                      <div className="text-[11px] font-bold text-[#41D996] flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">trending_up</span>
                          +12% from last month
                      </div>
                  </div>

                  <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-[#E9EDF7]/50 flex flex-col gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#F4F7FE] text-[#41D996] flex items-center justify-center">
                          <span className="material-symbols-outlined text-[28px]">group</span>
                      </div>
                      <div>
                          <div className="text-[10px] font-black text-[#A3AED0] uppercase tracking-widest mb-1">Registered Users</div>
                          <div className="text-3xl font-black text-[#2B3674]">{stats.totalUsers}</div>
                      </div>
                      <div className="text-[11px] font-bold text-[#41D996] flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">trending_up</span>
                          +{Math.round(stats.totalUsers * 0.05)} new this week
                      </div>
                  </div>

                  <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-[#E9EDF7]/50 flex flex-col gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#F4F7FE] text-[#7158fe] flex items-center justify-center">
                          <span className="material-symbols-outlined text-[28px]">sensors</span>
                      </div>
                      <div>
                          <div className="text-[10px] font-black text-[#A3AED0] uppercase tracking-widest mb-1">Active Sessions</div>
                          <div className="text-3xl font-black text-[#2B3674]">{stats.activeSessions}</div>
                      </div>
                      <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#41D996] animate-pulse"></div>
                          <span className="text-[11px] font-bold text-[#2B3674]">Live Monitoring</span>
                      </div>
                  </div>

                  <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-[#E9EDF7]/50 flex flex-col gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#F4F7FE] text-[#FFB547] flex items-center justify-center">
                          <span className="material-symbols-outlined text-[28px]">pie_chart</span>
                      </div>
                      <div>
                          <div className="text-[10px] font-black text-[#A3AED0] uppercase tracking-widest mb-1">Occupancy Rate</div>
                          <div className="text-3xl font-black text-[#2B3674]">{stats.occupancyRate}%</div>
                      </div>
                      <div className="w-full h-1.5 bg-[#F4F7FE] rounded-full overflow-hidden mt-1">
                          <div className="h-full bg-[#FF5B5B] rounded-full" style={{ width: `${stats.occupancyRate}%` }}></div>
                      </div>
                  </div>
              </div>

              {/* Charts & Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Recent Activity Table */}
                  <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-sm border border-[#E9EDF7]/30">
                      <div className="flex items-center justify-between mb-8">
                          <h3 className="text-xl font-bold text-[#2B3674]">Recent Activity</h3>
                          <button onClick={() => navigate('/admin/slots')} className="text-[#5D50D6] text-xs font-black uppercase tracking-widest hover:underline">View All Slots</button>
                      </div>

                      <div className="overflow-x-auto">
                          <table className="w-full text-left">
                              <thead>
                                  <tr className="border-b border-[#E9EDF7]">
                                      <th className="pb-4 text-[10px] font-black text-[#A3AED0] uppercase tracking-widest">User / Vehicle</th>
                                      <th className="pb-4 text-[10px] font-black text-[#A3AED0] uppercase tracking-widest">Slot</th>
                                      <th className="pb-4 text-[10px] font-black text-[#A3AED0] uppercase tracking-widest">Time</th>
                                      <th className="pb-4 text-[10px] font-black text-[#A3AED0] uppercase tracking-widest">Amount</th>
                                      <th className="pb-4 text-[10px] font-black text-[#A3AED0] uppercase tracking-widest">Status</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-[#F4F7FE]">
                                  {recentBookings.map((b, idx) => (
                                      <tr key={b.booking_id || idx} className="hover:bg-[#F4F7FE]/30 transition-colors">
                                          <td className="py-5">
                                              <div className="font-bold text-[#2B3674] text-sm">{b.profiles?.full_name || 'Guest User'}</div>
                                              <div className="text-[11px] text-[#A3AED0] font-medium">{b.vehicle_number}</div>
                                          </td>
                                          <td className="py-5">
                                              <div className="w-10 h-10 rounded-xl bg-[#F4F7FE] flex items-center justify-center font-black text-[#5D50D6] text-sm border border-[#E9EDF7]">
                                                  {b.parking_slots?.slot_number}
                                              </div>
                                          </td>
                                          <td className="py-5">
                                              <div className="text-sm font-medium text-[#2B3674]">{new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                              <div className="text-[10px] text-[#A3AED0] font-bold">{new Date(b.start_time).toLocaleDateString()}</div>
                                          </td>
                                          <td className="py-5">
                                              <div className="font-black text-[#2B3674]">₹{b.total_price || '--'}</div>
                                          </td>
                                          <td className="py-5 text-right">
                                              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                  b.status === 'active' ? 'bg-[#ECFDF5] text-[#10B981]' : 'bg-[#F4F7FE] text-[#A3AED0]'
                                              }`}>{b.status}</span>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>

                  {/* Operational Health / Quick Actions */}
                  <div className="flex flex-col gap-8">
                       <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-[#E9EDF7]/30 flex-1">
                          <h3 className="text-xl font-bold text-[#2B3674] mb-8">Zone Performance</h3>
                          <div className="space-y-6">
                              {[
                                  { name: 'North Wing (A)', level: 85, color: '#5D50D6' },
                                  { name: 'South Wing (B)', level: 42, color: '#41D996' },
                                  { name: 'Basement Level', level: 12, color: '#7158fe' },
                                ] .map(zone => (
                                  <div key={zone.name}>
                                      <div className="flex justify-between text-[11px] font-bold mb-2">
                                          <span className="text-[#2B3674]">{zone.name}</span>
                                          <span className="text-[#A3AED0]">{zone.level}% Full</span>
                                      </div>
                                      <div className="w-full h-2 bg-[#F4F7FE] rounded-full overflow-hidden">
                                          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${zone.level}%`, backgroundColor: zone.color }}></div>
                                      </div>
                                  </div>
                              ))}
                          </div>

                          <div className="mt-10 p-6 bg-[#F4F7FE] rounded-3xl border border-[#E9EDF7]">
                             <div className="font-bold text-[#2B3674] text-xs uppercase tracking-widest mb-6">System Controls</div>
                             <div className="flex flex-col gap-5">
                               <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                     <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-[#5D50D6]">
                                        <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                                     </div>
                                     <span className="text-sm font-bold text-[#2B3674]">AI Automation</span>
                                  </div>
                                  <div 
                                    onClick={() => setAiAutomation(!aiAutomation)} 
                                    className={`w-12 h-6 rounded-full flex items-center p-0.5 cursor-pointer transition-colors ${aiAutomation ? 'bg-[#5D50D6]' : 'bg-slate-300'}`}
                                  >
                                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${aiAutomation ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                  </div>
                               </div>
                               <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                     <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-[#5D50D6]">
                                        <span className="material-symbols-outlined text-[16px]">dashboard_customize</span>
                                     </div>
                                     <span className="text-sm font-bold text-[#2B3674]">Space Optimisation</span>
                                  </div>
                                  <div 
                                    onClick={() => setSpaceOptimisation(!spaceOptimisation)} 
                                    className={`w-12 h-6 rounded-full flex items-center p-0.5 cursor-pointer transition-colors ${spaceOptimisation ? 'bg-[#5D50D6]' : 'bg-slate-300'}`}
                                  >
                                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${spaceOptimisation ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                  </div>
                               </div>
                             </div>
                          </div>
                       </div>
                  </div>

              </div>
                </>
              )}
              
          </div>
      </main>

    </div>
  );
}
