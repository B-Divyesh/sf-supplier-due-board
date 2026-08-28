import type { Bill } from './types';

const DB_NAME = 'supplier-due-board';
const STORE = 'bills';
const VERSION = 1;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in globalThis)) {
      reject(new Error('This browser does not provide local database storage.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, VERSION);
    request.onerror = () => reject(request.error ?? new Error('Could not open local storage.'));
    request.onblocked = () => reject(new Error('Close other Due Board tabs, then try again.'));
    request.onupgradeneeded = () => {
      const database = request.result;
      const store = database.createObjectStore(STORE, { keyPath: 'id' });
      store.createIndex('dueDate', 'dueDate');
    };
    request.onsuccess = () => resolve(request.result);
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Local storage request failed.'));
  });
}

async function useStore<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDatabase();
  try {
    const transaction = db.transaction(STORE, mode);
    const result = await requestResult(action(transaction.objectStore(STORE)));
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Could not save to this device.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('The local save was cancelled.'));
    });
    return result;
  } finally {
    db.close();
  }
}

export const billStore = {
  list: () => useStore<Bill[]>('readonly', (store) => store.getAll()),
  put: (bill: Bill) => useStore<IDBValidKey>('readwrite', (store) => store.put(bill)),
  delete: (id: string) => useStore<undefined>('readwrite', (store) => store.delete(id)),
  clear: () => useStore<undefined>('readwrite', (store) => store.clear()),
  async replaceAll(bills: Bill[]): Promise<void> {
    const db = await openDatabase();
    try {
      const transaction = db.transaction(STORE, 'readwrite');
      const store = transaction.objectStore(STORE);
      store.clear();
      bills.forEach((bill) => store.put(bill));
      await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error ?? new Error('The import could not be saved.'));
        transaction.onabort = () => reject(transaction.error ?? new Error('The import was cancelled.'));
      });
    } finally {
      db.close();
    }
  },
};
