// 生年月日と試算月から、告示の年齢要件を判定する純粋関数群。
// 基準日は「試算する月の初日」とする。年齢は年齢計算ニ関スル法律により、誕生日の前日に1歳加算する。
// 日付はタイムゾーンの影響を避けるため、年・月・日の整数で扱う。

export interface YMD {
  y: number;
  m: number; // 1〜12
  d: number;
}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_RE = /^(\d{4})-(\d{2})$/;

function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** 'YYYY-MM-DD' を検証して YMD に変換する。不正な値は null。 */
export function parseDate(value: string | null | undefined): YMD | null {
  if (!value) return null;
  const match = DATE_RE.exec(value);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (m < 1 || m > 12 || d < 1 || d > daysInMonth(y, m)) return null;
  return { y, m, d };
}

/** 'YYYY-MM' を検証して、その月の初日を返す。不正な値は null。 */
export function parseMonthStart(value: string | null | undefined): YMD | null {
  if (!value) return null;
  const match = MONTH_RE.exec(value);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  if (m < 1 || m > 12) return null;
  return { y, m, d: 1 };
}

function compare(a: YMD, b: YMD): number {
  return a.y - b.y || a.m - b.m || a.d - b.d;
}

function addDays(date: YMD, days: number): YMD {
  const t = new Date(Date.UTC(date.y, date.m - 1, date.d + days));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

/** n歳に達する日（n回目の誕生日の前日）。2月29日生まれは平年では3月1日を誕生日とみなす。 */
export function dateReachingAge(birth: YMD, n: number): YMD {
  const y = birth.y + n;
  const birthday = birth.m === 2 && birth.d === 29 && daysInMonth(y, 2) === 28 ? { y, m: 3, d: 1 } : { y, m: birth.m, d: birth.d };
  return addDays(birthday, -1);
}

/** 基準日時点の満年齢。 */
export function ageAt(birth: YMD, base: YMD): number {
  let age = base.y - birth.y;
  while (age > 0 && compare(dateReachingAge(birth, age), base) > 0) age--;
  while (compare(dateReachingAge(birth, age + 1), base) <= 0) age++;
  return Math.max(0, age);
}

/** 「n歳に達する日以後の最初の3月31日までの間にある」か（基準日時点）。 */
export function isUntilFirstMarch31AfterAge(birth: YMD, n: number, base: YMD): boolean {
  const reach = dateReachingAge(birth, n);
  const march31SameYear: YMD = { y: reach.y, m: 3, d: 31 };
  const firstMarch31 = compare(reach, march31SameYear) <= 0 ? march31SameYear : { y: reach.y + 1, m: 3, d: 31 };
  return compare(base, firstMarch31) <= 0;
}

/** 「3歳に満たない」か（基準日時点）。月の初日に生まれた児童は出生の日から3年を経過しないか で判定する。 */
export function isUnder3(birth: YMD, base: YMD): boolean {
  if (birth.d === 1) {
    const third: YMD = { y: birth.y + 3, m: birth.m, d: 1 };
    return compare(base, third) < 0;
  }
  return ageAt(birth, base) < 3;
}
