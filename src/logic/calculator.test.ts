/// <reference types="astro/client" />
import { describe, it, expect } from 'vitest';
import { calculateWelfare, getAgeCategory, mapDisabilityToCategory } from './calculator';
import type { CalculationInput } from './types';
import type { HousingLimit } from '../schemas/masterSchema';
import tokyoData from '../../public/data/municipalities/13.json';
import aichiData from '../../public/data/municipalities/23.json';

// 東京都 1級地（特別区）の住宅扶助限度額
const standardTokyoLimits: HousingLimit = {
  '1': 53700,
  '2': 64000,
  '3_5': 69800,
  '6': 75000,
  '7_plus': 83800,
};

describe('生活保護費計算ロジック（令和8年10月改正基準・拡張対応）', () => {

  it('年齢区分マッピングが正しいこと', () => {
    expect(getAgeCategory(0)).toBe('0_2');
    expect(getAgeCategory(2)).toBe('0_2');
    expect(getAgeCategory(3)).toBe('3_5');
    expect(getAgeCategory(5)).toBe('3_5');
    expect(getAgeCategory(6)).toBe('6_11');
    expect(getAgeCategory(11)).toBe('6_11');
    expect(getAgeCategory(12)).toBe('12_17');
    expect(getAgeCategory(17)).toBe('12_17');
    expect(getAgeCategory(18)).toBe('18_19');
    expect(getAgeCategory(19)).toBe('18_19');
    expect(getAgeCategory(20)).toBe('20_40');
    expect(getAgeCategory(40)).toBe('20_40');
    expect(getAgeCategory(41)).toBe('41_59');
    expect(getAgeCategory(59)).toBe('41_59');
    expect(getAgeCategory(60)).toBe('60_64');
    expect(getAgeCategory(64)).toBe('60_64');
    expect(getAgeCategory(65)).toBe('65_69');
    expect(getAgeCategory(69)).toBe('65_69');
    expect(getAgeCategory(70)).toBe('70_74');
    expect(getAgeCategory(74)).toBe('70_74');
    expect(getAgeCategory(75)).toBe('75_plus');
    expect(getAgeCategory(85)).toBe('75_plus');
  });

  it('障害詳細区分のマッピングが法令基準に合致すること', () => {
    expect(mapDisabilityToCategory('none')).toBe('none');
    expect(mapDisabilityToCategory('physical_1_2')).toBe('typeA');
    expect(mapDisabilityToCategory('mental_1')).toBe('typeA');
    expect(mapDisabilityToCategory('pension_1')).toBe('typeA');
    expect(mapDisabilityToCategory('special_child_1')).toBe('typeA');
    expect(mapDisabilityToCategory('physical_3')).toBe('typeB');
    expect(mapDisabilityToCategory('mental_2')).toBe('typeB');
    expect(mapDisabilityToCategory('pension_2')).toBe('typeB');
    expect(mapDisabilityToCategory('special_child_2')).toBe('typeB');
  });

  it('検証例1: 1級地-1 / 30代夫婦＋子1人（4歳）', () => {
    const input: CalculationInput = {
      grade: '1-1',
      members: [
        { id: '1', age: 35, disabilityDetail: 'none' },
        { id: '2', age: 33, disabilityDetail: 'none' },
        { id: '3', age: 4, disabilityDetail: 'none' },
      ],
      isSingleParent: false,
      feePaymentType: 'separate',
    };

    const res = calculateWelfare(input, standardTokyoLimits);
    // 第1類: 46,930 + 46,930 + 44,580 = 138,440、逓減率0.75 → 103,830、第2類（3人）44,730
    // 名古屋市公式資料（1級地-1・標準3人世帯）の「Ⅰ類＋Ⅱ類 148,560円」と一致
    expect(res.livelihoodStandard.category1Sum).toBe(138440);
    expect(res.livelihoodStandard.reductionRate).toBe(75);
    expect(res.livelihoodStandard.category1Reduced).toBe(103830);
    expect(res.livelihoodStandard.category2).toBe(44730);
    expect(res.livelihoodStandard.transitionalAddition).toBe(0);
    expect(res.livelihoodStandard.baseAmount).toBe(148560);
    expect(res.livelihoodStandard.temporarySpecialAddition).toBe(7500);
    expect(res.livelihoodStandard.finalLivelihoodAmount).toBe(156060);
    expect(res.additions.childCareAddition).toBe(10190);
    expect(res.housingAssistance.approvedHousingAmount).toBe(69800);
    expect(res.totalBenefitMonthly).toBe(156060 + 10190 + 69800);
  });

  it('検証例2: 1級地-1 / 75歳夫婦（2人世帯）', () => {
    const input: CalculationInput = {
      grade: '1-1',
      members: [
        { id: '1', age: 75, disabilityDetail: 'none' },
        { id: '2', age: 75, disabilityDetail: 'none' },
      ],
      isSingleParent: false,
      pureRent: 60000,
      feePaymentType: 'separate',
    };

    const res = calculateWelfare(input, standardTokyoLimits);
    // 39,890×2 = 79,780 × 0.87 = 69,408.6 ＋ 第2類 38,060 = 107,468.6 → 10円未満切上 107,470 ＋ 特例加算 5,000
    expect(res.livelihoodStandard.baseAmount).toBe(107470);
    expect(res.livelihoodStandard.finalLivelihoodAmount).toBe(112470);
    expect(res.housingAssistance.approvedHousingAmount).toBe(60000);
    expect(res.totalBenefitMonthly).toBe(112470 + 60000);
  });

  it('検証例3: 1級地-1 / 65歳単身世帯', () => {
    const input: CalculationInput = {
      grade: '1-1',
      members: [{ id: '1', age: 65, disabilityDetail: 'none' }],
      isSingleParent: false,
      feePaymentType: 'separate',
    };

    const res = calculateWelfare(input, standardTokyoLimits);
    // 第1類 46,460 ＋ 第2類 27,790 ＋ 経過的加算（単身・65〜69歳・1級地-1）130 ＋ 特例加算 2,500
    expect(res.livelihoodStandard.transitionalAddition).toBe(130);
    expect(res.livelihoodStandard.baseAmount).toBe(74380);
    expect(res.livelihoodStandard.finalLivelihoodAmount).toBe(76880);
    expect(res.totalBenefitMonthly).toBe(76880 + 53700);
  });

  it('検証例4: 母子世帯（30代母＋小学生1人）＋児童養育加算＋母子加算', () => {
    const input: CalculationInput = {
      grade: '1-1',
      members: [
        { id: '1', age: 35, disabilityDetail: 'none' },
        { id: '2', age: 9, disabilityDetail: 'none' },
      ],
      isSingleParent: true,
      feePaymentType: 'separate',
    };

    const res = calculateWelfare(input, standardTokyoLimits);
    // 46,930 ＋ 46,460 = 93,390 × 0.87 ＋ 38,060 = 119,309.3 → 119,310（名古屋市公式資料の母子2人世帯「Ⅰ類＋Ⅱ類」と一致）
    expect(res.livelihoodStandard.baseAmount).toBe(119310);
    expect(res.livelihoodStandard.finalLivelihoodAmount).toBe(124310);
    expect(res.additions.childCareAddition).toBe(10190);
    expect(res.additions.singleParentAddition).toBe(18800);
    expect(res.additions.totalAdditions).toBe(28990);
    expect(res.totalBenefitMonthly).toBe(124310 + 28990 + 64000);
  });

  it('検証例5: 障害詳細区分（精神手帳1級）および住宅扶助上限キャップ', () => {
    const input: CalculationInput = {
      grade: '1-1',
      members: [{ id: '1', age: 45, disabilityDetail: 'mental_1' }],
      isSingleParent: false,
      pureRent: 70000,
      feePaymentType: 'separate',
      winterZone: 'VI',
    };

    const res = calculateWelfare(input, standardTokyoLimits);
    // 46,930 ＋ 27,790 ＋ 経過的加算（単身・41〜59歳・1級地-1）20 ＝ 74,740 ＋ 特例加算 2,500
    expect(res.livelihoodStandard.finalLivelihoodAmount).toBe(77240);
    expect(res.additions.disabilityAddition).toBe(27460);
    expect(res.additions.disabilityTypeACount).toBe(1);
    expect(res.housingAssistance.approvedHousingAmount).toBe(53700);
    expect(res.housingAssistance.excessRent).toBe(16300); // 70000 - 53700
    expect(res.totalBenefitMonthly).toBe(77240 + 27460 + 53700);
    expect(res.additions.winterAdditionEstimate).toBe(2630);
    expect(res.winterTotalBenefitMonthly).toBe(77240 + 27460 + 53700 + 2630);
  });

  it('共益費ルール検証: 共益費別払いの場合、共益費は住宅扶助対象外（自己負担）となること', () => {
    // 単身40歳 (生活扶助本体: 46,930 + 27,790 + 特例加算2,500 = 77,220円)
    // 純家賃: 48,000円 (上限53,700円以下)
    // 共益費: 4,000円（別払い）
    // 住宅扶助支給額: 48,000円
    // 支給総額: 77,220 + 48,000 = 125,220円
    // 自己負担共益費: 4,000円
    // 実質手元生活費: 77,220 - 4,000 = 73,220円
    const input: CalculationInput = {
      grade: '1-1',
      members: [{ id: '1', age: 40, disabilityDetail: 'none' }],
      isSingleParent: false,
      pureRent: 48000,
      commonServiceFee: 4000,
      feePaymentType: 'separate',
    };

    const res = calculateWelfare(input, standardTokyoLimits);
    expect(res.housingAssistance.approvedHousingAmount).toBe(48000);
    expect(res.housingAssistance.outOfPocketFee).toBe(4000);
    expect(res.totalBenefitMonthly).toBe(77220 + 48000);
    expect(res.effectiveLivingAllowance).toBe(77220 - 4000);
  });

  it('共益費ルール検証: 共益費込契約で合計が上限以内の場合、全額が住宅扶助で支給されること', () => {
    // 純家賃: 48,000円 + 共益費込: 4,000円 = 合計52,000円 (上限53,700円以内)
    // 住宅扶助支給額: 52,000円
    // 自己負担共益費: 0円
    // 実質手元生活費: 77,220円 (生活費が目減りしない)
    const input: CalculationInput = {
      grade: '1-1',
      members: [{ id: '1', age: 40, disabilityDetail: 'none' }],
      isSingleParent: false,
      pureRent: 48000,
      commonServiceFee: 4000,
      feePaymentType: 'included',
    };

    const res = calculateWelfare(input, standardTokyoLimits);
    expect(res.housingAssistance.effectiveRentForHousingAssistance).toBe(52000);
    expect(res.housingAssistance.approvedHousingAmount).toBe(52000);
    expect(res.housingAssistance.outOfPocketFee).toBe(0);
    expect(res.effectiveLivingAllowance).toBe(77220);
  });

  it('共益費ルール検証: 共益費込契約で合計が上限を超える場合、上限額まで支給されること', () => {
    // 純家賃: 52,000円 + 共益費込: 4,000円 = 合計56,000円 (上限53,700円超過)
    // 住宅扶助支給額: 53,700円
    // 超過自己負担額: 2,300円
    const input: CalculationInput = {
      grade: '1-1',
      members: [{ id: '1', age: 40, disabilityDetail: 'none' }],
      isSingleParent: false,
      pureRent: 52000,
      commonServiceFee: 4000,
      feePaymentType: 'included',
    };

    const res = calculateWelfare(input, standardTokyoLimits);
    expect(res.housingAssistance.approvedHousingAmount).toBe(53700);
    expect(res.housingAssistance.excessRent).toBe(2300);
    expect(res.effectiveLivingAllowance).toBe(77220 - 2300);
  });

  it('エラー検証: 年齢が未入力（null）の場合は例外をスローすること', () => {
    const input: CalculationInput = {
      grade: '1-1',
      members: [{ id: '1', age: null, disabilityDetail: 'none' }],
      isSingleParent: false,
      feePaymentType: 'separate',
    };
    expect(() => calculateWelfare(input, standardTokyoLimits)).toThrow('年齢が未入力です');
  });
});

