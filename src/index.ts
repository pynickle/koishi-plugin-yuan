import '@pynickle/koishi-plugin-adapter-onebot';

import { Context } from 'koishi';

import { Config } from './config/config';
import { bind } from './plugins/bili/bind/bind';
import { thousand_likes } from './plugins/bili/thousand_likes/thousand_likes';
import { watch_time } from './plugins/bili/watch_time/watch_time';
import JrrpPlugin from './plugins/jrrp/jrrp';
import JrysPlugin from './plugins/jrys/jrys';
import StarCoinPlugin from './plugins/starcoin/starcoin';
import { zanwo } from './plugins/zanwo/zanwo';

export const name = 'yuan';

export const inject = ['database', 'puppeteer', 'server'];

export * from './config/config';

export function apply(ctx: Context, cfg: Config) {
  ctx.plugin(zanwo);
  ctx.plugin(StarCoinPlugin);
  ctx.plugin(JrrpPlugin);
  ctx.plugin(JrysPlugin);

  // Register bili plugins
  ctx.plugin(bind);
  ctx.plugin(watch_time);
  ctx.plugin(thousand_likes);
}
