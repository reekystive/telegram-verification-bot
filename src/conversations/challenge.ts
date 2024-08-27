import { InlineKeyboard } from 'grammy';
import { truncate } from 'lodash-es';
import type { Challenge } from '../config.js';
import { challenges } from '../config.js';
import type { MyContext, MyConversation } from '../context.js';
import { logger } from '../logger.js';
import { createConversationLogger } from '../utils.js';
import { generateRandomId, sampleSize, shuffle } from '../utils/conversation.js';

async function getQuestionOptions(challenge: Challenge, randomFn: () => Promise<number>) {
  const correctAnswer = {
    answer: challenge.correctAnswer,
    isCorrect: true,
    temporaryId: await generateRandomId(randomFn, 4),
  };
  const incorrectAnswers = (await sampleSize(randomFn, challenge.incorrectAnswers, 3)).map((answer) => ({
    answer,
    isCorrect: false,
    temporaryId: 'set-later',
  }));
  for (const answer of incorrectAnswers) {
    answer.temporaryId = await generateRandomId(randomFn, 4);
  }
  const shuffledAnswers = await shuffle(randomFn, [correctAnswer, ...incorrectAnswers]);
  return shuffledAnswers;
}

export async function challengeNewUser(conversation: MyConversation, ctx: MyContext) {
  if (ctx.from === undefined) {
    logger.warn('ctx.from is undefined');
    return;
  }

  const randomFn = conversation.random.bind(conversation);
  const joinedAt = await conversation.now();
  const randomId = await generateRandomId(randomFn, 8);
  const sessionId = `${joinedAt}-${randomId}`;

  const cLogger = createConversationLogger(conversation, `challenge @${ctx.from.username} ${sessionId}`);
  cLogger.debug('加入了聊天', ctx.from.username);

  await ctx.reply(
    `欢迎 @${ctx.from.username} 加入！你需要在 5 分钟之内完成验证。回答问题以解除发言限制，你有 3 次机会。`
  );
  await ctx.reply('[emulation] 你已被禁止发言');

  const challengeCount = 3;
  const selectedChallenges = await sampleSize(randomFn, challenges, challengeCount);

  void conversation.external(() => {
    logger.debug(
      selectedChallenges.map((challenge) => truncate(challenge.question, { length: 20 })),
      '抽中问题'
    );
  });

  for (const challenge of selectedChallenges) {
    cLogger.debug('当前问题: %s', truncate(challenge.question, { length: 20 }));
    const keyboard = new InlineKeyboard();
    const shuffledAnswers = await getQuestionOptions(challenge, randomFn);
    for (const { answer, temporaryId } of shuffledAnswers) {
      keyboard.text(answer, temporaryId);
    }
    await ctx.reply(challenge.question, {
      reply_markup: keyboard,
    });

    cLogger.debug('问题已发送, 等待回答');
    const chooseId = await conversation.waitForCallbackQuery(
      shuffledAnswers.map((answer) => answer.temporaryId),
      {
        otherwise: async () => {
          cLogger.warn('非法选项');
        },
      }
    );

    cLogger.debug('选择了 %s', chooseId.match);
    const answer = shuffledAnswers.find((answer) => answer.temporaryId === chooseId.match);
    if (answer === undefined) {
      throw new Error('answer is undefined');
    }
    if (answer.isCorrect) {
      cLogger.debug('回答正确. 选择: %s', ctx.from.username, truncate(answer.answer, { length: 10 }));
      await ctx.reply('回答正确！');
      await ctx.reply('[emulation] 你现在可以正常发言!');
      return;
    } else {
      cLogger.debug('回答错误. 选择: %s', ctx.from.username, truncate(answer.answer, { length: 10 }));
      await ctx.reply('回答错误！来看看另一个问题');
      continue;
    }
  }

  cLogger.debug('回答错误次数过多, 请联系管理员解除封禁');
  await ctx.reply('回答错误次数过多, 请联系管理员解除封禁');
}
