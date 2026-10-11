// ISSUES #19: a scam call arrives as a real phone call before its choices, full screen:
//   1. Ringing — the place behind a lock-screen veil, the caller's photo in ringing ripples, a
//      "Suspected spam" tag, ringtone + buzz, Answer / Decline. Decline and they ring straight back
//      (scammers don't give up); decline again and only Answer is left.
//   2. On the call — a stopwatch starts; only the caller speaks (their line, typed and voiced).
//   3. Call ended — the stopwatch freezes, then the battle underneath shows the choices.
// `video` calls (digital arrest) show the caller big, like a video feed, with your own face small.
import Phaser from 'phaser';
import { getSession } from '@/app/session';
import { buzz, play, ring } from '../audio';
import { say, stopVoice } from '../voice';
import { backdropKey, drawBackdrop } from '../ui/Backdrop';
import { portraitKey } from '../ui/Portrait';
import { COLOR, text, tr } from '../ui/theme';
import { VIEW } from '../view';

export interface IncomingCallData {
  caller: string;
  line: string;
  kind: 'voice' | 'video';
  portrait?: string;
  place?: string;
  /** Called once the call has ended, with its length in seconds. */
  onEnded: (seconds: number) => void;
}

const RING_MS = 2600;
const PHOTO_Y = 226;
const BTN_Y = 548;
const SPAM = 0xff9f43;

export class IncomingCallScene extends Phaser.Scene {
  private call!: IncomingCallData;
  private declines = 0;
  private stage: 'ringing' | 'live' | 'ended' = 'ringing';
  private ringer?: Phaser.Time.TimerEvent;
  private status!: Phaser.GameObjects.Text;
  private photo!: Phaser.GameObjects.Container;
  private ringing: Phaser.GameObjects.GameObject[] = [];
  private declineBtn!: Phaser.GameObjects.Container;
  private answerBtn!: Phaser.GameObjects.Container;
  private startedAt = 0;
  private clock?: Phaser.GameObjects.Text;

  constructor() {
    super('IncomingCall');
  }

  init(data: IncomingCallData): void {
    this.call = data;
    this.declines = 0;
    this.stage = 'ringing';
    this.ringing = [];
    this.clock = undefined;
  }

  create(): void {
    const { width: W, height: H } = VIEW;
    const video = this.call.kind === 'video';
    // Lock screen: the place you're at, behind a dark veil. The veil swallows stray taps.
    this.add.rectangle(0, 0, W, H, 0x0e1020).setOrigin(0).setInteractive();
    if (drawBackdrop(this, backdropKey(this.call.place), 0, 0, W, H))
      this.add.rectangle(0, 0, W, H, 0x0e1020, 0.84).setOrigin(0);

    this.status = text(
      this,
      W / 2,
      70,
      video
        ? tr('call.incoming_video', 'Incoming video call…')
        : tr('call.incoming', 'Incoming call…'),
      'sm',
      COLOR.white,
    ).setOrigin(0.5);
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
      this.ringing.push(ripple);
    }
    this.photo = this.add.container(W / 2, PHOTO_Y);
    this.photo.add(this.add.circle(0, 0, 78, 0x2a3326).setStrokeStyle(4, COLOR.white, 0.9));
    const key = portraitKey(this, this.call.portrait, this.call.caller);
    if (key)
      this.photo.add(
        this.add.image(0, 0, key).setScale(96 / this.textures.get(key).getSourceImage().height),
      );
    else this.photo.add(text(this, 0, 0, '?', 'xl', COLOR.white).setOrigin(0.5));

    text(this, W / 2, PHOTO_Y + 112, this.callerName(), 'lg', COLOR.white).setOrigin(0.5);
    // What a real phone would flag. The game's lesson is to believe it.
    const tag = video
      ? tr('call.video_tag', 'Video call · not in contacts')
      : tr('call.spam', '⚠ Suspected spam');
    const tagBg = this.add.rectangle(W / 2, PHOTO_Y + 142, 10, 10, video ? 0x3a4060 : SPAM);
    const tagText = text(this, W / 2, PHOTO_Y + 142, tag, 'xs', video ? COLOR.white : 0x1f2a1e);
    tagText.setOrigin(0.5);
    tagBg.setSize(tagText.width + 18, tagText.height + 8);

    this.declineBtn = this.roundButton(
      W / 2 - 92,
      0xe04848,
      135,
      tr('call.decline', 'Decline'),
      () => this.decline(),
    );
    this.answerBtn = this.roundButton(
      W / 2 + 92,
      COLOR.good,
      0,
      tr('call.answer', 'Answer'),
      () => this.answer(),
      video ? '🎥' : '📞',
    );
    this.tweens.add({ targets: this.answerBtn, y: -6, yoyo: true, repeat: -1, duration: 380 });

