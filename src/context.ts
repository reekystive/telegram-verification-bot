import type { Context, SessionFlavor } from 'grammy';

export interface BotConfig {
  isDeveloper: boolean;
}

export interface SessionData {
  messageCount: number;
}

export type MyContext = Context & {
  config: BotConfig;
} & SessionFlavor<SessionData>;
