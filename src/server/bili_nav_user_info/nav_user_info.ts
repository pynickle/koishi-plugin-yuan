import axios from 'axios';
import { Context } from 'koishi';

import { Config } from '../../index';

export const name = 'nav-user-info';

async function getBilibiliNav(data) {
  const sessdataMatch = data.match(/SESSDATA=([^;]+)/);
  if (!sessdataMatch) {
    console.error('SESSDATA not found in cookie string');
    return;
  }

  const url = `https://api.bilibili.com/x/web-interface/nav`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Cookie: data,
    },
  });

  if (!response.ok) {
    console.error('Network response was not ok', response.statusText);
    return;
  }

  return await response.json();
}

export function nav_user_info(ctx: Context, config: Config) {
  ctx.server.post('/api/user-info', async (koaCtx: any) => {
    try {
      let body = koaCtx.request.body;
      if (!body) {
        koaCtx.response.body = { error: 'Invalid JSON body' };
        return (koaCtx.status = 400);
      }

      const cookie = body['cookie'];
      if (!cookie) {
        koaCtx.response.body = {
          error: 'Missing required fields cookie',
        };
        return (koaCtx.status = 400);
      }

      const cookieInfo = await getBilibiliNav(cookie);
      if (cookieInfo.length === 0 || cookieInfo.code !== 0) {
        koaCtx.response.body = { error: 'Failed to get user info' };
        return (koaCtx.status = 400);
      }

      const face = cookieInfo.data.face;
      const base64 = await loadImageAsBase64(face);
      koaCtx.response.body = { ...cookieInfo, faceBase64: base64 };
      koaCtx.status = 200;
    } catch (error) {
      ctx.logger('cookie').error('Bind cookie error:', error);
      koaCtx.response.body = { error: 'Internal server error' };
      koaCtx.status = 500;
    }
  });
}

async function loadImageAsBase64(imageUrl: string): Promise<string> {
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Node.js)',
      },
    });

    const mimeType = response.headers['content-type'] || 'image/png';

    const base64Data = Buffer.from(response.data, 'binary').toString('base64');
    return `data:${mimeType};base64,${base64Data}`;
  } catch (error) {
    console.error('Error loading image:', error);
    throw error;
  }
}
