import 'koishi-plugin-adapter-onebot';

import { Context, Session } from 'koishi';

export async function getUserName(ctx: Context, session: Session, userId: string): Promise<string> {
  let userName: string;
  try {
    const memberInfo = await session.onebot.getGroupMemberInfo(session.channelId, userId);
    userName = memberInfo.card || memberInfo.nickname || userId;
  } catch (error) {
    ctx.logger.warn(`获取群成员信息失败（userId: ${userId}）：`, error);
    userName = userId;
  }

  return userName;
}

export async function getUserNameWithoutSession(
  ctx: Context,
  channelId: string,
  userId: string
): Promise<string> {
  let userName: string;

  const bot = ctx.bots[0];
  try {
    const memberInfo = await bot.internal.getGroupMemberInfo(channelId, userId);
    userName = memberInfo.card || memberInfo.nickname || userId; // 优先群名片，其次昵称，最后 QQ 号
  } catch (error) {
    ctx.logger.warn(`获取群成员信息失败（userId: ${userId}）：`, error);
    userName = userId; // 降级使用 QQ 号
  }

  return userName;
}

export function createTextMsgNode(userId: string, nickname: string, content: string) {
  return {
    type: 'node',
    data: {
      user_id: userId,
      nickname: nickname,
      content: content,
    },
  };
}

export function createTextMsg(content: string) {
  return {
    type: 'text',
    data: {
      text: content,
    },
  };
}

export function createFileMsg(content: string, type: string = 'image') {
  return {
    type: type,
    data: {
      file: content,
    },
  };
}
