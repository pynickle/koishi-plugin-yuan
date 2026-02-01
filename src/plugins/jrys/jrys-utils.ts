import 'koishi-plugin-puppeteer';

import axios from 'axios';
import { Solar } from 'lunar-typescript';

import { BiasType, random, randomChoice, randomInt } from '../../utils/pseudo-random-utils';

export interface FortuneData {
  score: number;
  randomNum: number;
  sentence: string;
  sentenceFrom: string;
  dos: string;
  donts: string;
  luckyColor: string;
  luckyNumber: number;
  solarDate: string;
}

export const COLOR_MAP: Record<string, string> = {
  red: '#E63946',
  orange: '#F77F00',
  yellow: '#FFD60A',
  green: '#06D6A0',
  cyan: '#00B4D8',
  blue: '#4361EE',
  purple: '#7209B7',
  pink: '#FF006E',
  gold: '#FFB703',
  silver: '#ADB5BD',
  black: '#212529',
  gray: '#6C757D',
  brown: '#8B4513',
  beige: '#F4E4C1',
};

export const COLOR_NAME_MAP: Record<string, string> = {
  red: '红色',
  orange: '橙色',
  yellow: '黄色',
  green: '绿色',
  cyan: '青色',
  blue: '蓝色',
  purple: '紫色',
  pink: '粉色',
  gold: '金色',
  silver: '银色',
  black: '黑色',
  gray: '灰色',
  brown: '棕色',
  beige: '米色',
};

const FALLBACK_SENTENCES = [
  '心若向阳,无畏悲伤。',
  '一切都会好起来的。',
  '每一个平凡的日子都值得珍惜。',
  '保持微笑,好运自然来。',
  '今天也要元气满满!',
];

const HITOKOTO_API_URL = 'http://hitokoto_api:8000';
const HITOKOTO_TIMEOUT = 5000;
const PICSUM_TIMEOUT = 15000;
const BACKUP_IMAGE_TIMEOUT = 10000;

export async function calculateFortune(userId: string, targetDate: Date): Promise<FortuneData> {
  const solar = Solar.fromDate(targetDate);
  const lunar = solar.getLunar();

  const seed1 = `${userId}${targetDate.getFullYear()}${targetDate.getMonth()}${targetDate.getDate()}`;
  const seed2 = `${seed1}_;Y?hv7P.aFLf[w]?O"}MBsc')V=)hD(?)`;

  const bias: BiasType = 'none';
  const randomNum = random(seed1);
  const score = randomInt(1, 100, seed1, { bias });

  const colorKeys = Object.keys(COLOR_MAP);
  const englishColorKey = randomChoice<string>(colorKeys, seed2);
  const luckyColor = COLOR_NAME_MAP[englishColorKey];
  const luckyNumber = randomInt(1, 100, seed2);

  const solarDate = `${targetDate.getFullYear()}年${targetDate.getMonth() + 1}月${targetDate.getDate()}日`;

  const dos = lunar.getDayYi().slice(0, 7).join(' ');
  const donts = lunar.getDayJi().slice(0, 7).join(' ');

  const { sentence, sentenceFrom } = await fetchHitokoto(seed1);

  return {
    score,
    randomNum,
    dos,
    donts,
    luckyColor,
    luckyNumber,
    solarDate,
    sentence,
    sentenceFrom,
  };
}

async function fetchHitokoto(
  fallbackSeed: string
): Promise<{ sentence: string; sentenceFrom: string }> {
  try {
    const res = await axios.get(HITOKOTO_API_URL, {
      timeout: HITOKOTO_TIMEOUT,
    });
    return {
      sentence: res.data.hitokoto,
      sentenceFrom: res.data.from,
    };
  } catch (error) {
    return {
      sentence: randomChoice(FALLBACK_SENTENCES, fallbackSeed),
      sentenceFrom: '系统提示',
    };
  }
}

export async function getFortuneImageBase64(randomNum: number): Promise<string> {
  const picsumUrl = `https://picsum.photos/seed/${randomNum}/400/120`;

  try {
    return await fetchImageAsBase64(picsumUrl, PICSUM_TIMEOUT);
  } catch (error) {
    return await fetchBackupImage(randomNum);
  }
}

async function fetchImageAsBase64(url: string, timeout: number): Promise<string> {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout,
  });
  const base64 = Buffer.from(response.data).toString('base64');
  return `data:image/jpeg;base64,${base64}`;
}

