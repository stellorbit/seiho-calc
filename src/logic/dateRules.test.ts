import { describe, it, expect } from 'vitest';
import { parseDate, parseMonthStart, ageAt, dateReachingAge, isUntilFirstMarch31AfterAge, isUnder3 } from './dateRules';

const d = (s: string) => {
  const v = parseDate(s);
  if (!v) throw new Error(`invalid date: ${s}`);
  return v;
};
const month = (s: string) => {
  const v = parseMonthStart(s);
  if (!v) throw new Error(`invalid month: ${s}`);
  return v;
};

describe('日付の入力検証', () => {
  it('不正な日付・年月は null になること', () => {
    expect(parseDate('2026-02-30')).toBeNull();
    expect(parseDate('2026-13-01')).toBeNull();
    expect(parseDate('20260101')).toBeNull();
    expect(parseDate('')).toBeNull();
    expect(parseDate(undefined)).toBeNull();
    expect(parseMonthStart('2026-00')).toBeNull();
    expect(parseMonthStart('2026-10')).toEqual({ y: 2026, m: 10, d: 1 });
    expect(parseDate('2024-02-29')).toEqual({ y: 2024, m: 2, d: 29 });
  });
});

describe('満年齢（誕生日の前日に加齢）', () => {
  it('誕生日の前日に年齢が加わること', () => {
    expect(dateReachingAge(d('2008-04-02'), 18)).toEqual({ y: 2026, m: 4, d: 1 });
    expect(ageAt(d('2008-10-02'), month('2026-10'))).toBe(18);
    expect(ageAt(d('2008-10-03'), month('2026-10'))).toBe(17);
    expect(ageAt(d('2026-10-15'), month('2026-10'))).toBe(0);
  });

  it('2月29日生まれは平年では2月28日に加齢すること', () => {
    expect(dateReachingAge(d('2008-02-29'), 18)).toEqual({ y: 2026, m: 2, d: 28 });
    expect(dateReachingAge(d('2008-02-29'), 16)).toEqual({ y: 2024, m: 2, d: 28 });
  });
});

describe('18歳に達する日以後の最初の3月31日（児童の判定）', () => {
  it('4月1日生まれは早生まれとして前年度末で児童でなくなること', () => {
    // 2008-04-01生まれは2026-03-31に18歳に達し、同日が最初の3月31日
    expect(isUntilFirstMarch31AfterAge(d('2008-04-01'), 18, month('2026-03'))).toBe(true);
    expect(isUntilFirstMarch31AfterAge(d('2008-04-01'), 18, month('2026-04'))).toBe(false);
  });

  it('4月2日生まれは18歳到達後、翌年3月31日まで児童であること', () => {
    expect(isUntilFirstMarch31AfterAge(d('2008-04-02'), 18, month('2026-10'))).toBe(true);
    expect(isUntilFirstMarch31AfterAge(d('2008-04-02'), 18, month('2027-03'))).toBe(true);
    expect(isUntilFirstMarch31AfterAge(d('2008-04-02'), 18, month('2027-04'))).toBe(false);
  });

  it('12歳到達後の最初の3月31日（小学校修了前）', () => {
    expect(isUntilFirstMarch31AfterAge(d('2014-05-10'), 12, month('2027-03'))).toBe(true);
    expect(isUntilFirstMarch31AfterAge(d('2014-05-10'), 12, month('2027-04'))).toBe(false);
  });
});

describe('3歳に満たない児童', () => {
  it('3歳に達した月以降は該当しないこと', () => {
    // 2023-10-02生まれは2026-10-01に3歳に達する
    expect(isUnder3(d('2023-10-02'), month('2026-09'))).toBe(true);
    expect(isUnder3(d('2023-10-02'), month('2026-10'))).toBe(false);
    // 2023-10-03生まれは2026-10-01時点で2歳
    expect(isUnder3(d('2023-10-03'), month('2026-10'))).toBe(true);
  });

  it('月の初日生まれは出生の日から3年を経過するまで該当すること', () => {
    expect(isUnder3(d('2023-11-01'), month('2026-10'))).toBe(true);
    expect(isUnder3(d('2023-11-01'), month('2026-11'))).toBe(false);
  });
});
