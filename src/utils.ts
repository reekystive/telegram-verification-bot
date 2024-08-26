import type pino from 'pino';
import type { MyConversation } from './context.js';
import { logger } from './logger.js';

export const createConversationLogger = (conversation: MyConversation) => {
  const createWrappedLogFn = (logFn: pino.LogFn) => {
    return (msg: string, ...args: unknown[]) => {
      void conversation.external(() => logFn(msg, ...args));
    };
  };
  const conversationLogger = {
    ...logger,
    debug: createWrappedLogFn(logger.debug.bind(logger)),
    info: createWrappedLogFn(logger.info.bind(logger)),
    warn: createWrappedLogFn(logger.warn.bind(logger)),
    error: createWrappedLogFn(logger.error.bind(logger)),
    fatal: createWrappedLogFn(logger.fatal.bind(logger)),
  };
  return conversationLogger;
};
