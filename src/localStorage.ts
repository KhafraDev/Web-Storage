import { Storage } from './Storage.js';

const hasOwn = Object.prototype.hasOwnProperty;

export const localStorage = new Proxy(new Storage('local'), {
    defineProperty: (target, prop, attributes) => {
        return Reflect.defineProperty(target, prop, Object.assign({ 
            value: target[prop as keyof typeof target] 
        }, attributes));
    },
    get: (target, prop) => {
        if (hasOwn.call(Storage.prototype, prop)) {
            const storageProp = target[prop as keyof typeof target];
            return typeof storageProp === 'function'
                ? storageProp.bind(target)
                : storageProp;
        } else {
            if (typeof prop === 'symbol') {
                return target[prop as keyof typeof target];
            } else {
                return target.getItem(prop);
            }
        }
    },
    set: (target: Storage & { [key: string]: any }, prop, value) => {
        if (hasOwn.call(target, prop)) {
            return false;
        } else {
            if (typeof prop === 'symbol') {
                target[prop as unknown as Exclude<keyof Storage, 'length' | SymbolConstructor['toStringTag']>] = value; 
            } else {
                target.setItem(prop, value);
            }

            return true;
        }
    },
    deleteProperty: (target, prop) => {
        const deleted = delete target[prop as keyof typeof target];
        if (typeof prop === 'symbol') {
            return deleted;
        } else {
            target.removeItem(prop);
            return deleted;
        }
    },
    ownKeys: (target) => {
        const keys: string[] = [];
        let i = 0, key: string | null = null;

        while ((key = target.key(i++)) !== null) {
            keys.push(key);
        }

        return keys;
    },
    getOwnPropertyDescriptor: (target, prop) => {
        if (prop === 'undefined' && !hasOwn.call(target, prop)) return undefined;
        return { enumerable: true, configurable: true };
    }
});