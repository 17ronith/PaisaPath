// Opponent / Aunty / avatar portrait. Uses the texture if loaded, otherwise a coloured
// pixel block with the speaker's initial, so missing art never blocks a screen.
import Phaser from 'phaser';
import { COLOR, text } from './theme';

const PALETTE = [0xd06040, 0x4080c0, 0x60a050, 0x9060b0, 0xc09030, 0x408888];

function colourFor(key: string): number {
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export class Portrait extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number, size: number, key: string, label = key) {
    super(scene, x, y);
    if (key && scene.textures.exists(key)) {
      const img = scene.add.image(0, 0, key);
      img.setScale(size / Math.max(img.width, img.height));
      this.add(img);
    } else {
      const c = key === 'aunty' ? COLOR.aunty : colourFor(key || label);
      const g = scene.add.graphics();
      g.fillStyle(COLOR.panelEdge, 1).fillRect(-size / 2, -size / 2, size, size);
      g.fillStyle(c, 1).fillRect(-size / 2 + 3, -size / 2 + 3, size - 6, size - 6);
      // simple pixel face so it reads as a character, not a box
      const u = Math.max(2, Math.round(size / 12));
      g.fillStyle(0xf0c8a0, 1).fillRect(-3 * u, -4 * u, 6 * u, 6 * u);
      g.fillStyle(COLOR.ink, 1)
        .fillRect(-2 * u, -2 * u, u, u)
        .fillRect(u, -2 * u, u, u);
      this.add(g);
      const initial = (label || '?').trim().charAt(0).toUpperCase();
      this.add(text(scene, 0, size / 2 - 14, initial, 'sm', COLOR.white).setOrigin(0.5, 0));
    }
    scene.add.existing(this);
  }
}
