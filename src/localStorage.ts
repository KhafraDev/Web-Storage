import { Storage } from './Storage.js';

const hasOwn = Object.prototype.hasOwnProperty;
const protoProps = ['length', 'key', 'getItem', 'setItem', 'removeItem', 'clear'];

export const localStorage: Storage = new Proxy(new Storage('local'), {
    defineProperty: (target, prop, attributes) => {
        const attr: PropertyDescriptor = attributes.configurable && 'value' in attributes
            ? attributes
            : { value: attributes.value, configurable: true };

        if (attr.value?.toString) {
            if (typeof attr.value.toString === 'function') {
                attr.value = attr.value.toString();
                Object.defineProperty(target, prop, attr);
            } else {
                throw new TypeError(`can't convert value to string`);
            }
        } else {
            Object.defineProperty(target, prop, attr);
        }

        target.setItem(prop as string, attributes.value);
        return target.getItem(prop as string) !== null;
    },
    get: (target, prop) => {
        if (protoProps.includes(prop as string)) {
            const storageProp = target[prop as keyof typeof target];
            return typeof storageProp === 'function'
                ? storageProp.bind(target)
                : storageProp;
        } else {
            if (typeof prop === 'symbol') {
                return target[prop as keyof typeof target];
            } else {
                return target[prop as keyof typeof target] ?? target.getItem(prop) ?? undefined;
            }
        }
    },
    set: (target: Storage & { [key: string]: any }, prop, value) => {
        if (protoProps.includes(prop as string)) {
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
    has: (target, prop) => {
        if (typeof prop === 'symbol') return hasOwn.call(localStorage, prop);
        if (protoProps.includes(prop)) return true;
        if (target.getItem(prop) !== null) return true;

        return false;
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