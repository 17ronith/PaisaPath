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
