import type { Conversation, ConversationFlavor } from '@grammyjs/conversations';
import type { Context, SessionFlavor } from 'grammy';

export interface BotConfig {
  isDeveloper: boolean;
}

export interface CustomFlavor {
  config: BotConfig;
}

export interface SessionData {
  messageCount: number;
  joinedAt?: number;
}

export type MyContext = Context & CustomFlavor & SessionFlavor<SessionData> & ConversationFlavor;

export type MyConversation = Conversation<MyContext>;
