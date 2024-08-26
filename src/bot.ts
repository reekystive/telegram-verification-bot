import dotenvFlow from 'dotenv-flow';
import { Bot } from 'grammy';
import { ProxyAgent } from 'proxy-agent';
import type { MyContext } from './context.js';

dotenvFlow.config();

const proxyAgent = new ProxyAgent();

export const bot = new Bot<MyContext>(process.env.BOT_TOKEN, {
  client: {
    baseFetchConfig: {
      agent: proxyAgent,
    },
  },
});