async function fetchBackupImage(randomNum: number): Promise<string> {
  const randomImageNum = randomInt(1, 50, randomNum.toString());
  const backupUrl = `http://47.117.27.240:5140/files/${randomImageNum}.jpg`;

  try {
    return await fetchImageAsBase64(backupUrl, BACKUP_IMAGE_TIMEOUT);
  } catch (backupError) {
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  }
}

export async function buildFortuneHtml(fortuneData: FortuneData): Promise<string> {
  const imageUrl = await getFortuneImageBase64(fortuneData.randomNum);
  const luckyColorValue = getColorValue(fortuneData.luckyColor);

  return `
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=400, initial-scale=1.0" />
    <title>今日运势</title>
    <link href="https://cdn.bootcdn.net/ajax/libs/bulma/1.0.4/css/bulma.min.css" rel="stylesheet" />
    <style>
      body {
          width: 400px;
          font-size: 14px;
          font-family: "Maple Mono NF CN", serif;
      }

      .hero-image-wrapper {
          position: relative;
          width: 400px;
          height: 120px;
      }

      .hero-overlay-text {
          position: absolute;
          bottom: 10px;
          right: 10px;
          text-shadow: 0 0 3px rgba(0, 0, 0, 0.8);
      }

      .hero-date-tag {
          position: absolute;
          top: 10px;
          left: 10px;
      }

      .icon {
          color: ${luckyColorValue};
      }
    </style>
  </head>
  <body>
      <div class="hero-image-wrapper">
        <img src="${imageUrl}" alt="每日运势图片" />
        <div class="hero-overlay-text">
          <p class="title is-4 has-text-white mb-0">今日运势</p>
        </div>
        <div class="hero-date-tag">
          <span class="tag is-dark is-medium">${fortuneData.solarDate}</span>
        </div>
      </div>

      <div class="has-text-centered mt-4 pb-4">
        <div class="mt-2">
          <span class="icon-text">
            <span class="icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-clover-icon lucide-clover"
              >
                <path d="M16.17 7.83 2 22" />
                <path
                  d="M4.02 12a2.827 2.827 0 1 1 3.81-4.17A2.827 2.827 0 1 1 12 4.02a2.827 2.827 0 1 1 4.17 3.81A2.827 2.827 0 1 1 19.98 12a2.827 2.827 0 1 1-3.81 4.17A2.827 2.827 0 1 1 12 19.98a2.827 2.827 0 1 1-4.17-3.81A1 1 0 1 1 4 12"
                />
                <path d="m7.83 7.83 8.34 8.34" />
              </svg>
            </span>
            <p class="title is-4 ml-1">运势指数：${fortuneData.score}</p>
          </span>

          <div class="mt-5 ml-3 is-flex is-justify-content-center is-align-items-center is-flex-direction-column">
            <p class="subtitle is-6 mb-0">${fortuneData.sentence}</p>
            <p class="is-size-7 has-text-grey mt-1">—— ${fortuneData.sentenceFrom}</p>
          </div>

          <div class="is-flex is-justify-content-center is-align-items-center my-5">
            <span class="icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect width="12" height="12" x="2" y="10" rx="2" ry="2" />
                <path
                  d="m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6"
                />
                <path d="M6 18h.01" />
                <path d="M10 14h.01" />
                <path d="M15 6h.01" />
                <path d="M18 9h.01" />
              </svg>
            </span>
            <p><span class="has-text-weight-bold ml-1">幸运数字:</span> ${fortuneData.luckyNumber}</p>

            <span class="icon ml-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"
                />
                <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
                <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
                <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
                <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
              </svg>
            </span>
            <p><span class="has-text-weight-bold ml-1">幸运颜色:</span> ${fortuneData.luckyColor}</p>
          </div>

          <p><span class="has-text-weight-bold">宜:</span> ${fortuneData.dos}</p>
          <p><span class="has-text-weight-bold">忌:</span> ${fortuneData.donts}</p>
        </div>
      </div>
  </body>
</html>
    `.trim();
}

export function getColorValue(colorName: string): string {
  if (COLOR_MAP[colorName]) {
    return COLOR_MAP[colorName];
  }

  const englishKey = Object.keys(COLOR_NAME_MAP).find((key) => COLOR_NAME_MAP[key] === colorName);

  return englishKey ? COLOR_MAP[englishKey] || '#000000' : '#000000';
}
