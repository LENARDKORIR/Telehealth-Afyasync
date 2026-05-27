import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { messageService } from '../services/messageService';
import { syncService } from '../services/syncService';
import type { SyncState } from '../services/syncService';
import type {
  AppNotification,
  BrowserNotificationState,
  NotificationContextType,
} from '../types/notification';
import type { Message } from '../types/message';

interface NotificationProviderProps {
  children: ReactNode;
}

interface AppointmentPreview {
  id: string;
  patientId: string;
  patientName?: string | null;
  doctorId: string;
  doctorName?: string | null;
  appointmentDate: string;
  startTime: string;
  status: string;
  reason: string;
}

const appointmentWindowMs = 24 * 60 * 60 * 1000;
const notificationPollMs = 45 * 1000;
const maxNotifications = 50;

const getBrowserPermission = (): BrowserNotificationState => {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
};

const getReadStorageKey = (userId?: string) => `afyasyncc.notification.read.${userId || 'guest'}`;

const getStoredReadIds = (userId?: string) => {
  try {
    return new Set<string>(JSON.parse(localStorage.getItem(getReadStorageKey(userId)) || '[]'));
  } catch {
    return new Set<string>();
  }
};

const storeReadIds = (userId: string | undefined, ids: Set<string>) => {
  localStorage.setItem(getReadStorageKey(userId), JSON.stringify(Array.from(ids)));
};

