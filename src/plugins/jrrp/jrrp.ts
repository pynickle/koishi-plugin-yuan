import { Context, Session, h } from 'koishi';

import { Config } from '../../index';
import { createTextMsgNode, getUserName } from '../../utils/onebot-utils';
import { formatDate, getTodayString } from '../../utils/time-utils';
import { calculateAndStoreLuck, formatTodayLuckMessage } from './jrrp-utils';

export interface Jrrp {
  id: number;
  userId: string;
  date: string;
  luck: number;
}

declare module 'koishi' {
  interface Tables {
    jrrp: Jrrp;
  }
}

class JrrpPlugin {
  constructor(
    private ctx: Context,
    private config: Config
  ) {
    this.setupDatabase();
    this.registerCommands();
  }

  private async getUserLuckRecord(userId: string, date: string): Promise<Jrrp | null> {
    const records = await this.ctx.database.select('jrrp').where({ userId, date }).execute();
    return records.length > 0 ? records[0] : null;
  }

  private setupDatabase(): void {
    this.ctx.model.extend(
      'jrrp',
      {
        id: 'unsigned',
        userId: 'string',
        date: 'string',
        luck: 'integer',
      },
      {
        primary: 'id',
        autoInc: true,
        unique: [['userId', 'date']],
      }
    );
  }

  private registerCommands(): void {
    this.ctx
      .command('jrrp', '查看今日人品')
      .action(async ({ session }) => this.handleJrrpCommand(session));

    this.ctx
      .command('jrrp.rank', '查看群内今日人品排行榜')
      .action(async ({ session }) => this.handleRankCommand(session));

    this.ctx
      .command('jrrp.history', '查看最近 7 天的人品记录')
      .action(async ({ session }) => this.handleHistoryCommand(session));
  }

  private async handleJrrpCommand(session: Session): Promise<string> {
    const today = getTodayString();
    const { userId } = session;

    const existingRecord = await this.getUserLuckRecord(userId, today);
    if (existingRecord) {
      return formatTodayLuckMessage(userId, today, existingRecord.luck);
    }

    const luck = await calculateAndStoreLuck(this.ctx, session, today);
    return formatTodayLuckMessage(userId, today, luck);
  }

  private async handleRankCommand(session: Session): Promise<string | void> {
    if (!session.guildId) {
      return '请在群聊中使用排行榜命令哦！';
    }

    const today = getTodayString();
    const rankings = await this.getRankings(session, today);

    if (!rankings.length) {
      return '今日群内暂无人品数据。';
    }

    await this.sendForwardMessage(session, rankings);
  }

  private async getRankings(session: Session, date: string): Promise<Jrrp[]> {
    let groupMembers = [];
    if (session.guildId) {
      try {
        const members = await session.onebot.getGroupMemberList(session.onebot.group_id);
        groupMembers = members.map((member) => member.user_id);
      } catch (error) {
        this.ctx.logger.warn('获取群成员列表失败：', error);
      }
    }

    const query = this.ctx.database
      .select('jrrp')
      .where({
        userId: { $in: groupMembers },
        date,
      })
      .orderBy('luck', 'desc');

    return await query.limit(50).execute();
  }

  private async formatRankingMessage(session: Session, rankings: Jrrp[]): Promise<string> {
    const rankEntries = await Promise.all(
      rankings.map(async (rank, index) => {
        const userName = await getUserName(this.ctx, session, rank.userId);
        return `${index + 1}. ${h.escape(userName)} - 人品值：${rank.luck}`;
      })
    );

    return '今日人品排行榜：\n' + rankEntries.join('\n');
  }

  private async sendForwardMessage(session: Session, rankings: Jrrp[]): Promise<void> {
    const botName = (await getUserName(this.ctx, session, session.bot?.userId)) || 'Bot';
    const rankingText = await this.formatRankingText(session, rankings);

    await session.onebot.sendGroupForwardMsg(session.onebot.group_id, [
      createTextMsgNode(session.bot?.userId, botName, '今日人品排行榜'),
      createTextMsgNode(session.bot?.userId, botName, rankingText),
    ]);
  }

  private async formatRankingText(session: Session, rankings: Jrrp[]): Promise<string> {
    const rankEntries = await Promise.all(
      rankings.map(async (rank, index) => {
        const userName = await getUserName(this.ctx, session, rank.userId);
        return `${index + 1}. ${h.escape(userName)} - 人品值：${rank.luck}`;
      })
    );

    return rankEntries.join('\n');
  }

  private async handleHistoryCommand(session: Session): Promise<string> {
    const { userId } = session;
    const { startDateStr, todayStr } = this.getHistoryDateRange();
    const history = await this.getHistoryRecords(userId, startDateStr, todayStr);

    if (!history.length) {
      return '最近 7 天内暂无人品记录。';
    }

    return await this.formatHistoryMessage(session, history);
  }

  private getHistoryDateRange() {
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 6);
    return {
      startDateStr: formatDate(startDate),
      todayStr: formatDate(today),
    };
  }

  private async getHistoryRecords(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<Jrrp[]> {
    return await this.ctx.database
      .select('jrrp')
      .where({
        userId,
        date: { $gte: startDate, $lte: endDate },
      })
      .orderBy('date', 'desc')
      .execute();
  }

  private async formatHistoryMessage(session: Session, history: Jrrp[]): Promise<string> {
    const userName = await getUserName(this.ctx, session, session.userId);
    let output = `${h.escape(userName)} 最近 7 天的人品记录：\n`;

    for (const record of history) {
      output += `${record.date} - 人品值：${record.luck}\n`;
    }

    return output;
  }
}

export default JrrpPlugin;