describe('加算（告示 別表第1 第2章・令和8年10月）', () => {
  const person = (id: string, age: number, disabilityDetail: CalculationInput['members'][number]['disabilityDetail'] = 'none') => ({ id, age, disabilityDetail });

  it('母子加算・障害者加算は1・2・3級地の額で算定されること', () => {
    const base = { isSingleParent: true, feePaymentType: 'separate' as const };
    const twoChildren = [person('1', 35), person('2', 9), person('3', 6)];
    const threeChildren = [...twoChildren, person('4', 3)];
    expect(calculateWelfare({ ...base, grade: '1-2', members: twoChildren }, standardTokyoLimits).additions.singleParentAddition).toBe(18800 + 4800);
    expect(calculateWelfare({ ...base, grade: '2-2', members: twoChildren }, standardTokyoLimits).additions.singleParentAddition).toBe(17400 + 4400);
    expect(calculateWelfare({ ...base, grade: '3-1', members: threeChildren }, standardTokyoLimits).additions.singleParentAddition).toBe(16100 + 4100 + 2500);

    const disabled = (grade: CalculationInput['grade'], detail: 'physical_1_2' | 'physical_3') =>
      calculateWelfare({ grade, members: [person('1', 50, detail)], isSingleParent: false, feePaymentType: 'separate' }, standardTokyoLimits).additions.disabilityAddition;
    expect(disabled('1-2', 'physical_1_2')).toBe(27460);
    expect(disabled('2-1', 'physical_1_2')).toBe(25540);
    expect(disabled('3-2', 'physical_1_2')).toBe(23620);
    expect(disabled('1-1', 'physical_3')).toBe(18300);
    expect(disabled('2-2', 'physical_3')).toBe(17020);
    expect(disabled('3-1', 'physical_3')).toBe(15750);
  });

  it('世帯主が障害者加算と母子加算の両方に該当する場合は高い方のみ算定し、児童2人目以降の額は重複調整しないこと', () => {
    const common = { grade: '1-1' as const, isSingleParent: true, feePaymentType: 'separate' as const };
    // 区分A（27,460円）＞ 母子加算（18,800円）→ 障害者加算のみ
    const a = calculateWelfare({ ...common, members: [person('1', 35, 'physical_1_2'), person('2', 9)] }, standardTokyoLimits);
    expect(a.additions.disabilityAddition).toBe(27460);
    expect(a.additions.singleParentAddition).toBe(0);
    expect(a.additions.overlapAdjusted).toBe(true);
    // 児童2人: 2人目の加算額4,800円は重複調整せず算定
    const a2 = calculateWelfare({ ...common, members: [person('1', 35, 'physical_1_2'), person('2', 9), person('3', 6)] }, standardTokyoLimits);
    expect(a2.additions.disabilityAddition).toBe(27460);
    expect(a2.additions.singleParentAddition).toBe(4800);
    // 区分B（18,300円）＜ 母子加算（18,800円）→ 母子加算のみ
    const b = calculateWelfare({ ...common, members: [person('1', 35, 'physical_3'), person('2', 9)] }, standardTokyoLimits);
    expect(b.additions.disabilityAddition).toBe(0);
    expect(b.additions.singleParentAddition).toBe(18800);
    expect(b.additions.overlapAdjusted).toBe(true);
    // 児童側の障害者加算は重複調整の対象外
    const c = calculateWelfare({ ...common, members: [person('1', 35), person('2', 9, 'physical_3')] }, standardTokyoLimits);
    expect(c.additions.disabilityAddition).toBe(18300);
    expect(c.additions.singleParentAddition).toBe(18800);
    expect(c.additions.overlapAdjusted).toBe(false);
  });

  it('母子加算の児童には障害のある19歳を含め、児童養育加算は18歳以下のみとすること', () => {
    const res = calculateWelfare(
      { grade: '1-1', members: [person('1', 45), person('2', 19, 'physical_3')], isSingleParent: true, feePaymentType: 'separate' },
      standardTokyoLimits
    );
    expect(res.additions.singleParentChildCount).toBe(1);
    expect(res.additions.singleParentAddition).toBe(18800);
    expect(res.additions.childCareCount).toBe(0);
  });
});

