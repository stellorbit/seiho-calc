import type { Grade, AgeCategory, Criteria, HousingLimit, MajorGrade } from '../schemas/masterSchema';
import type { CalculationInput, CalculationResult, PersonInput, DisabilityDetailType } from './types';
import rawCriteria from '../data/criteria_202610.json';

// ビルド時・テスト時にZodで検証済みの基準データ
const criteriaData = rawCriteria as unknown as Criteria;

// 児童（18歳に達する日以後の最初の3月31日までの者）を年齢のみで判定する際の上限年齢
const CHILD_MAX_AGE = 18;

type MembersKey10 = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10';
type MembersKey9 = Exclude<MembersKey10, '10'>;

function toMajorGrade(grade: Grade): MajorGrade {
  return grade.charAt(0) as MajorGrade;
}

function membersKeyUpTo10(n: number): MembersKey10 {
  return String(Math.min(n, 10)) as MembersKey10;
}

// 9人までは表の額、10人以上は9人の額に1人を増すごとの額を加える
function byMembersWithIncrement(table: { byMembers: Record<MembersKey9, number>; perPersonOver9: number }, n: number): number {
  if (n <= 9) return table.byMembers[String(n) as MembersKey9];
  return table.byMembers['9'] + (n - 9) * table.perPersonOver9;
}

// 100倍した整数値を受け取り、元の額の10円未満を10円に切り上げる（浮動小数点の誤差を避けるため整数で扱う）
function ceilTo10FromTimes100(valueTimes100: number): number {
  return Math.ceil(valueTimes100 / 1000) * 10;
}

