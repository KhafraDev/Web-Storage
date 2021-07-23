import { broadcastStorageEvent } from './StorageEvent.js';
import { url } from './Utility/URL.js';

export const instances: { type: 'local' | 'session', url: string, storage: Storage }[] = []

/**
 * @link https://html.spec.whatwg.org/multipage/webstorage.html#the-storage-interface
 */
interface IWebStorage {
    readonly length: number;
    key(index: number): string | null;
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
    clear(): void;
}

export class Storage extends Object implements IWebStorage {
    #backerKMP = new Map<string, string>();

    constructor(type: 'local' | 'session') {
        super();

        instances.push({ type, url: url(), storage: this });
    }

    public get [Symbol.toStringTag](): string {
        return 'Storage';
    }

    public get length(): number {
        // "The length getter steps are to return this's map's size."
        return this.#backerKMP.size;
    }

    public key(index: number): string | null {
        // 1. If index is greater than or equal to this's map's size, then return null.
        if (index > this.length) return null;

        // 2. Let keys be the result of running get the keys on this's map.
        // - To get the keys of an ordered map, return a new ordered set whose items are each of the keys in the map’s entries. 
        // - An ordered set is a list with the additional semantic that it must not contain the same item twice. 
        const keys = [...this.#backerKMP.keys()];
        
        // 3. Return keys[index].
        return keys[index]!;
    }

    public getItem(key: string): string | null {
        // standard browser implementation
        key = `${key}`;
        // 1. If this's map[key] does not exist, then return null.
        if (!this.#backerKMP.has(key)) return null;
        
        // 2. Return this's map[key].
        return this.#backerKMP.get(key)!;
    }

    public setItem(key: string, value: string): void {
        if (arguments.length < 2)
            throw new TypeError('Storage.setItem: At least 2 arguments required, but only 1 passed');

        key = `${key}`;
        value = `${value}`;

        // 1. Let oldValue be null.
        let oldValue = null;
        // TODO: 2. Let reorder be true.
        // let reorder = true;

        // 3. If this's map[key] exists:
        // - An ordered map contains an entry with a given key if there exists an entry with that key.
        const mapKeyExists = [...this.#backerKMP.keys()].includes(key);
        if (mapKeyExists) {
            // 3a. Set oldValue to this's map[key].
            oldValue = this.getItem(key);
            // 3b. If oldValue is value, then return.
            if (oldValue === value) return;
            // TODO: 3c. Set reorder to false.
            // reorder = false;
        }

        // TODO: 4. If value cannot be stored, then throw a "QuotaExceededError" DOMException exception.

        // 5. Set this's map[key] to value.
        this.#backerKMP.set(key, value);

        // TODO: 6. If reorder is true, then reorder this.
        
        // 7. Broadcast this with key, oldValue, and value.
        broadcastStorageEvent(this, key, oldValue, value);
    }

    public removeItem(key: string): void | null {
        if (arguments.length < 1)
            throw new TypeError('Storage.removeItem: At least 1 argument required, but only 0 passed');
            
        key = `${key}`;

        // 1. If this's map[key] does not exist, then return null.
        // - An ordered map contains an entry with a given key if there exists an entry with that key.
        const mapKeyExists = [...this.#backerKMP.keys()].includes(key);
        if (!mapKeyExists) {
            // Browsers do not return null when a key is non-existent (Chrome/Firefox).
            return;
        }

        // 2. Set oldValue to this's map[key].
        const oldValue = this.getItem(key);
        // 3. Remove this's map[key].
        this.#backerKMP.delete(key);

        // TODO: 4. Reorder this.
        
        // 5. Broadcast this with key, oldValue, and null.
        broadcastStorageEvent(this, key, oldValue, null);
    }

    public clear(): void {
        // 1. Clear this's map.
        this.#backerKMP.clear();
        // 2. Broadcast this with null, null, and null.
        broadcastStorageEvent(this, null, null, null);
    }
}