// The ♪ panel: three separate switches — background music, sound effects (taps, coins, footsteps)
// and the voice-over (some players would rather just read). Launched as an overlay by the corner
// ♪ (SoundScene) and the HUD's ♪; choices persist per device.
import Phaser from 'phaser';
import { CHANNELS, isOn, setOn, type Channel } from '../audio';
import { Button } from '../ui/Button';
import { PixelPanel } from '../ui/PixelPanel';
import { COLOR, text, tr } from '../ui/theme';
import { VIEW } from '../view';

const LABEL: Record<Channel, [string, string]> = {
  music: ['audio.music', 'Music'],
  sfx: ['audio.sfx', 'Sound effects'],
  voice: ['audio.voice', 'Voice-over'],
};

export class AudioSettingsScene extends Phaser.Scene {
  constructor() {
    super('AudioSettings');
  }

  create(): void {
    const { width: W, height: H } = VIEW;
    // Dim the game and swallow taps; tapping outside the panel closes it.
    this.add
      .rectangle(0, 0, W, H, 0x000000, 0.55)
      .setOrigin(0, 0)
      .setInteractive()
      .on('pointerdown', () => this.close());

    const pw = W - 48;
    const ph = 330;
    const px = 24;
    const py = (H - ph) / 2;
    const panel = new PixelPanel(this, px, py, pw, ph, { variant: 'dark' });
    panel.setInteractive(new Phaser.Geom.Rectangle(0, 0, pw, ph), Phaser.Geom.Rectangle.Contains);
    text(this, W / 2, py + 30, tr('audio.title', 'Sound'), 'md', COLOR.accent).setOrigin(0.5);

    // Green = on, red = off: both skins take white text, so the label stays readable when it flips.
    CHANNELS.forEach((c, i) => {
      const caption = () =>
        `${tr(LABEL[c][0], LABEL[c][1])}: ${isOn(c) ? tr('audio.on', 'ON') : tr('audio.off', 'OFF')}`;
      const b: Button = new Button(
        this,
        W / 2,
        py + 92 + i * 68,
        caption(),
        () => {
          setOn(c, !isOn(c));
          b.setCaption(caption()).setFill(isOn(c) ? COLOR.good : COLOR.bad);
        },
        { width: pw - 40, height: 56, size: 'sm', fill: isOn(c) ? COLOR.good : COLOR.bad },
      );
    });

    new Button(this, W / 2, py + ph - 40, tr('btn.close', 'CLOSE'), () => this.close(), {
      width: 140,
      height: 48,
      size: 'sm',
    });
    this.scene.bringToTop();
  }

  private close(): void {
    this.scene.stop();
  }
}
