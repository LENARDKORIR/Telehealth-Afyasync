/**
 * Navbar component
 */

import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { getInitials } from '../utils/helpers';
import { useNotifications } from '../hooks/useNotifications';
import type { AppNotification } from '../types/notification';

interface NavbarProps {
  onMenuToggle: () => void;
}

const priorityStyles: Record<AppNotification['priority'], string> = {
  info: 'border-blue-200 bg-blue-50 text-blue-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-rose-200 bg-rose-50 text-rose-700',
};

const formatNotificationTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const Navbar = ({ onMenuToggle }: NavbarProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    syncState,
    browserPermission,
    markRead,
    markAllRead,
    requestBrowserPermission,
  } = useNotifications();

  const syncLabel = !syncState.isOnline
    ? 'Offline mode'
    : syncState.status === 'syncing'
      ? `Syncing ${syncState.pending}`
      : syncState.pending > 0
        ? `${syncState.pending} pending`
        : 'Synced';

  const syncClass = !syncState.isOnline
    ? 'border-amber-200 bg-amber-50 text-amber-700'
    : syncState.status === 'error'
      ? 'border-rose-200 bg-rose-50 text-rose-700'
      : syncState.pending > 0 || syncState.status === 'syncing'
        ? 'border-blue-200 bg-blue-50 text-blue-700'
        : 'border-emerald-200 bg-emerald-50 text-emerald-700';

  const syncDotClass = !syncState.isOnline
    ? 'bg-amber-500'
    : syncState.status === 'error'
      ? 'bg-rose-500'
      : syncState.pending > 0 || syncState.status === 'syncing'
        ? 'bg-blue-500'
        : 'bg-emerald-500';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleNotificationClick = (notification: AppNotification) => {
    markRead(notification.id);
    setIsNotificationsOpen(false);

    if (notification.href) {
      navigate(notification.href);
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-rose-950/10 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuToggle}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#8e171b] text-white shadow-sm transition hover:bg-[#741215] md:hidden"
          >
            ☰
          </button>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8e171b] shadow-sm">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-slate-900 sm:text-xl">Afyasync Portal</h1>
            <p className="hidden text-xs text-slate-500 sm:block">Clinical workspace with Tailwind styling</p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className={`hidden items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold md:inline-flex ${syncClass}`}>
            <span className={`h-2 w-2 rounded-full ${syncDotClass}`} />
            {syncLabel}
          </div>
          <button
            type="button"
            onClick={() => {
              setIsNotificationsOpen((current) => !current);
              setIsMenuOpen(false);
            }}
            className="relative inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Alerts
            {unreadCount > 0 && (
              <span className="absolute -right-2 -top-2 inline-flex min-w-5 items-center justify-center rounded-full bg-[#8e171b] px-1.5 py-0.5 text-xs font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <div className="hidden text-right sm:block">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Welcome</p>
            <p className="font-semibold text-slate-900">{user?.name}</p>
          </div>
          <button
            onClick={() => {
              setIsMenuOpen((current) => !current);
              setIsNotificationsOpen(false);
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#8e171b] font-bold text-white transition hover:bg-[#741215]"
          >
            {getInitials(user?.name || 'User')}
          </button>
        </div>

      </div>

      {isNotificationsOpen && (
        <div className="absolute right-4 top-16 z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-sm font-bold text-slate-900">Notifications</p>
              <p className="text-xs text-slate-500">{unreadCount} unread</p>
            </div>
            <button
              type="button"
              onClick={markAllRead}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Mark read
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto p-2">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  className={`mb-2 block w-full rounded-2xl border px-4 py-3 text-left transition last:mb-0 hover:bg-slate-50 ${
                    notification.read ? 'border-slate-200 bg-white' : 'border-[#8e171b]/20 bg-[#fff7f7]'
                  }`}
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <p className="text-sm font-bold text-slate-900">{notification.title}</p>
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${priorityStyles[notification.priority]}`}>
                      {notification.type}
                    </span>
                  </div>
                  <p className="break-words text-sm leading-5 text-slate-600">{notification.body}</p>
                  <p className="mt-2 text-xs text-slate-400">{formatNotificationTime(notification.createdAt)}</p>
                </button>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                No notifications yet.
              </div>
            )}
          </div>

          {browserPermission !== 'granted' && browserPermission !== 'unsupported' && (
            <div className="border-t border-slate-100 p-3">
              <button
                type="button"
                onClick={() => void requestBrowserPermission()}
                className="w-full rounded-xl bg-[#8e171b] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#741215]"
              >
                Enable browser alerts
              </button>
            </div>
          )}
        </div>
      )}

      {isMenuOpen && (
        <div className="absolute right-4 top-16 z-50 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
          <button
            onClick={() => navigate('/settings')}
            className="block w-full rounded-xl px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-100"
          >
            Settings
          </button>
          <button
            onClick={handleLogout}
            className="block w-full rounded-xl px-4 py-3 text-left text-sm text-rose-600 transition hover:bg-rose-50"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};
