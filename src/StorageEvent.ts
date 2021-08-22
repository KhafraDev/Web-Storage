import { instances, kState, Storage } from './Storage.js';
import { url as StorageURL } from './Utility/URL.js';

interface StorageEventInit extends EventInit {
    key: string | null;
    oldValue: string | null;
    newValue: string | null;
    url?: string;
    storageArea: Storage | null;
}

interface IStorageEvent extends Event {  
    readonly key: string | null;
    readonly oldValue: string | null;
    readonly newValue: string | null;
    readonly url: string | null;
    readonly storageArea: Storage | null;
  
    initStorageEvent(
        type: 'local' | 'session',
        bubbles?: boolean,
        cancelable?: boolean,
        key?: string | null,
        oldValue?: string | null,
        newValue?: string | null,
        url?: string,
        storageArea?: Storage | null
    ): void;
}

export class StorageEvent extends Event implements IStorageEvent {
    /** Returns the key of the storage item being changed. */
    key: string | null = null;
    /** Returns the old value of the key of the storage item whose value is being changed. */
    oldValue: string | null = null;
    /** Returns the new value of the key of the storage item whose value is being changed. */
    newValue: string | null = null;
    /** Returns the URL of the document whose storage item changed. */
    url: string = '';
    /** Returns the Storage object that was affected. */
    storageArea: Storage | null = null;

    constructor(type: string, eventInitDict = {} as StorageEventInit) {
        if (arguments.length < 1) {
            throw new TypeError(`StorageEvent constructor: At least 1 argument required, but only ${arguments.length} passed`);
        }

        super(type, eventInitDict);
        this.key = eventInitDict?.key ?? null;
        this.oldValue = eventInitDict?.oldValue ?? null;
        this.newValue = eventInitDict?.newValue ?? null;
        this.url = typeof eventInitDict?.url === 'string' || eventInitDict?.url === null
            ? `${eventInitDict.url}`
            : eventInitDict?.url ?? '';
        this.storageArea = eventInitDict?.storageArea ?? null;
    }

    initStorageEvent(
        type: string,
        bubbles = false,
        cancelable = false,
        key: string | null = null,
        oldValue: string | null = null,
        newValue: string | null = null,
        url: string = '',
        storageArea: Storage | null = null
    ): void {
        if (arguments.length < 1) {
            throw new TypeError('At least 1 argument required, but only 0 passed');
        }
        
        Object.defineProperties(this, {
            type: { value: `${type}` },
            bubbles: { value: bubbles ?? false },
            cancelable: { value: cancelable ?? false },
            key: { value: key },
            oldValue: { value: oldValue },
            newValue: { value: newValue },
            url: { value: url === null ? `${url}` : url },
            storageArea: { value: storageArea }
        });

        WindowEventTarget.dispatchEvent(this);
    }
}

export const WindowEventTarget = new EventTarget();

export const broadcastStorageEvent = (
    storageItem: Storage, 
    key: string | null, 
    oldValue: string | null,
    newValue: string | null
) => {
    // 1. Let url be storage's relevant global object's associated Document's URL.
    // 2. Let remoteStorages be all Storage objects excluding storage whose:
    const { storage, url } = instances.find(s => storageItem[kState].type === s.storage[kState].type && s.url === StorageURL())!;
    // 2a. type is storage's type
    // 2b. relevant settings object's origin is same origin with storage's relevant settings object's origin.
    const remoteStorages = instances.filter(s => s.storage[kState].type === storage[kState].type && s.url === url);
    // TODO: 2c. and, if type is "session", whose relevant settings object's browsing session is storage's relevant settings object's browsing session.

    // 3. For each remoteStorage of remoteStorages: queue a global task on the DOM manipulation 
    // task source given remoteStorage's relevant global object to fire an event named storage at
    // remoteStorage's relevant global object, using StorageEvent, with key initialized to key, 
    // oldValue initialized to oldValue, newValue initialized to newValue, url initialized to url, 
    // and storageArea initialized to remoteStorage.
    for (const remoteStorage of remoteStorages) {
        WindowEventTarget.dispatchEvent(new StorageEvent('storage', {
            key,
            oldValue,
            newValue,
            storageArea: remoteStorage.storage
        }));
    }
}