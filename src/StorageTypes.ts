import { create, Storage } from './Storage.js';

const protoProps = ['length', 'key', 'getItem', 'setItem', 'removeItem', 'clear'];

/** @type {Storage} */
export const ProxyHandler: ProxyHandler<Storage> = {
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
        if (typeof prop === 'symbol') 
            return Object.getOwnPropertySymbols(target).includes(prop);
        if (protoProps.includes(prop)) return true;
        if (target.getItem(prop) !== null) return true;

        return false;
    },
    deleteProperty: (target, prop) => {
        delete target[prop as keyof typeof target];

        if (typeof prop === 'string') {
            target.removeItem(prop);
        }

        return true;
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
}

/** @type {Storage} */
export const localStorage: Storage = new Proxy(create('local'), ProxyHandler);
/** @type {Storage} */
export const sessionStorage: Storage = new Proxy(create('session'), ProxyHandler);