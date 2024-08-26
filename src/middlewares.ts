import type { SessionData } from './context.js';

export function createSessionData(): SessionData {
  return { messageCount: 0 };
}
