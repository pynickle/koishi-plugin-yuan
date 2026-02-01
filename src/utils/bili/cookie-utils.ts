export interface BiliCookies {
  buvid3: string;
  SESSDATA: string;
  bili_jct: string;
  DedeUserID: string;
  DedeUserID__ckMd5: string;
  sid: string;
}

function extractValue(cookieString: string, key: string): string | undefined {
  if (!cookieString) return undefined;

  const parts = cookieString.split(';');
  for (const part of parts) {
    const trimmedPart = part.trim();
    if (!trimmedPart) continue;

    const indexOfEquals = trimmedPart.indexOf('=');
    if (indexOfEquals === -1) continue;

    const partKey = trimmedPart.substring(0, indexOfEquals).trim();
    const value = trimmedPart.substring(indexOfEquals + 1).trim();

    if (partKey === key) {
      return value;
    }
  }
  return undefined;
}

export function extractBiliJct(cookieString: string): string | undefined {
  return extractValue(cookieString, 'bili_jct');
}
