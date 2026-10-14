import fs from 'fs';
import path from 'path';
import { CriteriaSchema, MunicipalityFileSchema } from '../src/schemas/masterSchema';

// 1. Validate criteria_202610.json
const criteriaPath = path.resolve('src/data/criteria_202610.json');
const criteriaRaw = JSON.parse(fs.readFileSync(criteriaPath, 'utf-8'));
const criteriaResult = CriteriaSchema.safeParse(criteriaRaw);

if (!criteriaResult.success) {
  console.error('Criteria validation failed:', criteriaResult.error.format());
  process.exit(1);
}
console.log('Criteria schema validation passed.');

// 2. Validate all 47 municipalities
const mDir = path.resolve('public/data/municipalities');
const files = fs.readdirSync(mDir).filter(f => f.endsWith('.json'));

for (const file of files) {
  const filePath = path.join(mDir, file);
  const mRaw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const mResult = MunicipalityFileSchema.safeParse(mRaw);
  if (!mResult.success) {
    console.error(`Municipality validation failed for ${file}:`, mResult.error.format());
    process.exit(1);
  }
}
console.log(`Validated ${files.length} municipality files successfully.`);
