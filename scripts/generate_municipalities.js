import fs from 'fs';
import path from 'path';

// 住宅扶助（家賃・間代等）の限度額と級地区分から、都道府県別の自治体マスターを生成する。
// - 級地: scripts/data/kyuchi_h30.json（厚生労働省 kyuchi.3010.pdf、平成30年10月1日現在）
// - 限度額: scripts/data/housing_limits_r8.json（令和8年10月現在として扱う一覧。出典は同ファイルの _source を参照）
// 指定都市・中核市は市ごとの限度額、それ以外は都道府県×級地（1・2・3級地）の限度額を適用する。

const outDir = path.resolve('public/data/municipalities');
const dataDir = path.resolve('scripts/data');

const kyuchi = JSON.parse(fs.readFileSync(path.join(dataDir, 'kyuchi_h30.json'), 'utf-8'));
const limits = JSON.parse(fs.readFileSync(path.join(dataDir, 'housing_limits_r8.json'), 'utf-8'));

// 都道府県コード・名称・冬季加算の地区区分
// 地区区分は告示 別表第1 第1章1(2)イの表による（都道府県単位。市町村単位の例外規定なし）
//   Ⅰ区: 北海道・青森県・秋田県／Ⅱ区: 岩手県・山形県・新潟県／Ⅲ区: 宮城県・福島県・富山県・長野県
//   Ⅳ区: 石川県・福井県／Ⅴ区: 栃木県・群馬県・山梨県・岐阜県・鳥取県・島根県／Ⅵ区: その他の都府県
const prefectures = [
  ['01', '北海道', 'I'], ['02', '青森県', 'I'], ['03', '岩手県', 'II'], ['04', '宮城県', 'III'],
  ['05', '秋田県', 'I'], ['06', '山形県', 'II'], ['07', '福島県', 'III'], ['08', '茨城県', 'VI'],
  ['09', '栃木県', 'V'], ['10', '群馬県', 'V'], ['11', '埼玉県', 'VI'], ['12', '千葉県', 'VI'],
  ['13', '東京都', 'VI'], ['14', '神奈川県', 'VI'], ['15', '新潟県', 'II'], ['16', '富山県', 'III'],
  ['17', '石川県', 'IV'], ['18', '福井県', 'IV'], ['19', '山梨県', 'V'], ['20', '長野県', 'III'],
  ['21', '岐阜県', 'V'], ['22', '静岡県', 'VI'], ['23', '愛知県', 'VI'], ['24', '三重県', 'VI'],
  ['25', '滋賀県', 'VI'], ['26', '京都府', 'VI'], ['27', '大阪府', 'VI'], ['28', '兵庫県', 'VI'],
  ['29', '奈良県', 'VI'], ['30', '和歌山県', 'VI'], ['31', '鳥取県', 'V'], ['32', '島根県', 'V'],
  ['33', '岡山県', 'VI'], ['34', '広島県', 'VI'], ['35', '山口県', 'VI'], ['36', '徳島県', 'VI'],
  ['37', '香川県', 'VI'], ['38', '愛媛県', 'VI'], ['39', '高知県', 'VI'], ['40', '福岡県', 'VI'],
  ['41', '佐賀県', 'VI'], ['42', '長崎県', 'VI'], ['43', '熊本県', 'VI'], ['44', '大分県', 'VI'],
  ['45', '宮崎県', 'VI'], ['46', '鹿児島県', 'VI'], ['47', '沖縄県', 'VI'],
];

const DISPLAY_NAMES = { 区の存する地域: '特別区（23区）' };
const OTHER_NAME = '上記以外の市町村';

function prefLimit(prefName, grade, label) {
  const major = grade.split('-')[0];
  const row = limits.prefectures[prefName]?.[major];
  if (!row) {
    throw new Error(`住宅扶助限度額が未定義です: ${prefName} ${major}級地（${label}）`);
  }
  return row;
}

fs.mkdirSync(outDir, { recursive: true });
const usedCities = new Set();
let total = 0;

for (const [code, prefName, zone] of prefectures) {
  const entries = kyuchi.prefectures[prefName];
  if (!entries) {
    throw new Error(`級地データがありません: ${prefName}`);
  }

  const items = entries.map(({ name, grade }) => {
    const city = limits.cities[name];
    let housingLimit;
    if (city) {
      if (usedCities.has(name)) {
        throw new Error(`指定都市・中核市が重複しています: ${name}`);
      }
      usedCities.add(name);
      housingLimit = city.limits;
    } else {
      housingLimit = prefLimit(prefName, grade, name);
    }
    return { name: DISPLAY_NAMES[name] ?? name, grade, housingLimit };
  });

  items.push({
    name: `${OTHER_NAME}（3級地-2）`,
    grade: '3-2',
    housingLimit: prefLimit(prefName, '3-2', OTHER_NAME),
  });

  const fileData = {
    prefCode: code,
    prefName,
    winterZone: zone,
    municipalities: items.map((item, index) => ({
      code: `${code}${String(index + 1).padStart(3, '0')}`,
      ...item,
    })),
  };

  fs.writeFileSync(path.join(outDir, `${code}.json`), JSON.stringify(fileData, null, 2) + '\n', 'utf-8');
  total += items.length;
}

const unusedCities = Object.keys(limits.cities).filter((name) => !usedCities.has(name));
if (unusedCities.length > 0) {
  throw new Error(`級地データに対応しない指定都市・中核市があります: ${unusedCities.join('、')}`);
}

console.log(`Generated ${total} municipalities for ${prefectures.length} prefectures.`);
