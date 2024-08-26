import type { Context, NextFunction } from 'grammy';
import type { MyContext, MyConversation, SessionData } from './context.js';
import { logger } from './logger.js';
import { createConversationLogger } from './utils.js';

export function createSessionData(): SessionData {
  return { messageCount: 0 };
}

export function getSessionKey(ctx: Context): string | undefined {
  return ctx.from === undefined || ctx.chat === undefined ? undefined : `${ctx.from.id}/${ctx.chat.id}`;
}

export const countMessageMiddleware = async (ctx: MyContext, next: NextFunction) => {
  logger.debug('running message counter middleware');
  ctx.session.messageCount = ctx.session.messageCount + 1;
  await next();
};

export async function movie(conversation: MyConversation, ctx: MyContext) {
  const cLogger = createConversationLogger(conversation);
  cLogger.debug('你有多少部最喜欢的电影？');
  await ctx.reply('你有多少部最喜欢的电影？');
  const count = await conversation.form.number();
  const movies: string[] = [];
  for (let i = 0; i < count; i++) {
    cLogger.debug(`告诉我第 ${i + 1} 名！`);
    await ctx.reply(`告诉我第 ${i + 1} 名！`);
    const titleCtx = await conversation.waitFor(':text');
    movies.push(titleCtx.msg.text);
  }
  cLogger.debug('这里有一个更好的排名！');
  await ctx.reply('这里有一个更好的排名！');
  movies.sort();
  await ctx.reply(movies.map((m, i) => `${i + 1}. ${m}`).join('\n'));
}