describe('追加の加算・期末一時扶助・年度末判定（告示 別表第1）', () => {
  type Member = CalculationInput['members'][number];
  const p = (id: string, age: number | null, extra: Partial<Member> = {}): Member => ({ id, age, disabilityDetail: 'none', ...extra });
  const calc = (members: Member[], extra: Partial<CalculationInput> = {}) =>
    calculateWelfare({ grade: '1-1', members, isSingleParent: false, feePaymentType: 'separate', ...extra }, standardTokyoLimits);

  it('妊産婦加算は1・2級地同額、3級地別額で算定されること', () => {
    expect(calc([p('1', 30, { pregnancyStatus: 'pregnant_under6' })]).additions.pregnancyAddition).toBe(9350);
    expect(calc([p('1', 30, { pregnancyStatus: 'pregnant_6plus' })], { grade: '2-1' }).additions.pregnancyAddition).toBe(14120);
    expect(calc([p('1', 30, { pregnancyStatus: 'postpartum' })], { grade: '3-2' }).additions.pregnancyAddition).toBe(7390);
    expect(calc([p('1', 30, { pregnancyStatus: 'postpartum' })]).additions.totalAdditions).toBe(8690);
  });

  it('重度障害者加算16,560円・家族介護13,890円（家族介護は区分Aのみ）', () => {
    const severe = calc([p('1', 50, { disabilityDetail: 'physical_1_2', severeCare: true })]);
    expect(severe.additions.disabilityAddition).toBe(27460 + 16560);
    expect(severe.additions.severeDisabilityCount).toBe(1);
    const family = calc([p('1', 50, { disabilityDetail: 'physical_1_2', familyCare: true }), p('2', 48)]);
    expect(family.additions.familyCareAddition).toBe(13890);
    expect(family.additions.totalAdditions).toBe(27460 + 13890);
    const familyB = calc([p('1', 50, { disabilityDetail: 'physical_3', familyCare: true }), p('2', 48)]);
    expect(familyB.additions.familyCareAddition).toBe(0);
  });

  it('重複調整: 重度障害者加算を含めて比較し、家族介護は調整しないこと', () => {
    const res = calc(
      [p('1', 35, { disabilityDetail: 'physical_1_2', severeCare: true, familyCare: true }), p('2', 9)],
      { isSingleParent: true }
    );
    expect(res.additions.disabilityAddition).toBe(27460 + 16560);
    expect(res.additions.singleParentAddition).toBe(0);
    expect(res.additions.familyCareAddition).toBe(13890);
  });

  it('期末一時扶助は12月のみ生活扶助に加算されること', () => {
    const dec = calc([p('1', 30), p('2', 30)], { calcMonth: '2026-12' });
    const nov = calc([p('1', 30), p('2', 30)], { calcMonth: '2026-11' });
    expect(dec.livelihoodStandard.yearEndAllowance).toBe(23640);
    expect(dec.livelihoodStandard.finalLivelihoodAmount).toBe(nov.livelihoodStandard.finalLivelihoodAmount + 23640);
    expect(nov.livelihoodStandard.yearEndAllowance).toBe(0);
    const ten = calc(Array.from({ length: 10 }, (_, i) => p(String(i + 1), 30)), { grade: '3-2', calcMonth: '2026-12' });
    expect(ten.livelihoodStandard.yearEndAllowance).toBe(29650 + 1350);
  });

  it('児童養育加算の経過的加算: 4人以上の世帯の3歳未満児、第3子以降の3歳以上・小学校修了前の児童', () => {
    const four = calc([p('1', 35), p('2', 33), p('3', 6), p('4', 2)]);
    expect(four.additions.childCareTransitionalCount).toBe(1);
    expect(four.additions.childCareAddition).toBe(2 * 10190 + 4330);
    const three = calc([p('1', 35), p('2', 6), p('3', 2)]);
    expect(three.additions.childCareTransitionalCount).toBe(0);
    const fifth = calc([p('1', 40), p('2', 38), p('3', 10), p('4', 8), p('5', 5)]);
    expect(fifth.additions.childCareTransitionalCount).toBe(1);
    expect(fifth.additions.childCareTransitional).toBe(4330);
  });

  it('母子加算の経過的加算: 3人以上の世帯で児童が1人の場合に世帯人員・年齢・級地別の額を加算すること', () => {
    const res = calc([p('1', 35), p('2', 9), p('3', 65)], { isSingleParent: true });
    expect(res.additions.singleParentTransitional).toBe(3330);
    expect(res.additions.singleParentAddition).toBe(18800 + 3330);
    expect(calc([p('1', 35), p('2', 9), p('3', 65)], { isSingleParent: true, grade: '2-2' }).additions.singleParentTransitional).toBe(0);
    expect(calc([p('1', 35), p('2', 16), p('3', 65), p('4', 60)], { isSingleParent: true }).additions.singleParentTransitional).toBe(0);
    expect(calc([p('1', 35), p('2', 9), p('3', 65), p('4', 60), p('5', 40)], { isSingleParent: true, grade: '3-2' }).additions.singleParentTransitional).toBe(2900);
    // 世帯主の障害者加算（区分B 18,300円）＜ 母子加算＋経過的加算（22,130円）→ 母子加算を算定
    const overlap = calc([p('1', 35, { disabilityDetail: 'physical_3' }), p('2', 9), p('3', 65)], { isSingleParent: true });
    expect(overlap.additions.singleParentAddition).toBe(22130);
    expect(overlap.additions.disabilityAddition).toBe(0);
  });

  it('生年月日がある場合は試算月1日時点で18歳の年度末を判定すること', () => {
    const april1 = calc([p('1', 45), p('2', null, { birthDate: '2008-04-01' })], { calcMonth: '2026-10' });
    expect(april1.additions.childCareCount).toBe(0);
    expect(april1.additions.birthDateUsed).toBe(true);
    const april2 = calc([p('1', 45), p('2', null, { birthDate: '2008-04-02' })], { calcMonth: '2026-10' });
    expect(april2.additions.childCareCount).toBe(1);
    // 生年月日から年齢（18歳）を算定し、第1類は18・19歳の区分を適用
    expect(april2.livelihoodStandard.category1Sum).toBe(46930 + 46930);
    // 試算月がない場合は生年月日を使わず年齢で判定（18歳は児童とみなす）
    const fallback = calc([p('1', 45), p('2', 18, { birthDate: '2008-04-01' })]);
    expect(fallback.additions.childCareCount).toBe(1);
    expect(fallback.additions.birthDateUsed).toBe(false);
  });
});

