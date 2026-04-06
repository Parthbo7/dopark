import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabase';

export default function AdminUsers() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  
  // Verify Admin
  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdminLoggedIn');
    if (isAdmin !== 'true') {
      navigate('/admin/login');
    }
  }, [navigate]);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      console.log("Admin: Initializing User Sync...");
      
      try {
        // Fetch profiles joined with ALL columns of parking_cards
        const { data, error } = await supabase
          .from('profiles')
          .select(`
             *,
             parking_cards(*)
          `)
          .order('created_at', { ascending: false });
          
        if (error) {
           console.error("Supabase Error:", error);
           throw error;
        }
        
        if (data && data.length > 0) {
          console.log("Admin Trace - Raw Data Sample:", data[0]);
          console.log("Admin Trace - Cards found for user 0:", data[0].parking_cards);
        }
        
        if (data) setUsers(data);
        
      } catch (err) {
        console.error("Critical Fetch Error:", err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isAdminLoggedIn');
    localStorage.removeItem('adminEmail');
    navigate('/admin/login');
  };

  const totalMembers = users.length;
  // Estimate Active this hour based on updated_at or just dummy for UI metric mapping
  const activeThisHour = Math.floor(totalMembers * 0.15) || 0; 
  // Aggregated System Balance
  const totalSystemBalance = users.reduce((acc, user) => {
    const cards = user.parking_cards;
    const userCard = Array.isArray(cards) ? cards[0] : cards;
    return acc + (Number(userCard?.balance) || 0);
  }, 0);

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "--";
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

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
             <button onClick={() => navigate('/admin/analytics')} className="w-full flex items-center gap-4 px-5 py-4 text-[#A3AED0] hover:bg-[#F4F7FE] hover:text-[#2B3674] rounded-2xl font-bold transition-all text-left">
                <span className="material-symbols-outlined text-[24px]">bar_chart</span>
                <span className="text-[15px]">Analytics</span>
             </button>
             <button onClick={() => navigate('/admin/users')} className="w-full flex items-center gap-4 px-5 py-4 bg-[#F4F7FE] text-[#5D50D6] rounded-2xl font-bold transition-all text-left">
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
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
      <main className="ml-[300px] flex-1 flex flex-col min-h-screen relative p-8">
          
          {/* Top Navbar */}
          <header className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3 bg-white rounded-full px-5 py-3 w-[450px] shadow-sm">
                  <span className="material-symbols-outlined text-[#A3AED0]">search</span>
                  <input type="text" placeholder="Search members..." className="bg-transparent border-none outline-none w-full text-sm font-medium text-[#2B3674] placeholder:text-[#A3AED0]" />
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

          {/* Stats Section */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm mb-8 flex flex-col md:flex-row items-center gap-8 md:gap-4 relative overflow-hidden">
              <div className="flex-1 pr-6 z-10 w-full mb-4 md:mb-0">
                  <div className="flex justify-between items-start mb-2">
                       <h2 className="text-3xl font-black text-[#2B3674]">User Management</h2>
                       <button className="bg-[#4a40e0] hover:bg-[#3d33c4] text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95 md:hidden">
                           <span className="material-symbols-outlined text-[18px]">person_add</span>
                           Add
                       </button>
                  </div>
                  <p className="text-[#A3AED0] text-sm font-medium leading-relaxed max-w-md">Control and oversee the Luminous Smart Parking ecosystem. Manage member credentials, vehicle data, and digital DoCards in real-time.</p>
                  
                  <button className="bg-[#4a40e0] hover:bg-[#3d33c4] text-white font-bold text-sm px-6 py-3 rounded-xl shadow-lg shadow-[#4a40e0]/20 hidden md:flex items-center gap-2 transition-all active:scale-95 mt-6">
                      <span className="material-symbols-outlined text-[18px]">person_add</span>
                      Add New User
                  </button>
              </div>

              <div className="flex-1 flex items-center gap-4 z-10 w-full md:mt-0 mt-2">
                  <div className="flex-1 bg-[#F4F7FE] rounded-2xl p-6 border border-[#E9EDF7]">
                      <h4 className="text-[10px] font-black text-[#4a40e0] uppercase tracking-widest mb-1">Total Members</h4>
                      <div className="text-3xl font-bold text-[#2B3674]">{totalMembers.toLocaleString()}</div>
                  </div>
                  <div className="flex-1 bg-[#F4F7FE] rounded-2xl p-6 border border-[#E9EDF7]">
                      <h4 className="text-[10px] font-black text-[#A3AED0] uppercase tracking-widest mb-1">Active This Hour</h4>
                      <div className="text-3xl font-bold text-[#2B3674]">{activeThisHour}</div>
                  </div>
                  <div className="flex-1 bg-[#2B3674] rounded-2xl p-6 shadow-lg shadow-[#2B3674]/30 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                      <h4 className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-1 relative z-10">System DoCard Bal</h4>
                      <div className="text-3xl font-bold text-white relative z-10">₹{totalSystemBalance.toLocaleString()}</div>
                  </div>
              </div>
          </div>

          {/* Table Data */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-[#2B3674]">Current Members</h3>
                  <div className="flex gap-4 text-[#A3AED0]">
                      <span className="material-symbols-outlined cursor-pointer hover:text-[#2B3674] transition-colors">filter_list</span>
                      <span className="material-symbols-outlined cursor-pointer hover:text-[#2B3674] transition-colors">download</span>
                  </div>
              </div>

              {/* Table Header */}
              <div className="grid grid-cols-[2fr_1fr_2fr_1fr_1fr] bg-[#F4F7FE] rounded-lg px-6 py-4 mb-4">
                  <div className="text-[10px] font-black text-[#A3AED0] uppercase tracking-widest">Name & Contact</div>
                  <div className="text-[10px] font-black text-[#A3AED0] uppercase tracking-widest">Vehicle Details</div>
                  <div className="text-[10px] font-black text-[#A3AED0] uppercase tracking-widest">Email Address</div>
                  <div className="text-[10px] font-black text-[#A3AED0] uppercase tracking-widest">DoCard Balance</div>
                  <div className="text-[10px] font-black text-[#A3AED0] uppercase tracking-widest">Member Since</div>
              </div>

              {/* Table Body */}
              <div className="flex-1 space-y-2">
                  {loading ? (
                      <div className="flex justify-center py-20"><div className="animate-spin w-10 h-10 rounded-full border-4 border-[#4a40e0]/30 border-t-[#4a40e0]"></div></div>
                  ) : users.length === 0 ? (
                      <div className="text-center py-10 text-[#A3AED0] font-bold">No members found.</div>
                  ) : (
                      users.map((user, idx) => {
                          // Handle cases where parking_cards might be an array, an object, or null
                          const cards = user.parking_cards;
                          const userCard = Array.isArray(cards) ? cards[0] : cards;
                          const balance = userCard?.balance ?? 0;
                          
                          return (
                          <div key={user.id} className="grid grid-cols-[2fr_1fr_2fr_1fr_1fr] items-center px-6 py-4 hover:bg-[#F4F7FE]/50 border-b border-outline-variant/10 transition-colors">
                              
                              {/* Name & Contact */}
                              <div className="flex items-center gap-4">
                                  <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${idx % 3 === 0 ? 'bg-indigo-50 text-[#4a40e0]' : idx % 3 === 1 ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                                      {getInitials(user.full_name)}
                                  </div>
                                  <div>
                                      <div className="font-bold text-sm text-[#2B3674]">{user.full_name || 'Anonymous User'}</div>
                                      <div className="text-[11px] text-[#A3AED0] mt-0.5">{user.phone_number || 'N/A'}</div>
                                  </div>
                              </div>

                              {/* Vehicle */}
                              <div>
                                  <div className="font-black text-sm text-[#2B3674] tracking-wide">{user.vehicle_number || '--'}</div>
                                  <div className="text-[9px] font-bold uppercase tracking-widest text-[#A3AED0] mt-0.5">
                                      {user.vehicle_type ? user.vehicle_type.replace('_', ' ') : 'N/A'}
                                  </div>
                              </div>

                              {/* Email */}
                              <div className="text-sm font-medium text-[#A3AED0] truncate pr-4">
                                  {user.email}
                              </div>

                              {/* DoCard Bal */}
                              <div>
                                  <span className="bg-indigo-50 text-[#4a40e0] font-extrabold text-xs px-3 py-1.5 rounded-lg shadow-sm">
                                      ₹{Number(balance).toLocaleString()}
                                  </span>
                              </div>

                              {/* Member Since */}
                              <div className="text-sm font-medium text-[#A3AED0]">
                                  {formatDate(user.created_at)}
                              </div>
                          </div>
                      )})
                  )}
              </div>

              {/* Pagination Footer */}
              <div className="flex items-center justify-between mt-6 bg-[#F4F7FE] rounded-2xl px-6 py-4">
                  <span className="text-xs font-bold text-[#A3AED0]">Showing {users.length} members</span>
                  <div className="flex items-center gap-1 font-bold text-xs text-[#A3AED0]">
                     <button className="px-3 py-1.5 hover:text-[#2B3674] transition-colors">Previous</button>
                     <button className="w-8 h-8 rounded-lg bg-white text-[#4a40e0] shadow-sm flex items-center justify-center">1</button>
                     <button className="w-8 h-8 rounded-lg hover:bg-white/50 transition-colors flex items-center justify-center">2</button>
                     <button className="w-8 h-8 rounded-lg hover:bg-white/50 transition-colors flex items-center justify-center">3</button>
                     <button className="px-3 py-1.5 hover:text-[#2B3674] transition-colors">Next</button>
                  </div>
              </div>
          </div>
      </main>

    </div>
  );
}
