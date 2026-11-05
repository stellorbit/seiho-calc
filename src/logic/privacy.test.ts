/// <reference types="astro/client" />
import { describe, it, expect } from 'vitest';

// プライバシー保護（完全クライアントサイド計算）をソースコードの静的検査で固定する。
// 入力内容の送信・保存・外部読み込み・動的HTML生成につながるAPIや記述が混入した場合に失敗する。
const sources = import.meta.glob<string>(
  ['../pages/*.astro', '../components/*.astro', './*.ts', '../styles/*.css', '!./*.test.ts'],
  { eager: true, query: '?raw', import: 'default' }
);

const entries = Object.entries(sources);

// 許可する外部URL（リンク・メタ情報のみ。読み込みには使わない）
const ALLOWED_URL_PREFIXES = [
  'https://seihocalc.stellorbit.net/',
  'https://www.mhlw.go.jp/',
  'https://stellorbit.net/contact/', // お問い合わせ先（リンクのみ）
  'https://x.com/OnslaughtktnP', // X（リンクのみ）
];

describe('プライバシー保護の静的検査（外部通信・保存・動的HTML生成の禁止）', () => {
  it('検査対象のソースが取得できること', () => {
    const names = entries.map(([name]) => name);
    expect(names.some((n) => n.endsWith('/pages/index.astro'))).toBe(true);
    expect(names.some((n) => n.endsWith('/calculator.ts'))).toBe(true);
    expect(names.some((n) => n.endsWith('/dateRules.ts'))).toBe(true);
    expect(names.some((n) => n.endsWith('.test.ts'))).toBe(false);
    expect(names.some((n) => n.endsWith('/styles/theme.css'))).toBe(true);
    expect(entries.length).toBeGreaterThanOrEqual(8);
  });

  it('外部送信・保存・動的コード実行・動的HTML生成のAPIを使っていないこと', () => {
    const forbidden: Array<[string, RegExp]> = [
      ['XMLHttpRequest', /XMLHttpRequest/],
      ['sendBeacon', /sendBeacon/],
      ['WebSocket', /WebSocket/],
      ['EventSource', /EventSource/],
      ['eval', /\beval\s*\(/],
      ['new Function', /new\s+Function\s*\(/],
      ['setTimeout(string)', /set(Timeout|Interval)\s*\(\s*['"`]/],
      ['document.write', /document\.write/],
      ['innerHTML', /\binnerHTML\b/],
      ['outerHTML', /\bouterHTML\b/],
      ['insertAdjacentHTML', /insertAdjacentHTML/],
      ['localStorage', /localStorage/],
      ['sessionStorage', /sessionStorage/],
      ['indexedDB', /indexedDB/],
      ['document.cookie', /document\.cookie/],
      ['geolocation', /geolocation/],
      ['postMessage', /postMessage/],
      ['importScripts', /importScripts/],
      ['serviceWorker', /serviceWorker/],
      ['dangerouslySetInnerHTML', /dangerouslySetInnerHTML/],
      ['Astro set:html', /set:html/],
    ];
    for (const [file, text] of entries) {
      for (const [label, pattern] of forbidden) {
        expect(pattern.test(text), `${file}: ${label}`).toBe(false);
      }
    }
  });

  it('fetch は同一オリジンの自治体データ（/data/municipalities/）のみであること', () => {
    let fetchCount = 0;
    for (const [file, text] of entries) {
      const calls = text.match(/\bfetch\s*\(([^)]*)\)/g) ?? [];
      for (const call of calls) {
        fetchCount++;
        expect(call.startsWith('fetch(`/data/municipalities/'), `${file}: ${call}`).toBe(true);
      }
    }
    expect(fetchCount).toBe(1);
  });

  it('外部リソースの読み込み（script src・外部CSS・@import・外部フォント・画像）がないこと', () => {
    for (const [file, text] of entries) {
      expect(/<script[^>]*\ssrc\s*=/i.test(text), `${file}: script src`).toBe(false);
      expect(/<link[^>]*rel=["']?stylesheet/i.test(text), `${file}: link stylesheet`).toBe(false);
      expect(/<iframe|<embed|<object/i.test(text), `${file}: iframe/embed/object`).toBe(false);
      expect(/@import/.test(text), `${file}: @import`).toBe(false);
      expect(/url\(\s*['"]?https?:/i.test(text), `${file}: url(http)`).toBe(false);
      expect(/<img[^>]*\ssrc\s*=\s*["']https?:/i.test(text), `${file}: 外部img`).toBe(false);
      expect(/\son[a-z]+\s*=\s*["']/i.test(text), `${file}: インラインイベント属性`).toBe(false);
      expect(/<form/i.test(text), `${file}: form（送信先を持つ要素）`).toBe(false);
    }
  });

  it('記載されている外部URLは許可リスト（リンク・メタ情報）のみであること', () => {
    const urlPattern = /https?:\/\/[^\s"'`)<>]+/g;
    for (const [file, text] of entries) {
      for (const url of text.match(urlPattern) ?? []) {
        expect(
          ALLOWED_URL_PREFIXES.some((prefix) => url.startsWith(prefix)),
          `${file}: ${url}`
        ).toBe(true);
      }
    }
  });

  it('外部リンクは別タブで開く際に rel="noopener noreferrer" を付けていること', () => {
    for (const [file, text] of entries) {
      const anchors = text.match(/<a\s[^>]*target=["']_blank["'][^>]*>/g) ?? [];
      for (const anchor of anchors) {
        expect(/rel=["'][^"']*noopener[^"']*noreferrer[^"']*["']/.test(anchor), `${file}: ${anchor}`).toBe(true);
      }
    }
  });

  it('CSP が外部通信を許可していないこと（connect-src・form-action 等）', () => {
    const index = entries.find(([name]) => name.endsWith('/pages/index.astro'))?.[1] ?? '';
    const csp = /http-equiv="Content-Security-Policy" content="([^"]+)"/.exec(index)?.[1] ?? '';
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("connect-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("form-action 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(/https?:/.test(csp)).toBe(false);
    expect(csp).not.toContain('unsafe-eval');
  });

  it('必須の表示（免責文・引用・生成AIクレジット）が含まれていること', () => {
    const all = entries.map(([, text]) => text).join('\n');
    expect(all).toContain('シミュレーターの値はあくまで資料に基づく概算です。詳しくは各自治体への生活保護担当部署へお問い合わせください。');
    expect(all).toContain('生活保護は、最低生活の保障と自立の助長を図ることを目的として');
    expect(all).toContain('https://www.mhlw.go.jp/content/000988958.pdf');
    expect(all).toContain('https://stellorbit.net/contact/');
    expect(all).toContain('https://x.com/OnslaughtktnP');
    expect(all).toContain('@OnslaughtktnP');
    // ヘッダーの「お問い合わせ」メニュー
    expect(all).toContain('class="site-menu"');
    expect(all).toMatch(/<span>お問い合わせ<\/span>/);
    expect(all).toContain('このサイトは、生成AIを利用して構成しております。');
    expect(all).toContain('データ収集・保守');
    expect(all).toContain('Claude Opus 5.5');
    expect(all).toContain('Claude Sonnet 5.5');
  });
});
