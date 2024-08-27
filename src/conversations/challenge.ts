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
  const newChatMember = ctx.chatMember?.new_chat_member.user ?? null;
  if (ctx.chatMember?.new_chat_member.user.id === undefined) {
    logger.warn('ctx.chatMember.new_chat_member.user.id is undefined');
  }

  if (newChatMember !== null) {
    await ctx.restrictChatMember(newChatMember.id, {
      can_send_messages: false,
      can_add_web_page_previews: false,
      can_change_info: false,
      can_invite_users: false,
      can_manage_topics: false,
      can_pin_messages: false,
      can_send_audios: false,
      can_send_documents: false,
      can_send_other_messages: false,
      can_send_photos: false,
      can_send_polls: false,
      can_send_video_notes: false,
      can_send_videos: false,
      can_send_voice_notes: false,
    });
  }

  const randomFn = conversation.random.bind(conversation);
  const joinedAt = await conversation.now();
  const randomId = await generateRandomId(randomFn, 8);
  const sessionId = `${joinedAt}-${randomId}`;

  const cLogger = createConversationLogger(conversation, `challenge @${ctx.from.username} ${sessionId}`);
  cLogger.debug('加入了聊天', ctx.from.username);

  await ctx.reply(
    `欢迎 @${ctx.from.username} 加入！你需要在 3 分钟之内完成身份验证，正确回答任意问题以解除发言限制。你有 3 次机会，每个问题只能回答一次。`
  );

  const challengeCount = 3;
  const selectedChallenges = await sampleSize(randomFn, challenges, challengeCount);

  void conversation.external(() => {
    logger.debug(
      selectedChallenges.map((challenge) => truncate(challenge.question, { length: 20 })),
      '抽中问题'
    );
  });

  for (const [index, challenge] of selectedChallenges.entries()) {
    cLogger.debug('当前问题: %s', truncate(challenge.question, { length: 20 }));
    const keyboard = new InlineKeyboard();
    const shuffledAnswers = await getQuestionOptions(challenge, randomFn);
    for (const { answer, temporaryId } of shuffledAnswers) {
      keyboard.text(answer, temporaryId);
    }
    keyboard.row();
    const isLast = challengeCount - index == 1;
    if (!isLast) {
      keyboard.text('不晓得，换一道', 'another');
    }
    const remain = isLast ? '*这是你最后的机会。*' : `你还可以回答 ${challengeCount - index} 次。`;
    const mention = ctx.from.username ? `@${ctx.from.username}\n\n` : '';
    await ctx.reply(
      `${mention}*${challenge.question}*\n\n点击下方的按钮来回答此问题。\n注意，每道题目只有 1 次选择机会。${remain}`,
      {
        reply_markup: keyboard,
        parse_mode: 'MarkdownV2',
      }
    );

    cLogger.debug('问题已发送, 等待回答');
    const chooseCtx = await conversation.waitForCallbackQuery(
      [...shuffledAnswers.map((answer) => answer.temporaryId), 'another'],
      {
        otherwise: async () => {
          cLogger.warn('非法选项');
        },
      }
    );
    await chooseCtx.answerCallbackQuery();

    cLogger.debug('选择了 %s', chooseCtx.match);

    if (chooseCtx.match === 'another') {
      await ctx.reply('好的，我们来换一个题目看看');
      continue;
    }

    const answer = shuffledAnswers.find((answer) => answer.temporaryId === chooseCtx.match);
    if (answer === undefined) {
      throw new Error('answer is undefined');
    }
    if (answer.isCorrect) {
      cLogger.debug('回答正确. 选择: %s', ctx.from.username, truncate(answer.answer, { length: 10 }));
      await ctx.reply('回答正确！你已通过验证，现在可以正常发言!');
      if (newChatMember !== null) {
        await ctx.restrictChatMember(newChatMember.id, {
          can_send_messages: true,
          can_add_web_page_previews: true,
          can_change_info: true,
          can_invite_users: true,
          can_manage_topics: true,
          can_pin_messages: true,
          can_send_audios: true,
          can_send_documents: true,
          can_send_other_messages: true,
          can_send_photos: true,
          can_send_polls: true,
          can_send_video_notes: true,
          can_send_videos: true,
          can_send_voice_notes: true,
        });
      }
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
