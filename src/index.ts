import { conversations, createConversation } from '@grammyjs/conversations';
import { run, sequentialize } from '@grammyjs/runner';
import { InlineKeyboard, session } from 'grammy';
import { ignoreOld } from 'grammy-middlewares';
import { bot } from './bot.js';
import { challenges } from './config.js';
import { BOT_DEVELOPER_USERNAME } from './constants.js';
import { challengeNewUser } from './conversations/challenge.js';
import { logger } from './logger.js';
import { countMessageMiddleware, createSessionData, getSessionKey, movie } from './middlewares.js';

logger.info('Parsed challenges: %o', challenges.length);

bot.use(ignoreOld(60)); // Ignore old updates (60 seconds)

bot.use(async (ctx, next) => {
  ctx.config = {
    isDeveloper: ctx.from?.username === BOT_DEVELOPER_USERNAME,
  };
  await next();
});

bot.use(sequentialize(getSessionKey));
bot.use(session({ initial: createSessionData, getSessionKey }));
bot.on('message:text', countMessageMiddleware);

bot.use(conversations());
bot.use(createConversation(movie, 'movie'));
bot.use(createConversation(challengeNewUser, 'challenge-new-user'));

await bot.api.setMyCommands([
  { command: 'start', description: 'Start the bot' },
  { command: 'help', description: 'Show help text' },
  { command: 'settings', description: 'Open settings' },
  { command: 'movie', description: "What's your favorite movie?" },
  { command: 'join', description: 'Emulate a user joining a group chat' },
]);

bot.command('start', async (ctx) => {
  logger.info('[start] %o', ctx.from?.username);
  await ctx.reply('Welcome! Up and running.');
});

bot.command('help', async (ctx) => {
  logger.info('[help] %o', ctx.from?.username);
  await ctx.reply('Developer: @reekystive');
});

bot.command('settings', async (ctx) => {
  logger.info('[settings] %o', ctx.from?.username);
  await ctx.reply('Have fun.');
});

bot.command('movie', async (ctx) => {
  await ctx.conversation.enter('movie');
});

bot.command('join').on('message:text', async (ctx) => {
  await ctx.conversation.enter('challenge-new-user');
});

bot.on('message:text').filter(
  (ctx) => ctx.message.text === 'quiz',
  async (ctx) => {
    logger.info('[message:text=quiz] %o: %o', ctx.from.username, ctx.message.text);
    const inlineKeyboard = new InlineKeyboard()
      .text('A', 'select-answer-a')
      .text('B', 'select-answer-b')
      .text('C', 'select-answer-c')
      .text('D', 'select-answer-d');
    await ctx.reply('这道题选什么？', { reply_markup: inlineKeyboard });
  }
);

bot.on('message:text').filter(
  (ctx) => ctx.message.text === 'message-count',
  async (ctx) => {
    logger.info('[message:text=message-count] %o: %o', ctx.from.username, ctx.message.text);
    await ctx.reply(`You have sent ${String(ctx.session.messageCount)} messages.`);
  }
);

bot.on('message:text', async (ctx) => {
  logger.info('[message:text] %o: %o', ctx.from.username, ctx.message.text);
  await ctx.reply(`Hello ${String(ctx.update.message.from.username)}`, {
    reply_parameters: {
      message_id: ctx.message.message_id,
    },
  });
});

bot
  .on('chat_member')
  .filter((ctx) => ctx.chatMember.old_chat_member.status === 'left')
  .filter((ctx) => ctx.chatMember.new_chat_member.status === 'member')
  .use(async (ctx) => {
    logger.info('chat_member', ctx);
    const newChatMember = ctx.chatMember.new_chat_member.user;
    await ctx.reply(`欢迎 @${String(newChatMember.username)} 加入！你需要在 5 分钟之内完成验证。`);
    await ctx.restrictChatMember(newChatMember.id, {
      can_send_messages: false,
    });
  });

bot.on('callback_query:data').filter(
  (ctx) => ctx.callbackQuery.data.startsWith('select-answer-'),
  async (ctx) => {
    logger.info('[callback_query:data=select-answer] %o: %o', ctx.from.username, ctx.callbackQuery.data);
  }
);

const handle = run(bot, {
  runner: {
    fetch: {
      allowed_updates: ['chat_member', 'message', 'callback_query'],
    },
  },
});

const stopRunner = async () => {
  await handle.stop();
};

process.on('SIGINT', () => {
  logger.info('Received SIGINT (Ctrl+C). Exiting gracefully...');
  void stopRunner().then(() => {
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM. Exiting gracefully...');
  void stopRunner().then(() => {
    process.exit(0);
  });
});

logger.info('Bot running, PID: %o', process.pid);
