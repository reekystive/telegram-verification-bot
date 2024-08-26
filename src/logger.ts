import { pino } from 'pino';
import pretty from 'pino-pretty';
import { IS_DEV } from './env.js';

const stream = pretty();

export const logger = pino({ level: IS_DEV ? 'debug' : 'info' }, stream);
