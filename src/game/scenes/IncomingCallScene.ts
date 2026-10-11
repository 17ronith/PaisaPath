// ISSUES #19: a scam call arrives as a real incoming call before its choices: the place behind a
// lock-screen veil, the caller's photo in ringing ripples, a ringtone and a buzz, Answer / Decline.
// Decline and they ring straight back (scammers don't give up); decline again and only Answer is
// left, because the lesson happens on the line. Answer connects into the battle underneath.
import Phaser from 'phaser';
import { buzz, play, ring } from '../audio';
import { backdropKey, drawBackdrop } from '../ui/Backdrop';
import { COLOR, text, tr } from '../ui/theme';
import { VIEW } from '../view';

export interface IncomingCallData {
  caller: string;
  portrait?: string;
  place?: string;
  onAnswer: () => void;
}

const RING_MS = 2600;
const PHOTO_Y = 236;
const BTN_Y = 540;

export class IncomingCallScene extends Phaser.Scene {
  private call!: IncomingCallData;
  private declines = 0;
  private done = false;
  private ringer?: Phaser.Time.TimerEvent;
  private status!: Phaser.GameObjects.Text;
  private photo!: Phaser.GameObjects.Container;
  private declineBtn!: Phaser.GameObjects.Container;

  constructor() {
    super('IncomingCall');
  }

  init(data: IncomingCallData): void {
    this.call = data;
    this.declines = 0;
    this.done = false;
  }

  create(): void {
    const { width: W, height: H } = VIEW;
    // Lock screen: the place you're at, behind a dark veil. The veil swallows stray taps.
    this.add.rectangle(0, 0, W, H, 0x0e1020).setOrigin(0).setInteractive();
    if (drawBackdrop(this, backdropKey(this.call.place), 0, 0, W, H))
      this.add.rectangle(0, 0, W, H, 0x0e1020, 0.84).setOrigin(0);

    this.status = text(this, W / 2, 96, tr('call.incoming', 'Incoming call…'), 'sm', COLOR.white)
      .setOrigin(0.5)
      .setAlign('center')
      .setWordWrapWidth(W - 48);
    this.tweens.add({ targets: this.status, alpha: 0.45, yoyo: true, repeat: -1, duration: 700 });

    // The caller's photo in ringing ripples.
    for (let i = 0; i < 3; i++) {
      const ripple = this.add.circle(W / 2, PHOTO_Y, 78).setStrokeStyle(3, COLOR.good, 0.9);
      this.tweens.add({
        targets: ripple,
        scale: 1.75,
        alpha: 0,
        duration: 1800,
        delay: i * 600,
        repeat: -1,
      });
    }
    this.photo = this.add.container(W / 2, PHOTO_Y);
    this.photo.add(this.add.circle(0, 0, 78, 0x2a2f4a).setStrokeStyle(4, COLOR.white, 0.9));
    const key = this.call.portrait;
    if (key && this.textures.exists(key)) this.photo.add(this.add.image(0, 0, key).setScale(2));
    else this.photo.add(text(this, 0, 0, '?', 'xl', COLOR.white).setOrigin(0.5));

    text(this, W / 2, PHOTO_Y + 116, this.call.caller, 'lg', COLOR.white).setOrigin(0.5);
    text(
      this,
      W / 2,
      PHOTO_Y + 146,
      tr('call.mobile', 'Mobile · India'),
      'xs',
      COLOR.muted,
    ).setOrigin(0.5);

    this.declineBtn = this.roundButton(
      W / 2 - 92,
      0xe04848,
      135,
      tr('call.decline', 'Decline'),
      () => this.decline(),
    );
    const answer = this.roundButton(W / 2 + 92, COLOR.good, 0, tr('call.answer', 'Answer'), () =>
      this.answer(),
    );
    this.tweens.add({ targets: answer, y: -6, yoyo: true, repeat: -1, duration: 380 });

    this.ringOnce();
    this.ringer = this.time.addEvent({
      delay: RING_MS,
      loop: true,
      callback: () => this.ringOnce(),
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => buzz([]));
  }

  /** A round call button: coloured disc, a handset (rotated 135° for hang-up), a label under it. */
  private roundButton(
    x: number,
    fill: number,
    angle: number,
    label: string,
    onTap: () => void,
  ): Phaser.GameObjects.Container {
    const c = this.add.container(0, 0);
    const disc = this.add.circle(x, BTN_Y, 34, fill).setStrokeStyle(3, COLOR.white, 0.85);
    disc.setInteractive({ useHandCursor: true }).on('pointerup', onTap);
    const icon = text(this, x, BTN_Y, '📞', 'xl', COLOR.white).setOrigin(0.5).setAngle(angle);
    c.add([disc, icon, text(this, x, BTN_Y + 50, label, 'sm', COLOR.white).setOrigin(0.5)]);
    return c;
  }

  private ringOnce(): void {
    if (this.done) return;
    ring();
    buzz([350, 150, 350]);
    this.tweens.add({
      targets: this.photo,
      angle: { from: -6, to: 6 },
      yoyo: true,
      repeat: 5,
      duration: 45,
    });
  }

  private decline(): void {
    if (this.done) return;
    this.declines++;
    play('select');
    buzz([]);
    if (this.ringer) this.ringer.paused = true;
    if (this.declines === 1) {
      this.status.setText(tr('call.missed', 'Missed call'));
      this.time.delayedCall(1400, () => {
        if (this.done) return;
        this.status.setText(tr('call.again', 'Calling again… (1 missed call)'));
        this.ringOnce();
        if (this.ringer) this.ringer.paused = false;
      });
      return;
    }
    // They won't stop. Only Answer is left: deal with it properly on the line.
    this.declineBtn.setVisible(false);
    this.status.setText(
      tr(
        'call.again2',
        'Calling again… (2 missed calls). They won’t stop. Answer and end it properly.',
      ),
    );
    this.time.delayedCall(900, () => {
      this.ringOnce();
      if (this.ringer) this.ringer.paused = false;
    });
  }

  private answer(): void {
    if (this.done) return;
    this.done = true;
    this.ringer?.remove();
    buzz([]);
    play('select');
    this.status.setText(tr('call.connected', 'Connected'));
    this.cameras.main.fadeOut(260, 14, 16, 32);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      const onAnswer = this.call.onAnswer;
      this.scene.stop();
      onAnswer();
    });
  }
}
