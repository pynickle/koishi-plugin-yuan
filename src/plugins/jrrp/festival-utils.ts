import * as crypto from 'crypto';

import { Lunar } from 'lunar-typescript';

function getLunarNewYear(year: number): string {
  const lunar = Lunar.fromYmd(year, 1, 1);
  const solar = lunar.getSolar();
  return `${solar.getMonth()}-${solar.getDay()}`;
}

function getAprilFoolsBonus(userId: string, date: string): { bonus: number; description: string } {
  const seed = `${userId}${date}april_fools`;
  const hash = crypto.createHash('md5').update(seed).digest('hex');
  const random = parseInt(hash.substring(0, 8), 16) / 0xffffffff; // 0到1的随机数
  const choice = Math.floor(random * 3); // 随机选择 0, 1, 2

  switch (choice) {
    case 0:
      const decimalBonus = Number((random * 1.9 + 0.1).toFixed(1)); // 0.1 到 2.0
      return {
        bonus: decimalBonus,
        description: `愚人节的奇妙魔法，运气增加 ${decimalBonus} 点！`,
      };
    case 1:
      const negativeBonus = -Math.floor(random * 10 + 1); // -1 到 -10
      return {
        bonus: negativeBonus,
        description: `被愚人节恶作剧整蛊，运气下降 ${-negativeBonus} 点！`,
      };
    case 2:
      const highBonus = Math.floor(random * 31) + 20; // +20 到 +50
      return {
        bonus: highBonus,
        description: `愚人节反整蛊成功，运气爆棚 +${highBonus}！`,
      };
  }
}

export function getFestivals(year: number): { [key: string]: string } {
  return {
    '01-01': '元旦',
    [getLunarNewYear(year)]: '春节',
    '05-01': '劳动节',
    '06-01': '儿童节',
    '10-01': '国庆节',
    '12-25': '圣诞节',
    '03-08': '妇女节',
    '04-01': '愚人节',
    '05-04': '青年节',
    '09-10': '教师节',
    '11-11': '光棍节',
  };
}

export function getFestivalBonus(
  userId: string,
  date: string,
  festivals: { [key: string]: string }
): { bonus: number; description: string } {
  const monthDay = date.slice(5, 10); // MM-DD
  if (monthDay === '04-01') {
    return getAprilFoolsBonus(userId, date);
  }
  if (monthDay in festivals) {
    return {
      bonus: 10,
      description: `因${festivals[monthDay]}获得 +10 人品值！`,
    };
  }
  return { bonus: 0, description: '' };
}
