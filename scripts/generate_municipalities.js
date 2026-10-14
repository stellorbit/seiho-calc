import fs from 'fs';
import path from 'path';

const outDir = path.resolve('public/data/municipalities');
fs.mkdirSync(outDir, { recursive: true });

// 住宅扶助特別基準額（上限）標準マトリクス
const standardLimits = {
  '1-1': { '1': 53700, '2': 64000, '3_5': 69800, '6_plus': 75000 },
  '1-2': { '1': 46000, '2': 55000, '3_5': 59800, '6_plus': 65000 },
  '2-1': { '1': 40000, '2': 48000, '3_5': 52000, '6_plus': 56000 },
  '2-2': { '1': 36000, '2': 43000, '3_5': 47000, '6_plus': 51000 },
  '3-1': { '1': 33000, '2': 40000, '3_5': 43000, '6_plus': 47000 },
  '3-2': { '1': 29000, '2': 35000, '3_5': 38000, '6_plus': 41000 },
};

// 47都道府県の詳細市町村データ
const prefData = [
  {
    code: '01', name: '北海道', zone: 'I',
    list: [
      { name: '札幌市中央区・北区・東区等（全区）', grade: '1-2', limits: standardLimits['1-2'] },
      { name: '旭川市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '函館市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '小樽市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '室蘭市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '釧路市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '帯広市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '北見市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '苫小牧市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '江別市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '千歳市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '恵庭市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '北広島市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '石狩市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '岩見沢市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '網走市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '留萌市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '稚内市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '美唄市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: '夕張市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: 'その他郡部・町村', grade: '3-2', limits: standardLimits['3-2'] }
    ]
  },
  {
    code: '02', name: '青森県', zone: 'II',
    list: [
      { name: '青森市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '八戸市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '弘前市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '十和田市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '三沢市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: 'むつ市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '黒石市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: '五所川原市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: 'その他町村部', grade: '3-2', limits: standardLimits['3-2'] }
    ]
  },
  {
    code: '03', name: '岩手県', zone: 'II',
    list: [
      { name: '盛岡市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '奥州市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '一関市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '花巻市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '北上市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '宮古市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: '大船渡市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: '釜石市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: 'その他町村部', grade: '3-2', limits: standardLimits['3-2'] }
    ]
  },
  {
    code: '04', name: '宮城県', zone: 'III',
    list: [
      { name: '仙台市青葉区・宮城野区等（全区）', grade: '1-2', limits: { '1': 47000, '2': 56000, '3_5': 61000, '6_plus': 66000 } },
      { name: '石巻市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '塩竈市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '名取市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '多賀城市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '富谷市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '大崎市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '気仙沼市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '白石市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: 'その他町村部', grade: '3-2', limits: standardLimits['3-2'] }
    ]
  },
  {
    code: '05', name: '秋田県', zone: 'II',
    list: [
      { name: '秋田市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '大仙市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '横手市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '由利本荘市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '大館市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: '能代市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: '湯沢市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: 'その他町村部', grade: '3-2', limits: standardLimits['3-2'] }
    ]
  },
  {
    code: '06', name: '山形県', zone: 'III',
    list: [
      { name: '山形市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '酒田市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '鶴岡市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '米沢市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '天童市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '東根市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '新庄市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: 'その他町村部', grade: '3-2', limits: standardLimits['3-2'] }
    ]
  },
  {
    code: '07', name: '福島県', zone: 'III',
    list: [
      { name: '福島市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '郡山市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: 'いわき市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '会津若松市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '須賀川市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '白河市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '南相馬市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: '伊達市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: 'その他町村部', grade: '3-2', limits: standardLimits['3-2'] }
    ]
  },
  {
    code: '08', name: '茨城県', zone: 'VI',
    list: [
      { name: '水戸市', grade: '2-1', limits: { '1': 42000, '2': 50000, '3_5': 54000, '6_plus': 58000 } },
      { name: 'つくば市', grade: '1-2', limits: standardLimits['1-2'] },
      { name: '日立市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '土浦市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '古河市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '取手市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '牛久市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '守谷市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: 'ひたちなか市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '鹿嶋市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '神栖市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: 'その他市町村', grade: '3-1', limits: standardLimits['3-1'] }
    ]
  },
  {
    code: '09', name: '栃木県', zone: 'VI',
    list: [
      { name: '宇都宮市', grade: '2-1', limits: { '1': 43000, '2': 51000, '3_5': 55000, '6_plus': 59000 } },
      { name: '小山市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '足利市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '栃木市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '佐野市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '那須塩原市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '鹿沼市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: '日光市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: 'その他市町村', grade: '3-1', limits: standardLimits['3-1'] }
    ]
  },
  {
    code: '10', name: '群馬県', zone: 'IV',
    list: [
      { name: '前橋市', grade: '2-1', limits: { '1': 42000, '2': 50000, '3_5': 54000, '6_plus': 58000 } },
      { name: '高崎市', grade: '2-1', limits: { '1': 42000, '2': 50000, '3_5': 54000, '6_plus': 58000 } },
      { name: '太田市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '伊勢崎市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '桐生市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '館林市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '渋川市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: '藤岡市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: 'その他市町村', grade: '3-2', limits: standardLimits['3-2'] }
    ]
  },
  {
    code: '11', name: '埼玉県', zone: 'VI',
    list: [
      { name: 'さいたま市（大宮・浦和・中央等全区）', grade: '1-1', limits: { '1': 51000, '2': 61000, '3_5': 66000, '6_plus': 71000 } },
      { name: '川口市', grade: '1-1', limits: { '1': 51000, '2': 61000, '3_5': 66000, '6_plus': 71000 } },
      { name: '所沢市', grade: '1-1', limits: { '1': 51000, '2': 61000, '3_5': 66000, '6_plus': 71000 } },
      { name: '越谷市', grade: '1-1', limits: { '1': 51000, '2': 61000, '3_5': 66000, '6_plus': 71000 } },
      { name: '草加市', grade: '1-1', limits: { '1': 51000, '2': 61000, '3_5': 66000, '6_plus': 71000 } },
      { name: '春日部市', grade: '1-1', limits: { '1': 51000, '2': 61000, '3_5': 66000, '6_plus': 71000 } },
      { name: '上尾市', grade: '1-1', limits: { '1': 51000, '2': 61000, '3_5': 66000, '6_plus': 71000 } },
      { name: '戸田市', grade: '1-1', limits: { '1': 51000, '2': 61000, '3_5': 66000, '6_plus': 71000 } },
      { name: '和光市', grade: '1-1', limits: { '1': 51000, '2': 61000, '3_5': 66000, '6_plus': 71000 } },
      { name: '新座市', grade: '1-1', limits: { '1': 51000, '2': 61000, '3_5': 66000, '6_plus': 71000 } },
      { name: '川越市', grade: '1-2', limits: standardLimits['1-2'] },
      { name: '熊谷市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '深谷市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '秩父市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: 'その他町村部', grade: '3-1', limits: standardLimits['3-1'] }
    ]
  },
  {
    code: '12', name: '千葉県', zone: 'VI',
    list: [
      { name: '千葉市（中央・花見川・稲毛等全区）', grade: '1-1', limits: { '1': 51000, '2': 61000, '3_5': 66000, '6_plus': 71000 } },
      { name: '市川市', grade: '1-1', limits: { '1': 51000, '2': 61000, '3_5': 66000, '6_plus': 71000 } },
      { name: '船橋市', grade: '1-1', limits: { '1': 51000, '2': 61000, '3_5': 66000, '6_plus': 71000 } },
      { name: '松戸市', grade: '1-1', limits: { '1': 51000, '2': 61000, '3_5': 66000, '6_plus': 71000 } },
      { name: '柏市', grade: '1-1', limits: { '1': 51000, '2': 61000, '3_5': 66000, '6_plus': 71000 } },
      { name: '浦安市', grade: '1-1', limits: { '1': 51000, '2': 61000, '3_5': 66000, '6_plus': 71000 } },
      { name: '習志野市', grade: '1-1', limits: { '1': 51000, '2': 61000, '3_5': 66000, '6_plus': 71000 } },
      { name: '流山市', grade: '1-1', limits: { '1': 51000, '2': 61000, '3_5': 66000, '6_plus': 71000 } },
      { name: '八千代市', grade: '1-1', limits: { '1': 51000, '2': 61000, '3_5': 66000, '6_plus': 71000 } },
      { name: '市原市', grade: '1-2', limits: standardLimits['1-2'] },
      { name: '木更津市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '成田市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '茂原市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '銚子市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '館山市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: 'その他町村部', grade: '3-2', limits: standardLimits['3-2'] }
    ]
  },
  {
    code: '13', name: '東京都', zone: 'VI',
    list: [
      { name: '特別区（23区すべて：新宿・世田谷・足立・大田等）', grade: '1-1', limits: standardLimits['1-1'] },
      { name: '八王子市', grade: '1-1', limits: standardLimits['1-1'] },
      { name: '立川市', grade: '1-1', limits: standardLimits['1-1'] },
      { name: '武蔵野市', grade: '1-1', limits: standardLimits['1-1'] },
      { name: '三鷹市', grade: '1-1', limits: standardLimits['1-1'] },
      { name: '府中市', grade: '1-1', limits: standardLimits['1-1'] },
      { name: '調布市', grade: '1-1', limits: standardLimits['1-1'] },
      { name: '町田市', grade: '1-1', limits: standardLimits['1-1'] },
      { name: '小金井市', grade: '1-1', limits: standardLimits['1-1'] },
      { name: '小平市', grade: '1-1', limits: standardLimits['1-1'] },
      { name: '日野市', grade: '1-1', limits: standardLimits['1-1'] },
      { name: '東村山市', grade: '1-1', limits: standardLimits['1-1'] },
      { name: '国分寺市', grade: '1-1', limits: standardLimits['1-1'] },
      { name: '国立市', grade: '1-1', limits: standardLimits['1-1'] },
      { name: '西東京市', grade: '1-1', limits: standardLimits['1-1'] },
      { name: '狛江市', grade: '1-1', limits: standardLimits['1-1'] },
      { name: '東大和市', grade: '1-1', limits: standardLimits['1-1'] },
      { name: '清瀬市', grade: '1-1', limits: standardLimits['1-1'] },
      { name: '東久留米市', grade: '1-1', limits: standardLimits['1-1'] },
      { name: '多摩市', grade: '1-1', limits: standardLimits['1-1'] },
      { name: '稲城市', grade: '1-1', limits: standardLimits['1-1'] },
      { name: '福生市', grade: '1-1', limits: standardLimits['1-1'] },
      { name: '羽村市', grade: '1-1', limits: standardLimits['1-1'] },
      { name: 'あきる野市', grade: '1-2', limits: standardLimits['1-2'] },
      { name: '青梅市', grade: '1-2', limits: standardLimits['1-2'] },
      { name: '西多摩郡（瑞穂町・日の出町・檜原村・奥多摩町）', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '島しょ部（大島・八丈島等）', grade: '2-1', limits: standardLimits['2-1'] }
    ]
  },
  {
    code: '14', name: '神奈川県', zone: 'VI',
    list: [
      { name: '横浜市（全区：中区・西区・港北区・戸塚区等）', grade: '1-1', limits: { '1': 52000, '2': 62000, '3_5': 67000, '6_plus': 72000 } },
      { name: '川崎市（全区：川崎区・中原区・高津区等）', grade: '1-1', limits: { '1': 52000, '2': 62000, '3_5': 67000, '6_plus': 72000 } },
      { name: '相模原市（中央区・南区・緑区）', grade: '1-1', limits: standardLimits['1-1'] },
      { name: '横須賀市', grade: '1-2', limits: standardLimits['1-2'] },
      { name: '藤沢市', grade: '1-2', limits: standardLimits['1-2'] },
      { name: '平塚市', grade: '1-2', limits: standardLimits['1-2'] },
      { name: '茅ヶ崎市', grade: '1-2', limits: standardLimits['1-2'] },
      { name: '大和市', grade: '1-2', limits: standardLimits['1-2'] },
      { name: '厚木市', grade: '1-2', limits: standardLimits['1-2'] },
      { name: '鎌倉市', grade: '1-2', limits: standardLimits['1-2'] },
      { name: '海老名市', grade: '1-2', limits: standardLimits['1-2'] },
      { name: '座間市', grade: '1-2', limits: standardLimits['1-2'] },
      { name: '小田原市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '秦野市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '伊勢原市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '逗子市・葉山町', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '三浦市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '足柄下郡（箱根町・湯河原町・真鶴町）', grade: '2-2', limits: standardLimits['2-2'] },
      { name: 'その他郡部・町村', grade: '3-1', limits: standardLimits['3-1'] }
    ]
  },
  {
    code: '15', name: '新潟県', zone: 'III',
    list: [
      { name: '新潟市（中央区・西区等全区）', grade: '1-2', limits: standardLimits['1-2'] },
      { name: '長岡市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '上越市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '三条市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '柏崎市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '新発田市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '燕市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '佐渡市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: 'その他市町村', grade: '3-2', limits: standardLimits['3-2'] }
    ]
  },
  {
    code: '16', name: '富山県', zone: 'III',
    list: [
      { name: '富山市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '高岡市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '射水市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '魚津市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: '氷見市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: 'その他市町村', grade: '3-2', limits: standardLimits['3-2'] }
    ]
  },
  {
    code: '17', name: '石川県', zone: 'III',
    list: [
      { name: '金沢市', grade: '2-1', limits: { '1': 43000, '2': 51000, '3_5': 55000, '6_plus': 59000 } },
      { name: '白山市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '小松市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '加賀市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: '七尾市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: 'その他市町村', grade: '3-2', limits: standardLimits['3-2'] }
    ]
  },
  {
    code: '18', name: '福井県', zone: 'III',
    list: [
      { name: '福井市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '敦賀市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '坂井市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '越前市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '鯖江市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: 'その他市町村', grade: '3-2', limits: standardLimits['3-2'] }
    ]
  },
  {
    code: '19', name: '山梨県', zone: 'IV',
    list: [
      { name: '甲府市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '甲斐市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '南アルプス市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '富士吉田市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '笛吹市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: 'その他市町村', grade: '3-2', limits: standardLimits['3-2'] }
    ]
  },
  {
    code: '20', name: '長野県', zone: 'III',
    list: [
      { name: '長野市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '松本市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '上田市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '飯田市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '佐久市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '安曇野市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '諏訪市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: '伊那市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: 'その他市町村', grade: '3-2', limits: standardLimits['3-2'] }
    ]
  },
  {
    code: '21', name: '岐阜県', zone: 'IV',
    list: [
      { name: '岐阜市', grade: '2-1', limits: { '1': 42000, '2': 50000, '3_5': 54000, '6_plus': 58000 } },
      { name: '大垣市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '各務原市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '多治見市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '可児市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '高山市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: '中津川市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: 'その他市町村', grade: '3-2', limits: standardLimits['3-2'] }
    ]
  },
  {
    code: '22', name: '静岡県', zone: 'VI',
    list: [
      { name: '静岡市（葵区・駿河区・清水区）', grade: '1-2', limits: standardLimits['1-2'] },
      { name: '浜松市（中区・東区・浜北区等全区）', grade: '1-2', limits: standardLimits['1-2'] },
      { name: '沼津市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '富士市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '三島市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '磐田市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '焼津市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '藤枝市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '掛川市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '熱海市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '御殿場市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: 'その他市町村', grade: '3-1', limits: standardLimits['3-1'] }
    ]
  },
  {
    code: '23', name: '愛知県', zone: 'VI',
    list: [
      { name: '名古屋市（中区・千種区・中村区・緑区等全区）', grade: '1-1', limits: { '1': 50000, '2': 60000, '3_5': 65000, '6_plus': 70000 } },
      { name: '豊田市', grade: '1-2', limits: standardLimits['1-2'] },
      { name: '豊橋市', grade: '1-2', limits: standardLimits['1-2'] },
      { name: '岡崎市', grade: '1-2', limits: standardLimits['1-2'] },
      { name: '一宮市', grade: '1-2', limits: standardLimits['1-2'] },
      { name: '春日井市', grade: '1-2', limits: standardLimits['1-2'] },
      { name: '刈谷市', grade: '1-2', limits: standardLimits['1-2'] },
      { name: '安城市', grade: '1-2', limits: standardLimits['1-2'] },
      { name: '小牧市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '瀬戸市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '半田市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '東海市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '日進市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '大府市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '豊川市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '西尾市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '犬山市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '蒲郡市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: 'その他町村部', grade: '3-1', limits: standardLimits['3-1'] }
    ]
  },
  {
    code: '24', name: '三重県', zone: 'VI',
    list: [
      { name: '四日市市', grade: '2-1', limits: { '1': 42000, '2': 50000, '3_5': 54000, '6_plus': 58000 } },
      { name: '津市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '鈴鹿市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '松阪市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '桑名市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '伊勢市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '名張市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: 'その他市町村', grade: '3-2', limits: standardLimits['3-2'] }
    ]
  },
  {
    code: '25', name: '滋賀県', zone: 'V',
    list: [
      { name: '大津市', grade: '1-2', limits: standardLimits['1-2'] },
      { name: '草津市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '彦根市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '長浜市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '近江八幡市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '守山市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '栗東市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '甲賀市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: 'その他市町村', grade: '3-2', limits: standardLimits['3-2'] }
    ]
  },
  {
    code: '26', name: '京都府', zone: 'V',
    list: [
      { name: '京都市（中京区・下京区・左京区・伏見区等全区）', grade: '1-1', limits: { '1': 51000, '2': 61000, '3_5': 66000, '6_plus': 71000 } },
      { name: '宇治市', grade: '1-2', limits: standardLimits['1-2'] },
      { name: '長岡京市', grade: '1-2', limits: standardLimits['1-2'] },
      { name: '向日市', grade: '1-2', limits: standardLimits['1-2'] },
      { name: '城陽市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '八幡市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '京田辺市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '亀岡市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '舞鶴市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '福知山市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: 'その他町村部', grade: '3-1', limits: standardLimits['3-1'] }
    ]
  },
  {
    code: '27', name: '大阪府', zone: 'VI',
    list: [
      { name: '大阪市（北区・中央区・浪速区・淀川区・西成区等全区）', grade: '1-1', limits: { '1': 52000, '2': 62000, '3_5': 67000, '6_plus': 72000 } },
      { name: '堺市（堺区・北区・中区等全区）', grade: '1-1', limits: { '1': 51000, '2': 61000, '3_5': 66000, '6_plus': 71000 } },
      { name: '東大阪市', grade: '1-1', limits: standardLimits['1-1'] },
      { name: '豊中市', grade: '1-1', limits: standardLimits['1-1'] },
      { name: '吹田市', grade: '1-1', limits: standardLimits['1-1'] },
      { name: '高槻市', grade: '1-1', limits: standardLimits['1-1'] },
      { name: '枚方市', grade: '1-1', limits: standardLimits['1-1'] },
      { name: '八尾市', grade: '1-1', limits: standardLimits['1-1'] },
      { name: '茨木市', grade: '1-1', limits: standardLimits['1-1'] },
      { name: '寝屋川市', grade: '1-1', limits: standardLimits['1-1'] },
      { name: '岸和田市', grade: '1-2', limits: standardLimits['1-2'] },
      { name: '池田市', grade: '1-2', limits: standardLimits['1-2'] },
      { name: '守口市', grade: '1-2', limits: standardLimits['1-2'] },
      { name: '門真市', grade: '1-2', limits: standardLimits['1-2'] },
      { name: '大東市', grade: '1-2', limits: standardLimits['1-2'] },
      { name: '箕面市', grade: '1-2', limits: standardLimits['1-2'] },
      { name: '松原市', grade: '1-2', limits: standardLimits['1-2'] },
      { name: '羽曳野市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '富田林市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '泉佐野市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '河内長野市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: 'その他町村部', grade: '2-2', limits: standardLimits['2-2'] }
    ]
  },
  {
    code: '28', name: '兵庫県', zone: 'V',
    list: [
      { name: '神戸市（中央区・東灘区・灘区・兵庫区等全区）', grade: '1-1', limits: { '1': 51000, '2': 61000, '3_5': 66000, '6_plus': 71000 } },
      { name: '尼崎市', grade: '1-1', limits: standardLimits['1-1'] },
      { name: '西宮市', grade: '1-1', limits: standardLimits['1-1'] },
      { name: '芦屋市', grade: '1-1', limits: standardLimits['1-1'] },
      { name: '伊丹市', grade: '1-1', limits: standardLimits['1-1'] },
      { name: '宝塚市', grade: '1-1', limits: standardLimits['1-1'] },
      { name: '姫路市', grade: '1-2', limits: standardLimits['1-2'] },
      { name: '明石市', grade: '1-2', limits: standardLimits['1-2'] },
      { name: '加古川市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '川西市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '三田市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: 'たつの市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '豊岡市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '洲本市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: 'その他町村部', grade: '3-2', limits: standardLimits['3-2'] }
    ]
  },
  {
    code: '29', name: '奈良県', zone: 'VI',
    list: [
      { name: '奈良市', grade: '1-2', limits: standardLimits['1-2'] },
      { name: '生駒市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '橿原市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '大和郡山市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '香芝市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '天理市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '桜井市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: 'その他町村部', grade: '3-2', limits: standardLimits['3-2'] }
    ]
  },
  {
    code: '30', name: '和歌山県', zone: 'VI',
    list: [
      { name: '和歌山市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '岩出市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '橋本市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '田辺市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '紀の川市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: '新宮市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: 'その他市町村', grade: '3-2', limits: standardLimits['3-2'] }
    ]
  },
  {
    code: '31', name: '鳥取県', zone: 'IV',
    list: [
      { name: '鳥取市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '米子市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '倉吉市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: '境港市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: 'その他町村部', grade: '3-2', limits: standardLimits['3-2'] }
    ]
  },
  {
    code: '32', name: '島根県', zone: 'IV',
    list: [
      { name: '松江市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '出雲市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '浜田市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: '益田市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: 'その他町村部', grade: '3-2', limits: standardLimits['3-2'] }
    ]
  },
  {
    code: '33', name: '岡山県', zone: 'V',
    list: [
      { name: '岡山市（北区・南区・中区・東区）', grade: '1-2', limits: standardLimits['1-2'] },
      { name: '倉敷市', grade: '1-2', limits: standardLimits['1-2'] },
      { name: '津山市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '総社市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '玉野市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: '笠岡市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: 'その他市町村', grade: '3-2', limits: standardLimits['3-2'] }
    ]
  },
  {
    code: '34', name: '広島県', zone: 'V',
    list: [
      { name: '広島市（中区・西区・南区・安佐南区等全区）', grade: '1-2', limits: { '1': 46000, '2': 55000, '3_5': 59800, '6_plus': 65000 } },
      { name: '福山市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '呉市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '東広島市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '尾道市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '廿日市市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '三原市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: '三次市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: 'その他市町村', grade: '3-2', limits: standardLimits['3-2'] }
    ]
  },
  {
    code: '35', name: '山口県', zone: 'VI',
    list: [
      { name: '下関市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '山口市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '宇部市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '周南市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '岩国市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '防府市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '山陽小野田市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: 'その他市町村', grade: '3-2', limits: standardLimits['3-2'] }
    ]
  },
  {
    code: '36', name: '徳島県', zone: 'VI',
    list: [
      { name: '徳島市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '鳴門市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '阿南市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '小松島市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: '吉野川市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: 'その他町村部', grade: '3-2', limits: standardLimits['3-2'] }
    ]
  },
  {
    code: '37', name: '香川県', zone: 'VI',
    list: [
      { name: '高松市', grade: '2-1', limits: { '1': 41000, '2': 49000, '3_5': 53000, '6_plus': 57000 } },
      { name: '丸亀市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '坂出市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: 'さぬき市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: '三豊市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: 'その他市町村', grade: '3-2', limits: standardLimits['3-2'] }
    ]
  },
  {
    code: '38', name: '愛媛県', zone: 'VI',
    list: [
      { name: '松山市', grade: '2-1', limits: { '1': 41000, '2': 49000, '3_5': 53000, '6_plus': 57000 } },
      { name: '今治市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '新居浜市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '西条市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '四国中央市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: '宇和島市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: 'その他市町村', grade: '3-2', limits: standardLimits['3-2'] }
    ]
  },
  {
    code: '39', name: '高知県', zone: 'VI',
    list: [
      { name: '高知市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '南国市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '香南市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: '四万十市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: 'その他市町村', grade: '3-2', limits: standardLimits['3-2'] }
    ]
  },
  {
    code: '40', name: '福岡県', zone: 'VI',
    list: [
      { name: '福岡市（博多区・中央区・東区・南区・早良区等全区）', grade: '1-1', limits: { '1': 49000, '2': 59000, '3_5': 64000, '6_plus': 69000 } },
      { name: '北九州市（小倉北区・八幡西区・門司区等全区）', grade: '1-2', limits: standardLimits['1-2'] },
      { name: '久留米市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '春日市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '大野城市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '太宰府市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '筑紫野市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '糸島市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '宗像市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '飯塚市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '大牟田市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '行橋市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: '田川市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: 'その他市町村', grade: '3-2', limits: standardLimits['3-2'] }
    ]
  },
  {
    code: '41', name: '佐賀県', zone: 'VI',
    list: [
      { name: '佐賀市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '鳥栖市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '唐津市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '伊万里市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: '武雄市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: 'その他市町村', grade: '3-2', limits: standardLimits['3-2'] }
    ]
  },
  {
    code: '42', name: '長崎県', zone: 'VI',
    list: [
      { name: '長崎市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '佐世保市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '諫早市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '大村市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '島原市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: '平戸市', grade: '3-2', limits: standardLimits['3-2'] },
      { name: '壱岐市・対馬市・五島市', grade: '3-2', limits: standardLimits['3-2'] },
      { name: 'その他市町村', grade: '3-2', limits: standardLimits['3-2'] }
    ]
  },
  {
    code: '43', name: '熊本県', zone: 'VI',
    list: [
      { name: '熊本市（中央区・東区・西区・南区・北区）', grade: '1-2', limits: standardLimits['1-2'] },
      { name: '八代市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '合志市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '菊池市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: '玉名市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: '天草市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: 'その他市町村', grade: '3-2', limits: standardLimits['3-2'] }
    ]
  },
  {
    code: '44', name: '大分県', zone: 'VI',
    list: [
      { name: '大分市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '別府市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '中津市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '日田市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: '佐伯市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: 'その他市町村', grade: '3-2', limits: standardLimits['3-2'] }
    ]
  },
  {
    code: '45', name: '宮崎県', zone: 'VI',
    list: [
      { name: '宮崎市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '都城市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '延岡市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '日南市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: '日向市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: 'その他市町村', grade: '3-2', limits: standardLimits['3-2'] }
    ]
  },
  {
    code: '46', name: '鹿児島県', zone: 'VI',
    list: [
      { name: '鹿児島市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '霧島市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '鹿屋市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '薩摩川内市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '姶良市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '奄美市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: 'その他市町村・島しょ部', grade: '3-2', limits: standardLimits['3-2'] }
    ]
  },
  {
    code: '47', name: '沖縄県', zone: 'VI',
    list: [
      { name: '那覇市', grade: '1-2', limits: standardLimits['1-2'] },
      { name: '浦添市', grade: '1-2', limits: standardLimits['1-2'] },
      { name: '宜野湾市', grade: '1-2', limits: standardLimits['1-2'] },
      { name: '沖縄市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: 'うるま市', grade: '2-1', limits: standardLimits['2-1'] },
      { name: '糸満市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '豊見城市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '名護市', grade: '2-2', limits: standardLimits['2-2'] },
      { name: '宮古島市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: '石垣市', grade: '3-1', limits: standardLimits['3-1'] },
      { name: 'その他町村部・離島', grade: '3-2', limits: standardLimits['3-2'] }
    ]
  }
];

for (const p of prefData) {
  const filePath = path.join(outDir, `${p.code}.json`);
  const municipalities = p.list.map((item, index) => ({
    code: `${p.code}${String(index + 1).padStart(3, '0')}`,
    name: item.name,
    grade: item.grade,
    housingLimit: item.limits,
  }));

  const fileData = {
    prefCode: p.code,
    prefName: p.name,
    winterZone: p.zone,
    municipalities,
  };

  fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2), 'utf-8');
}

console.log(`Generated detailed municipalities for all 47 prefectures.`);
