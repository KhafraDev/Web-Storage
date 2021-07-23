import { createHash } from 'crypto';

export const url = () => createHash('sha256').update(import.meta.url).digest('hex');