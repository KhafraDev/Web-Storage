import { test, expect, describe, afterEach } from '@jest/globals';
import { Storage } from '../dist/Storage.js';

const storage = new Storage();
const toString = Object.prototype.toString;

describe('<Storage> class tests', () => {
    afterEach(() => storage.clear());

    test('using "magic keys" to set, get, and delete works', () => {
        const symbol = Symbol('jest');
        const stringKey = 'testing';
        const otherKey = { a: 'b' };

        // setting symbol keys to string or other types
        expect(storage[symbol] = stringKey).toEqual(stringKey);
        expect(storage[symbol] = otherKey).toEqual(otherKey);
        expect(() => storage[symbol] = symbol).not.toThrow();
        // setting string keys to different values
        expect(storage[stringKey] = stringKey).toEqual(stringKey);
        expect(storage[stringKey] = otherKey).toEqual(otherKey);
        // setting the key returns the original, getting it returns the stringified
        expect(storage[stringKey]).toEqual(toString.call(otherKey));
        expect(() => storage[stringKey] = symbol).toThrow(TypeError);

        // symbols are not added using <Storage>.setItem, and do not count towards the length
        // string keys, on the other hand, do count when setting "magic keys"
        expect(storage.length).toEqual(1);

        // deleting a symbol key
        expect(delete storage[symbol]).toEqual(true);
        expect(storage[symbol]).toBe(undefined);
        // deleting a key string
        expect(delete storage[stringKey]).toEqual(true);
        expect(storage[stringKey]).toBe(undefined);
        expect(storage.length).toEqual(0);
    });

    test('<Storage>.setItem', () => {
        const obj = { a: '1' };

        expect(storage.setItem('key', 'value')).toEqual(undefined); // void return
        expect(storage.setItem('key2', obj)).toEqual(undefined);
        expect(() => storage.setItem('key')).toThrow(TypeError); // not enough args
        expect(() => storage.setItem('key', 'value', '1', '2', '3')).not.toThrow(); // passing extraneous args
        expect(() => storage.setItem(Symbol('jest'), 'jest')).toThrow(TypeError); // setting a symbol key
        expect(() => storage.setItem('jest', Symbol('jest'))).toThrow(TypeError); // setting a symbol value

        expect(storage.length).toEqual(2); // key + key2
    });

    test('<Storage>.getItem', () => {
        const obj = { a: '1' };
        storage.setItem('key', 'value');
        storage.setItem('key2', obj);

        expect(storage.getItem('key')).toEqual('value');
        expect(storage.getItem('key', '2', '3', '4')).toEqual(storage.getItem('key'));
        expect(storage.getItem('key2')).toEqual(toString.call(obj));
        expect(storage.getItem('nonexistent')).toEqual(null);
        expect(() => storage.getItem(Symbol('jest'))).toThrow(TypeError);
    });

    test('<Storage>.removeItem', () => {
        for (let i = 0; i < 100; i++) {
            storage.setItem(`key${i}`, `value${i}`);
            expect(storage.getItem(`key${i}`)).toBeDefined();
            storage.removeItem(`key${i}`);
            expect(storage.getItem(`key${i}`)).toBeNull();
        }

        expect(() => storage.removeItem('nonexistent')).not.toThrow();
        expect(() => storage.removeItem({})).not.toThrow();
        expect(() => storage.removeItem()).toThrow(TypeError);
        expect(() => storage.removeItem(undefined)).not.toThrow(TypeError);
        expect(() => storage.removeItem('1', '2', '3', '4')).not.toThrow();
    });

    test('<Storage>.key', () => {
        for (let i = 0; i < 100; i++) {
            const key = `key${i}`;
            storage.setItem(key, Math.random().toString(36));
            expect(storage.key(i)).toEqual(key);
        }
    });

    test('<Storage>.length', () => {
        const random = Math.floor(Math.random() * 100);
        for (let i = 0; i < random; i++) {
            storage.setItem(i, Math.random().toString(36));
        }

        expect(storage.length).toEqual(random);
    });

    test('<Storage>.[Symbol.toStringTag]', () => {
        expect(toString.call(storage)).toEqual('[object Storage]');
    });

    test('<Storage>.prototype', () => {
        expect(Object.getPrototypeOf(Storage)).toEqual(Function);
    });
});