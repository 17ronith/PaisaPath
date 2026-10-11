// Big touch target (≥ 56px tall by default) built from Kenney 9-slice button frames, with a
// real pressed frame. The caller's fill colour picks the frame colour.
import Phaser from 'phaser';
import { play } from '../audio';
import { COLOR, text, type TextSize } from './theme';

export interface ButtonOpts {
  width?: number;
  height?: number;
  size?: TextSize;
  fill?: number;
  textColor?: number;
  align?: 'center' | 'left';
}

type Skin = 'blue' | 'green' | 'red' | 'yellow' | 'grey';
const SLICE = 8;
/** Kenney's button frames carry a 4px bottom bevel; pressing drops the label onto it. */
const PRESS_DROP = 2;

function skinFor(fill: number | undefined): Skin {
  switch (fill) {
    case COLOR.good:
      return 'green';
    case COLOR.bad:
      return 'red';
    case COLOR.warn:
      return 'yellow';
    case 0x56684a:
      return 'grey';
    default:
      return 'blue';
  }
}

export class Button extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.NineSlice | Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  private skin: Skin;
  private enabled = true;
  private labelY = 0;

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
    this.skin = skinFor(opts.fill);
    const key = `btn_${this.skin}`;
    this.bg = scene.textures.exists(key)
      ? scene.add.nineslice(0, 0, key, undefined, w, h, SLICE, SLICE, SLICE, SLICE)
      : scene.add
          .rectangle(0, 0, w, h, opts.fill ?? COLOR.button)
          .setStrokeStyle(2, COLOR.panelEdge);
    const dark = this.skin === 'grey' || this.skin === 'yellow';
    const left = opts.align === 'left';
    this.labelY = -1;
    this.label = text(
      scene,
      left ? -w / 2 + 14 : 0,
      this.labelY,
      caption,
      opts.size ?? 'md',
      opts.textColor ?? (dark ? COLOR.ink : COLOR.white),
      {
        align: left ? 'left' : 'center',
        // Icon-sized buttons don't wrap (Phaser throws if the wrap width is under one glyph).
        ...(w > 60 ? { wordWrap: { width: w - 24, useAdvancedWrap: true } } : {}),
      },
    ).setOrigin(left ? 0 : 0.5, 0.5);
    if (!dark) this.label.setShadow(0, 1, 'rgba(0,0,0,0.35)', 0, false, true);
    this.add([this.bg, this.label]);
    this.setSize(w, h);
    this.setInteractive({ useHandCursor: true });
    this.on('pointerdown', () => this.enabled && this.press(true));
    this.on('pointerout', () => this.press(false));
    this.on('pointerup', () => {
      if (!this.enabled) return;
      this.press(false);
      play('select');
      onClick();
    });
    scene.add.existing(this);
  }

  private press(down: boolean): void {
    const key = `btn_${this.skin}${down ? '_pressed' : ''}`;
    if (this.bg instanceof Phaser.GameObjects.NineSlice && this.scene.textures.exists(key))
      this.bg.setTexture(key);
    else if (this.bg instanceof Phaser.GameObjects.Rectangle)
      this.bg.setFillStyle(down ? COLOR.buttonDown : COLOR.button);
    this.label.y = this.labelY + (down ? PRESS_DROP : 0);
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
    this.skin = skinFor(color);
    this.press(false);
    return this;
  }
}
