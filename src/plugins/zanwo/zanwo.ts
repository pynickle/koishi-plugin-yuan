import { Context } from 'koishi';

export function zanwo(ctx: Context) {
  ctx.command('zanwo', '给你点赞').action(async ({ session }) => {
    let num = 0;
    try {
      for (num = 0; num < 2; num++) {
        await session.onebot.sendLike(session.userId, 10);
        await new Promise((r) => setTimeout(r, 1000));
      }
      return '搞定啦！记得回赞我哦！';
    } catch (e) {
      if (num > 0) return '搞定啦！记得回赞我哦！';
      return '点赞失败了，可能是今天已经赞过了哦~';
    }
  });
}
