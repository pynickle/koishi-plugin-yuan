import 'koishi-plugin-puppeteer';

import { getEmojiByName } from '@pynickle/koishi-plugin-adapter-onebot';
import { Context, Session } from 'koishi';

import { FortuneData, buildFortuneHtml, calculateFortune } from './jrys-utils';

class JrysPlugin {
  constructor(private ctx: Context) {
    this.registerCommands();
  }

  private registerCommands(): void {
    this.ctx
      .command('jrys', '查看今日运势')
      .action(async ({ session }) => this.handleJrysCommand(session));
  }

  private async handleJrysCommand(session: Session): Promise<string> {
    const fortuneData = await calculateFortune(this.ctx, session.userId, new Date());
    try {
      await session.onebot.setMsgEmojiLike(session.messageId, getEmojiByName('棒棒糖').id);
      return await this.renderToImage(fortuneData);
    } catch (error) {
      return '生成今日运势图片失败：' + error.message;
    }
  }

  private async renderToImage(fortuneData: FortuneData): Promise<string> {
    const { puppeteer } = this.ctx;

    const html = await buildFortuneHtml(fortuneData);
    return puppeteer.render(html);
  }
}

export default JrysPlugin;
