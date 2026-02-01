import { Context } from 'koishi';

/**
 * Helper class for star coin operations
 */
export class StarCoinHelper {
  public static async getUserStarCoin(
    ctx: Context,
    userId: string,
    channelId: string
  ): Promise<number> {
    const records = await ctx.database.select('sign_in').where({ userId, channelId }).execute();
    return records.length > 0 ? records[0].starCoin : 0;
  }

  public static async setUserStarCoin(
    ctx: Context,
    userId: string,
    channelId: string,
    amount: number
  ): Promise<boolean> {
    if (amount < 0 || !Number.isInteger(amount)) {
      return false;
    }

    try {
      const now = new Date().getTime();

      await ctx.database.upsert(
        'sign_in',
        [
          {
            userId,
            channelId,
            starCoin: amount,
            consecutiveDays: 0,
            lastSignIn: now,
          },
        ],
        ['userId', 'channelId']
      );

      return true;
    } catch (error) {
      ctx.logger.warn('设置星币失败:', error);
      return false;
    }
  }

  public static async addUserStarCoin(
    ctx: Context,
    userId: string,
    channelId: string,
    amount: number
  ): Promise<boolean> {
    if (amount <= 0 || !Number.isInteger(amount)) {
      return false;
    }

    try {
      const records = await ctx.database.select('sign_in').where({ userId, channelId }).execute();

      const now = new Date().getTime();

      if (records.length > 0) {
        const currentStarCoin = records[0].starCoin;
        const newStarCoin = currentStarCoin + amount;
        await ctx.database.set('sign_in', { userId, channelId }, { starCoin: newStarCoin });
      } else {
        await ctx.database.upsert(
          'sign_in',
          [
            {
              userId,
              channelId,
              starCoin: amount,
              consecutiveDays: 0,
              lastSignIn: now,
            },
          ],
          ['userId', 'channelId']
        );
      }

      return true;
    } catch (error) {
      ctx.logger.warn('增加星币失败：', error);
      return false;
    }
  }

  public static async removeUserStarCoin(
    ctx: Context,
    userId: string,
    channelId: string,
    amount: number
  ): Promise<boolean> {
    if (amount < 0 || !Number.isInteger(amount)) {
      ctx.logger.info(amount);
      return false;
    }

    try {
      const records = await ctx.database.select('sign_in').where({ userId, channelId }).execute();

      if (records.length === 0) {
        return false;
      }

      const currentStarCoin = records[0].starCoin;
      const newStarCoin = Math.max(0, currentStarCoin - amount);

      await ctx.database.set('sign_in', { userId, channelId }, { starCoin: newStarCoin });

      return true;
    } catch (error) {
      ctx.logger.warn('减少星币失败:', error);
      return false;
    }
  }

  public static async hasEnoughStarCoin(
    ctx: Context,
    userId: string,
    channelId: string,
    amount: number
  ): Promise<boolean> {
    if (amount <= 0) {
      return true;
    }

    const userStarCoin = await this.getUserStarCoin(ctx, userId, channelId);
    return userStarCoin >= amount;
  }
}
