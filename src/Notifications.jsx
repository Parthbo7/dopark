import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabase';
import { fetchNotifications, markAsRead, markAllAsRead, subscribeToNotifications } from './notificationService';

// Icon + color mapping per notification type
const TYPE_CONFIG = {
  booking:    { color: 'bg-indigo-50  text-[#4a40e0]', ring: 'border-[#4a40e0]/20' },
  payment:    { color: 'bg-emerald-50 text-emerald-600', ring: 'border-emerald-200/40' },
  session:    { color: 'bg-amber-50   text-amber-600', ring: 'border-amber-200/40' },
  entry_exit: { color: 'bg-sky-50     text-sky-600', ring: 'border-sky-200/40' },
  alert:      { color: 'bg-red-50     text-red-500', ring: 'border-red-200/40' },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

export default function Notifications() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const tabs = ['All', 'Booking', 'Payment', 'Session', 'Alerts'];
  const tabTypeMap = { All: null, Booking: 'booking', Payment: 'payment', Session: 'session', Alerts: ['alert', 'entry_exit'] };

  // Fetch on mount
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchNotifications(100);
      setNotifications(data);
      setUnreadCount(data.filter(n => n.status === 'unread').length);
      setLoading(false);
    };
    load();
  }, []);

  // Realtime subscription
  useEffect(() => {
    let channel;
    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      channel = subscribeToNotifications(user.id, (newNotif) => {
        setNotifications(prev => [newNotif, ...prev]);
        setUnreadCount(prev => prev + 1);
      });
    };
    setup();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })));
    setUnreadCount(0);
  };

  const handleNotificationClick = async (notif) => {
    if (notif.status === 'unread') {
      await markAsRead(notif.id);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, status: 'read' } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    if (notif.action_url) navigate(notif.action_url);
  };

  // Filter
  const filtered = notifications.filter(n => {
    const mapping = tabTypeMap[activeTab];
    if (!mapping) return true;
    if (Array.isArray(mapping)) return mapping.includes(n.type);
    return n.type === mapping;
  });

  // Group by date
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const grouped = { today: [], yesterday: [], older: [] };
  filtered.forEach(n => {
    const d = new Date(n.created_at).toDateString();
    if (d === today) grouped.today.push(n);
    else if (d === yesterday) grouped.yesterday.push(n);
    else grouped.older.push(n);
  });

  return (
    <div className="bg-[#F8F9FE] min-h-screen text-[#1c1b1f] flex flex-col font-body pb-24">

      {/* ── HEADER ──────────────────────────────────── */}
      <header className="bg-gradient-to-r from-[#5D50D6] to-[#6C63FF] rounded-b-[2rem] pt-6 pb-10 px-5 text-white relative z-10 w-full max-w-md mx-auto md:max-w-2xl shadow-lg">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white/10 rounded-xl transition">
            <span className="material-symbols-outlined text-white">arrow_back</span>
          </button>
          <h1 className="text-[17px] font-extrabold tracking-tight">Notifications</h1>
          <button onClick={handleMarkAllRead} className="p-2 hover:bg-white/10 rounded-xl transition" title="Mark all read">
            <span className="material-symbols-outlined text-white text-xl">done_all</span>
          </button>
        </div>
        {unreadCount > 0 && (
          <div className="mt-3 text-center">
            <span className="bg-white/20 text-white text-[11px] font-bold px-3 py-1 rounded-full">{unreadCount} unread</span>
          </div>
        )}
      </header>

      {/* ── MAIN ──────────────────────────────────── */}
      <main className="flex-1 w-full max-w-md mx-auto md:max-w-2xl px-5 -mt-5 relative z-20">

        {/* Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2 pt-1 mb-4">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-4 py-2 rounded-full font-bold text-[12px] transition-all ${activeTab === tab ? 'bg-[#4a40e0] text-white shadow-md shadow-[#4a40e0]/20' : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin w-8 h-8 rounded-full border-4 border-[#4a40e0]/30 border-t-[#4a40e0]"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-slate-300 text-3xl">notifications_off</span>
            </div>
            <span className="text-slate-400 text-sm font-medium">No notifications yet</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* TODAY */}
            {grouped.today.length > 0 && (
              <>
                <span className="text-[10px] font-extrabold text-slate-400 tracking-widest uppercase pl-1 block">TODAY</span>
                {grouped.today.map(n => <NotifCard key={n.id} n={n} onClick={handleNotificationClick} navigate={navigate} />)}
              </>
            )}
            {/* YESTERDAY */}
            {grouped.yesterday.length > 0 && (
              <>
                <span className="text-[10px] font-extrabold text-slate-400 tracking-widest uppercase pl-1 block pt-2">YESTERDAY</span>
                {grouped.yesterday.map(n => <NotifCard key={n.id} n={n} onClick={handleNotificationClick} navigate={navigate} />)}
              </>
            )}
            {/* OLDER */}
            {grouped.older.length > 0 && (
              <>
                <span className="text-[10px] font-extrabold text-slate-400 tracking-widest uppercase pl-1 block pt-2">EARLIER</span>
                {grouped.older.map(n => <NotifCard key={n.id} n={n} onClick={handleNotificationClick} navigate={navigate} />)}
              </>
            )}
          </div>
        )}
      </main>

      {/* ── BOTTOM NAV ──────────────────────────────── */}
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-sm rounded-2xl bg-white/95 backdrop-blur-xl z-50 flex justify-around items-center px-2 py-2.5 shadow-[0px_12px_30px_rgba(74,64,224,0.12)] border border-slate-100">
        <NavBtn icon="home" label="HOME" onClick={() => navigate('/dashboard')} />
        <NavBtn icon="local_parking" label="PARKING" onClick={() => navigate('/dashboard')} />
        <NavBtn icon="notifications" label="ALERTS" active onClick={() => {}} />
        <NavBtn icon="person" label="PROFILE" onClick={() => navigate('/dashboard')} />
      </nav>
    </div>
  );
}