    this.ringOnce();
    this.ringer = this.time.addEvent({
      delay: RING_MS,
      loop: true,
      callback: () => this.ringOnce(),
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      buzz([]);
      stopVoice();
    });
  }

  update(): void {
    if (this.stage === 'live' && this.clock) this.clock.setText(this.elapsedLabel());
  }

  /** The name as a phone shows it: no "so-called" quote marks from the story text. */
  private callerName(): string {
    return this.call.caller.replace(/^['‘"“]+|['’"”]+$/g, '');
  }

  private elapsed(): number {
    return Math.floor((this.time.now - this.startedAt) / 1000);
  }

  private elapsedLabel(): string {
    const s = this.elapsed();
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }

  /** A round call button: coloured disc, a handset (rotated 135° for hang-up), a label under it. */
  private roundButton(
    x: number,
    fill: number,
    angle: number,
    label: string,
    onTap: () => void,
    icon = '📞',
  ): Phaser.GameObjects.Container {
    const c = this.add.container(0, 0);
    const disc = this.add.circle(x, BTN_Y, 34, fill).setStrokeStyle(3, COLOR.white, 0.85);
    disc.setInteractive({ useHandCursor: true }).on('pointerup', onTap);
    const glyph = text(this, x, BTN_Y, icon, 'xl', COLOR.white).setOrigin(0.5).setAngle(angle);
    const caption = text(this, x, BTN_Y + 50, label, 'sm', COLOR.white).setOrigin(0.5);
    caption.setInteractive({ useHandCursor: true }).on('pointerup', onTap); // the label counts too
    c.add([disc, glyph, caption]);
    return c;
  }

  private ringOnce(): void {
    if (this.stage !== 'ringing') return;
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
    if (this.stage !== 'ringing') return;
    this.declines++;
    play('select');
    buzz([]);
    if (this.ringer) this.ringer.paused = true;
    if (this.declines === 1) {
      this.status.setText(tr('call.missed', 'Missed call'));
      this.time.delayedCall(1400, () => {
        if (this.stage !== 'ringing') return;
        this.status.setText(tr('call.again', 'Calling again… (1 missed call)'));
        this.ringOnce();
        if (this.ringer) this.ringer.paused = false;
      });
      return;
    }
    // They won't stop. Only Answer is left: deal with it properly on the line.
    this.declineBtn.setVisible(false);
    this.status
      .setText(tr('call.again2', 'Calling again… (2 missed calls). They won’t stop. Answer it.'))
      .setWordWrapWidth(VIEW.width - 40)
      .setAlign('center');
    this.time.delayedCall(900, () => {
      this.ringOnce();
      if (this.ringer) this.ringer.paused = false;
    });
  }

  /** On the call: the stopwatch runs and only the caller speaks; then the line goes dead. */
  private answer(): void {
    if (this.stage !== 'ringing') return;
    this.stage = 'live';
    this.ringer?.remove();
    buzz([]);
    play('select');
    this.startedAt = this.time.now;
    for (const o of this.ringing)
      (o as unknown as Phaser.GameObjects.Components.Visible).setVisible(false);
    this.declineBtn.setVisible(false);
    this.answerBtn.setVisible(false);
    this.tweens.killTweensOf(this.status);
    this.status
      .setAlpha(1)
      .setText(
        this.call.kind === 'video'
          ? tr('call.on_video', 'Video call')
          : tr('call.on_call', 'On call'),
      );
    const { width: W } = VIEW;
    if (this.call.kind === 'video') this.videoFeed();
    this.clock = text(this, W / 2, PHOTO_Y + 168, '00:00', 'md', COLOR.white).setOrigin(0.5);

    // The caller's line as live subtitles, voiced. Nobody else speaks.
    const panel = this.add.rectangle(16, 410, W - 32, 92, 0x000000, 0.55).setOrigin(0);
    panel.setStrokeStyle(2, 0xffffff, 0.15);
    text(this, 28, 418, this.callerName(), 'xs', SPAM);
    const sub = text(this, 28, 436, '', 'sm', COLOR.white, {
      wordWrap: { width: W - 60, useAdvancedWrap: true },
    });
    const line = this.call.line.replace(/^'|'$/g, '');
    let shown = 0;
    this.time.addEvent({
      delay: 38,
      repeat: line.length - 1,
      callback: () => sub.setText(line.slice(0, ++shown)),
    });
    say(this.call.line);
    const hangUp = this.roundButton(W / 2, 0xe04848, 135, tr('call.end', 'End call'), () =>
      this.end(),
    );
    void hangUp;
    // Talking time: about 2.7 words a second, at least 5 s, then the caller hangs up.
    const words = line.split(/\s+/).length;
    this.time.delayedCall(Math.max(5000, (words / 2.7) * 1000 + 1500), () => this.end());
  }

  /** Video call: the caller fills the screen like a webcam feed; your own face sits in a corner. */
  private videoFeed(): void {
    const { width: W } = VIEW;
    this.photo.setScale(1.6).setY(PHOTO_Y - 10);
    const avatar = getSession().game?.state.profile.avatar;
    const self = this.add
      .rectangle(W - 70, 330, 80, 100, 0x2a3326)
      .setStrokeStyle(2, COLOR.white, 0.8);
    void self;
    if (avatar && this.textures.exists(avatar))
      this.add
        .image(W - 70, 338, avatar)
        .setScale(80 / this.textures.get(avatar).getSourceImage().height);
    // a REC-style red dot: the "officer" wants you to stay on camera
    const dot = this.add.circle(30, 112, 6, 0xe04848);
    this.tweens.add({ targets: dot, alpha: 0.2, yoyo: true, repeat: -1, duration: 500 });
    text(this, 44, 104, tr('call.on_camera', 'ON CAMERA'), 'xs', COLOR.white);
  }

  private end(): void {
    if (this.stage !== 'live') return;
    this.stage = 'ended';
    stopVoice();
    play('bad');
    buzz([120]);
    const secs = Math.max(1, this.elapsed());
    this.status.setText(tr('call.ended', 'Call ended'));
    this.clock?.setText(this.elapsedLabel()).setColor('#ff6b6b');
    this.time.delayedCall(1100, () => {
      this.cameras.main.fadeOut(260, 14, 16, 32);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        const onEnded = this.call.onEnded;
        this.scene.stop();
        onEnded(secs);
      });
    });
  }
}
