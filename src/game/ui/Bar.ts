// Label + value + Pokémon-style HP bar: dark rounded track, two-tone fill with a highlight
// stripe. setValue() tweens; the fill turns red at ≤30%.
import Phaser from 'phaser';
import { fillRatio, isLow } from '../logic/display';
import { COLOR, text } from './theme';

export interface BarOpts {
  label: string;
  max: number;
  color: number;
  width?: number;
  format?: (v: number) => string;
  /** Hide the value text (e.g. opponent pressure). */
  hideValue?: boolean;
}

const TRACK_H = 9;
const TRACK_Y = 15;

/** Lighten a 0xRRGGBB colour toward white by `amt` (0..1). */
function lighten(c: number, amt: number): number {
  const r = (c >> 16) & 0xff;
  const g = (c >> 8) & 0xff;
  const b = c & 0xff;
  const l = (v: number): number => Math.round(v + (255 - v) * amt);
  return (l(r) << 16) | (l(g) << 8) | l(b);
}

export class Bar extends Phaser.GameObjects.Container {
  private opts: Required<Omit<BarOpts, 'hideValue'>> & { hideValue: boolean };
  private fill: Phaser.GameObjects.Graphics;
  private valueText: Phaser.GameObjects.Text;
  private shown = 0;
  private tween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, x: number, y: number, opts: BarOpts, value: number) {
    super(scene, x, y);
    const width = opts.width ?? 150;
    this.opts = { width, format: (v) => String(Math.round(v)), hideValue: false, ...opts };
    const label = text(scene, 0, -2, opts.label, 'xs', COLOR.muted);
    this.valueText = text(scene, width, -2, '', 'xs', COLOR.ink).setOrigin(1, 0);
    this.valueText.setVisible(!this.opts.hideValue);
    const track = scene.add.graphics();
    track.fillStyle(COLOR.panelEdge, 1).fillRoundedRect(0, TRACK_Y, width, TRACK_H, 3);
    track.fillStyle(0x3a4256, 1).fillRoundedRect(1.5, TRACK_Y + 1.5, width - 3, TRACK_H - 3, 2);
    this.fill = scene.add.graphics();
    this.add([label, this.valueText, track, this.fill]);
    scene.add.existing(this);
    this.render(value);
  }

  get value(): number {
    return this.shown;
  }

  setMax(max: number): this {
    this.opts.max = max;
    this.render(this.shown);
    return this;
  }

  setValue(to: number, animate = true, duration = 700): Promise<void> {
    this.tween?.stop();
    if (!animate || to === this.shown) {
      this.render(to);
      return Promise.resolve();
    }
    const from = this.shown;
    return new Promise((resolve) => {
      this.tween = this.scene.tweens.addCounter({
        from,
        to,
        duration,
        ease: 'Cubic.easeOut',
        onUpdate: (tw) => this.render(tw.getValue() ?? to),
        onComplete: () => {
          this.render(to);
          resolve();
        },
      });
    });
  }

  private render(v: number): void {
    this.shown = v;
    const inner = this.opts.width - 3;
    const w = inner * fillRatio(v, this.opts.max);
    const base = isLow(v, this.opts.max) ? COLOR.bad : this.opts.color;
    const g = this.fill.clear();
    if (w >= 1) {
      const h = TRACK_H - 3;
      g.fillStyle(base, 1).fillRoundedRect(1.5, TRACK_Y + 1.5, w, h, Math.min(2, w / 2));
      g.fillStyle(lighten(base, 0.35), 1).fillRect(2.5, TRACK_Y + 2.5, Math.max(0, w - 2), 1.5);
    }
    this.valueText.setText(this.opts.format(v));
  }
}
