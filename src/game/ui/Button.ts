// Big touch target (≥ 56px tall by default) with press feedback. Text wraps inside.
import Phaser from 'phaser';
import { COLOR, text, type TextSize } from './theme';

export interface ButtonOpts {
  width?: number;
  height?: number;
  size?: TextSize;
  fill?: number;
  textColor?: number;
  align?: 'center' | 'left';
}

export class Button extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Rectangle;
  private edge: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  private fillColor: number;
  private enabled = true;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    caption: string,
    onClick: () => void,
    opts: ButtonOpts = {},
  ) {
    super(scene, x, y);
    const w = opts.width ?? 280;
    const h = opts.height ?? 56;
    this.fillColor = opts.fill ?? COLOR.button;
    this.edge = scene.add.rectangle(0, 3, w, h, COLOR.panelEdge);
    this.bg = scene.add.rectangle(0, 0, w, h, this.fillColor).setStrokeStyle(2, COLOR.panelEdge);
    const left = opts.align === 'left';
    this.label = text(
      scene,
      left ? -w / 2 + 12 : 0,
      0,
      caption,
      opts.size ?? 'sm',
      opts.textColor ?? COLOR.white,
      {
        align: left ? 'left' : 'center',
        wordWrap: { width: w - 20, useAdvancedWrap: true },
      },
    ).setOrigin(left ? 0 : 0.5, 0.5);
    this.add([this.edge, this.bg, this.label]);
    this.setSize(w, h + 3);
    this.setInteractive({ useHandCursor: true });
    this.on('pointerdown', () => {
      if (!this.enabled) return;
      this.bg.fillColor = COLOR.buttonDown;
      this.bg.y = 2;
      this.label.y = 2;
    });
    const release = (): void => {
      this.bg.fillColor = this.fillColor;
      this.bg.y = 0;
      this.label.y = 0;
    };
    this.on('pointerout', release);
    this.on('pointerup', () => {
      if (!this.enabled) return;
      release();
      onClick();
    });
    scene.add.existing(this);
  }

  setEnabled(on: boolean): this {
    this.enabled = on;
    this.setAlpha(on ? 1 : 0.45);
    return this;
  }

  setCaption(caption: string): this {
    this.label.setText(caption);
    return this;
  }

  setFill(color: number): this {
    this.fillColor = color;
    this.bg.fillColor = color;
    return this;
  }
}
