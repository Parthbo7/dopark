import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminSecurity() {
  const navigate = useNavigate();
  const [isLockdown, setIsLockdown] = useState(false);

  // Verify Admin
  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdminLoggedIn');
    if (isAdmin !== 'true') {
      navigate('/admin/login');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex font-body text-on-surface">
      
      {/* Sidebar */}
      <aside className="w-[300px] bg-white h-screen flex flex-col fixed left-0 top-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-50">
         <div className="p-8 pb-4">
            <h1 className="text-[#5D50D6] font-black text-[22px] leading-tight">Luminous Park</h1>
            <p className="text-[#A3AED0] text-[10px] font-black uppercase tracking-[0.1em] mt-1">Admin Terminal</p>
         </div>
         
         <nav className="flex-1 px-6 space-y-1 mt-6">
             <button onClick={() => navigate('/admin/dashboard')} className="w-full flex items-center gap-4 px-5 py-4 text-[#A3AED0] hover:bg-[#F4F7FE] hover:text-[#2B3674] rounded-[20px] font-bold transition-all text-left">
                <span className="material-symbols-outlined text-[24px]">grid_view</span>
                <span className="text-[15px]">Dashboard</span>
             </button>
             <button onClick={() => navigate('/admin/slots')} className="w-full flex items-center gap-4 px-5 py-4 text-[#A3AED0] hover:bg-[#F4F7FE] hover:text-[#2B3674] rounded-[20px] font-bold transition-all text-left">
                <span className="material-symbols-outlined text-[24px]">image</span>
                <span className="text-[15px]">Slot Management</span>
             </button>
             <button onClick={() => navigate('/admin/analytics')} className="w-full flex items-center gap-4 px-5 py-4 text-[#A3AED0] hover:bg-[#F4F7FE] hover:text-[#2B3674] rounded-[20px] font-bold transition-all text-left">
                <span className="material-symbols-outlined text-[24px]">payments</span>
                <span className="text-[15px]">Revenue</span>
             </button>
             <button onClick={() => navigate('/admin/users')} className="w-full flex items-center gap-4 px-5 py-4 text-[#A3AED0] hover:bg-[#F4F7FE] hover:text-[#2B3674] rounded-[20px] font-bold transition-all text-left">
                <span className="material-symbols-outlined text-[24px]">group</span>
                <span className="text-[15px]">Users</span>
             </button>
             <div className="py-2">
                 <div className="w-full h-[1px] bg-[#E9EDF7]"></div>
             </div>
             <button className="w-full flex items-center gap-4 px-5 py-4 bg-[#EEF2FF] text-[#5D50D6] border-l-[3px] border-[#5D50D6] rounded-r-[20px] font-bold transition-all text-left ml-[-24px] pl-[41px]">
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
                <span className="text-[15px]">Security Breach System</span>
             </button>
         </nav>

         <div className="p-6 mt-auto">
             <button 
                onClick={() => setIsLockdown(!isLockdown)}
                className={`w-full font-bold text-[14px] py-3.5 rounded-[16px] shadow-sm hover:brightness-110 transition-all mb-6 ${isLockdown ? 'bg-[#10B981] text-white' : 'bg-[#C81E1E] text-white'}`}
             >
                 {isLockdown ? 'Lift Lockout' : 'Emergency Lockout'}
             </button>
         </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-[300px] flex-1 flex flex-col min-h-screen">
          
          {/* Top Navbar */}
          <header className="h-[80px] bg-white border-b border-[#E9EDF7] flex items-center justify-between px-8 py-4 z-10 sticky top-0">
              <div className="flex items-center gap-12 flex-1">
                  <h1 className="text-[20px] font-black text-[#5D50D6] tracking-tight">Security Monitor</h1>
                  
                  <div className="flex items-center gap-3 bg-[#F4F7FE] rounded-full px-5 py-2.5 w-[360px] border border-transparent focus-within:border-[#5D50D6]/30 transition-all">
                      <span className="material-symbols-outlined text-[#A3AED0] text-[20px]">search</span>
                      <input type="text" placeholder="Search alert, slot, vehicle number..." className="bg-transparent border-none outline-none w-full text-sm font-medium text-[#2B3674] placeholder:text-[#A3AED0]" />
                  </div>
              </div>

              <div className="flex items-center gap-5">
                  <div className="flex items-center gap-2 bg-[#EEF2FF] px-3.5 py-1.5 rounded-full">
                      <div className="w-2 h-2 rounded-full bg-[#5D50D6]"></div>
                      <span className="text-[10px] text-[#5D50D6] font-black uppercase tracking-wider">AI LIVE</span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-[#707EAE]">
                      <button className="hover:text-[#2B3674] transition-colors relative">
                          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>notifications</span>
                          <span className="absolute 1 top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                      </button>
                      <button className="hover:text-[#2B3674] transition-colors">
                          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>local_police</span>
                      </button>
                      <button className="hover:text-[#2B3674] transition-colors">
                          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>help</span>
                      </button>
                  </div>
              </div>
          </header>

          {isLockdown && (
              <div className="bg-[#C81E1E] text-white py-3 px-8 flex items-center justify-between shrink-0 shadow-md">
                  <div className="font-bold flex items-center gap-3">
                      <span className="material-symbols-outlined text-[24px]">warning</span>
                      <span className="tracking-wide">FACILITY IN EMERGENCY LOCKDOWN</span>
                  </div>
                  <div className="text-sm font-medium opacity-90">All gates locked. Security teams deployed. Automated systems on high alert.</div>
              </div>
          )}

          <div className="p-8 flex gap-8">
              
              {/* Left Column */}
              <div className="flex-[2] flex flex-col gap-8">
                  
                  {/* Live Security Alerts */}
                  <div className="bg-white rounded-[24px] p-8 shadow-sm">
                      <div className="flex justify-between items-center mb-8">
                          <h2 className="text-[22px] font-bold text-[#1c1b1f]">Live Security Alerts</h2>
                          <div className="flex gap-3">
                              <span className="bg-[#F0F2F5] text-[#2B3674] text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-md">ALL ALERTS</span>
                              <span className="bg-[#FFE5E5] text-[#C81E1E] text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-md">12 UNRESOLVED</span>
                          </div>
                      </div>

                      <table className="w-full text-sm text-left">
                          <thead className="text-[10px] text-[#A3AED0] uppercase font-bold tracking-wider border-b border-[#F0F2F5]">
                              <tr>
                                  <th className="pb-4 font-bold">ID</th>
                                  <th className="pb-4 font-bold">TIME</th>
                                  <th className="pb-4 font-bold">VEHICLE</th>
                                  <th className="pb-4 font-bold">SECTOR/GATE</th>
                                  <th className="pb-4 font-bold">BREACH TYPE</th>
                                  <th className="pb-4 font-bold">SEVERITY</th>
                                  <th className="pb-4 font-bold">STATUS</th>
                                  <th className="pb-4"></th>
                              </tr>
                          </thead>
                          <tbody>
                              <tr className="border-b border-[#F0F2F5] last:border-0 hover:bg-[#F8F9FD] transition-colors">
                                  <td className="py-5 font-medium text-[#707EAE]">#9421</td>
                                  <td className="py-5 font-medium text-[#2B3674]">14:22:05</td>
                                  <td className="py-5 font-bold text-[#2B3674]">ABC-<br/>1234</td>
                                  <td className="py-5 font-medium text-[#707EAE]">Gate A</td>
                                  <td className="py-5 font-medium text-[#2B3674]">Barrier<br/>Forced Open</td>
                                  <td className="py-5">
                                      <span className="bg-[#FFE5E5] text-[#C81E1E] text-[10px] font-bold uppercase px-2.5 py-1 rounded-full">CRITICAL</span>
                                  </td>
                                  <td className="py-5">
                                      <div className="flex items-center gap-2">
                                          <div className="w-1.5 h-1.5 rounded-full bg-[#C81E1E]"></div>
                                          <span className="font-semibold text-[#2B3674]">New</span>
                                      </div>
                                  </td>
                                  <td className="py-5 text-right opacity-50"><span className="material-symbols-outlined text-[#5D50D6]">pause</span></td>
                              </tr>
                              <tr className="border-b border-[#F0F2F5] last:border-0 hover:bg-[#F8F9FD] transition-colors">
                                  <td className="py-5 font-medium text-[#707EAE]">#9418</td>
                                  <td className="py-5 font-medium text-[#2B3674]">14:15:30</td>
                                  <td className="py-5 font-bold text-[#2B3674]">XYZ-<br/>9876</td>
                                  <td className="py-5 font-medium text-[#707EAE]">B2 Entry</td>
                                  <td className="py-5 font-medium text-[#2B3674]">ANPR<br/>Mismatch</td>
                                  <td className="py-5">
                                      <span className="bg-[#F4EBFF] text-[#9333EA] text-[10px] font-bold uppercase px-2.5 py-1 rounded-full">HIGH</span>
                                  </td>
                                  <td className="py-5">
                                      <div className="flex items-center gap-2">
                                          <div className="w-1.5 h-1.5 rounded-full bg-[#5D50D6]"></div>
                                          <span className="font-semibold text-[#2B3674]">Under<br/>Review</span>
                                      </div>
                                  </td>
                                  <td className="py-5 text-right opacity-0 hover:opacity-50"><span className="material-symbols-outlined text-[#5D50D6]">more_vert</span></td>
                              </tr>
                              <tr className="border-b border-[#F0F2F5] last:border-0 hover:bg-[#F8F9FD] transition-colors">
                                  <td className="py-5 font-medium text-[#707EAE]">#9412</td>
                                  <td className="py-5 font-medium text-[#2B3674]">14:02:11</td>
                                  <td className="py-5 font-bold text-[#2B3674]">JKL-<br/>5521</td>
                                  <td className="py-5 font-medium text-[#707EAE]">VIP Sector</td>
                                  <td className="py-5 font-medium text-[#2B3674]">Unauthorized<br/>Entry</td>
                                  <td className="py-5">
                                      <span className="bg-[#F4EBFF] text-[#9333EA] text-[10px] font-bold uppercase px-2.5 py-1 rounded-full">HIGH</span>
                                  </td>
                                  <td className="py-5">
                                      <div className="flex items-center gap-2">
                                          <div className="w-1.5 h-1.5 rounded-full bg-[#C81E1E]"></div>
                                          <span className="font-semibold text-[#2B3674]">New</span>
                                      </div>
                                  </td>
                                  <td className="py-5 text-right opacity-50"><span className="material-symbols-outlined text-[#5D50D6]">more_vert</span></td>
                              </tr>
                              <tr className="border-b border-[#F0F2F5] last:border-0 hover:bg-[#F8F9FD] transition-colors">
                                  <td className="py-5 font-medium text-[#707EAE]">#9405</td>
                                  <td className="py-5 font-medium text-[#2B3674]">13:45:12</td>
                                  <td className="py-5 font-bold text-[#2B3674]">MNO-<br/>4432</td>
                                  <td className="py-5 font-medium text-[#707EAE]">Mall Entry</td>
                                  <td className="py-5 font-medium text-[#2B3674]">Suspicious<br/>Re-entry</td>
                                  <td className="py-5">
                                      <span className="bg-[#E9EDF7] text-[#707EAE] text-[10px] font-bold uppercase px-2.5 py-1 rounded-full">MEDIUM</span>
                                  </td>
                                  <td className="py-5">
                                      <div className="flex items-center gap-2">
                                          <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></div>
                                          <span className="font-semibold text-[#707EAE]">Resolved</span>
                                      </div>
                                  </td>
                                  <td className="py-5 text-right opacity-0 hover:opacity-50"><span className="material-symbols-outlined text-[#5D50D6]">more_vert</span></td>
                              </tr>
                          </tbody>
                      </table>
                  </div>

                  {/* Incident HeatZones */}
                  <div className="bg-white rounded-[24px] p-8 shadow-sm">
                      <h2 className="text-[20px] font-bold text-[#1c1b1f] mb-6">Incident HeatZones</h2>
                      <div className="grid grid-cols-3 gap-5">
                          <div className="bg-[#F8F9FD] rounded-[16px] p-6 flex flex-col items-center gap-3 border border-transparent hover:border-[#F0F2F5] transition-colors">
                              <span className="text-[10px] font-bold text-[#707EAE] uppercase tracking-wider">GATE A</span>
                              <span className="material-symbols-outlined text-[#C81E1E] text-[32px] font-bold">asterisk</span>
                              <span className="text-[11px] font-bold text-[#C81E1E] uppercase tracking-wider">CRITICAL</span>
                          </div>
                          <div className="bg-[#F8F9FD] rounded-[16px] p-6 flex flex-col items-center gap-3 border border-transparent hover:border-[#F0F2F5] transition-colors">
                              <span className="text-[10px] font-bold text-[#707EAE] uppercase tracking-wider">GATE B</span>
                              <span className="material-symbols-outlined text-[#4318FF] text-[32px] font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                              <span className="text-[11px] font-bold text-[#4318FF] uppercase tracking-wider">SAFE</span>
                          </div>
                          <div className="bg-[#F8F9FD] rounded-[16px] p-6 flex flex-col items-center gap-3 border border-transparent hover:border-[#F0F2F5] transition-colors">
                              <span className="text-[10px] font-bold text-[#707EAE] uppercase tracking-wider">MALL ENTRY</span>
                              <span className="material-symbols-outlined text-[#9333EA] text-[32px] font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                              <span className="text-[11px] font-bold text-[#9333EA] uppercase tracking-wider">WARNING</span>
                          </div>
                          <div className="bg-[#F8F9FD] rounded-[16px] p-6 flex flex-col items-center gap-3 border border-transparent hover:border-[#F0F2F5] transition-colors">
                              <span className="text-[10px] font-bold text-[#707EAE] uppercase tracking-wider">B1 PARKING</span>
                              <span className="material-symbols-outlined text-[#4318FF] text-[32px] font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                              <span className="text-[11px] font-bold text-[#4318FF] uppercase tracking-wider">SAFE</span>
                          </div>
                          <div className="bg-[#F8F9FD] rounded-[16px] p-6 flex flex-col items-center gap-3 border border-transparent hover:border-[#F0F2F5] transition-colors">
                              <span className="text-[10px] font-bold text-[#707EAE] uppercase tracking-wider">B2 PARKING</span>
                              <span className="material-symbols-outlined text-[#4318FF] text-[32px] font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                              <span className="text-[11px] font-bold text-[#4318FF] uppercase tracking-wider">SAFE</span>
                          </div>
                          <div className="bg-[#F8F9FD] rounded-[16px] p-6 flex flex-col items-center gap-3 border border-transparent hover:border-[#F0F2F5] transition-colors">
                              <span className="text-[10px] font-bold text-[#707EAE] uppercase tracking-wider">VIP AREA</span>
                              <span className="material-symbols-outlined text-[#9333EA] text-[32px] font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                              <span className="text-[11px] font-bold text-[#9333EA] uppercase tracking-wider">WARNING</span>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Right Column */}
              <div className="flex-1 flex flex-col gap-6">
                  
                  {/* Security Status */}
                  <div className="bg-gradient-to-br from-[#6C5EE6] to-[#4318FF] rounded-[24px] p-8 text-white shadow-lg overflow-hidden relative">
                      <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-bl-[100px] blur-xl font-bold"></div>
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-tr-[100px] blur-lg font-bold"></div>
                      
                      <div className="flex justify-between items-center mb-8 relative z-10">
                          <h2 className="text-[20px] font-medium tracking-wide">Security Status</h2>
                          <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-md">
                              <div className="w-1.5 h-1.5 bg-[#FFCE20] rounded-full"></div>
                              LIVE
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 relative z-10">
                          <div className="bg-white/10 p-5 rounded-[16px] backdrop-blur-sm border border-white/10">
                              <div className="text-[10px] uppercase tracking-widest font-bold text-white/70 mb-1">TOTAL TODAY</div>
                              <div className="text-[32px] font-semibold leading-tight">142</div>
                          </div>
                          <div className="bg-white/10 p-5 rounded-[16px] backdrop-blur-sm border border-white/10">
                              <div className="text-[10px] uppercase tracking-widest font-bold text-white/70 mb-1">CRITICAL</div>
                              <div className="text-[32px] font-semibold leading-tight">08</div>
                          </div>
                          <div className="bg-[#5D50D6]/80 p-5 rounded-[16px] backdrop-blur-sm border border-white/10">
                              <div className="text-[10px] uppercase tracking-widest font-bold text-white/70 mb-1">UNAUTHORIZED</div>
                              <div className="text-[32px] font-semibold leading-tight">24</div>
                          </div>
                          <div className="bg-white/10 p-5 rounded-[16px] backdrop-blur-sm border border-white/10">
                              <div className="text-[10px] uppercase tracking-widest font-bold text-white/70 mb-1">RESOLVED</div>
                              <div className="text-[32px] font-semibold leading-tight">118</div>
                          </div>
                      </div>
                  </div>

                  {/* Quick Response Actions */}
                  <div className="bg-white rounded-[24px] p-8 shadow-sm">
                      <h2 className="text-[16px] font-bold text-[#1c1b1f] mb-6">Quick Response Actions</h2>
                      <div className="grid grid-cols-2 gap-4">
                          <button className="bg-[#FFE5E5] text-[#C81E1E] flex flex-col items-center justify-center p-5 rounded-[16px] gap-2 hover:brightness-95 transition-all">
                              <span className="material-symbols-outlined">door_front</span>
                              <span className="text-[12px] font-bold">Lock Gate</span>
                          </button>
                          <button className="bg-[#EEF2FF] text-[#4318FF] flex flex-col items-center justify-center p-5 rounded-[16px] gap-2 hover:brightness-95 transition-all">
                              <span className="material-symbols-outlined">group</span>
                              <span className="text-[12px] font-bold">Send Team</span>
                          </button>
                          <button className="bg-[#F8F9FD] text-[#5D50D6] flex flex-col items-center justify-center p-5 rounded-[16px] gap-2 hover:brightness-95 transition-all">
                              <span className="material-symbols-outlined">flag</span>
                              <span className="text-[12px] font-bold">Flag Vehicle</span>
                          </button>
                          <button className="bg-[#F0FDF4] text-[#10B981] flex flex-col items-center justify-center p-5 rounded-[16px] gap-2 hover:brightness-95 transition-all">
                              <span className="material-symbols-outlined">check_circle</span>
                              <span className="text-[12px] font-bold text-center">Mark Resolved</span>
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      </main>
    </div>
  );
}
