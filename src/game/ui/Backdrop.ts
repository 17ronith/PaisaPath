// Tile-built scenery from Kenney Tiny Town: grass fields, houses, trees. Tiles are drawn at a
// whole-number scale (default 2 → 32 logical px per tile) so the pixel grid stays even.
import Phaser from 'phaser';

const T = 16;

/** Tiny Town frame ids (12 columns). */
export const TOWN = {
  grass: 0,
  grassTufts: 1,
  grassFlowers: 2,
  tree: 16,
  treeRound: 28,
  treeOrange: 27,
  bush: 5,
  houseRed: [
    [52, 53, 54],
    [64, 67, 66],
    [84, 85, 84],
  ],
  houseBlue: [
    [48, 49, 50],
    [60, 63, 62],
    [88, 89, 88],
  ],
} as const;

function rng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 0xffffffff;
  };
}

export function hasTown(scene: Phaser.Scene): boolean {
  return scene.textures.exists('town');
}

/** Grass field covering [x, x+w) × [y, y+h), returned in a container. */
export function grassField(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  scale = 2,
  seed = 7,
): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  if (!hasTown(scene)) {
    c.add(scene.add.rectangle(0, 0, w, h, 0x7ac25a).setOrigin(0));
    return c;
  }
  const r = rng(seed);
  const s = T * scale;
  for (let ty = 0; ty < h; ty += s)
    for (let tx = 0; tx < w; tx += s) {
      const roll = r();
      const f = roll < 0.08 ? TOWN.grassFlowers : roll < 0.3 ? TOWN.grassTufts : TOWN.grass;
      c.add(scene.add.image(tx, ty, 'town', f).setOrigin(0).setScale(scale));
    }
  // Crop overflow on the right/bottom edge.
  const mask = scene.make.graphics({ x: 0, y: 0 }, false).fillRect(x, y, w, h);
  c.setMask(mask.createGeometryMask());
  return c;
}

export function house(
  scene: Phaser.Scene,
  x: number,
  y: number,
  kind: 'red' | 'blue' = 'red',
  scale = 2,
): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  if (!hasTown(scene)) return c;
  const grid = kind === 'red' ? TOWN.houseRed : TOWN.houseBlue;
  grid.forEach((row, ry) =>
    row.forEach((f, rx) =>
      c.add(
        scene.add
          .image(rx * T * scale, ry * T * scale, 'town', f)
          .setOrigin(0)
          .setScale(scale),
      ),
    ),
  );
  return c;
}

export function prop(
  scene: Phaser.Scene,
  x: number,
  y: number,
  frame: number,
  scale = 2,
): Phaser.GameObjects.Image | null {
  if (!hasTown(scene)) return null;
  return scene.add.image(x, y, 'town', frame).setOrigin(0.5, 1).setScale(scale);
}

/** A little town scene: grass, two houses, a row of trees. Width = full view. */
export function townStrip(scene: Phaser.Scene, y: number, w: number, h: number, scale = 2): void {
  grassField(scene, 0, y, w, h, scale, 11);
  if (!hasTown(scene)) return;
  const s = T * scale;
  house(scene, s * 0.5, y + s * 0.5, 'red', scale);
  house(scene, w - s * 3.5, y + s * 0.5, 'blue', scale);
  [TOWN.tree, TOWN.treeRound, TOWN.bush, TOWN.tree, TOWN.treeOrange, TOWN.treeRound].forEach(
    (f, i) => prop(scene, s * 0.75 + (i * (w - s * 1.5)) / 5, y + h - s * 0.25, f, scale),
  );
}

// ---- Hyderabad backdrops (ISSUES #18) — original pixel art, 480×270, in public/assets/backdrops ----
/** places.json id → backdrop file (no extension). Every current place is covered. */
export const BACKDROP_FOR: Record<string, string> = {
  home: '10_home',
  gachibowli: '09_hitec_city',
  kirana: '11_kirana',
  college: '12_college',
  bank: '13_bank',
  charminar: '01_charminar',
  mobile_shop: '14_mobile_shop',
  clinic: '15_clinic',
  canteen: '16_canteen',
  bus_stop: '08_bus_stop',
  turf: '17_turf',
  durgam_cheruvu: '02_durgam_cheruvu',
  campus: '18_campus',
};
/** Non-battle screens. */
export const BACKDROP_EXTRA: Record<string, string> = {
  title: '03_tank_bund_buddha',
  stage2: '20_office_lobby',
  stage3: '09_hitec_city',
  epilogue: '19_home_age60',
  market: '21_market_terminal',
  // Life-journey landmarks on the world map (logic/journey.ts) that no place uses yet.
  ramoji: '04_film_city',
  shilparamam: '05_shilparamam',
  birla: '06_birla_mandir',
  qutb: '07_qutb_shahi_tombs',
};
export const BACKDROP_W = 480;
export const BACKDROP_H = 270;

export function backdropKey(placeId: string | undefined): string | null {
  const f = placeId ? BACKDROP_FOR[placeId] : undefined;
  return f ? `bg_${f}` : null;
}

/**
 * Draw a backdrop so it fills the box (cover: scale to the box height, centre, crop the sides).
 * Returns false if the texture isn't loaded (caller falls back to grassField).
 */
export function drawBackdrop(
  scene: Phaser.Scene,
  key: string | null,
  x: number,
  y: number,
  w: number,
  h: number,
): boolean {
  if (!key || !scene.textures.exists(key)) return false;
  const scale = Math.max(w / BACKDROP_W, h / BACKDROP_H);
  const img = scene.add.image(x + w / 2, y + h / 2, key).setScale(scale);
  // crop to the box so nothing bleeds over the HUD or text box
  const cropW = w / scale;
  const cropH = h / scale;
  img.setCrop((BACKDROP_W - cropW) / 2, (BACKDROP_H - cropH) / 2, cropW, cropH);
  return true;
}
