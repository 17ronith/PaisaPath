// Battle text box: speaker tag + typewriter text. Tap while typing completes it instantly.
// An optional portrait (e.g. the Professor when he's teaching) sits at the left.
import Phaser from 'phaser';
import { PixelPanel } from './PixelPanel';
import { COLOR, text } from './theme';

const CHAR_MS = 18;

export class TextBox extends PixelPanel {
  private speaker: Phaser.GameObjects.Text;
  private bodyText: Phaser.GameObjects.Text;
  private full = '';
  private timer?: Phaser.Time.TimerEvent;
  private resolveTyping?: () => void;
  private face: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, x: number, y: number, w: number, h: number) {
    super(scene, x, y, w, h);
    this.face = scene.add
      .image(8, h - 6, '__DEFAULT')
      .setOrigin(0, 1)
      .setVisible(false);
    this.speaker = text(scene, 12, 10, '', 'xs', COLOR.aunty);
    this.bodyText = text(scene, 12, 26, '', 'sm', COLOR.ink, {
      wordWrap: { width: w - 24, useAdvancedWrap: true },
    });
    const hit = scene.add.zone(0, 0, w, h).setOrigin(0, 0).setInteractive();
    hit.on('pointerup', () => this.complete());
    this.add([hit, this.face, this.speaker, this.bodyText]);
  }

  get typing(): boolean {
    return !!this.timer;
  }

  /** Types `str`; resolves when fully shown (typed out or tapped). */
  say(str: string, who = '', speakerColor: number = COLOR.aunty, portrait?: string): Promise<void> {
    this.complete();
    // Portrait at 2× (a 48 px sprite → 96 px), text moves right of it.
    const showFace = !!portrait && this.scene.textures.exists(portrait);
    const left = showFace ? 8 + 96 + 6 : 12;
    if (showFace)
      this.face
        .setTexture(portrait)
        .setScale(96 / this.scene.textures.get(portrait).getSourceImage().height);
    this.face.setVisible(showFace);
    this.speaker.setX(left);
    this.bodyText.setX(left).setWordWrapWidth(this.w - left - 12, true);
    this.speaker
      .setText(who.toUpperCase())
      .setColor('#' + speakerColor.toString(16).padStart(6, '0'));
    this.bodyText.setY(who ? 26 : 12);
    this.full = str;
    this.bodyText.setText('');
    let i = 0;
    return new Promise((resolve) => {
      this.resolveTyping = resolve;
      this.timer = this.scene.time.addEvent({
        delay: CHAR_MS,
        repeat: Math.max(0, str.length - 1),
        callback: () => {
          i++;
          this.bodyText.setText(str.slice(0, i));
          if (i >= str.length) this.complete();
        },
      });
      if (str.length === 0) this.complete();
    });
  }

  complete(): void {
    if (this.timer) {
      this.timer.remove(false);
      this.timer = undefined;
    }
    this.bodyText.setText(this.full);
    const r = this.resolveTyping;
    this.resolveTyping = undefined;
    r?.();
  }
}
