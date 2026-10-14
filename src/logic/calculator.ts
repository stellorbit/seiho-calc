import type { Grade, AgeCategory, WinterZone, Criteria } from '../schemas/masterSchema';
import type { CalculationInput, CalculationResult, PersonInput, DisabilityDetailType } from './types';
import rawCriteria from '../data/criteria_202610.json';

// ビルド時・テスト時にZodで検証済みの基準データ
const criteriaData = rawCriteria as unknown as Criteria;

export function getAgeCategory(age: number): AgeCategory {
  const safeAge = Math.max(0, Math.floor(age));
  if (safeAge <= 2) return '0_2';
  if (safeAge <= 5) return '3_5';
  if (safeAge <= 11) return '6_11';
  if (safeAge <= 19) return '12_19';
  if (safeAge <= 40) return '20_40';
  if (safeAge <= 59) return '41_59';
  if (safeAge <= 64) return '60_64';
  if (safeAge <= 69) return '65_69';
  if (safeAge <= 74) return '70_74';
  return '75_plus';
}

export function mapDisabilityToCategory(detail: DisabilityDetailType): 'none' | 'typeA' | 'typeB' {
  switch (detail) {
    case 'physical_1_2':
    case 'mental_1':
    case 'pension_1':
    case 'special_child_1':
      return 'typeA';
    case 'physical_3':
    case 'mental_2':
    case 'pension_2':
    case 'special_child_2':
      return 'typeB';
    default:
      return 'none';
  }
}

