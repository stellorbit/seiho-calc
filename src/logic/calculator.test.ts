import { describe, it, expect } from 'vitest';
import { calculateWelfare, getAgeCategory, mapDisabilityToCategory } from './calculator';
import type { CalculationInput } from './types';

describe('生活保護費計算ロジック（令和8年10月改正基準・拡張対応）', () => {
  const standardTokyoLimits = {
    '1': 53700,
    '2': 64000,
    '3_5': 69800,
    '6_plus': 75000,
  };

  it('年齢区分マッピングが正しいこと', () => {
    expect(getAgeCategory(0)).toBe('0_2');
    expect(getAgeCategory(2)).toBe('0_2');
    expect(getAgeCategory(3)).toBe('3_5');
    expect(getAgeCategory(5)).toBe('3_5');
    expect(getAgeCategory(6)).toBe('6_11');
    expect(getAgeCategory(11)).toBe('6_11');
    expect(getAgeCategory(12)).toBe('12_19');
    expect(getAgeCategory(19)).toBe('12_19');
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
    expect(res.livelihoodStandard.category1Sum).toBe(109030);
    expect(res.livelihoodStandard.reductionRate).toBe(76);
    expect(res.livelihoodStandard.category1Reduced).toBe(82862);
    expect(res.livelihoodStandard.baseAmount).toBe(137510);
    expect(res.livelihoodStandard.temporarySpecialAddition).toBe(7500);
    expect(res.livelihoodStandard.calculated2026).toBe(146010);
    expect(res.livelihoodStandard.guaranteedAmount).toBe(155000);
    expect(res.livelihoodStandard.finalLivelihoodAmount).toBe(155000);
    expect(res.additions.childCareAddition).toBe(10190);
    expect(res.housingAssistance.approvedHousingAmount).toBe(69800);
    expect(res.totalBenefitMonthly).toBe(234990);
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
    expect(res.livelihoodStandard.finalLivelihoodAmount).toBe(120000);
    expect(res.housingAssistance.approvedHousingAmount).toBe(60000);
    expect(res.totalBenefitMonthly).toBe(180000);
  });

  it('検証例3: 1級地-1 / 65歳単身世帯', () => {
    const input: CalculationInput = {
      grade: '1-1',
      members: [{ id: '1', age: 65, disabilityDetail: 'none' }],
      isSingleParent: false,
      feePaymentType: 'separate',
    };

    const res = calculateWelfare(input, standardTokyoLimits);
    expect(res.livelihoodStandard.calculated2026).toBe(81040);
    expect(res.livelihoodStandard.finalLivelihoodAmount).toBe(81040);
    expect(res.totalBenefitMonthly).toBe(134740);
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
    expect(res.livelihoodStandard.finalLivelihoodAmount).toBe(120000);
    expect(res.additions.childCareAddition).toBe(10190);
    expect(res.additions.singleParentAddition).toBe(18800);
    expect(res.additions.totalAdditions).toBe(28990);
    expect(res.totalBenefitMonthly).toBe(212990);
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
    expect(res.livelihoodStandard.finalLivelihoodAmount).toBe(85390);
    expect(res.additions.disabilityAddition).toBe(26850);
    expect(res.additions.disabilityTypeACount).toBe(1);
    expect(res.housingAssistance.approvedHousingAmount).toBe(53700);
    expect(res.housingAssistance.excessRent).toBe(16300); // 70000 - 53700
    expect(res.totalBenefitMonthly).toBe(165940);
    expect(res.additions.winterAdditionEstimate).toBe(2560);
    expect(res.winterTotalBenefitMonthly).toBe(165940 + 2560);
  });

  it('共益費ルール検証: 共益費別払いの場合、共益費は住宅扶助対象外（自己負担）となること', () => {
    // 単身40歳 (生活扶助本体: 87,480円)
    // 純家賃: 48,000円 (上限53,700円以下)
    // 共益費: 4,000円（別払い）
    // 住宅扶助支給額: 48,000円
    // 支給総額: 87,480 + 48,000 = 135,480円
    // 自己負担共益費: 4,000円
    // 実質手元生活費: 87,480 - 4,000 = 83,480円
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
    expect(res.totalBenefitMonthly).toBe(87480 + 48000);
    expect(res.effectiveLivingAllowance).toBe(87480 - 4000);
  });

  it('共益費ルール検証: 共益費込契約で合計が上限以内の場合、全額が住宅扶助で支給されること', () => {
    // 純家賃: 48,000円 + 共益費込: 4,000円 = 合計52,000円 (上限53,700円以内)
    // 住宅扶助支給額: 52,000円
    // 自己負担共益費: 0円
    // 実質手元生活費: 87,480円 (生活費が目減りしない)
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
    expect(res.effectiveLivingAllowance).toBe(87480);
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
    expect(res.effectiveLivingAllowance).toBe(87480 - 2300);
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
