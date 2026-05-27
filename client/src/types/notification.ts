import type { SyncState } from '../services/syncService';

export type AppNotificationType = 'appointment' | 'message' | 'sync';
export type AppNotificationPriority = 'info' | 'success' | 'warning' | 'danger';

export interface AppNotification {
  id: string;
  type: AppNotificationType;
  title: string;
  body: string;
  createdAt: string;
  href?: string;
  read: boolean;
  priority: AppNotificationPriority;
}

export type BrowserNotificationState = NotificationPermission | 'unsupported';

export interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  syncState: SyncState;
  browserPermission: BrowserNotificationState;
  refreshNotifications: () => Promise<void>;
  markRead: (id: string) => void;
  markAllRead: () => void;
  requestBrowserPermission: () => Promise<BrowserNotificationState>;
}
