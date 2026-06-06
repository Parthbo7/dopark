import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from './supabase';
import { getUnreadCount, subscribeToNotifications } from './notificationService';

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Layout States
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [cardData, setCardData] = useState(null);
  const [activeBooking, setActiveBooking] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchProfileAndCard = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch Profile
      const { data: pData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (pData) setProfile(pData);

      // Fetch Card
      const { data: cData } = await supabase
        .from('parking_cards')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (cData) setCardData(cData);

      // Fetch Active Booking
      const { data: bData } = await supabase
        .from('bookings')
        .select(`
          *,
          parking_stations(name, address),
          parking_slots(slot_number)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('start_time', { ascending: false })
        .maybeSingle();
      setActiveBooking(bData);

      // Fetch Unread Notification Count
      const count = await getUnreadCount();
      setUnreadCount(count);

    } catch (err) {
      console.error('[MainLayout] Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndCard();

    // Subscribe to notification changes
    let notificationChannel;
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      notificationChannel = subscribeToNotifications(user.id, () => {
        // Increment unread count or refetch count
        setUnreadCount(prev => prev + 1);
      });

      // Also listen to bookings table updates for active booking state
      const bookingChannel = supabase
        .channel('layout-booking-monitor')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'bookings', filter: `user_id=eq.${user.id}` },
          () => {
            fetchProfileAndCard();
          }
        )
        .subscribe();

      return () => {
        if (notificationChannel) supabase.removeChannel(notificationChannel);
        supabase.removeChannel(bookingChannel);
      };
    };

    setupRealtime();
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem('doparking_guest_email');
    localStorage.removeItem('doparking_guest_password');
    await supabase.auth.signOut();
    setIsSidebarOpen(false);
    navigate('/');
  };

  const menuItems = [
    { label: 'Find Parking', path: '/dashboard', icon: 'explore' },
    { label: 'Parking History', path: '/history', icon: 'history' },
    { label: 'My Cards / Wallet', path: '/my-cards', icon: 'credit_card' },
    { label: 'Active booking', path: '/active-booking', icon: 'receipt_long', highlight: !!activeBooking },
    { label: 'Notifications', path: '/notifications', icon: 'notifications', badgeCount: unreadCount },
  ];

  // Helper to determine if link is active
  const isActive = (path) => location.pathname === path;

  // Sidebar content (rendered in static sidebar on desktop or sliding drawer on mobile)
  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800/50 p-6">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-2xl font-black">local_parking</span>
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-extrabold text-[#4a40e0] leading-none tracking-tight">Do Parking</span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Smart City</span>
        </div>
      </div>

      {/* User Card */}
      <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl mb-6 shadow-sm border border-slate-100/50 dark:border-slate-700/10">
        <div className="w-12 h-12 rounded-xl bg-primary/10 overflow-hidden shrink-0 border border-primary/20 flex items-center justify-center text-[#4a40e0]">
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-extrabold text-on-surface truncate">
            {loading ? 'Loading...' : (profile?.full_name || 'Guest User')}
          </h4>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] font-extrabold text-primary">₹{cardData?.balance || 0}</span>
            <span className="text-slate-300">•</span>
            <span className="text-[10px] text-slate-400 font-semibold truncate">{profile?.vehicle_number || 'No Vehicle'}</span>
          </div>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 space-y-1.5">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setIsSidebarOpen(false)}
            className={`flex items-center justify-between px-4 py-3.5 rounded-xl font-bold text-sm transition-all ${
              isActive(item.path)
                ? 'bg-primary/5 text-primary shadow-sm border-l-4 border-primary'
                : 'text-on-surface-variant hover:bg-slate-50 dark:hover:bg-slate-800/30 hover:text-on-surface'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <span 
                className={`material-symbols-outlined text-lg ${isActive(item.path) ? 'text-primary' : 'text-slate-400'}`}
                style={{ fontVariationSettings: isActive(item.path) ? "'FILL' 1" : undefined }}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </div>
            {item.badgeCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {item.badgeCount}
              </span>
            )}
            {item.highlight && (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            )}
          </Link>
        ))}
      </nav>

      {/* Footer / Reset Session */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-auto">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3.5 text-error px-4 py-3.5 rounded-xl font-bold text-sm hover:bg-error/5 dark:hover:bg-error/10 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">restart_alt</span>
          <span>Reset Session</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FE] text-on-surface flex flex-col lg:flex-row font-body relative overflow-x-hidden">
      
      {/* ── DESKTOP PERSISTENT SIDEBAR (>=1024px) ────────── */}
      <aside className="hidden lg:block lg:w-72 shrink-0 h-screen sticky top-0 z-40">
        {renderSidebarContent()}
      </aside>

      {/* ── MOBILE SLIDE-IN DRAWER (<1024px) ────────────── */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <aside 
        className={`fixed top-0 left-0 h-full w-[80%] max-w-sm z-50 transform transition-transform duration-300 ease-in-out shadow-2xl lg:hidden ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {renderSidebarContent()}
      </aside>

      {/* ── MAIN CONTENT LAYER ──────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen relative pb-16 md:pb-24 lg:pb-0 overflow-y-auto">
        
        {/* Mobile Header Bar (<1024px) */}
        <header className="lg:hidden flex items-center justify-between px-5 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/40 sticky top-0 z-30">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-[#4a40e0] hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>
          
          <Link to="/dashboard" className="text-xl font-extrabold text-[#4a40e0] tracking-tight flex items-center gap-1.5">
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>local_parking</span>
            DoParking
          </Link>
          
          <button 
            onClick={() => navigate('/notifications')}
            className="p-2 -mr-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition relative cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full outline outline-2 outline-white border-none"></span>
            )}
          </button>
        </header>

        {/* Dynamic Page Outlet with shared state */}
        <div className="flex-grow p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {loading ? (
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="animate-spin w-10 h-10 border-4 border-[#4a40e0]/30 border-t-[#4a40e0] rounded-full"></div>
            </div>
          ) : (
            <Outlet context={{ profile, cardData, activeBooking, unreadCount, fetchProfileAndCard }} />
          )}
        </div>

        {/* ── MOBILE/TABLET BOTTOM NAVIGATION (<768px) ─────── */}
        <nav className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl z-40 flex justify-around items-center px-2 py-2.5 shadow-[0px_10px_30px_rgba(74,64,224,0.12)] border border-slate-100 dark:border-slate-800/40">
          <button 
            onClick={() => navigate('/dashboard')}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
              isActive('/dashboard') ? 'text-[#4a40e0]' : 'text-slate-400'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isActive('/dashboard') ? "'FILL' 1" : undefined }}>explore</span>
            <span className="text-[9px] font-black tracking-widest">FIND</span>
          </button>
          
          <button 
            onClick={() => navigate('/active-booking')}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all relative ${
              isActive('/active-booking') ? 'text-[#4a40e0]' : 'text-slate-400'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isActive('/active-booking') ? "'FILL' 1" : undefined }}>receipt_long</span>
            <span className="text-[9px] font-black tracking-widest">ACTIVE</span>
            {activeBooking && (
              <span className="absolute top-1 right-3.5 w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
            )}
          </button>
          
          <button 
            onClick={() => navigate('/my-cards')}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
              isActive('/my-cards') ? 'text-[#4a40e0]' : 'text-slate-400'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isActive('/my-cards') ? "'FILL' 1" : undefined }}>credit_card</span>
            <span className="text-[9px] font-black tracking-widest">DOCARD</span>
          </button>
          
          <button 
            onClick={() => navigate('/history')}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
              isActive('/history') ? 'text-[#4a40e0]' : 'text-slate-400'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isActive('/history') ? "'FILL' 1" : undefined }}>history</span>
            <span className="text-[9px] font-black tracking-widest">HISTORY</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
