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
    [key: string]: any
}

export class Storage implements IWebStorage {
    #backerKMP = new Map<string | Symbol, string>();
    #backerIdx: string[] = [];

    [key: string]: any;

    constructor() {
        // https://stackoverflow.com/a/45317277/15299271
        return new Proxy(this, {
            get: (target, prop) => {
                if (typeof prop === 'symbol') return target[prop as keyof typeof target];
                if (['key', 'getItem', 'setItem', 'removeItem', 'clear', 'length'].includes(prop)) {
                    // length is a getter
                    if (prop === 'length') return target[prop];

                    // we need to bind to target so that it can access the private key backing properties
                    return (target[prop as keyof Storage] as (...args: unknown[]) => unknown).bind(target);
                }

                return target.getItem(prop) || undefined;
            },
            set: (target, prop, value) => {
                if (typeof prop === 'symbol') {
                    // https://github.com/Microsoft/TypeScript/issues/24587
                    return target[prop as keyof typeof target] = value;
                } else {
                    target.setItem(prop, value);
                    return target.#backerKMP.has(prop);
                }
            },
            deleteProperty: (target, prop) => {
                const deleted = delete target[prop as keyof typeof target];
                if (typeof prop === 'symbol') return deleted;
                target.removeItem(prop);
                return !target.#backerKMP.has(prop);
            }
        });
    }

    public get length(): number {
        return this.#backerIdx.length;
    }

    public key(index: number): string | null {
        if (typeof index === 'number') {
            return this.#backerIdx[index] || null;
        } else {            
            return this.#backerIdx[0] || null;
        }
    }

    public getItem(key: string): string | null {
        return this.#backerKMP.get(`${key}`) || null;
    }

    public setItem(key: string, value: string): void {
        const idx = this.#backerIdx.findIndex((v) => v === `${key}`);
        if (idx === -1) {
            this.#backerIdx.push(`${key}`);
            this.#backerKMP.set(`${key}`, `${value}`);
        } else {
            this.#backerIdx.splice(idx, 1, `${key}`);
            this.#backerKMP.set(`${key}`, `${value}`);
        }
    }

    public removeItem(key: string): void {
        const idx = this.#backerIdx.findIndex((v) => v === `${key}`);
        if (idx === -1) {
            return;
        } else {
            this.#backerIdx.splice(idx, 1);
            this.#backerKMP.delete(`${key}`);
        }
    }

    public clear(): void {
        this.#backerIdx = [];
        this.#backerKMP.clear();
    }
}