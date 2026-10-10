// Panel built from the Kenney Pixel UI 9-slice frames (1 art pixel = 1 logical pixel, so the
// borders stay thin and crisp at RES×). Falls back to plain rectangles if art is missing.
import Phaser from 'phaser';
import { COLOR } from './theme';

export type PanelVariant = 'paper' | 'card' | 'blue' | 'red' | 'green' | 'dark';

export interface PanelOpts {
  variant?: PanelVariant;
  /** Legacy (pre-art) options, mapped onto a variant. */
  fill?: number;
  edge?: number;
  shadow?: boolean;
}

export const PANEL_KEYS: Record<PanelVariant, string> = {
  paper: 'ui_paper',
  card: 'ui_card',
  blue: 'ui_outline_blue',
  red: 'ui_outline_red',
  green: 'ui_outline_green',
  dark: 'ui_space',
};
const SLICE = 8;

function pickVariant(o: PanelOpts): PanelVariant {
  if (o.variant) return o.variant;
  if (o.edge === COLOR.aunty) return 'red';
  if (o.shadow === false) return 'card';
  return 'paper';
}

export class PixelPanel extends Phaser.GameObjects.Container {
  readonly w: number;
  readonly h: number;
  private bg?: Phaser.GameObjects.GameObject;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    w: number,
    h: number,
    opts: PanelOpts = {},
  ) {
    super(scene, x, y);
    this.w = w;
    this.h = h;
    this.draw(opts);
    scene.add.existing(this);
  }

  draw(opts: PanelOpts = {}): void {
    this.bg?.destroy();
    const key = PANEL_KEYS[pickVariant(opts)];
    if (this.scene.textures.exists(key)) {
      this.bg = this.scene.add
        .nineslice(0, 0, key, undefined, this.w, this.h, SLICE, SLICE, SLICE, SLICE)
        .setOrigin(0, 0);
      if (key === PANEL_KEYS.paper) (this.bg as Phaser.GameObjects.NineSlice).setTint(0xfff6e4);
    } else {
      const g = this.scene.add.graphics();
      g.fillStyle(COLOR.panelShadow, 1).fillRect(3, 3, this.w, this.h);
      g.fillStyle(COLOR.panelEdge, 1).fillRect(0, 0, this.w, this.h);
      g.fillStyle(COLOR.panel, 1).fillRect(2, 2, this.w - 4, this.h - 4);
      this.bg = g;
    }
    this.addAt(this.bg, 0);
  }
}
