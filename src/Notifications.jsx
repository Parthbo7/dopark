import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabase';
import { fetchNotifications, markAsRead, markAllAsRead, subscribeToNotifications } from './notificationService';

const TYPE_CONFIG = {
  booking:    { color: 'bg-indigo-50 dark:bg-indigo-950/20 text-[#4a40e0] dark:text-indigo-400', ring: 'border-[#4a40e0]/20' },
  payment:    { color: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400', ring: 'border-emerald-200/40' },
  session:    { color: 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-450', ring: 'border-amber-200/40' },
  entry_exit: { color: 'bg-sky-50 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400', ring: 'border-sky-200/40' },
  alert:      { color: 'bg-rose-50 dark:bg-rose-950/20 text-rose-500 dark:text-rose-450', ring: 'border-rose-200/40' },
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

  const filtered = notifications.filter(n => {
    const mapping = tabTypeMap[activeTab];
    if (!mapping) return true;
    if (Array.isArray(mapping)) return mapping.includes(n.type);
    return n.type === mapping;
  });

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
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800/40 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 lg:p-8 flex flex-col font-body">
      
      {/* Title Header with Mark Read Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-5 border-b border-slate-100 dark:border-slate-800/40">
        <div>
          <h2 className="text-xl font-extrabold text-[#4a40e0] tracking-tight flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <span className="text-[10px] font-black text-rose-500 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/10 px-2 py-0.5 rounded-full">
                {unreadCount} UNREAD
              </span>
            )}
          </h2>
          <p className="text-slate-400 text-xs font-semibold mt-1">Real-time alerts, gate entries, and payment details</p>
        </div>

        {unreadCount > 0 && (
          <button 
            onClick={handleMarkAllRead} 
            className="px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-[#4a40e0] dark:text-indigo-400 rounded-xl transition text-xs font-black flex items-center gap-2 cursor-pointer w-fit"
          >
            <span className="material-symbols-outlined text-base">done_all</span>
            Mark All as Read
          </button>
        )}
      </div>

      {/* Tab Selectors */}
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-3 mb-6 shrink-0">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap px-4 py-2 rounded-xl font-extrabold text-xs transition-all ${
              activeTab === tab 
                ? 'bg-[#4a40e0] text-white shadow-md shadow-[#4a40e0]/10' 
                : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border border-transparent hover:bg-slate-100 dark:hover:bg-slate-700/60 cursor-pointer'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main List */}
      <div className="flex-1">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin w-8 h-8 rounded-full border-4 border-[#4a40e0]/30 border-t-[#4a40e0]"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center max-w-md mx-auto text-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-700/30">
              <span className="material-symbols-outlined text-slate-400 text-2xl">notifications_off</span>
            </div>
            <h3 className="font-extrabold text-on-surface text-base">All Caught Up!</h3>
            <p className="text-slate-400 text-xs font-semibold mt-1">No notifications found for this category.</p>
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl">
            {/* TODAY */}
            {grouped.today.length > 0 && (
              <div className="space-y-3">
                <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase pl-1 block">TODAY</span>
                <div className="space-y-3">
                  {grouped.today.map(n => <NotifCard key={n.id} n={n} onClick={handleNotificationClick} navigate={navigate} />)}
                </div>
              </div>
            )}
            
            {/* YESTERDAY */}
            {grouped.yesterday.length > 0 && (
              <div className="space-y-3">
                <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase pl-1 block pt-2">YESTERDAY</span>
                <div className="space-y-3">
                  {grouped.yesterday.map(n => <NotifCard key={n.id} n={n} onClick={handleNotificationClick} navigate={navigate} />)}
                </div>
              </div>
            )}
            
            {/* OLDER */}
            {grouped.older.length > 0 && (
              <div className="space-y-3">
                <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase pl-1 block pt-2">EARLIER</span>
                <div className="space-y-3">
                  {grouped.older.map(n => <NotifCard key={n.id} n={n} onClick={handleNotificationClick} navigate={navigate} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function NotifCard({ n, onClick, navigate }) {
  const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.alert;
  const isUnread = n.status === 'unread';

  return (
    <div
      onClick={() => onClick(n)}
      className={`rounded-2xl p-4 flex gap-4 cursor-pointer transition-all border ${
        isUnread 
          ? `bg-[#4a40e0]/[0.02] dark:bg-[#4a40e0]/5 shadow-sm border-indigo-150/50 dark:border-indigo-950` 
          : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/30'
      } hover:shadow-md active:scale-[0.99]`}
    >
      {/* Icon Circle */}
      <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${cfg.color} border border-slate-100 dark:border-slate-800/40 shadow-sm`}>
        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          {n.icon || 'info'}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2 mb-1">
          <h3 className={`text-[13.5px] leading-tight pr-1 ${isUnread ? 'font-black text-[#2B3674] dark:text-slate-200' : 'font-bold text-slate-600 dark:text-slate-400'}`}>
            {n.title}
          </h3>
          <span className={`text-[9px] font-extrabold uppercase tracking-wider whitespace-nowrap mt-0.5 shrink-0 ${isUnread ? 'text-[#4a40e0] dark:text-indigo-400' : 'text-slate-400'}`}>
            {timeAgo(n.created_at)}
          </span>
        </div>
        <p className="text-xs text-slate-400 font-semibold leading-relaxed">{n.message}</p>

        {n.type === 'payment' && n.action_url && (
          <button
            onClick={(e) => { e.stopPropagation(); navigate(n.action_url); }}
            className="mt-2.5 text-[#4a40e0] dark:text-indigo-400 font-black text-[9px] uppercase tracking-widest hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            View Receipt
            <span className="material-symbols-outlined text-[12px] font-black">arrow_right_alt</span>
          </button>
        )}
      </div>

      {/* Unread marker dot */}
      {isUnread && (
        <div className="w-2.5 h-2.5 bg-[#4a40e0] rounded-full shrink-0 mt-2 shadow-sm shadow-[#4a40e0]/25 animate-pulse"></div>
      )}
    </div>
  );
}