describe('生活扶助本体（世帯人員が多い場合・告示 別表第1 第1章）', () => {
  const adults = (n: number) => Array.from({ length: n }, (_, i) => ({ id: String(i + 1), age: 30, disabilityDetail: 'none' as const }));

  it('7人世帯: 逓減率0.55・第2類58,920円・経過的加算（20〜40歳・1級地-1）2,810円/人', () => {
    const res = calculateWelfare({ grade: '1-1', members: adults(7), isSingleParent: false, feePaymentType: 'separate', winterZone: 'I' }, standardTokyoLimits);
    expect(res.livelihoodStandard.reductionRate).toBe(55);
    expect(res.livelihoodStandard.category2).toBe(58920);
    expect(res.livelihoodStandard.transitionalAddition).toBe(2810 * 7);
    // 46,930×7 = 328,510 × 0.55 = 180,680.5 ＋ 58,920 ＋ 19,670 = 259,270.5 → 259,280
    expect(res.livelihoodStandard.baseAmount).toBe(259280);
    expect(res.livelihoodStandard.finalLivelihoodAmount).toBe(259280 + 2500 * 7);
    expect(res.additions.winterAdditionEstimate).toBe(25360);
  });

  it('10人以上世帯: 第2類・冬季加算は9人の額に1人増すごとの額を加算すること', () => {
    const res10 = calculateWelfare({ grade: '3-2', members: adults(10), isSingleParent: false, feePaymentType: 'separate', winterZone: 'VI' }, standardTokyoLimits);
    expect(res10.livelihoodStandard.reductionRate).toBe(50);
    expect(res10.livelihoodStandard.category2).toBe(64670 + 2760);
    expect(res10.livelihoodStandard.transitionalAddition).toBe(360 * 10);
    expect(res10.additions.winterAdditionEstimate).toBe(5560 + 180);
    const res11 = calculateWelfare({ grade: '3-2', members: adults(11), isSingleParent: false, feePaymentType: 'separate', winterZone: 'VI' }, standardTokyoLimits);
    expect(res11.livelihoodStandard.category2).toBe(64670 + 2760 * 2);
    expect(res11.additions.winterAdditionEstimate).toBe(5560 + 180 * 2);
  });

  it('第2類・冬季加算は級地によらず同額であること', () => {
    const r1 = calculateWelfare({ grade: '1-1', members: adults(2), isSingleParent: false, feePaymentType: 'separate', winterZone: 'III' }, standardTokyoLimits);
    const r6 = calculateWelfare({ grade: '3-2', members: adults(2), isSingleParent: false, feePaymentType: 'separate', winterZone: 'III' }, standardTokyoLimits);
    expect(r1.livelihoodStandard.category2).toBe(38060);
    expect(r6.livelihoodStandard.category2).toBe(38060);
    expect(r1.additions.winterAdditionEstimate).toBe(10590);
    expect(r6.additions.winterAdditionEstimate).toBe(10590);
  });
});

