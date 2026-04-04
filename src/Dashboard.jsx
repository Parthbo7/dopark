import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Real-time states
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Stations State
  const [stations, setStations] = useState([]);
  const [stationsLoading, setStationsLoading] = useState(true);

  // Profile Fetch
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (!error && data) {
            setProfile(data);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Stations Fetch with Nested Slots
  useEffect(() => {
    const fetchStations = async () => {
      try {
        const { data, error } = await supabase
          .from('parking_stations')
          .select(`
            *,
            parking_sections (
              parking_slots (*)
            )
          `);

        if (!error && data) {
          console.log("[Dashboard] Raw Stations Data:", data);
          
          if (data.length > 0 && (!data[0].parking_sections || data[0].parking_sections.length === 0)) {
            console.warn("[Dashboard] WARNING: No sections found for stations. Check RLS or relationships!");
          }

          const formattedStations = data.map(station => {
            let available4w = 0;
            let available2w = 0;
            
            const sections = station.parking_sections || [];
            sections.forEach(sec => {
              const slots = sec.parking_slots || [];
              slots.forEach(slot => {
                if (!slot.is_occupied) {
                  // Standardizing type check to be case/space insensitive just in case
                  const type = slot.vehicle_type?.toLowerCase().trim();
                  if (type === '4_wheeler' || type === '4wheeler') available4w++;
                  if (type === '2_wheeler' || type === '2wheeler') available2w++;
                }
              });
            });

            return {
              ...station,
              available4w,
              available2w,
              totalAvailable: available4w + available2w
            };
          });
          setStations(formattedStations);
        } else {
            console.error("[Dashboard] Supabase Fetch Error:", error);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setStationsLoading(false);
      }
    };
    
    fetchStations();
    
    // Optional: Realtime subscription for station slots could go here
    const subscription = supabase
      .channel('public:parking_slots:dashboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'parking_slots' },
        () => fetchStations() // re-fetch on any slot change
      )
      .subscribe();

    return () => {
        supabase.removeChannel(subscription);
    }
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="bg-surface-bright text-on-surface min-h-screen relative flex flex-col font-body md:flex-row overflow-hidden">
      
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-50 transition-opacity md:hidden" 
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar Panel */}
      <aside className={`fixed md:relative top-0 left-0 h-full w-[85%] md:w-80 max-w-sm bg-surface-bright z-50 md:z-10 transform transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none border-r border-outline-variant/20 flex flex-col overflow-y-auto custom-scrollbar ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="p-6 md:py-8 flex flex-col h-full">
           
           {/* Profile Header Block */}
           <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-teal-600 overflow-hidden shadow-lg border-2 border-surface shrink-0">
                  <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDSWWkzsQW9kTxfkfUgbn1-8xp1z31xi_U9P18fUu41MEHTQwFWDUyAZ2KrtiwRkBS0mgWsaWX8Rp2Y-T4NFwLiecce5xMovHZyHvnyIZGVDvnQba1WG_e5V4U4mGrqrgkBT_NiB9mef-5ydAZTqNKS76_Hwbd1LK8W4r4rtj0McBSAakWegCCu_W24orHPTxTQRWFWFM0l98I-NxE8oUQthNslVP4HqkCLM5rEEEHw5H31QcwqKK_4Yww4TRRWiTAvShZyu3jRK6I" alt="User" />
              </div>
              <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-on-surface truncate">
                     {loading ? "Loading..." : (profile?.full_name || "Guest User")}
                  </h2>
                  <p className="text-[#4a40e0] text-xs font-semibold">Premium Member</p>
              </div>
              <button className="md:hidden p-2 text-outline" onClick={toggleSidebar}>
                 <span className="material-symbols-outlined">close</span>
              </button>
           </div>

           <nav className="space-y-2 mb-6">
              <a href="#" className="flex items-center gap-4 bg-[#4a40e0]/5 text-[#4a40e0] p-3 rounded-xl font-semibold text-sm">
                 <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
                 Home
              </a>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/history'); }} className="flex items-center gap-4 text-on-surface-variant p-3 rounded-xl font-semibold text-sm hover:bg-surface-container-low transition cursor-pointer">
                 <span className="material-symbols-outlined">history</span>
                 Parking History
              </a>
           </nav>

           <a href="#" onClick={(e) => { e.preventDefault(); navigate('/my-cards'); }} className="flex items-center gap-4 text-on-surface p-3 mb-4 rounded-xl font-semibold text-sm hover:bg-surface-container-low transition cursor-pointer">
             <span className="material-symbols-outlined text-on-surface-variant">credit_card</span>
             My Cards
           </a>

           {/* Vehicle Card fetching from real DB */}
           <div className="bg-[#4a40e0] p-5 rounded-2xl shadow-[0_12px_24px_rgba(74,64,224,0.25)] relative overflow-hidden mb-6 group cursor-pointer hover:shadow-lg transition">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-white/20 transition duration-500"></div>
               <div className="flex justify-between items-start mb-4 relative z-10">
                   <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                       {profile?.vehicle_type === '2w' ? 'two_wheeler' : 'directions_car'}
                   </span>
                   <span className="bg-white/20 text-white text-[9px] font-bold px-2 py-1 rounded uppercase tracking-widest backdrop-blur-sm">Primary</span>
               </div>
               <h3 className="text-white text-xl font-extrabold tracking-widest drop-shadow-sm relative z-10">
                   {loading ? "..." : (profile?.vehicle_number || "NO VEHICLE")}
               </h3>
               <p className="text-white/80 text-xs mb-5 relative z-10">
                   {profile?.vehicle_type === '2w' ? 'Motorcycle (2W)' : 'Car (4W)'}
               </p>
               <div className="flex gap-3 relative z-10">
                  <button className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg font-bold text-xs flex justify-center items-center gap-1 transition-colors backdrop-blur-md">
                     <span className="material-symbols-outlined text-[14px]">sync_alt</span>
                     SWITCH
                  </button>
                  <button className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg font-bold text-xs flex justify-center items-center gap-1 transition-colors backdrop-blur-md">
                     <span className="material-symbols-outlined text-[14px]">add</span>
                     NEW
                  </button>
               </div>
           </div>

           <div className="mt-auto">
             <div className="mb-2 uppercase text-[10px] font-bold text-outline-variant tracking-widest px-3">More</div>
             <nav className="space-y-1">
                <a href="#" onClick={(e) => { e.preventDefault(); navigate('/active-booking'); }} className="flex items-center gap-4 text-on-surface-variant p-3 rounded-xl font-semibold text-sm hover:bg-surface-container-low transition">
                   <span className="material-symbols-outlined">receipt_long</span>
                   Active Booking
                </a>
                <a href="#" onClick={(e) => { e.preventDefault(); navigate('/notifications'); }} className="flex items-center justify-between text-on-surface-variant p-3 rounded-xl font-semibold text-sm hover:bg-surface-container-low transition">
                   <div className="flex items-center gap-4">
                      <span className="material-symbols-outlined">notifications</span>
                      Notifications
                   </div>
                   <div className="w-2 h-2 rounded-full bg-error"></div>
                </a>
                <button onClick={handleLogout} className="w-full flex items-center gap-4 text-error p-3 rounded-xl font-semibold text-sm hover:bg-error/10 transition mt-4">
                   <span className="material-symbols-outlined">logout</span>
                   Logout
                </button>
             </nav>
           </div>

        </div>
      </aside>

      {/* --- Main Content Area --- */}
      <div className="flex-1 flex flex-col relative w-full overflow-hidden h-screen">
        
        {/* Header - Mobile Only */}
        <header className="flex md:hidden items-center justify-between px-4 py-4 z-40 bg-surface-bright/80 backdrop-blur-md sticky top-0 border-b border-outline-variant/10">
          <button onClick={toggleSidebar} className="p-2 text-[#4a40e0] hover:bg-indigo-50 transition-colors rounded-xl active:scale-95 cursor-pointer">
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>
          
          <h1 className="text-xl font-extrabold text-[#4a40e0] tracking-tight">DoParking</h1>
          
          <button onClick={() => navigate('/notifications')} className="p-2 text-outline hover:bg-indigo-50 transition-colors rounded-xl relative">
             <span className="material-symbols-outlined">notifications</span>
             <div className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full outline outline-2 outline-surface-bright border-none"></div>
          </button>
        </header>

        {/* Map Area */}
        <main className="flex-1 relative w-full parking-map-pattern h-full flex flex-col overflow-hidden bg-surface-container-low">
          
          {/* Top Floating Search */}
          <div className="absolute top-4 md:top-8 left-0 right-0 px-4 flex justify-center z-30 pointer-events-none">
            <div className="relative w-full max-w-lg md:max-w-2xl flex items-center bg-surface-container-lowest shadow-lg shadow-indigo-500/10 rounded-2xl overflow-hidden pointer-events-auto border border-outline-variant/10 transition-shadow hover:shadow-xl">
              <span className="material-symbols-outlined text-on-surface-variant ml-5">search</span>
              <input 
                className="w-full bg-transparent border-none py-4 px-4 text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-0 md:text-base text-sm" 
                placeholder="Search parking location, city, or zip..." 
                type="text"
              />
              <button className="bg-[#4a40e0] hover:bg-[#3d34b8] transition-colors text-white p-3 rounded-xl mr-2 cursor-pointer shadow-md flex items-center justify-center">
                <span className="material-symbols-outlined sm:text-[20px]">mic</span>
              </button>
            </div>
          </div>

          {/* Map Grid Elements (Aesthetic Background) */}
          <div className="absolute inset-0 pointer-events-none z-0">
             <div className="w-full h-full bg-[radial-gradient(#ced5db_1px,transparent_1px)] [background-size:24px_24px] md:[background-size:40px_40px] opacity-60"></div>
          </div>

          {/* Active Marker in Center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center cursor-pointer transition-transform hover:scale-110">
              <div className="bg-[#4a40e0] text-white w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-2xl shadow-[#4a40e0]/40 border-2 border-white marker-pulse z-20">
                <span className="font-bold text-xl md:text-2xl">P</span>
              </div>
              <div className="w-4 h-4 md:w-5 md:h-5 bg-[#4a40e0] rotate-45 -mt-2 -md:mt-3 z-10"></div>
              <div className="absolute w-24 h-24 bg-[#4a40e0]/20 rounded-full animate-ping -z-10"></div>
          </div>

          {/* Zomato-Style Horizontally Scrolling Cards Container */}
          <div className="absolute bottom-[90px] md:bottom-12 w-full px-4 overflow-x-auto snap-x custom-scrollbar flex gap-4 z-20 pb-4">
             {stationsLoading ? (
                 <div className="w-[300px] bg-white rounded-2xl p-5 shadow-lg flex items-center justify-center min-h-[160px]">
                     <div className="animate-spin w-8 h-8 rounded-full border-4 border-[#4a40e0]/30 border-t-[#4a40e0]"></div>
                 </div>
             ) : (
                stations.map(station => (
                  <div key={station.station_id} className="min-w-[300px] max-w-[320px] bg-white rounded-[1.5rem] shadow-[0px_10px_30px_rgba(74,64,224,0.1)] p-4 snap-center border border-outline-variant/10 flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                          <h3 className="text-[17px] font-extrabold text-on-surface tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">{station.name}</h3>
                          <div className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg flex items-center gap-1 ml-2 shrink-0 border border-emerald-100">
                             <span className="font-bold text-[12px]">{station.rating}</span>
                             <span className="text-[10px]">★</span>
                          </div>
                      </div>
                      
                      <div className="text-on-surface-variant text-[12px] font-medium leading-tight mb-4 flex items-start gap-1">
                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                          <span className="truncate">{station.address}, {station.city}</span>
                      </div>

                      <div className="bg-[#f0effb] rounded-xl p-3 flex items-center gap-3 mb-4">
                         <div className="flex-1 flex flex-col items-center border-r border-[#4a40e0]/10">
                            <span className="text-[10px] text-outline-variant font-bold uppercase tracking-widest mb-0.5">4 Wheeler</span>
                            <span className={`font-extrabold text-lg ${station.available4w > 0 ? 'text-[#4a40e0]' : 'text-error'}`}>{station.available4w}</span>
                         </div>
                         <div className="flex-1 flex flex-col items-center">
                            <span className="text-[10px] text-outline-variant font-bold uppercase tracking-widest mb-0.5">2 Wheeler</span>
                            <span className={`font-extrabold text-lg ${station.available2w > 0 ? 'text-[#4a40e0]' : 'text-error'}`}>{station.available2w}</span>
                         </div>
                      </div>
                      
                      <button 
                         onClick={() => navigate('/booking', { state: { stationId: station.station_id, stationName: station.name, vehicleType: profile?.vehicle_type || '4w' } })} 
                         disabled={station.totalAvailable === 0}
                         className={`w-full py-3 rounded-[14px] text-white font-bold text-[13px] tracking-wide transition-all ${station.totalAvailable > 0 ? 'bg-gradient-to-r from-[#4a40e0] to-[#5D50D6] shadow-[0px_6px_15px_rgba(74,64,224,0.25)] hover:brightness-110 active:scale-95 cursor-pointer' : 'bg-surface-container-high text-outline cursor-not-allowed'}`}
                      >
                          {station.totalAvailable > 0 ? 'Book Slot Now' : 'Parking Full'}
                      </button>
                  </div>
                ))
             )}
          </div>

        </main>

        {/* --- BottomNavBar (Mobile Only) --- */}
        <nav className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] rounded-2xl bg-white/95 backdrop-blur-xl z-30 flex justify-around items-center px-1.5 py-2 shadow-2xl border border-outline-variant/15">
          <a className="flex flex-col items-center justify-center text-[#4a40e0] py-1.5 px-3 transition-all" href="#">
            <div className="bg-[#4a40e0]/10 p-1.5 rounded-xl mb-1 flex items-center justify-center">
               <span className="material-symbols-outlined text-[20px] block" style={{ fontVariationSettings: "'FILL' 1" }}>explore</span>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest">FIND</span>
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/history'); }} className="flex flex-col items-center justify-center text-on-surface-variant hover:text-[#4a40e0] transition-colors py-1.5 px-3 cursor-pointer">
            <span className="material-symbols-outlined text-[20px] mb-1.5">local_activity</span>
            <span className="text-[9px] font-bold uppercase tracking-widest">BOOKINGS</span>
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/my-cards'); }} className="flex flex-col items-center justify-center text-on-surface-variant hover:text-[#4a40e0] transition-colors py-1.5 px-3 cursor-pointer">
            <span className="material-symbols-outlined text-[20px] mb-1.5">account_balance_wallet</span>
            <span className="text-[9px] font-bold uppercase tracking-widest">WALLET</span>
          </a>
          <a className="flex flex-col items-center justify-center text-on-surface-variant hover:text-[#4a40e0] transition-colors py-1.5 px-3" href="#">
            <span className="material-symbols-outlined text-[20px] mb-1.5">person</span>
            <span className="text-[9px] font-bold uppercase tracking-widest">ACCOUNT</span>
          </a>
        </nav>
        
      </div>
    </div>
  );
}
