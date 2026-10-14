import { z } from 'zod';

export const GradeSchema = z.enum(['1-1', '1-2', '2-1', '2-2', '3-1', '3-2']);
export type Grade = z.infer<typeof GradeSchema>;

export const AgeCategorySchema = z.enum([
  '0_2',
  '3_5',
  '6_11',
  '12_19',
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

export const CriteriaSchema = z.object({
  revisionDate: z.string(),
  temporarySpecialAdditionPerPerson: z.number().int().nonnegative(),
  childCareAdditionPerChild: z.number().int().nonnegative(),
  category1Standard: z.record(AgeCategorySchema, z.record(GradeSchema, z.number().int().nonnegative())),
  reductionRates: z.record(z.string(), z.number().int().positive()),
  category2Standard: z.record(z.string(), z.record(GradeSchema, z.number().int().nonnegative())),
  transitionalAddition: z.record(z.string(), z.record(GradeSchema, z.number().int().nonnegative())),
  guaranteedPreviousStandard: z.record(z.string(), z.record(GradeSchema, z.number().int().nonnegative())),
  singleParentAddition: z.record(
    GradeSchema,
    z.object({
      oneChild: z.number().int().nonnegative(),
      twoChildren: z.number().int().nonnegative(),
      additionalPerChild: z.number().int().nonnegative(),
    })
  ),
  disabilityAddition: z.record(
    GradeSchema,
    z.object({
      typeA: z.number().int().nonnegative(),
      typeB: z.number().int().nonnegative(),
    })
  ),
  winterAddition: z.record(
    WinterZoneSchema,
    z.record(
      GradeSchema,
      z.object({
        single: z.number().int().nonnegative(),
        two: z.number().int().nonnegative(),
        three_to_five: z.number().int().nonnegative(),
        six_plus: z.number().int().nonnegative(),
      })
    )
  ),
});

export type Criteria = z.infer<typeof CriteriaSchema>;

export const HousingLimitSchema = z.object({
  '1': z.number().int().nonnegative(),
  '2': z.number().int().nonnegative(),
  '3_5': z.number().int().nonnegative(),
  '6_plus': z.number().int().nonnegative(),
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