describe('冬季加算の地区区分（告示 別表第1 第1章1(2)イ）', () => {
  it('全都道府県の地区区分が告示の表と一致すること', () => {
    const expected: Record<string, string[]> = {
      I: ['北海道', '青森県', '秋田県'],
      II: ['岩手県', '山形県', '新潟県'],
      III: ['宮城県', '福島県', '富山県', '長野県'],
      IV: ['石川県', '福井県'],
      V: ['栃木県', '群馬県', '山梨県', '岐阜県', '鳥取県', '島根県'],
    };
    const zoneOf = (prefName: string) => Object.keys(expected).find((z) => expected[z].includes(prefName)) ?? 'VI';
    const files = import.meta.glob<{ prefName: string; winterZone: string }>('../../public/data/municipalities/*.json', {
      eager: true,
      import: 'default',
    });
    const list = Object.values(files);
    expect(list).toHaveLength(47);
    for (const data of list) {
      expect(data.winterZone, data.prefName).toBe(zoneOf(data.prefName));
    }
  });
});

describe('住宅扶助限度額（自治体マスター・世帯人員別）', () => {
  const findMuni = (data: { municipalities: Array<{ name: string; grade: string; housingLimit: HousingLimit }> }, name: string) => {
    const muni = data.municipalities.find((m) => m.name === name);
    if (!muni) throw new Error(`自治体が見つかりません: ${name}`);
    return muni;
  };

  // 家賃未入力時は住宅扶助限度額がそのまま認定額として算出される
  const housingFor = (limits: HousingLimit, memberCount: number) => {
    const input: CalculationInput = {
      grade: '1-1',
      members: Array.from({ length: memberCount }, (_, i) => ({ id: String(i + 1), age: 40, disabilityDetail: 'none' as const })),
      isSingleParent: false,
      feePaymentType: 'separate',
    };
    return calculateWelfare(input, limits).housingAssistance.approvedHousingAmount;
  };

  it('名古屋市（1級地-1・指定都市）の限度額が世帯人員別に正しいこと', () => {
    const nagoya = findMuni(aichiData, '名古屋市');
    expect(nagoya.grade).toBe('1-1');
    expect(housingFor(nagoya.housingLimit, 1)).toBe(37000);
    expect(housingFor(nagoya.housingLimit, 2)).toBe(44000);
    expect(housingFor(nagoya.housingLimit, 3)).toBe(48000);
    expect(housingFor(nagoya.housingLimit, 5)).toBe(48000);
    expect(housingFor(nagoya.housingLimit, 6)).toBe(52000);
    expect(housingFor(nagoya.housingLimit, 7)).toBe(58000);
    expect(housingFor(nagoya.housingLimit, 8)).toBe(58000);
  });

  it('中核市（一宮市）は市ごとの限度額、一般市は県の級地別限度額が適用されること', () => {
    expect(findMuni(aichiData, '一宮市').housingLimit['3_5']).toBe(48100);
    const anjo = findMuni(aichiData, '安城市');
    expect(anjo.grade).toBe('2-2');
    expect(anjo.housingLimit).toEqual({ '1': 37000, '2': 44000, '3_5': 48100, '6': 52000, '7_plus': 58000 });
    const other = findMuni(aichiData, '上記以外の市町村（3級地-2）');
    expect(other.housingLimit).toEqual({ '1': 36000, '2': 43000, '3_5': 46600, '6': 50000, '7_plus': 56000 });
  });

  it('同一都道府県の1級地-1と1級地-2は同額の限度額となること', () => {
    const tokubetsuku = findMuni(tokyoData, '特別区（23区）');
    const ome = findMuni(tokyoData, '青梅市');
    expect(tokubetsuku.grade).toBe('1-1');
    expect(ome.grade).toBe('1-2');
    expect(ome.housingLimit).toEqual(tokubetsuku.housingLimit);
    expect(tokubetsuku.housingLimit).toEqual(standardTokyoLimits);
  });
});
