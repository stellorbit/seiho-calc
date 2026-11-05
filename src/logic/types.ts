import type { Grade, AgeCategory, WinterZone } from '../schemas/masterSchema';

export type DisabilityDetailType =
  | 'none'
  | 'physical_1_2'   // 身体障害者手帳 1・2級 (区分A)
  | 'mental_1'       // 精神障害者保健福祉手帳 1級 (区分A)
  | 'pension_1'      // 障害基礎年金 1級相当 (区分A)
  | 'special_child_1'// 特別児童扶養手当 1級 (区分A)
  | 'physical_3'     // 身体障害者手帳 3級 (区分B)
  | 'mental_2'       // 精神障害者保健福祉手帳 2級 (区分B)
  | 'pension_2'      // 障害基礎年金 2級相当 (区分B)
  | 'special_child_2';// 特別児童扶養手当 2級 (区分B)

// 妊産婦加算の区分（告示 別表第1 第2章1）
export type PregnancyStatus =
  | 'none'
  | 'pregnant_under6'  // 妊娠6か月未満（妊娠を確認した月の翌月から）
  | 'pregnant_6plus'   // 妊娠6か月以上
  | 'postpartum';      // 産婦（出産の月から6か月以内。保護受給中の出産は翌月から5か月以内）

export interface PersonInput {
  id: string;
  age: number | null;
  disabilityDetail: DisabilityDetailType;
  birthDate?: string | null;          // 'YYYY-MM-DD'（任意。入力時は年齢・児童の判定に優先して使用）
  pregnancyStatus?: PregnancyStatus;
  severeCare?: boolean;               // 第2章2(3): 特別児童扶養手当等施行令別表第1程度で常時介護を要する（施設入所者を除く）
  familyCare?: boolean;               // 第2章2(4): 区分Aで日常生活の全てに介護を要し、同一世帯員が介護している
}

export type FeePaymentType = 'separate' | 'included';

export interface CalculationInput {
  grade: Grade;
  members: PersonInput[];
  isSingleParent: boolean;
  pureRent?: number | null;            // 純家賃（共益費・管理費を除く）
  commonServiceFee?: number | null;    // 共益費・管理費
  feePaymentType: FeePaymentType;      // 'separate' (別払い) または 'included' (家賃込契約)
  winterZone?: WinterZone;
  calcMonth?: string | null;           // 試算する年月 'YYYY-MM'（年齢要件の基準日は当月1日。12月は期末一時扶助を加算）
}

export interface CalculationResult {
  livelihoodStandard: {
    category1Sum: number;
    reductionRate: number;
    category1Reduced: number;
    category2: number;
    transitionalAddition: number;      // 生活扶助本体に係る経過的加算（世帯員ごとの合算）
    baseAmount: number;                // 第1類×逓減率＋第2類＋経過的加算（10円未満切り上げ後）
    temporarySpecialAddition: number;  // 特例加算（世帯人員1人につき月額2,500円）
    yearEndAllowance: number;          // 期末一時扶助（試算月が12月の場合のみ）
    finalLivelihoodAmount: number;     // 生活扶助本体（baseAmount＋特例加算＋期末一時扶助）
  };
  additions: {
    childCareAddition: number;              // 児童養育加算（本体＋経過的加算）
    childCareCount: number;
    childCareTransitional: number;          // うち児童養育加算に係る経過的加算
    childCareTransitionalCount: number;
    singleParentAddition: number;           // 母子加算（本体＋経過的加算、重複調整後）
    singleParentChildCount: number;
    singleParentTransitional: number;       // うち母子加算に係る経過的加算
    disabilityAddition: number;             // 障害者加算（区分A/B＋重度障害者加算、重複調整後）
    disabilityTypeACount: number;
    disabilityTypeBCount: number;
    severeDisabilityCount: number;          // 重度障害者加算（16,560円）の対象者数
    familyCareAddition: number;             // 家族介護（13,890円/人。重複調整の対象外）
    familyCareCount: number;
    pregnancyAddition: number;              // 妊産婦加算
    pregnancyCount: number;
    overlapAdjusted: boolean;          // 障害者加算と母子加算の重複調整を行ったか
    birthDateUsed: boolean;            // 生年月日による年齢要件判定を行った世帯員がいるか
    winterAdditionEstimate: number;    // 冬季加算（地区別・世帯人員別。冬季のみ）
    totalAdditions: number;            // 冬季加算を除く加算合計
  };
  housingAssistance: {
    limit: number;
    pureRent: number | null;
    commonServiceFee: number | null;
    feePaymentType: FeePaymentType;
    effectiveRentForHousingAssistance: number; // 住宅扶助の算定基準家賃
    approvedHousingAmount: number;            // 住宅扶助支給額
    outOfPocketFee: number;                   // 共益費等の自己負担額（生活費から支出）
    excessRent: number;                       // 家賃上限超過分
  };
  totalBenefitMonthly: number;               // 生活保護費 支給総額（生活扶助＋加算＋住宅扶助）
  effectiveLivingAllowance: number;          // 住居費支出後の実質手元生活費（支給額 - 住宅費実費）
  winterTotalBenefitMonthly: number;         // 冬季加算を含む参考月額
}
