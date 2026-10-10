// Logical layout size and the internal render resolution.
// All scene code lays out in a fixed 360×640 logical space. The canvas itself is
// RES× larger and every camera is zoomed by RES, so text and shapes render at the
// phone's real pixel density (crisp) while pixel-art sprites stay nearest-neighbour.
export const GAME_W = 360;
export const GAME_H = 640;
export const VIEW = { width: GAME_W, height: GAME_H } as const;

function pickResolution(): number {
  if (typeof window === 'undefined') return 2;
  const fit = Math.min(window.innerWidth / GAME_W, window.innerHeight / GAME_H);
  const want = Math.ceil((window.devicePixelRatio || 1) * fit);
  return Math.max(2, Math.min(3, want)); // 3× caps fill-rate on budget phones
}

export const RES = pickResolution();
