export const INSTAGRAM_SYNC_TIMEZONE = "America/Sao_Paulo";

const USERNAME_PATTERN = /^[a-z0-9._]{1,30}$/;

export type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

export function parseInstagramUsername(raw: string): string | null {
  let value = raw.trim();
  const fromUrl = value.match(/instagram\.com\/([A-Za-z0-9._]+)/i);
  if (fromUrl?.[1]) value = fromUrl[1];
  value = value.replace(/^@+/, "").replace(/\/+$/, "").toLowerCase();
  if (!USERNAME_PATTERN.test(value)) return null;
  return value;
}

export function captionToNotification(caption: string | null | undefined, username: string): { title: string; description: string } {
  const text = (caption ?? "").replace(/\r/g, "").trim();
  const firstLine = text
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);
  const fallback = `Nova publicação de @${username}`;
  const titleBase = firstLine || fallback;
  const title = titleBase.length > 120 ? `${titleBase.slice(0, 117)}…` : titleBase;
  const description = (text || fallback).slice(0, 2000);
  return { title, description };
}

export function isInstagramPermalink(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && (url.hostname === "www.instagram.com" || url.hostname === "instagram.com");
  } catch {
    return false;
  }
}

export function isInstagramMediaId(raw: string): boolean {
  return /^[0-9]{5,30}$/.test(raw);
}

function zonedParts(date: Date, timeZone: string): ZonedParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  let hour = Number(parts.hour);
  if (hour === 24) hour = 0;
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour,
    minute: Number(parts.minute),
  };
}

function timeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = zonedParts(date, timeZone);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0);
  return asUtc - date.getTime();
}

function zonedTimeToUtc(year: number, month: number, day: number, hour: number, minute: number, timeZone: string): number {
  const guess = Date.UTC(year, month - 1, day, hour, minute, 0);
  return guess - timeZoneOffsetMs(new Date(guess), timeZone);
}

export function zonedDayRange(fromDay: string, toDay: string, timeZone = INSTAGRAM_SYNC_TIMEZONE): { start: number; end: number } | null {
  const from = parseDay(fromDay);
  const to = parseDay(toDay);
  if (!from || !to) return null;
  const fromUtc = Date.UTC(from.year, from.month - 1, from.day);
  const toUtc = Date.UTC(to.year, to.month - 1, to.day);
  if (fromUtc > toUtc) return null;
  const start = zonedTimeToUtc(from.year, from.month, from.day, 0, 0, timeZone);
  const next = new Date(Date.UTC(to.year, to.month - 1, to.day + 1));
  const end = zonedTimeToUtc(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate(), 0, 0, timeZone);
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return null;
  return { start, end };
}

export function isRunDue(now: Date, runTime: string, lastRunAt: string | null, timeZone = INSTAGRAM_SYNC_TIMEZONE): boolean {
  const match = /^(\d{2}):(\d{2})/.exec(runTime);
  if (!match) return false;
  const current = zonedParts(now, timeZone);
  const nowMinutes = current.hour * 60 + current.minute;
  const runMinutes = Number(match[1]) * 60 + Number(match[2]);
  if (nowMinutes < runMinutes) return false;
  if (!lastRunAt) return true;
  const last = zonedParts(new Date(lastRunAt), timeZone);
  if (Number.isNaN(last.year)) return true;
  return localDateKey(current) !== localDateKey(last);
}

function parseDay(value: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

function localDateKey(parts: ZonedParts): string {
  return `${parts.year}-${parts.month}-${parts.day}`;
}
