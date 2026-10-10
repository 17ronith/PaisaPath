// Pokémon-style panel: light fill, dark 2px border, hard drop shadow. Rectangles only until
// Kenney 9-slice art lands; same API afterwards.
import Phaser from 'phaser';
import { COLOR } from './theme';

export interface PanelOpts {
  fill?: number;
  edge?: number;
  shadow?: boolean;
}

export class PixelPanel extends Phaser.GameObjects.Container {
  readonly w: number;
  readonly h: number;
  private bg: Phaser.GameObjects.Graphics;

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
    this.bg = scene.add.graphics();
    this.add(this.bg);
    this.draw(opts);
    scene.add.existing(this);
  }

  draw({ fill = COLOR.panel, edge = COLOR.panelEdge, shadow = true }: PanelOpts = {}): void {
    const g = this.bg.clear();
    if (shadow) g.fillStyle(COLOR.panelShadow, 1).fillRect(3, 3, this.w, this.h);
    g.fillStyle(edge, 1).fillRect(0, 0, this.w, this.h);
    g.fillStyle(fill, 1).fillRect(2, 2, this.w - 4, this.h - 4);
  }
}
