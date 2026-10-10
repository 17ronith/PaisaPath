// Shared look: palette, pixel font, text factory, and a t() wrapper with an inline
// English fallback for chrome strings not yet in content/strings (Aakarsh adds them later).
import Phaser from 'phaser';
import { t } from '@/shared/i18n';

/** Press Start 2P has no Telugu glyphs; the browser falls back per glyph to the next family. */
export const FONT = '"PressStart2P", "Noto Sans Telugu", "Nirmala UI", monospace';

export const COLOR = {
  bg: 0x1b1b2f,
  bgBattle: 0xe8f0d8,
  ground: 0xb8d8a0,
  panel: 0xf8f8f0,
  panelEdge: 0x283040,
  panelShadow: 0x98a0a8,
  ink: 0x202028,
  muted: 0x606878,
  good: 0x48b048,
  warn: 0xf0b030,
  bad: 0xe04848,
  money: 0x3878d8,
  happy: 0xe8a020,
  accent: 0x9fd3c7,
  aunty: 0xc05890,
  button: 0x384870,
  buttonDown: 0x283458,
  white: 0xffffff,
} as const;

export const hex = (c: number): string => '#' + c.toString(16).padStart(6, '0');

export type TextSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
const PX: Record<TextSize, number> = { xs: 8, sm: 10, md: 12, lg: 16, xl: 20 };

export function text(
  scene: Phaser.Scene,
  x: number,
  y: number,
  str: string,
  size: TextSize = 'sm',
  color: number = COLOR.ink,
  extra: Phaser.Types.GameObjects.Text.TextStyle = {},
): Phaser.GameObjects.Text {
  return scene.add.text(x, y, str, {
    fontFamily: FONT,
    fontSize: `${PX[size]}px`,
    color: hex(color),
    lineSpacing: Math.round(PX[size] * 0.5),
    ...extra,
  });
}

/** t(key) but with an English fallback when the key is missing from every strings file. */
export function tr(key: string, fallback: string, vars?: Record<string, string | number>): string {
  const out = t(key, vars);
  if (out !== key) return out;
  if (!vars) return fallback;
  return fallback.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}
