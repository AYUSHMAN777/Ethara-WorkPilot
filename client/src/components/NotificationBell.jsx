import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as notificationService from '../services/notificationService.js';

const POLL_MS = 45_000;

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const data = await notificationService.fetchNotifications({ limit: 30 });
      setItems(data.notifications || []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const handleOpen = () => {
    setOpen((v) => !v);
    if (!open) {
      setLoading(true);
      load().finally(() => setLoading(false));
    }
  };

  const handleNotificationClick = async (n) => {
    if (!n.read) {
      try {
        await notificationService.markNotificationRead(n._id);
        setItems((prev) => prev.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        /* ignore */
      }
    }
    setOpen(false);
    if (n.projectId) {
      navigate(`/projects/${n.projectId}`);
    }
  };

  const handleMarkAll = async () => {
    try {
      await notificationService.markAllNotificationsRead();
      setItems((prev) => prev.map((x) => ({ ...x, read: true })));
      setUnreadCount(0);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={handleOpen}
        className="relative rounded-xl border border-slate-700/90 bg-slate-900/50 p-2.5 text-slate-300 shadow-inner shadow-black/20 transition hover:border-slate-500 hover:bg-slate-800/50 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500/50"
        aria-label="Notifications"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-1 text-[10px] font-bold text-white shadow-md ring-2 ring-slate-950">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-900/95 shadow-2xl shadow-black/40 ring-1 ring-white/[0.05] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-950/40 px-4 py-3">
            <span className="text-sm font-semibold text-white">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                className="text-xs font-semibold text-indigo-400 transition hover:text-indigo-300"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading && items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-500">Loading…</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-500">No notifications yet.</p>
            ) : (
              <ul className="divide-y divide-slate-800/80">
                {items.map((n) => (
                  <li key={n._id}>
                    <button
                      type="button"
                      onClick={() => handleNotificationClick(n)}
                      className={`w-full px-4 py-3 text-left transition hover:bg-slate-800/50 ${
                        n.read ? 'opacity-70' : 'bg-indigo-500/[0.06]'
                      }`}
                    >
                      <NotificationRow n={n} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationRow({ n }) {
  return (
    <>
      <p className="text-xs font-semibold text-indigo-300">{n.title}</p>
      <p className="mt-1 text-sm leading-snug text-slate-200">{n.message}</p>
      {n.actor?.name && <p className="mt-2 text-xs text-slate-500">From {n.actor.name}</p>}
    </>
  );
}
