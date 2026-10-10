// Tiny i18n. Strings come from src/content/strings/<lang>.json (loaded by content/index.ts).
// Missing key → falls back to en → falls back to the key itself (visible, never blank).
import type { Lang } from './types';

type Dict = Record<string, string>;
const dicts: Record<Lang, Dict> = { en: {}, te: {}, hi: {} };
let current: Lang = 'en';

export function registerStrings(lang: Lang, dict: Dict): void {
  dicts[lang] = { ...dicts[lang], ...dict };
}

export function setLang(lang: Lang): void {
  current = lang;
}

export function getLang(): Lang {
  return current;
}

export function t(key: string, vars?: Record<string, string | number>): string {
  const raw = dicts[current][key] ?? dicts.en[key] ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

/** Format coins as rupees: 1840 → "₹1,840" (Indian grouping). */
export function rupees(coins: number): string {
  const n = Math.round(coins);
  const s = Math.abs(n).toString();
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  const grouped = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3 : last3;
  return (n < 0 ? '-₹' : '₹') + grouped;
}