export function calculateWelfare(
  input: CalculationInput,
  housingLimits: { '1': number; '2': number; '3_5': number; '6_plus': number }
): CalculationResult {
  const n = input.members.length;
  if (n <= 0) {
    throw new Error('世帯員は少なくとも1名必要です。');
  }

  const grade = input.grade;

  // 1. 第1類合算
  let category1Sum = 0;
  for (const m of input.members) {
    const ageCat = getAgeCategory(m.age);
    category1Sum += criteriaData.category1Standard[ageCat][grade];
  }

  // 2. 逓減率
  const memberKey = String(Math.min(n, 8));
  const reductionRate = criteriaData.reductionRates[memberKey] ?? 57;
  const category1Reduced = Math.floor((category1Sum * reductionRate) / 100);

  // 3. 第2類加算および10円未満切り上げ
  const cat2Key = String(Math.min(n, 5));
  const category2 = criteriaData.category2Standard[cat2Key][grade] ?? 0;
  const baseAmount = Math.ceil((category1Reduced + category2) / 10) * 10;

  // 4. 特例加算と経過的加算
  const temporarySpecialAddition = criteriaData.temporarySpecialAdditionPerPerson * n;
  const transKey = String(Math.min(n, 3));
  const transitionalAddition = criteriaData.transitionalAddition[transKey]?.[grade] ?? 0;
  const calculated2026 = baseAmount + transitionalAddition + temporarySpecialAddition;

  // 5. 従前額保障比較
  const guaranteeKey = String(Math.min(n, 3));
  const guaranteedAmount = criteriaData.guaranteedPreviousStandard[guaranteeKey]?.[grade] ?? 0;
  const finalLivelihoodAmount = Math.max(calculated2026, guaranteedAmount);

  // 6. 各種加算
  // 6.1 児童養育加算 (18歳以下)
  const childCount = input.members.filter(m => m.age <= 18).length;
  const childCareAddition = childCount * criteriaData.childCareAdditionPerChild;

  // 6.2 母子加算 (ひとり親かつ児童がいる場合のみ適用)
  let singleParentAddition = 0;
  if (input.isSingleParent && childCount > 0 && n > 1) {
    const spTable = criteriaData.singleParentAddition[grade];
    if (childCount === 1) {
      singleParentAddition = spTable.oneChild;
    } else if (childCount === 2) {
      singleParentAddition = spTable.twoChildren;
    } else {
      singleParentAddition = spTable.twoChildren + (childCount - 2) * spTable.additionalPerChild;
    }
  }

  // 6.3 障害者加算 (細分化区分から区分A/Bへマッピング)
  let disabilityAddition = 0;
  let disabilityTypeACount = 0;
  let disabilityTypeBCount = 0;
  const disTable = criteriaData.disabilityAddition[grade];
  for (const m of input.members) {
    const cat = mapDisabilityToCategory(m.disabilityDetail);
    if (cat === 'typeA') {
      disabilityAddition += disTable.typeA;
      disabilityTypeACount++;
    } else if (cat === 'typeB') {
      disabilityAddition += disTable.typeB;
      disabilityTypeBCount++;
    }
  }

  // 6.4 冬季加算（参考値）
  let winterAdditionEstimate = 0;
  if (input.winterZone) {
    const wZoneTable = criteriaData.winterAddition[input.winterZone]?.[grade];
    if (wZoneTable) {
      if (n === 1) winterAdditionEstimate = wZoneTable.single;
      else if (n === 2) winterAdditionEstimate = wZoneTable.two;
      else if (n <= 5) winterAdditionEstimate = wZoneTable.three_to_five;
      else winterAdditionEstimate = wZoneTable.six_plus;
    }
  }

  const totalAdditions = childCareAddition + singleParentAddition + disabilityAddition;

  // 7. 住宅扶助・共益費算定
  let housingLimit = housingLimits['1'];
  if (n === 2) housingLimit = housingLimits['2'];
  else if (n >= 3 && n <= 5) housingLimit = housingLimits['3_5'];
  else if (n >= 6) housingLimit = housingLimits['6_plus'];

  // 純家賃サニタイズ
  let pureRent: number | null = null;
  if (input.pureRent !== undefined && input.pureRent !== null && !isNaN(input.pureRent)) {
    pureRent = Math.max(0, Math.floor(input.pureRent));
  }

  // 共益費サニタイズ
  let commonServiceFee: number | null = null;
  if (input.commonServiceFee !== undefined && input.commonServiceFee !== null && !isNaN(input.commonServiceFee)) {
    commonServiceFee = Math.max(0, Math.floor(input.commonServiceFee));
  }

  const feePaymentType = input.feePaymentType;

  // 住宅扶助の算定対象家賃決定
  let effectiveRentForHousingAssistance = 0;
  let approvedHousingAmount = 0;
  let outOfPocketFee = 0;
  let excessRent = 0;

  if (pureRent === null) {
    // 家賃未入力の場合は上限額をそのまま参考表示
    effectiveRentForHousingAssistance = housingLimit;
    approvedHousingAmount = housingLimit;
    outOfPocketFee = 0;
    excessRent = 0;
  } else {
    if (feePaymentType === 'included') {
      // 共益費・管理費が家賃に含まれている契約（不可分）
      // 契約上の総家賃を住宅扶助の対象とする（上限限度）
      effectiveRentForHousingAssistance = pureRent + (commonServiceFee ?? 0);
      approvedHousingAmount = Math.min(effectiveRentForHousingAssistance, housingLimit);
      outOfPocketFee = 0;
      excessRent = Math.max(0, effectiveRentForHousingAssistance - housingLimit);
    } else {
      // 共益費・管理費が家賃と別払い（原則ルール）
      // 住宅扶助は「純家賃」のみを対象とし、共益費は生活扶助本体から支払う
      effectiveRentForHousingAssistance = pureRent;
      approvedHousingAmount = Math.min(pureRent, housingLimit);
      outOfPocketFee = commonServiceFee ?? 0;
      excessRent = Math.max(0, pureRent - housingLimit);
    }
  }

  // 支給総額（受給できる保護費の月額）
  const totalBenefitMonthly = finalLivelihoodAmount + totalAdditions + approvedHousingAmount;

  // 実質手元生活費（生活扶助本体＋加算から、住宅扶助対象外の共益費や家賃超過分を差し引いた実質残額）
  const effectiveLivingAllowance = Math.max(
    0,
    finalLivelihoodAmount + totalAdditions - outOfPocketFee - excessRent
  );

  const winterTotalBenefitMonthly = totalBenefitMonthly + winterAdditionEstimate;

  return {
    livelihoodStandard: {
      category1Sum,
      reductionRate,
      category1Reduced,
      category2,
      baseAmount,
      transitionalAddition,
      temporarySpecialAddition,
      calculated2026,
      guaranteedAmount,
      finalLivelihoodAmount,
    },
    additions: {
      childCareAddition,
      childCareCount: childCount,
      singleParentAddition,
      disabilityAddition,
      disabilityTypeACount,
      disabilityTypeBCount,
      winterAdditionEstimate,
      totalAdditions,
    },
    housingAssistance: {
      limit: housingLimit,
      pureRent,
      commonServiceFee,
      feePaymentType,
      effectiveRentForHousingAssistance,
      approvedHousingAmount,
      outOfPocketFee,
      excessRent,
    },
    totalBenefitMonthly,
    effectiveLivingAllowance,
    winterTotalBenefitMonthly,
  };
}
