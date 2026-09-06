import type { Bill } from './types';

const STORE = 'bills';
const VERSION = 1;

function openDatabase(name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in globalThis)) {
      reject(new Error('This browser does not provide local database storage.'));
      return;
    }
    const request = indexedDB.open(name, VERSION);
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

async function useStore<T>(name: string, mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDatabase(name);
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

export function createBillStore(name: string) {
  return {
    list: () => useStore<Bill[]>(name, 'readonly', (store) => store.getAll()),
    put: (bill: Bill) => useStore<IDBValidKey>(name, 'readwrite', (store) => store.put(bill)),
    delete: (id: string) => useStore<undefined>(name, 'readwrite', (store) => store.delete(id)),
    clear: () => useStore<undefined>(name, 'readwrite', (store) => store.clear()),
    async replaceAll(bills: Bill[]): Promise<void> {
      const db = await openDatabase(name);
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
}

export function deleteBillDatabase(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error('The local sample data could not be removed.'));
    request.onblocked = () => reject(new Error('Close other Due Board tabs, then try again.'));
  });
}