export function getAgeCategory(age: number): AgeCategory {
  const safeAge = Math.max(0, Math.floor(age));
  if (safeAge <= 2) return '0_2';
  if (safeAge <= 5) return '3_5';
  if (safeAge <= 11) return '6_11';
  if (safeAge <= 17) return '12_17';
  if (safeAge <= 19) return '18_19';
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
  housingLimits: HousingLimit
): CalculationResult {
  const n = input.members.length;
  if (n <= 0) {
    throw new Error('世帯員は少なくとも1名必要です。');
  }

  const grade = input.grade;
  const majorGrade = toMajorGrade(grade);

  const ages: number[] = input.members.map((m) => {
    if (m.age === null || m.age === undefined || isNaN(m.age)) {
      throw new Error(`世帯員の年齢が未入力です（ID: ${m.id}）。年齢を正しく入力してください。`);
    }
    return Math.max(0, Math.floor(m.age));
  });

  // 告示 別表第1 第1章1(2)ア: 基準生活費 = A（第1類合算×逓減率＋第2類）＋B（経過的加算）
  // その額の10円未満の端数は10円に切り上げる
  const membersKey10 = membersKeyUpTo10(n);

  // 1. 第1類合算
  let category1Sum = 0;
  for (const age of ages) {
    category1Sum += criteriaData.category1Standard[getAgeCategory(age)][grade];
  }

  // 2. 逓減率（百分率の整数）
  const reductionRate = criteriaData.reductionRates[membersKey10];
  const category1ReducedTimes100 = category1Sum * reductionRate;
  const category1Reduced = Math.floor(category1ReducedTimes100 / 100);

  // 3. 第2類（全級地同額。10人以上は1人増すごとに加算）
  const category2 = byMembersWithIncrement(criteriaData.category2Standard, n);

  // 4. 生活扶助本体に係る経過的加算（世帯人員に応じた年齢別の額を世帯員ごとに合算）
  const transTable = criteriaData.transitionalAddition[membersKey10];
  let transitionalAddition = 0;
  for (const age of ages) {
    transitionalAddition += transTable[getAgeCategory(age)][grade];
  }

  // 5. 端数処理（10円未満切り上げ）後に特例加算（1人につき月額2,500円）を加える
  const baseAmount = ceilTo10FromTimes100(category1ReducedTimes100 + (category2 + transitionalAddition) * 100);
  const temporarySpecialAddition = criteriaData.temporarySpecialAdditionPerPerson * n;
  const finalLivelihoodAmount = baseAmount + temporarySpecialAddition;

  // 6. 各種加算（告示 別表第1 第2章。加算額は1・2・3級地の区分）
  // 6.1 児童養育加算: 18歳に達する日以後の最初の3月31日までの児童1人につき（年齢のみで判定するため18歳を含める）
  const childCount = ages.filter((age) => age <= CHILD_MAX_AGE).length;
  const childCareAddition = childCount * criteriaData.childCareAdditionPerChild;

  // 6.2 障害者加算（区分A: 身体障害者手帳1・2級等、区分B: 3級等）
  const disTable = criteriaData.disabilityAddition[majorGrade];
  const disabilityAmounts = input.members.map((m) => {
    const cat = mapDisabilityToCategory(m.disabilityDetail);
    if (cat === 'typeA') return disTable.typeA;
    if (cat === 'typeB') return disTable.typeB;
    return 0;
  });
  const disabilityTypeACount = input.members.filter((m) => mapDisabilityToCategory(m.disabilityDetail) === 'typeA').length;
  const disabilityTypeBCount = input.members.filter((m) => mapDisabilityToCategory(m.disabilityDetail) === 'typeB').length;
  let disabilityAddition = disabilityAmounts.reduce((sum, v) => sum + v, 0);

  // 6.3 母子加算: 養育に当たる者（世帯主＝1人目）について、児童（18歳年度末まで、または障害のある20歳未満）の数に応じて算定
  let singleParentAddition = 0;
  let singleParentChildCount = 0;
  let overlapAdjusted = false;
  if (input.isSingleParent && n > 1) {
    singleParentChildCount = input.members.filter((m, idx) => {
      if (idx === 0) return false;
      const age = ages[idx];
      return age <= CHILD_MAX_AGE || (age < 20 && mapDisabilityToCategory(m.disabilityDetail) !== 'none');
    }).length;

    if (singleParentChildCount > 0) {
      const spTable = criteriaData.singleParentAddition[majorGrade];
      const firstChildAmount = spTable.oneChild;
      const extraAmount =
        (singleParentChildCount >= 2 ? spTable.secondChild : 0) +
        Math.max(0, singleParentChildCount - 2) * spTable.perChildFromThird;

      // 告示 第2章9: 同一の者が障害者加算と母子加算の両方に該当する場合は高い方（同額はいずれか一方）を算定。
      // 児童2人以上の場合に児童1人につき加算する額は重複調整を行わない。
      const parentDisability = disabilityAmounts[0];
      if (parentDisability > 0) {
        overlapAdjusted = true;
        if (parentDisability >= firstChildAmount) {
          singleParentAddition = extraAmount;
        } else {
          disabilityAddition -= parentDisability;
          singleParentAddition = firstChildAmount + extraAmount;
        }
      } else {
        singleParentAddition = firstChildAmount + extraAmount;
      }
    }
  }

  // 6.4 冬季加算（第2類の地区別冬季加算額。全級地同額、世帯人員別）
  // 冬季加算額は10円単位のため、端数処理後の額に加算しても算定結果は同一
  const winterAdditionEstimate = input.winterZone
    ? byMembersWithIncrement(criteriaData.winterAddition[input.winterZone], n)
    : 0;

  const totalAdditions = childCareAddition + singleParentAddition + disabilityAddition;

  // 7. 住宅扶助・共益費算定
  let housingLimit = housingLimits['1'];
  if (n === 2) housingLimit = housingLimits['2'];
  else if (n >= 3 && n <= 5) housingLimit = housingLimits['3_5'];
  else if (n === 6) housingLimit = housingLimits['6'];
  else if (n >= 7) housingLimit = housingLimits['7_plus'];

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
      transitionalAddition,
      baseAmount,
      temporarySpecialAddition,
      finalLivelihoodAmount,
    },
    additions: {
      childCareAddition,
      childCareCount: childCount,
      singleParentAddition,
      singleParentChildCount,
      disabilityAddition,
      disabilityTypeACount,
      disabilityTypeBCount,
      overlapAdjusted,
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
