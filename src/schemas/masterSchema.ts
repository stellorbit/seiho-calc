import { z } from 'zod';

export const GradeSchema = z.enum(['1-1', '1-2', '2-1', '2-2', '3-1', '3-2']);
export type Grade = z.infer<typeof GradeSchema>;

export const AgeCategorySchema = z.enum([
  '0_2',
  '3_5',
  '6_11',
  '12_17',
  '18_19',
  '20_40',
  '41_59',
  '60_64',
  '65_69',
  '70_74',
  '75_plus',
]);
export type AgeCategory = z.infer<typeof AgeCategorySchema>;

export const WinterZoneSchema = z.enum(['I', 'II', 'III', 'IV', 'V', 'VI']);
export type WinterZone = z.infer<typeof WinterZoneSchema>;

// 加算額の級地区分（1級地・2級地・3級地）
export const MajorGradeSchema = z.enum(['1', '2', '3']);
export type MajorGrade = z.infer<typeof MajorGradeSchema>;

const yen = z.number().int().nonnegative();

// 世帯人員キー: 逓減率・経過的加算は '1'〜'9' と '10'（10人以上）、第2類・冬季加算は '1'〜'9'
const MembersUpTo10Schema = z.enum(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
const MembersUpTo9Schema = z.enum(['1', '2', '3', '4', '5', '6', '7', '8', '9']);

export const CriteriaSchema = z.object({
  revisionDate: z.string(),
  source: z.object({
    title: z.string(),
    url: z.url(),
    crossCheck: z.url(),
  }),
  temporarySpecialAdditionPerPerson: yen,
  category1Standard: z.record(AgeCategorySchema, z.record(GradeSchema, yen)),
  // 逓減率（百分率の整数）。'10' は10人以上
  reductionRates: z.record(MembersUpTo10Schema, z.number().int().positive().max(100)),
  category2Standard: z.object({
    byMembers: z.record(MembersUpTo9Schema, yen),
    perPersonOver9: yen,
  }),
  // 経過的加算（月額）: 世帯人員 × 年齢区分 × 級地。'10' は10人以上
  transitionalAddition: z.record(MembersUpTo10Schema, z.record(AgeCategorySchema, z.record(GradeSchema, yen))),
  winterAddition: z.record(
    WinterZoneSchema,
    z.object({
      byMembers: z.record(MembersUpTo9Schema, yen),
      perPersonOver9: yen,
    })
  ),
  childCareAdditionPerChild: yen,
  singleParentAddition: z.record(
    MajorGradeSchema,
    z.object({
      oneChild: yen,
      secondChild: yen,
      perChildFromThird: yen,
    })
  ),
  disabilityAddition: z.record(
    MajorGradeSchema,
    z.object({
      typeA: yen,
      typeB: yen,
    })
  ),
});

export type Criteria = z.infer<typeof CriteriaSchema>;

export const HousingLimitSchema = z.object({
  '1': z.number().int().nonnegative(),
  '2': z.number().int().nonnegative(),
  '3_5': z.number().int().nonnegative(),
  '6': z.number().int().nonnegative(),
  '7_plus': z.number().int().nonnegative(),
});
export type HousingLimit = z.infer<typeof HousingLimitSchema>;

export const MunicipalityItemSchema = z.object({
  code: z.string(),
  name: z.string(),
  grade: GradeSchema,
  housingLimit: HousingLimitSchema,
});
export type MunicipalityItem = z.infer<typeof MunicipalityItemSchema>;

export const MunicipalityFileSchema = z.object({
  prefCode: z.string().length(2),
  prefName: z.string(),
  winterZone: WinterZoneSchema,
  municipalities: z.array(MunicipalityItemSchema),
});
export type MunicipalityFile = z.infer<typeof MunicipalityFileSchema>;
