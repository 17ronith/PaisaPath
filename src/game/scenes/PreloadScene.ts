// Loads the pixel font and generates placeholder textures (avatars) until Kenney art lands.
import Phaser from 'phaser';
import { AVATARS } from '../logic/onboarding';
import { COLOR, text } from '../ui/theme';

const FONT_FILES = [
  'assets/fonts/PressStart2P-latin.woff2',
  'assets/fonts/PressStart2P-latin-ext.woff2',
];

/** 16×16 placeholder avatars: [skin, hair, shirt, trousers]. */
const AVATAR_COLOURS: [number, number, number, number][] = [
  [0xf0c8a0, 0x302018, 0xd04848, 0x283860],
  [0xd8a878, 0x181010, 0x48a058, 0x404040],
  [0xc08860, 0x402818, 0x4878c8, 0x605040],
  [0xa87050, 0x100808, 0xe0a030, 0x303858],
];

async function loadFonts(): Promise<void> {
  if (typeof FontFace === 'undefined' || !document.fonts) return;
  await Promise.all(
    FONT_FILES.map(async (file) => {
      const url = new URL(file, document.baseURI).href;
      const face = new FontFace('PressStart2P', `url(${url})`);
      document.fonts.add(await face.load());
    }),
  ).catch((e) => console.warn('font load failed, using fallback', e));
}

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload(): void {
    const { width, height } = this.scale;
    const barW = 220;
    this.add
      .rectangle(width / 2, height / 2, barW + 4, 14, COLOR.panelEdge)
      .setStrokeStyle(2, COLOR.accent);
    const fill = this.add
      .rectangle(width / 2 - barW / 2, height / 2, 0, 10, COLOR.accent)
      .setOrigin(0, 0.5);
    this.load.on('progress', (p: number) => (fill.width = barW * p));
    // Kenney sheets and SFX get queued here once they are in public/assets/.
  }

  async create(): Promise<void> {
    AVATAR_COLOURS.forEach((c, i) => this.makeAvatar(AVATARS[i], c));
    await loadFonts();
    // Warm the font so the first real text renders in it, not the fallback.
    text(this, -100, -100, '₹0', 'xs').destroy();
    this.scene.start('Title');
  }

  private makeAvatar(
    key: string,
    [skin, hair, shirt, legs]: [number, number, number, number],
  ): void {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(hair).fillRect(5, 1, 6, 3); // hair
    g.fillStyle(skin).fillRect(5, 3, 6, 5); // face
    g.fillStyle(0x202028).fillRect(6, 5, 1, 1).fillRect(9, 5, 1, 1); // eyes
    g.fillStyle(shirt).fillRect(4, 8, 8, 5); // shirt
    g.fillStyle(skin).fillRect(3, 9, 1, 3).fillRect(12, 9, 1, 3); // arms
    g.fillStyle(legs).fillRect(5, 13, 2, 3).fillRect(9, 13, 2, 3); // legs
    g.generateTexture(key, 16, 16);
    g.destroy();
  }
}
