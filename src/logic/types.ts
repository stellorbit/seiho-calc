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

export interface PersonInput {
  id: string;
  age: number;
  disabilityDetail: DisabilityDetailType;
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
}

export interface CalculationResult {
  livelihoodStandard: {
    category1Sum: number;
    reductionRate: number;
    category1Reduced: number;
    category2: number;
    baseAmount: number; // 10円未満切り上げ後
    transitionalAddition: number;
    temporarySpecialAddition: number;
    calculated2026: number;
    guaranteedAmount: number;
    finalLivelihoodAmount: number;
  };
  additions: {
    childCareAddition: number;
    childCareCount: number;
    singleParentAddition: number;
    disabilityAddition: number;
    disabilityTypeACount: number;
    disabilityTypeBCount: number;
    winterAdditionEstimate: number; // 参考値
    totalAdditions: number; // 冬季加算を除く定常加算合計
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