const parseAppointmentStart = (appointment: AppointmentPreview) => {
  const match = appointment.startTime.match(/^(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/i);
  if (!match) {
    return new Date(`${appointment.appointmentDate}T${appointment.startTime}`);
  }

  let hours = Number(match[1]);
  const minutes = match[2];
  const period = match[3]?.toUpperCase();

  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return new Date(`${appointment.appointmentDate}T${String(hours).padStart(2, '0')}:${minutes}`);
};

const formatAppointmentStart = (appointment: AppointmentPreview) => {
  const start = parseAppointmentStart(appointment);
  if (Number.isNaN(start.getTime())) return `${appointment.appointmentDate} at ${appointment.startTime}`;

  return start.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const sortNotifications = (items: AppNotification[]) =>
  [...items]
    .sort((a, b) => Number(a.read) - Number(b.read) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, maxNotifications);

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(() => getStoredReadIds());
  const [syncState, setSyncState] = useState<SyncState>(() => syncService.getState());
  const [browserPermission, setBrowserPermission] = useState<BrowserNotificationState>(() => getBrowserPermission());
  const previousSyncState = useRef<SyncState>(syncService.getState());

  useEffect(() => {
    const storedReadIds = getStoredReadIds(user?.id);
    setReadIds(storedReadIds);
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read: storedReadIds.has(notification.id),
      }))
    );
  }, [user?.id]);

  const notifyBrowser = useCallback((notification: AppNotification) => {
    if (!('Notification' in window) || Notification.permission !== 'granted' || notification.read) {
      return;
    }

    new Notification(notification.title, {
      body: notification.body,
    });
  }, []);

  const mergeGeneratedNotifications = useCallback(
    (type: AppNotification['type'], incoming: Omit<AppNotification, 'read'>[]) => {
      setNotifications((current) => {
        const existingIds = new Set(current.map((item) => item.id));
        const generated = incoming.map((notification) => ({
          ...notification,
          read: readIds.has(notification.id),
        }));

        generated
          .filter((notification) => !existingIds.has(notification.id))
          .forEach((notification) => notifyBrowser(notification));

        return sortNotifications([
          ...generated,
          ...current.filter((notification) => notification.type !== type),
        ]);
      });
    },
    [notifyBrowser, readIds]
  );

  const upsertNotification = useCallback(
    (notification: Omit<AppNotification, 'read'>) => {
      setNotifications((current) => {
        const exists = current.some((item) => item.id === notification.id);
        const next = {
          ...notification,
          read: readIds.has(notification.id),
        };

        if (!exists) {
          notifyBrowser(next);
        }

        return sortNotifications([next, ...current.filter((item) => item.id !== notification.id)]);
      });
    },
    [notifyBrowser, readIds]
  );

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setNotifications([]);
      return;
    }

    const appointmentEndpoint = user.role === 'patient' ? `/appointments/patient/${user.id}` : '/appointments';

    const [appointmentsResult, messagesResult] = await Promise.all([
      api.get<{ data: AppointmentPreview[] }>(appointmentEndpoint).catch((error) => {
        console.error('Failed to load appointment notifications:', error);
        return { data: { data: [] } };
      }),
      messageService.getUnreadMessages().catch((error) => {
        console.error('Failed to load message notifications:', error);
        return [] as Message[];
      }),
    ]);

    const now = Date.now();
    const appointmentNotifications = (appointmentsResult.data.data || [])
      .filter((appointment) => appointment.status === 'scheduled')
      .map((appointment) => ({
        appointment,
        startAt: parseAppointmentStart(appointment),
      }))
      .filter(({ startAt }) => {
        const startsIn = startAt.getTime() - now;
        return !Number.isNaN(startAt.getTime()) && startsIn >= 0 && startsIn <= appointmentWindowMs;
      })
      .slice(0, 8)
      .map(({ appointment, startAt }) => {
        const counterpart =
          user.role === 'patient'
            ? appointment.doctorName || appointment.doctorId
            : appointment.patientName || appointment.patientId;

        return {
          id: `appointment:${appointment.id}:${appointment.appointmentDate}:${appointment.startTime}`,
          type: 'appointment' as const,
          title: 'Upcoming appointment',
          body: `${counterpart} - ${appointment.reason} at ${formatAppointmentStart(appointment)}`,
          createdAt: startAt.toISOString(),
          href: '/appointments',
          priority: 'warning' as const,
        };
      });

    const messageNotifications = messagesResult.map((message) => ({
      id: `message:${message.id}`,
      type: 'message' as const,
      title: 'New message',
      body: `${message.senderName || message.senderId}: ${message.subject}`,
      createdAt: message.createdAt,
      href: `/messages?contact=${encodeURIComponent(message.senderId)}`,
      priority: 'info' as const,
    }));

    mergeGeneratedNotifications('appointment', appointmentNotifications);
    mergeGeneratedNotifications('message', messageNotifications);
  }, [isAuthenticated, mergeGeneratedNotifications, user?.id, user?.role]);

  useEffect(() => {
    void refreshNotifications();

    if (!isAuthenticated || !user?.id) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void refreshNotifications();
    }, notificationPollMs);

    return () => window.clearInterval(intervalId);
  }, [isAuthenticated, refreshNotifications, user?.id]);

  useEffect(() => {
    return syncService.subscribe((nextState) => {
      const previousState = previousSyncState.current;
      previousSyncState.current = nextState;
      setSyncState(nextState);

      if (!nextState.isOnline && previousState.isOnline) {
        upsertNotification({
          id: 'sync:offline',
          type: 'sync',
          title: 'Offline mode',
          body: 'Changes will be queued until the connection is restored.',
          createdAt: new Date().toISOString(),
          priority: 'warning',
        });
        return;
      }

      if (nextState.status === 'syncing' && nextState.pending > 0) {
        upsertNotification({
          id: 'sync:pending',
          type: 'sync',
          title: 'Sync in progress',
          body: `${nextState.pending} item${nextState.pending === 1 ? '' : 's'} waiting to sync.`,
          createdAt: new Date().toISOString(),
          priority: 'info',
        });
        return;
      }

      if (nextState.status === 'synced' && previousState.status === 'syncing') {
        upsertNotification({
          id: `sync:synced:${nextState.lastSyncedAt || Date.now()}`,
          type: 'sync',
          title: 'Sync complete',
          body: 'Offline changes are up to date.',
          createdAt: nextState.lastSyncedAt || new Date().toISOString(),
          priority: 'success',
        });
        return;
      }

      if (nextState.status === 'error') {
        upsertNotification({
          id: `sync:error:${Date.now()}`,
          type: 'sync',
          title: 'Sync needs attention',
          body: nextState.error || 'Some offline changes could not sync.',
          createdAt: new Date().toISOString(),
          priority: 'danger',
        });
      }
    });
  }, [upsertNotification]);

  const markRead = useCallback(
    (id: string) => {
      setReadIds((current) => {
        const next = new Set(current);
        next.add(id);
        storeReadIds(user?.id, next);
        return next;
      });

      setNotifications((current) =>
        current.map((notification) => (notification.id === id ? { ...notification, read: true } : notification))
      );
    },
    [user?.id]
  );

  const markAllRead = useCallback(() => {
    setReadIds((current) => {
      const next = new Set(current);
      notifications.forEach((notification) => next.add(notification.id));
      storeReadIds(user?.id, next);
      return next;
    });

    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
  }, [notifications, user?.id]);

  const requestBrowserPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      setBrowserPermission('unsupported');
      return 'unsupported';
    }

    const permission = await Notification.requestPermission();
    setBrowserPermission(permission);
    return permission;
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  const value = useMemo<NotificationContextType>(
    () => ({
      notifications,
      unreadCount,
      syncState,
      browserPermission,
      refreshNotifications,
      markRead,
      markAllRead,
      requestBrowserPermission,
    }),
    [
      browserPermission,
      markAllRead,
      markRead,
      notifications,
      refreshNotifications,
      requestBrowserPermission,
      syncState,
      unreadCount,
    ]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
