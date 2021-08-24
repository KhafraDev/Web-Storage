import { broadcastStorageEvent } from './StorageEvent.js';
import { DOMException } from './Utility/DOMException.js';
import { url } from './Utility/URL.js';

interface State {
    backerKMP: Map<string, string>
    type: 'local' | 'session' | null,
    url: string
}

export const instances: Storage[] = [];

const getQuota = (map: Map<string, string>): number => {
    // Symbol keys do not count for limit, string "magic keys" do
    let buffer = '';
    for (const value of map.values()) {
        buffer += value;
    }

    return Buffer.byteLength(buffer);
}

export const kState = Symbol('webStorage-khafra');
export const isStorage = (s: Storage): s is Storage => kState in s;

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

export class Storage implements IWebStorage {
    [key: string]: any;

    [kState]!: State;

    constructor() {
        throw new TypeError('Illegal constructor.');
    }

    public get [Symbol.toStringTag](): string {
        return 'Storage'; // this does not need brand checks
    }

    public get length(): number {
        if (!isStorage(this)) { // to trigger -> localStorage.__proto__.length
            throw new TypeError(`'length' called on an object that does not implement interface Storage.`);
        }

        // "The length getter steps are to return this's map's size."
        return this[kState].backerKMP.size;
    }

    public key(index: number): string | null {
        if (!isStorage(this)) {
            throw new TypeError(`'key' called on an object that does not implement interface Storage.`);
        } else if (arguments.length < 1) {
            throw new TypeError('Storage.key: At least 1 argument is required, but only 0 passed');
        }

        // these 2 conditions are not documented in the spec, however
        // storage_key.window.js WPT test checks for both conditions
        const max = 2 ** 32;
        if (index >= max) {
            index %= max;
        } else if (index < 0) {
            return null;
        }

        // 1. If index is greater than or equal to this's map's size, then return null.
        if (index >= this.length) return null;

        // 2. Let keys be the result of running get the keys on this's map.
        // - To get the keys of an ordered map, return a new ordered set whose items are each of the keys in the map’s entries. 
        // - An ordered set is a list with the additional semantic that it must not contain the same item twice. 
        const keys = [...this[kState].backerKMP.keys()];
        
        // 3. Return keys[index].
        return keys[index]!;
    }

    public getItem(key: string): string | null {
        if (!isStorage(this)) {
            throw new TypeError(`'getItem' called on an object that does not implement interface Storage.`);
        } else if (arguments.length < 1) {
            throw new TypeError('Storage.getItem: At least 1 argument is required, but only 0 passed');
        }

        // standard browser implementation
        key = `${key}`;
        // 1. If this's map[key] does not exist, then return null.
        if (!this[kState].backerKMP.has(key)) return null;
        
        // 2. Return this's map[key].
        return this[kState].backerKMP.get(key)!;
    }

    public setItem(key: string, value: string): void {
        if (!isStorage(this)) {
            throw new TypeError(`'setItem' called on an object that does not implement interface Storage.`);
        } else if (arguments.length < 2) {
            throw new TypeError('Storage.setItem: At least 2 arguments required, but only 1 passed');
        }

        key = `${key}`;
        value = `${value}`;

        // 1. Let oldValue be null.
        let oldValue = null;
        // TODO: 2. Let reorder be true.
        // let reorder = true;

        // 3. If this's map[key] exists:
        // - An ordered map contains an entry with a given key if there exists an entry with that key.
        const mapKeyExists = [...this[kState].backerKMP.keys()].includes(key);
        if (mapKeyExists) {
            // 3a. Set oldValue to this's map[key].
            oldValue = this.getItem(key);
            // 3b. If oldValue is value, then return.
            if (oldValue === value) return;
            // TODO: 3c. Set reorder to false.
            // reorder = false;
        }

        if (getQuota(this[kState].backerKMP) > 5_000_000) {
            throw new DOMException('Quota exceeded', 'QuotaExceededError');
        }

        // 5. Set this's map[key] to value.
        this[kState].backerKMP.set(key, value);

        // TODO: 6. If reorder is true, then reorder this.
        
        // 7. Broadcast this with key, oldValue, and value.
        broadcastStorageEvent(this, key, oldValue, value);
    }

    public removeItem(key: string): void | null {
        if (!isStorage(this)) {
            throw new TypeError(`'removeItem' called on an object that does not implement interface Storage.`);
        } else if (arguments.length < 1) {
            throw new TypeError('Storage.removeItem: At least 1 argument required, but only 0 passed');
        }

        key = `${key}`;

        // 1. If this's map[key] does not exist, then return null.
        // - An ordered map contains an entry with a given key if there exists an entry with that key.
        const mapKeyExists = [...this[kState].backerKMP.keys()].includes(key);
        if (!mapKeyExists) {
            // Browsers do not return null when a key is non-existent (Chrome/Firefox).
            return;
        }

        // 2. Set oldValue to this's map[key].
        const oldValue = this.getItem(key);
        // 3. Remove this's map[key].
        this[kState].backerKMP.delete(key);

        // TODO: 4. Reorder this.
        
        // 5. Broadcast this with key, oldValue, and null.
        broadcastStorageEvent(this, key, oldValue, null);
    }

    public clear(): void {
        if (!isStorage(this)) {
            throw new TypeError(`'clear' called on an object that does not implement interface Storage.`);
        }

        const keys = Array.from(this[kState].backerKMP.keys());
        // 1. Clear this's map.
        this[kState].backerKMP.clear();
        for (const key of keys)
            delete this[key as string & keyof typeof Storage];
        // 2. Broadcast this with null, null, and null.
        broadcastStorageEvent(this, null, null, null);
    }
}

export const create = (type: 'local' | 'session'): Storage => {
    // inspired by Deno <3
    // https://github.com/denoland/deno/blob/a0285e2eb88f6254f6494b0ecd1878db3a3b2a58/ext/webidl/00_webidl.js#L902
    const storage: Storage = Object.create(Storage.prototype);
    storage[kState] ??= {
        backerKMP: new Map<string, string>(),
        type: type,
        url: url()
    } as State;
    instances.push(storage);
    return storage;
}