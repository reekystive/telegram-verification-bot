import dotenvFlow from 'dotenv-flow';
import type { Context, SessionFlavor } from 'grammy';
import { Bot, InlineKeyboard, session } from 'grammy';
import { ProxyAgent } from 'proxy-agent';
import { BOT_DEVELOPER_USERNAME } from './constants.js';

dotenvFlow.config();

const proxyAgent = new ProxyAgent();

interface BotConfig {
  isDeveloper: boolean;
}

interface SessionData {
  messageCount: number;
}

type MyContext = Context & {
  config: BotConfig;
} & SessionFlavor<SessionData>;

function createSessionData(): SessionData {
  return { messageCount: 0 };
}

const bot = new Bot<MyContext>(process.env.BOT_TOKEN, {
  client: {
    baseFetchConfig: {
      agent: proxyAgent,
    },
  },
});

bot.use(async (ctx, next) => {
  ctx.config = {
    isDeveloper: ctx.from?.username === BOT_DEVELOPER_USERNAME,
  };
  await next();
});

bot.use(session({ initial: createSessionData }));

await bot.api.setMyCommands([
  { command: 'start', description: 'Start the bot' },
  { command: 'help', description: 'Show help text' },
  { command: 'settings', description: 'Open settings' },
]);

bot.on('message:text', async (ctx, next) => {
  ctx.session.messageCount = ctx.session.messageCount + 1;
  await next();
});

bot.command('start', async (ctx) => {
  console.log('[start] %o', ctx.from?.username);
  await ctx.reply('Welcome! Up and running.');
});

bot.command('help', async (ctx) => {
  console.log('[help] %o', ctx.from?.username);
  await ctx.reply('Developer: @reekystive');
});

bot.command('settings', async (ctx) => {
  console.log('[settings] %o', ctx.from?.username);
  await ctx.reply('Have fun.');
});

bot.on('message:text').filter(
  (ctx) => ctx.message.text === 'quiz',
  async (ctx) => {
    console.log('[message:text=quiz] %o: %o', ctx.from.username, ctx.message.text);
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
    console.log('[message:text=message-count] %o: %o', ctx.from.username, ctx.message.text);
    await ctx.reply(`You have sent ${String(ctx.session.messageCount)} messages.`);
  }
);

bot.on('message:text', async (ctx) => {
  console.log('[message:text] %o: %o', ctx.from.username, ctx.message.text);
  await ctx.reply(`Hello ${String(ctx.update.message.from.username)}`, {
    reply_parameters: {
      message_id: ctx.message.message_id,
    },
  });
});

bot.on('chat_member', async (ctx) => {
  console.log('chat_member', ctx);
  const newChatMember = ctx.chatMember.new_chat_member.user;
  await ctx.reply(`欢迎 @${String(newChatMember.username)} 加入！你需要在 5 分钟之内完成验证。`);
  await ctx.restrictChatMember(newChatMember.id, {
    can_send_messages: false,
  });
});

bot.on('callback_query:data').filter(
  (ctx) => ctx.callbackQuery.data.startsWith('select-answer-'),
  async (ctx) => {
    console.log('[callback_query:data=select-answer] %o: %o', ctx.from.username, ctx.callbackQuery.data);
  }
);

void bot.start({
  allowed_updates: ['chat_member', 'message', 'callback_query'],
});
