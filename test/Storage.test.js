import { test, expect, describe, afterEach } from '@jest/globals';
import { Storage } from '../dist/Storage.js';

const storage = new Storage();
const toString = Object.prototype.toString;

describe('<Storage> class tests', () => {
    afterEach(() => storage.clear());

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
        expect(storage.removeItem('nonexistent')).toBeUndefined();
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

        expect(storage.key(1000)).toBeNull();
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
});