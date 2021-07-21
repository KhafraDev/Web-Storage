import { test, expect, describe, afterEach } from '@jest/globals';
import { Storage } from '../dist/Storage.js';

const storage = new Storage();

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
});