// ── Notification Card Component ─────────────────────────────────
function NotifCard({ n, onClick, navigate }) {
  const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.alert;
  const isUnread = n.status === 'unread';

  return (
    <div
      onClick={() => onClick(n)}
      className={`rounded-2xl p-4 flex gap-3.5 cursor-pointer transition-all border ${isUnread ? `bg-white shadow-sm ${cfg.ring}` : 'bg-white/60 border-transparent'} hover:shadow-md active:scale-[0.99]`}
    >
      {/* Icon */}
      <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${cfg.color}`}>
        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          {n.icon || 'info'}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2 mb-0.5">
          <h3 className={`text-[14px] leading-tight pr-1 ${isUnread ? 'font-bold text-[#1c1b1f]' : 'font-semibold text-slate-600'}`}>
            {n.title}
          </h3>
          <span className={`text-[9px] font-bold uppercase tracking-wider whitespace-nowrap mt-0.5 ${isUnread ? 'text-[#4a40e0]' : 'text-slate-400'}`}>
            {timeAgo(n.created_at)}
          </span>
        </div>
        <p className="text-[12px] text-slate-500 leading-relaxed">{n.message}</p>

        {/* Action button for payment receipts */}
        {n.type === 'payment' && n.action_url && (
          <button
            onClick={(e) => { e.stopPropagation(); navigate(n.action_url); }}
            className="mt-2 text-[#4a40e0] font-bold text-[10px] uppercase tracking-widest hover:underline"
          >
            VIEW RECEIPT →
          </button>
        )}
      </div>

      {/* Unread dot */}
      {isUnread && <div className="w-2.5 h-2.5 bg-[#4a40e0] rounded-full shrink-0 mt-1.5"></div>}
    </div>
  );
}

// ── Bottom Nav Button ───────────────────────────────────────────
function NavBtn({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition ${active ? 'text-[#4a40e0] bg-indigo-50' : 'text-slate-400 hover:text-slate-600'}`}>
      <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: active ? "'FILL' 1" : "'wght' 500" }}>{icon}</span>
      <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}
