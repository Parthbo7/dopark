/**
 * notificationService.js
 * Client-side helpers to create, fetch, and manage notifications.
 * DB triggers handle: booking create, status change, low balance.
 * This service handles: session alerts, smart alerts, manual pushes.
 */
import { supabase } from './supabase';

// ── Create a notification ───────────────────────────────────────
export async function createNotification({
  userId,
  type = 'alert',
  title,
  message,
  icon = 'info',
  actionUrl = null,
  metadata = {}
}) {
  if (!userId || !title || !message) return null;

  const { data, error } = await supabase
    .from('notifications')
    .insert([{ user_id: userId, type, title, message, icon, action_url: actionUrl, metadata }])
    .select()
    .single();

  if (error) console.error('[Notification] Insert failed:', error.message);
  return data;
}

// ── Fetch all notifications for current user ────────────────────
export async function fetchNotifications(limit = 50) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) { console.error('[Notification] Fetch failed:', error.message); return []; }
  return data || [];
}

// ── Get unread count ────────────────────────────────────────────
export async function getUnreadCount() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'unread');

  if (error) return 0;
  return count || 0;
}

// ── Mark as read ────────────────────────────────────────────────
export async function markAsRead(notificationId) {
  await supabase
    .from('notifications')
    .update({ status: 'read' })
    .eq('id', notificationId);
}

export async function markAllAsRead() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('notifications')
    .update({ status: 'read' })
    .eq('user_id', user.id)
    .eq('status', 'unread');
}

// ── Subscribe to realtime notifications ─────────────────────────
export function subscribeToNotifications(userId, onNewNotification) {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      (payload) => onNewNotification(payload.new)
    )
    .subscribe();

  return channel; // caller should call supabase.removeChannel(channel) on unmount
}

// ── Preset notification builders (called from app code) ─────────

export const NotifyPresets = {
  sessionStarted: (userId, stationName) =>
    createNotification({
      userId, type: 'session', title: 'Session Started',
      message: `Your parking session at ${stationName} has begun. Drive safe! 🚗`,
      icon: 'play_circle'
    }),

  halfTimeAlert: (userId, stationName, minutesLeft) =>
    createNotification({
      userId, type: 'session', title: 'Half Time Used',
      message: `You've used half your time at ${stationName}. ${minutesLeft} min remaining.`,
      icon: 'hourglass_top'
    }),

  tenMinWarning: (userId, stationName) =>
    createNotification({
      userId, type: 'session', title: '10 Minutes Remaining',
      message: `Your session at ${stationName} expires in 10 min. Overstay charges may apply.`,
      icon: 'timer'
    }),

  timeExpired: (userId, stationName) =>
    createNotification({
      userId, type: 'session', title: 'Time Expired',
      message: `Your session at ${stationName} has expired. Extra charges are being applied automatically.`,
      icon: 'alarm'
    }),

  entryConfirmed: (userId, stationName, slotNumber) =>
    createNotification({
      userId, type: 'entry_exit', title: 'Entry Confirmed',
      message: `Welcome! You've entered ${stationName}, slot ${slotNumber}.`,
      icon: 'login'
    }),

  exitBlocked: (userId, reason) =>
    createNotification({
      userId, type: 'entry_exit', title: 'Exit Blocked',
      message: `Exit blocked: ${reason}. Please clear pending dues.`,
      icon: 'block', actionUrl: '/my-cards'
    }),

  penaltyCharged: (userId, amount) =>
    createNotification({
      userId, type: 'payment', title: 'Penalty Charged',
      message: `₹${amount} overtime penalty has been charged to your DoCard.`,
      icon: 'gavel', actionUrl: '/my-cards',
      metadata: { amount }
    }),

  paymentFailed: (userId, amount) =>
    createNotification({
      userId, type: 'payment', title: 'Payment Failed',
      message: `Payment of ₹${amount} failed. Please recharge your DoCard.`,
      icon: 'error', actionUrl: '/my-cards',
      metadata: { amount }
    }),

  peakHourPricing: (userId, stationName) =>
    createNotification({
      userId, type: 'alert', title: 'Peak Hour Pricing',
      message: `${stationName} has peak hour pricing active. Rates may be higher.`,
      icon: 'trending_up'
    }),

  overstayPrediction: (userId, stationName, extraMins) =>
    createNotification({
      userId, type: 'alert', title: 'Overstay Prediction',
      message: `Traffic patterns suggest you may overstay by ~${extraMins} min at ${stationName}.`,
      icon: 'psychology'
    }),

  systemError: (userId) =>
    createNotification({
      userId, type: 'alert', title: 'System Notice',
      message: 'We encountered an issue processing your session. Our team is on it.',
      icon: 'report_problem'
    }),
};
