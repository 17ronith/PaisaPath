// Logical layout size and the internal render resolution.
// Scenes lay out in logical units 360 wide. The height follows the screen: every scene is
// designed for 640 (DESIGN_H), and on taller phones the view grows up to 800 so the game
// fills the screen instead of letterboxing; bottom-anchored UI sits at `VIEW.height - n`
// (or `y + EXTRA_H` for y values designed in the 640 box). Desktop and wide screens get the
// 640 design height, centred by Phaser's FIT over the page backdrop (index.html).
// The canvas itself is RES× larger and every camera is zoomed by RES, so text and shapes
// render at the screen's real pixel density (crisp) while pixel-art sprites stay nearest-neighbour.
export const GAME_W = 360;
export const DESIGN_H = 640;
const MAX_H = 800;

function pickHeight(): number {
  if (typeof window === 'undefined' || !window.innerWidth) return DESIGN_H;
  const h = Math.round((GAME_W * window.innerHeight) / window.innerWidth);
  return Math.max(DESIGN_H, Math.min(MAX_H, h));
}

export const GAME_H = pickHeight();
export const VIEW = { width: GAME_W, height: GAME_H } as const;
/** Extra logical height beyond the 640 design box (0 on desktop and 9:16 screens). */
export const EXTRA_H = GAME_H - DESIGN_H;
/** A y designed in the 640 box for something anchored to the bottom of the screen. */
export const fromBottom = (y: number): number => y + EXTRA_H;

function pickResolution(): number {
  if (typeof window === 'undefined') return 2;
  const fit = Math.min(window.innerWidth / GAME_W, window.innerHeight / GAME_H);
  const want = Math.ceil((window.devicePixelRatio || 1) * fit);
  return Math.max(2, Math.min(3, want)); // 3× caps fill-rate on budget phones
}

export const RES = pickResolution();
