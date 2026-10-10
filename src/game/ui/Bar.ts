// Label + value text + fill bar. setValue() tweens to the new value; fill turns red at ≤30%.
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

export class Bar extends Phaser.GameObjects.Container {
  private opts: Required<Omit<BarOpts, 'hideValue'>> & { hideValue: boolean };
  private track: Phaser.GameObjects.Rectangle;
  private fill: Phaser.GameObjects.Rectangle;
  private valueText: Phaser.GameObjects.Text;
  private shown = 0;
  private tween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, x: number, y: number, opts: BarOpts, value: number) {
    super(scene, x, y);
    const width = opts.width ?? 150;
    this.opts = {
      width,
      format: (v) => String(Math.round(v)),
      hideValue: false,
      ...opts,
    };
    const label = text(scene, 0, 0, opts.label, 'xs', COLOR.muted);
    this.valueText = text(scene, width, 0, '', 'xs', COLOR.ink).setOrigin(1, 0);
    this.valueText.setVisible(!this.opts.hideValue);
    this.track = scene.add.rectangle(0, 12, width, 8, COLOR.panelEdge).setOrigin(0, 0);
    this.fill = scene.add.rectangle(1, 13, width - 2, 6, opts.color).setOrigin(0, 0);
    this.add([label, this.valueText, this.track, this.fill]);
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
    const inner = this.opts.width - 2;
    this.fill.width = Math.max(0, Math.round(inner * fillRatio(v, this.opts.max)));
    this.fill.fillColor = isLow(v, this.opts.max) ? COLOR.bad : this.opts.color;
    this.valueText.setText(this.opts.format(v));
  }
}
