import { Storage } from '../dist/Storage.js';
import tap from 'tap';

const storage = new Storage();
const toString = Object.prototype.toString;

tap.test('<Storage> class tests', (t) => {
    t.plan(6);
    tap.afterEach(() => storage.clear());

    t.test('<Storage>.setItem', (t) => {
        t.plan(7);
        const obj = { a: '1' };

        t.equal(storage.setItem('key', 'value'), undefined, '<Storage>.setItem returns void');
        t.equal(storage.setItem('key2', obj), undefined, '<Storage>.setItem returns void (object value)');
        t.throws(() => storage.setItem('key'), TypeError, 'passing <2 args throws');
        t.doesNotThrow(() => storage.setItem('key', 'value', '1', '2', '3'), 'extraneous args are ignored');
        t.throws(() => storage.setItem(Symbol('jest'), 'jest'), TypeError, 'setting a symbol key throws');
        t.throws(() => storage.setItem('jest', Symbol('jest')), TypeError, 'setting a symbol value throws');

        t.equal(storage.length, 2); // key + key2
    });

    t.test('<Storage>.getItem', (t) => {
        t.plan(5);
        const obj = { a: '1' };
        storage.setItem('key', 'value');
        storage.setItem('key2', obj);

        t.equal(storage.getItem('key'), 'value', 'getting a key returns the correct value');
        t.equal(storage.getItem('key', '2', '3', '4'), storage.getItem('key'), 'passing >2 args ignores extraneous ones');
        t.equal(storage.getItem('key2'), toString.call(obj), 'values are stringified');
        t.equal(storage.getItem('nonexistent'), null, 'getting non-existent key returns null');
        t.throws(() => storage.getItem(Symbol('jest')), TypeError, 'getting a Symbol key throws');
    });

    t.test('<Storage>.removeItem', (t) => {
        t.plan(206);

        for (let i = 0; i < 100; i++) {
            storage.setItem(`key${i}`, `value${i}`);
            t.strictNotSame(storage.getItem(`key${i}`), undefined);
            storage.removeItem(`key${i}`);
            t.equal(storage.getItem(`key${i}`), null);
        }

        t.doesNotThrow(() => storage.removeItem('nonexistent'), 'does not throw when removing non-existent key');
        t.equal(storage.removeItem('nonexistent'), undefined, '<Storage>.removeItem returns void');
        t.doesNotThrow(() => storage.removeItem({}), 'removing a non-string key does not throw');
        t.throws(() => storage.removeItem(), TypeError, 'passing in too few args throws');
        t.doesNotThrow(() => storage.removeItem(undefined), TypeError, 'passing args=undefined does not throw');
        t.doesNotThrow(() => storage.removeItem('1', '2', '3', '4'), 'passing too many args does not throw');
    });

    t.test('<Storage>.key', (t) => {
        t.plan(101);

        for (let i = 0; i < 100; i++) {
            const key = `key${i}`;
            storage.setItem(key, Math.random().toString(36));
            t.equal(storage.key(i), key);
        }

        t.equal(storage.key(1000), null, 'if a key does not exist, returns null');
    });

    t.test('<Storage>.length', (t) => {
        t.plan(1);

        const random = Math.floor(Math.random() * 100);
        for (let i = 0; i < random; i++) {
            storage.setItem(i, Math.random().toString(36));
        }

        t.equal(storage.length, random, 'length is calculated correctly');
    });

    t.test('<Storage>.[Symbol.toStringTag]', (t) => {
        t.plan(1);

        t.equal(toString.call(storage), '[object Storage]', 'Symbol.toStringTag is set');
    });
});