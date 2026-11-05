// ビルド成果物（dist）のセキュリティ監査。`pnpm run build` の後に実行する。
// - 外部リソースの読み込み・外部通信・インライン実行の混入がないこと
// - CSP などのセキュリティ設定が維持されていること
// 検出した問題は一覧表示し、1件でもあれば終了コード1で終了する。

import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve('dist');
const headersPath = path.resolve('public/_headers');

if (!fs.existsSync(distDir)) {
  console.error('dist が見つかりません。先に pnpm run build を実行してください。');
  process.exit(2);
}

const problems = [];
const notes = [];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const files = walk(distDir);
const textFiles = files.filter((f) => /\.(html|js|mjs|css|json|svg|txt|xml)$/.test(f) && !f.includes(`${path.sep}data${path.sep}municipalities${path.sep}`));
const rel = (f) => path.relative(distDir, f).replaceAll('\\', '/');

// 外部リンクとして許可するホスト（リンク・メタ情報のみ）
const allowedHosts = new Set(['seihocalc.stellorbit.net', 'www.mhlw.go.jp']);
const ALLOWED_ORIGIN_COUNT_NOTE = [...allowedHosts].join(', ');

for (const file of textFiles) {
  const text = fs.readFileSync(file, 'utf-8');
  const name = rel(file);

  // 1. 絶対URLはすべて許可ホストであること（W3C等の名前空間URLは除く）
  for (const url of text.match(/https?:\/\/[^\s"'`)<>\\]+/g) ?? []) {
    const host = url.replace(/^https?:\/\//, '').split(/[/:?#]/)[0];
    if (!allowedHosts.has(host) && !/^www\.w3\.org$/.test(host)) {
      problems.push(`${name}: 許可されていない外部URL ${url}`);
    }
  }

  if (name.endsWith('.html')) {
    // 2. 外部スクリプト・外部CSS・フレーム・フォーム
    for (const m of text.matchAll(/<script\b[^>]*\ssrc\s*=\s*["']([^"']+)["']/gi)) {
      if (/^(https?:)?\/\//.test(m[1])) problems.push(`${name}: 外部 script src ${m[1]}`);
    }
    for (const m of text.matchAll(/<link\b[^>]*\shref\s*=\s*["']([^"']+)["'][^>]*>/gi)) {
      if (/^(https?:)?\/\//.test(m[1]) && !/rel=["']?(icon|canonical)/i.test(m[0])) problems.push(`${name}: 外部 link ${m[1]}`);
    }
    if (/<(iframe|embed|object|form|base)\b/i.test(text)) problems.push(`${name}: iframe/embed/object/form/base が含まれています`);
    if (/\son[a-z]+\s*=\s*["']/i.test(text)) problems.push(`${name}: インラインイベント属性が含まれています`);
    if (/javascript:/i.test(text.replace(/<script[\s\S]*?<\/script>/gi, ''))) problems.push(`${name}: javascript: URL が含まれています`);

    // 3. target=_blank のリンクは noopener noreferrer 付き
    for (const m of text.matchAll(/<a\b[^>]*target=["']?_blank["']?[^>]*>/gi)) {
      if (!/noopener/.test(m[0]) || !/noreferrer/.test(m[0])) problems.push(`${name}: rel 不足の外部リンク ${m[0].slice(0, 120)}`);
    }

    // 4. CSP メタタグ
    const csp = /http-equiv="Content-Security-Policy"\s+content="([^"]+)"/i.exec(text)?.[1];
    if (!csp) {
      problems.push(`${name}: Content-Security-Policy のメタタグがありません`);
    } else {
      for (const required of ["default-src 'self'", "connect-src 'self'", "object-src 'none'", "base-uri 'self'", "form-action 'none'"]) {
        if (!csp.includes(required)) problems.push(`${name}: CSP に ${required} がありません`);
      }
      if (/unsafe-eval|https?:|\*/.test(csp)) problems.push(`${name}: CSP に外部オリジン・ワイルドカード・unsafe-eval が含まれています`);
      if (csp.includes("'unsafe-inline'")) notes.push("CSP の 'unsafe-inline'（script-src/style-src）が残っています（Astro のインラインスクリプト・スタイルのため）。外部読み込みは default-src 'self' で遮断済みです。");
    }
  }

  if (/\.(js|mjs)$/.test(name) || name.endsWith('.html')) {
    for (const [label, re] of [
      ['eval', /\beval\s*\(/],
      ['new Function', /new\s+Function\s*\(/],
      ['document.write', /document\.write\s*\(/],
      ['XMLHttpRequest', /XMLHttpRequest/],
      ['sendBeacon', /sendBeacon/],
      ['WebSocket', /WebSocket/],
      ['localStorage', /localStorage/],
      ['sessionStorage', /sessionStorage/],
      ['document.cookie', /document\.cookie/],
      ['innerHTML', /\.innerHTML\s*=/],
    ]) {
      if (re.test(text)) problems.push(`${name}: ${label} を使用しています`);
    }
    // fetch は同一オリジンの自治体データのみ
    for (const m of text.matchAll(/\bfetch\s*\(([^)]*)\)/g)) {
      if (!/\/data\/municipalities\//.test(m[1])) problems.push(`${name}: 想定外の fetch(${m[1].slice(0, 80)})`);
    }
  }
}

// 5. _headers（配信時のセキュリティヘッダー）
if (fs.existsSync(headersPath)) {
  const headers = fs.readFileSync(headersPath, 'utf-8');
  const requiredHeaders = [
    ['Content-Security-Policy', /Content-Security-Policy:[^\n]*connect-src 'self'[^\n]*frame-ancestors 'none'[^\n]*form-action 'none'/],
    ['Strict-Transport-Security', /Strict-Transport-Security:/],
    ['X-Content-Type-Options', /X-Content-Type-Options:\s*nosniff/],
    ['X-Frame-Options', /X-Frame-Options:\s*DENY/],
    ['Referrer-Policy', /Referrer-Policy:\s*no-referrer/],
    ['Permissions-Policy', /Permissions-Policy:[^\n]*geolocation=\(\)/],
    ['Cross-Origin-Opener-Policy', /Cross-Origin-Opener-Policy:\s*same-origin/],
  ];
  for (const [label, re] of requiredHeaders) {
    if (!re.test(headers)) problems.push(`public/_headers: ${label} が不足または不正です`);
  }
} else {
  problems.push('public/_headers が見つかりません');
}

// 6. 自治体データはJSONのみで、実行可能な文字列を含まないこと
const muniDir = path.join(distDir, 'data', 'municipalities');
if (fs.existsSync(muniDir)) {
  for (const f of fs.readdirSync(muniDir)) {
    if (!f.endsWith('.json')) {
      problems.push(`data/municipalities/${f}: JSON以外のファイルがあります`);
      continue;
    }
    try {
      JSON.parse(fs.readFileSync(path.join(muniDir, f), 'utf-8'));
    } catch {
      problems.push(`data/municipalities/${f}: JSONとして読み込めません`);
    }
  }
}

console.log(`監査対象: ${textFiles.length} ファイル（自治体データを除く）／許可ホスト: ${ALLOWED_ORIGIN_COUNT_NOTE}`);
for (const n of notes) console.log(`注記: ${n}`);
if (problems.length > 0) {
  console.error(`\n問題 ${problems.length} 件:`);
  for (const p of problems) console.error(` - ${p}`);
  process.exit(1);
}
console.log('セキュリティ監査: 問題は検出されませんでした。');
