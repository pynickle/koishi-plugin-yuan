import '@pynickle/koishi-plugin-adapter-onebot';

import { Context } from 'koishi';
import { cookie } from 'koishi-plugin-edge-seeker/lib/server/bili_cookie/cookie';
import { nav_user_info } from 'koishi-plugin-edge-seeker/lib/server/bili_nav_user_info/nav_user_info';
import { cors } from 'koishi-plugin-edge-seeker/lib/server/cors';

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
  ctx.plugin(zanwo, cfg);

  ctx.plugin(StarCoinPlugin, cfg);
  ctx.plugin(JrrpPlugin, cfg);
  ctx.plugin(JrysPlugin, cfg);

  // Register bili plugins
  ctx.plugin(bind, cfg);
  ctx.plugin(watch_time, cfg);
  ctx.plugin(thousand_likes, cfg);

  ctx.plugin(cors, cfg);
  ctx.plugin(cookie, cfg);
  ctx.plugin(nav_user_info, cfg);
}
