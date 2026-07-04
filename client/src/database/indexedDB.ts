/**
 * IndexedDB helper for offline data storage
 */

import { DB_NAME, DB_VERSION, STORES } from '../utils/constants';

interface SyncQueueItem {
  id: string;
  store: string;
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  synced: boolean;
}

class IndexedDBHelper {
  private db: IDBDatabase | null = null;

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB initialization failed');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        const storeNames = Object.values(STORES).filter((storeName) => storeName !== STORES.USERS && storeName !== STORES.SYNC_QUEUE);
        storeNames.forEach((storeName) => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id' });
            store.createIndex('timestamp', 'timestamp', { unique: false });
          }
        });

        if (!db.objectStoreNames.contains(STORES.USERS)) {
          const usersStore = db.createObjectStore(STORES.USERS, { keyPath: 'id' });
          usersStore.createIndex('email', 'email', { unique: true });
        }

        // Create sync queue store
        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Get all data from a store
   */
  async getAll<T>(storeName: string): Promise<T[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result as T[]);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Get single item from store
   */
  async get<T>(storeName: string, key: string): Promise<T | undefined> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result as T);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Add or update data in store
   */
  async put<T>(storeName: string, data: T): Promise<string> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => {
        resolve(request.result as string);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Delete data from store
   */
  async delete(storeName: string, key: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Clear entire store
   */
  async clear(storeName: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Add to sync queue
   */
  async addToSyncQueue(
    store: string,
    action: 'create' | 'update' | 'delete',
    data: any
  ): Promise<void> {
    const queueItem: SyncQueueItem = {
      id: `${Date.now()}-${Math.random()}`,
      store,
      action,
      data,
      timestamp: Date.now(),
      synced: false,
    };

    await this.put(STORES.SYNC_QUEUE, queueItem);
  }

  /**
   * Get unsync ed items
   */
  async getUnsyncedItems(): Promise<SyncQueueItem[]> {
    const allItems = await this.getAll<SyncQueueItem>(STORES.SYNC_QUEUE);
    return allItems.filter((item) => !item.synced);
  }

  /**
   * Mark as synced
   */
  async markAsSynced(id: string): Promise<void> {
    const item = await this.get<SyncQueueItem>(STORES.SYNC_QUEUE, id);
    if (item) {
      item.synced = true;
      await this.put(STORES.SYNC_QUEUE, item);
    }
  }

  /**
   * Batch operation
   */
  async batch(operations: Array<{ store: string; action: string; data: any }>): Promise<void> {
    if (!this.db) await this.init();

    const transaction = this.db!.transaction(
      operations.map((op) => op.store),
      'readwrite'
    );

    operations.forEach((operation) => {
      const store = transaction.objectStore(operation.store);
      if (operation.action === 'put') {
        store.put(operation.data);
      } else if (operation.action === 'delete') {
        store.delete(operation.data.id);
      }
    });

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

export const db = new IndexedDBHelper();
