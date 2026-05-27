/**
 * Sync service for offline data synchronization
 */

import api from './api';
import { db } from '../database/indexedDB';
import { SYNC_INTERVAL, SYNC_BATCH_SIZE } from '../utils/constants';

export type SyncStateName = 'idle' | 'offline' | 'syncing' | 'synced' | 'error';

export interface SyncState {
  status: SyncStateName;
  pending: number;
  total: number;
  synced: number;
  isOnline: boolean;
  lastSyncedAt?: string;
  error?: string;
}

interface SyncQueueItem {
  id: string;
  store: string;
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  synced: boolean;
}

type SyncListener = (state: SyncState) => void;

class SyncService {
  private syncInProgress = false;
  private syncIntervalId: ReturnType<typeof setInterval> | null = null;
  private listeners = new Set<SyncListener>();
  private state: SyncState = {
    status: typeof navigator !== 'undefined' && navigator.onLine ? 'idle' : 'offline',
    pending: 0,
    total: 0,
    synced: 0,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  };
  private handleOnline = () => {
    console.log('Back online - starting sync');
    this.emit({
      status: 'idle',
      isOnline: true,
      error: undefined,
    });
    void this.syncOfflineData();
  };
  private handleOffline = () => {
    console.log('Gone offline');
    this.emit({
      status: 'offline',
      isOnline: false,
      error: undefined,
    });
  };

  /**
   * Initialize sync service
   */
  init(): void {
    if (this.syncIntervalId) {
      return;
    }

    void this.refreshStats();

    this.syncIntervalId = setInterval(() => {
      void this.refreshStats();

      if (navigator.onLine) {
        void this.syncOfflineData();
      }
    }, SYNC_INTERVAL);

    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  /**
   * Stop sync service
   */
  stop(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }

    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.state);

    return () => {
      this.listeners.delete(listener);
    };
  }

  getState(): SyncState {
    return this.state;
  }

  private emit(update: Partial<SyncState>): void {
    this.state = {
      ...this.state,
      ...update,
    };

    this.listeners.forEach((listener) => listener(this.state));
  }

  /**
   * Check if online
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  async refreshStats(): Promise<SyncState> {
    try {
      const stats = await this.getSyncStats();
      const isOnline = navigator.onLine;
      const status = !isOnline
        ? 'offline'
        : this.syncInProgress
          ? 'syncing'
          : this.state.status === 'error'
            ? 'error'
            : stats.pending > 0
              ? 'idle'
              : 'synced';

      this.emit({
        status,
        isOnline,
        total: stats.total,
        synced: stats.synced,
        pending: stats.pending,
      });
    } catch (error) {
      console.error('Failed to refresh sync stats:', error);
    }

    return this.state;
  }

  /**
   * Sync offline data
   */
  async syncOfflineData(): Promise<void> {
    if (this.syncInProgress || !navigator.onLine) {
      if (!navigator.onLine) {
        this.emit({
          status: 'offline',
          isOnline: false,
        });
      }
      return;
    }

    this.syncInProgress = true;

    try {
      const unsyncedItems = await db.getUnsyncedItems();
      const allItems = await db.getAll<SyncQueueItem>('syncQueue');
      console.log(`Syncing ${unsyncedItems.length} items`);

      this.emit({
        status: unsyncedItems.length > 0 ? 'syncing' : 'synced',
        isOnline: true,
        total: allItems.length,
        synced: allItems.length - unsyncedItems.length,
        pending: unsyncedItems.length,
        error: undefined,
      });

      for (let i = 0; i < unsyncedItems.length; i += SYNC_BATCH_SIZE) {
        const batch = unsyncedItems.slice(i, i + SYNC_BATCH_SIZE);
        await Promise.all(batch.map((item) => this.syncItem(item)));

        const remainingItems = await db.getUnsyncedItems();
        const currentItems = await db.getAll<SyncQueueItem>('syncQueue');
        this.emit({
          status: remainingItems.length > 0 ? 'syncing' : 'synced',
          total: currentItems.length,
          synced: currentItems.length - remainingItems.length,
          pending: remainingItems.length,
        });
      }

      console.log('Sync completed');
      const stats = await this.getSyncStats();
      this.emit({
        status: 'synced',
        isOnline: true,
        total: stats.total,
        synced: stats.synced,
        pending: stats.pending,
        lastSyncedAt: new Date().toISOString(),
        error: undefined,
      });
    } catch (error) {
      console.error('Sync error:', error);
      this.emit({
        status: 'error',
        isOnline: true,
        error: error instanceof Error ? error.message : 'Sync failed',
      });
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync single item
   */
  private async syncItem(item: SyncQueueItem): Promise<void> {
    try {
      const endpoint = this.getEndpointForStore(item.store);

      if (!endpoint) {
        console.warn(`Skipping sync for unsupported store: ${item.store}`);
        await db.markAsSynced(item.id);
        return;
      }

      switch (item.action) {
        case 'create':
          await api.post(endpoint, item.data);
          break;
        case 'update':
          await api.put(`${endpoint}/${item.data.id}`, item.data);
          break;
        case 'delete':
          await api.delete(`${endpoint}/${item.data.id}`);
          break;
      }

      await db.markAsSynced(item.id);
    } catch (error) {
      console.error(`Failed to sync item ${item.id}:`, error);
      throw error;
    }
  }

  /**
   * Get endpoint for store
   */
  private getEndpointForStore(store: string): string | null {
    const endpoints: Record<string, string> = {
      patients: '/patients',
      appointments: '/appointments',
      medicalRecords: '/medical-records',
    };

    return endpoints[store] || null;
  }

  /**
   * Get sync stats
   */
  async getSyncStats(): Promise<{ total: number; synced: number; pending: number }> {
    const unsyncedItems = await db.getUnsyncedItems();
    const allItems = await db.getAll<SyncQueueItem>('syncQueue');

    return {
      total: allItems.length,
      synced: allItems.length - unsyncedItems.length,
      pending: unsyncedItems.length,
    };
  }
}

export const syncService = new SyncService();
