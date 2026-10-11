// Character sizing. Layouts were tuned for 16×16 Kenney sprites; Saharsh's characters are
// 48×48. `charScale` keeps a sprite the same on-screen size whatever its source resolution,
// so with RES 3 a 48 px sprite at "scale 4" lands on 4 device px per art pixel (still square).
import type Phaser from 'phaser';

export function charScale(scene: Phaser.Scene, key: string, scale16: number): number {
  const h = scene.textures.exists(key) ? scene.textures.get(key).getSourceImage().height : 16;
  return (scale16 * 16) / Math.max(1, h);
}
