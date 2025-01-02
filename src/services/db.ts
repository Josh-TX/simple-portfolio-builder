import { FundData } from "../models/models";

class Database<T>{
    private dbName: string;
    private storeName: string;
    private dbInstance: IDBDatabase | null = null; // Store the instance

    constructor(dbName: string, storeName: string) {
        this.dbName = dbName;
        this.storeName = storeName;
    }

    private async getDB(): Promise<IDBDatabase> {
        if (this.dbInstance) {
            return Promise.resolve(this.dbInstance); // Return already opened database
        }
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);

            request.onupgradeneeded = (_: IDBVersionChangeEvent) => {
                const db = request.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'id' });
                }
            };

            request.onsuccess = () => {
                this.dbInstance = request.result
                resolve(request.result)
            };
            request.onerror = () => reject(request.error);
        });
    }

    async set(key: string, t: T): Promise<void> {
        const db = await this.getDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(this.storeName, 'readwrite');
            const store = transaction.objectStore(this.storeName);

            const request = store.put({ id: key, data: t });
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async tryGet(key: string): Promise<T | null> {
        const db = await this.getDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(this.storeName, 'readonly');
            const store = transaction.objectStore(this.storeName);

            const request = store.get(key);
            request.onsuccess = () => {
                const result = request.result;
                if (result && result.data !== undefined) {
                    resolve(result.data as T);
                } else {
                    resolve(null);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    async get(key: string): Promise<T> {
        const db = await this.getDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(this.storeName, 'readonly');
            const store = transaction.objectStore(this.storeName);

            const request = store.get(key);
            request.onsuccess = () => {
                const result = request.result;
                if (result && result.data !== undefined) {
                    resolve(result.data as T);
                } else {
                    reject(new Error(`No entry found for key: ${key}`));
                }
            };
            request.onerror = () => reject(request.error);
        });
    }
}
export var pricesDB = new Database<FundData>("main", "ticker-prices");