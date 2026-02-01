import axios from 'axios';
import { Context } from 'koishi';

const mixinKeyEncTab = [
  46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49, 33, 9, 42, 19, 29, 28,
  14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40, 61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54,
  21, 56, 59, 6, 63, 57, 62, 11, 36, 20, 34, 44, 52,
];

interface WbiKeysCache {
  mid: number;
  img_key: string;
  sub_key: string;
  create_date: Date;
}

declare module 'koishi' {
  interface Tables {
    wbi_keys_cache: WbiKeysCache;
  }
}

export function getMixinKey(orig: string): string {
  return mixinKeyEncTab
    .map((n) => orig[n])
    .join('')
    .slice(0, 32);
}

export function encWbi(params: Record<string, string>, img_key: string, sub_key: string): string {
  getMixinKey(img_key + sub_key);

  const curr_time = Math.round(Date.now() / 1000);
  const chr_filter = /[!'()*]/g;

  Object.assign(params, { wts: curr_time.toString() });

  const query = Object.keys(params)
    .sort()
    .map((key) => {
      const value = params[key].toString().replace(chr_filter, '');
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    })
    .join('&');

  return query + '&w_rid=';
}

export function initWbiKeysCache(ctx: Context): void {
  ctx.model.extend(
    'wbi_keys_cache',
    {
      mid: 'unsigned',
      img_key: 'string',
      sub_key: 'string',
      create_date: 'date',
    },
    {
      primary: 'mid',
    }
  );
}

export async function getWbiKeys(
  ctx: Context,
  cookie: string,
  mid: number
): Promise<{ img_key: string; sub_key: string } | null> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const result = await ctx.database.get('wbi_keys_cache', {
      mid,
      create_date: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    let cachedKeyRecord: WbiKeysCache | null;
    if (Array.isArray(result) && result.length > 0) {
      cachedKeyRecord = result[0];
    } else {
      cachedKeyRecord = null;
    }

    if (
      cachedKeyRecord &&
      typeof cachedKeyRecord.img_key === 'string' &&
      typeof cachedKeyRecord.sub_key === 'string'
    ) {
      ctx.logger('bili-wbi').info(`使用缓存的 WBI Keys (MID: ${mid})`);
      return {
        img_key: cachedKeyRecord.img_key,
        sub_key: cachedKeyRecord.sub_key,
      };
    }

    const response = await axios.get('https://api.bilibili.com/x/web-interface/nav', {
      headers: {
        Cookie: cookie,
      },
    });
    const data = response.data;
    if (!data || !data.data || !data.data.wbi_img) {
      ctx.logger('bili-wbi').error('无法获取 WBI 图像信息');
      return null;
    }

    const img_url = data.data.wbi_img.img_url;
    const sub_url = data.data.wbi_img.sub_url;

    const img_key = img_url.slice(img_url.lastIndexOf('/') + 1, img_url.lastIndexOf('.'));
    const sub_key = sub_url.slice(sub_url.lastIndexOf('/') + 1, sub_url.lastIndexOf('.'));

    await ctx.database.upsert('wbi_keys_cache', [
      {
        mid,
        img_key,
        sub_key,
        create_date: new Date(),
      },
    ]);

    ctx.logger('bili-wbi').info(`已缓存 WBI Keys (MID: ${mid})`);

    return {
      img_key,
      sub_key,
    };
  } catch (error) {
    ctx.logger('bili-wbi').error('获取 WBI Keys 失败：', error);
    return null;
  }
}

export async function generateSignedUrl(
  baseUrl: string,
  params: Record<string, string>,
  img_key: string,
  sub_key: string
): Promise<string> {
  let signedQuery = encWbi(params, img_key, sub_key);

  const crypto = await import('crypto');
  const md5 = crypto.createHash('md5').update(signedQuery.slice(0, -8)).digest('hex');
  signedQuery = signedQuery.slice(0, -8) + md5;

  return `${baseUrl}?${signedQuery}`;
}
