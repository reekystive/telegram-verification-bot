import { pino } from 'pino';
import pretty from 'pino-pretty';
import { IS_DEV } from './env.js';

const stream = pretty();

export const logger = pino({ level: IS_DEV ? 'debug' : 'info' }, stream);

logger.info('hello world');

const child = logger.child({ a: 'property', b: 'hello' });
child.info('hello child!');

logger.info('hello world again');

logger.info({ a: 'property', b: 'hello' }, 'hello object');
