/**
 * Sync service for offline data synchronization
 */

import api from './api';
import { db } from '../database/indexedDB';
import { SYNC_INTERVAL, SYNC_BATCH_SIZE } from '../utils/constants';

interface SyncQueueItem {
  id: string;
  store: string;
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  synced: boolean;
}

class SyncService {
  private syncInProgress = false;
  private syncIntervalId: ReturnType<typeof setInterval> | null = null;
  private handleOnline = () => {
    console.log('Back online - starting sync');
    void this.syncOfflineData();
  };
  private handleOffline = () => {
    console.log('Gone offline');
  };

  /**
   * Initialize sync service
   */
  init(): void {
    if (this.syncIntervalId) {
      return;
    }

    this.syncIntervalId = setInterval(() => {
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

  /**
   * Check if online
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Sync offline data
   */
  async syncOfflineData(): Promise<void> {
    if (this.syncInProgress || !navigator.onLine) {
      return;
    }

    this.syncInProgress = true;

    try {
      const unsyncedItems = await db.getUnsyncedItems();
      console.log(`Syncing ${unsyncedItems.length} items`);

      for (let i = 0; i < unsyncedItems.length; i += SYNC_BATCH_SIZE) {
        const batch = unsyncedItems.slice(i, i + SYNC_BATCH_SIZE);
        await Promise.all(batch.map((item) => this.syncItem(item)));
      }

      console.log('Sync completed');
    } catch (error) {
      console.error('Sync error:', error);
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
      patients: '/api/patients',
      appointments: '/api/appointments',
      medicalRecords: '/api/medical-records',
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
