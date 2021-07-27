import { Storage } from './Storage.js';

const hasOwn = Object.prototype.hasOwnProperty;
const protoProps = ['length', 'key', 'getItem', 'setItem', 'removeItem', 'clear'];

export const localStorage: Storage = new Proxy(new Storage('local'), {
    defineProperty: (target, prop, attributes) => {
        const attr: PropertyDescriptor = {
            value: attributes.value,
            configurable: typeof prop !== 'symbol',
            writable: typeof prop !== 'symbol',
            enumerable: typeof prop !== 'symbol'
        };

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

        if (typeof prop !== 'symbol') {
            target.setItem(prop as string, attributes.value);
            return target.getItem(prop as string) !== null;
        } else {
            return true;
        }
    },
    get: (target, prop) => {
        if (protoProps.includes(prop as string)) {
            return target[prop as keyof typeof target];
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
            target.setItem(prop as string, value);
            return target.getItem(prop as string) !== null;
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
        // returning false here throws a TypeError due to the spec.
        // however returning true for properties that aren't configurable
        // also throws. So there's nothing I can really do about it.
        
        if (typeof prop === 'symbol') {
            return false;
        } else {
            target.removeItem(prop);
            return delete target[prop as keyof typeof target];
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
        if (typeof prop === 'symbol') return Reflect.getOwnPropertyDescriptor(target, prop);
        if (protoProps.includes(prop)) return undefined;

        return Reflect.getOwnPropertyDescriptor(target, prop)
    }
});