// The turf match the student saved for. Played after a choice that carries
// `cutscene: 'turf_cricket'` (the ₹20 chips instead of the ₹300 biryani): next day at the
// turf, the avatar bats three balls from a friend. The biryani choice never gets here; its
// detour is the match you can't afford. Purely visual: no state changes.
// Launched by Battle with data { onDone }; stops itself and then calls onDone exactly once.
import Phaser from 'phaser';
import { getSession } from '@/app/session';
import { play } from '../audio';
import { backdropKey, drawBackdrop } from '../ui/Backdrop';
import { Button } from '../ui/Button';
import { charScale } from '../ui/chars';
import { PixelPanel } from '../ui/PixelPanel';
import { COLOR, text, tr } from '../ui/theme';
import { VIEW } from '../view';

export interface TurfCricketData {
  onDone?: () => void;
}

const ARENA_TOP = 96;
const ARENA_H = 440;
// Pitch landmarks in logical px (turf backdrop drawn cover-fit into the arena).
const RELEASE = { x: 186, y: 388 };
const BOUNCE = { x: 180, y: 468 };
const BAT = { x: 176, y: 490 };
const BAT_REST = -135; // raised over the shoulder
const BAT_FOLLOW = 115; // follow-through

/** Where each ball goes: [target x, target y, runs, label]. */
const SHOTS: [number, number, number, string][] = [
  [36, 92, 6, 'SIX!'],
  [348, 440, 4, 'FOUR!'],
  [196, 70, 6, 'SIX!'],
];

export class TurfCricketScene extends Phaser.Scene {
  private data_!: TurfCricketData;
  private done = false;
  private runs = 0;
  private runsText!: Phaser.GameObjects.Text;
  private bat!: Phaser.GameObjects.Container;
  private bowler!: Phaser.GameObjects.Image;
  private button!: Button;

  constructor() {
    super('TurfCricket');
  }

  init(data: TurfCricketData): void {
    this.data_ = data ?? {};
    this.done = false;
    this.runs = 0;
  }

  create(): void {
    const { width: W, height: H } = VIEW;
    // Opaque, and swallows taps meant for the battle underneath.
    this.add.rectangle(0, 0, W, H, COLOR.bg).setOrigin(0).setInteractive();
    if (!drawBackdrop(this, backdropKey('turf'), 0, ARENA_TOP, W, ARENA_H))
      this.add.rectangle(0, ARENA_TOP, W, ARENA_H, 0x3f8f3a).setOrigin(0);

    // Header: why you're here.
    const head = new PixelPanel(this, 10, 10, W - 20, 76, { variant: 'blue' });
    head.add(text(this, 12, 10, tr('turf.title', 'NEXT DAY · TURF MATCH'), 'sm', COLOR.ink));
    head.add(
      text(
        this,
        12,
        36,
        tr('turf.saved', "You kept ₹100 for the match. You're batting!"),
        'xs',
        COLOR.muted,
        { wordWrap: { width: W - 120 } },
      ),
    );
    this.runsText = text(this, W - 32, 12, '0', 'lg', COLOR.money).setOrigin(1, 0);
    head.add(this.runsText);
    head.add(text(this, W - 32, 50, tr('turf.runs', 'RUNS'), 'xs', COLOR.muted).setOrigin(1, 0));

    // A friend bowls from the far end; another waits in the deep.
    const friend = this.textures.exists('npc_friend') ? 'npc_friend' : null;
    if (friend) {
      this.bowler = this.add
        .image(RELEASE.x + 4, 360, friend)
        .setOrigin(0.5, 1)
        .setScale(charScale(this, friend, 2.2));
      this.add
        .image(312, 372, friend)
        .setOrigin(0.5, 1)
        .setScale(charScale(this, friend, 1.8))
        .setFlipX(true);
    }

    // You, from behind, at the near crease, with a bat in your hands.
    const avatar = getSession().game?.state.profile.avatar ?? 'avatar_neutral';
    const back = [`${avatar}_back`, `${avatar}_quarter`, avatar].find((k) =>
      this.textures.exists(k),
    );
    this.add.ellipse(BAT.x - 10, 534, 70, 12, 0x000000, 0.25);
    if (back)
      this.add
        .image(BAT.x - 12, 536, back)
        .setOrigin(0.5, 1)
        .setScale(charScale(this, back, 5));
    this.bat = this.add.container(BAT.x + 2, BAT.y - 6);
    this.bat.add(this.add.rectangle(0, 0, 4, 12, 0x5a3a1e).setOrigin(0.5, 0)); // handle
    this.bat.add(
      this.add.rectangle(0, 11, 9, 30, 0xe0b070).setOrigin(0.5, 0).setStrokeStyle(1, 0x8a5a2a),
    );
    this.bat.setAngle(BAT_REST);

    this.button = new Button(this, W / 2, 600, tr('btn.skip', 'SKIP'), () => this.finish(), {
      height: 52,
    });

    this.bowlNext(0);
  }

  private bowlNext(i: number): void {
    if (this.done) return;
    if (i >= SHOTS.length) {
      this.wrapUp();
      return;
    }
    // Run-up: the bowler trots in, then lets go.
    const runUp = this.bowler
      ? this.tweens.add({
          targets: this.bowler,
          y: RELEASE.y + 8,
          duration: 520,
          ease: 'Sine.easeIn',
        })
      : null;
    this.time.delayedCall(runUp ? 540 : 200, () => this.deliver(i));
  }

  private deliver(i: number): void {
    if (this.done) return;
    play('select');
    const ball = this.add.circle(RELEASE.x, RELEASE.y, 2.2, 0xd8382c).setStrokeStyle(0.6, 0xffffff);
    // Release → bounce (comes closer, so it grows) → onto the bat.
    this.tweens.chain({
      targets: ball,
      tweens: [
        { x: BOUNCE.x, y: BOUNCE.y, scale: 1.7, duration: 420, ease: 'Quad.easeIn' },
        { x: BAT.x, y: BAT.y, scale: 2.1, duration: 170, ease: 'Linear' },
      ],
      onComplete: () => this.hit(ball, i),
    });
    // Swing so the bat meets the ball as it arrives.
    this.time.delayedCall(430, () =>
      this.tweens.add({
        targets: this.bat,
        angle: BAT_FOLLOW,
        duration: 200,
        ease: 'Cubic.easeIn',
        onComplete: () =>
          this.tweens.add({ targets: this.bat, angle: BAT_REST, duration: 380, delay: 260 }),
      }),
    );
    if (this.bowler)
      this.tweens.add({
        targets: this.bowler,
        y: 360,
        duration: 700,
        delay: 300,
        ease: 'Sine.easeOut',
      });
  }

  private hit(ball: Phaser.GameObjects.Arc, i: number): void {
    if (this.done) return;
    const [tx, ty, runs, label] = SHOTS[i];
    play('good');
    this.cameras.main.shake(90, 0.004);
    const lofted = runs === 6;
    this.tweens.add({
      targets: ball,
      x: tx,
      y: ty,
      // Lofted shots climb toward the camera, then shrink away over the fence.
      scale: lofted ? { from: 3.2, to: 0.8 } : 1.4,
      duration: lofted ? 900 : 650,
      ease: 'Quad.easeOut',
      onComplete: () => ball.destroy(),
    });
    this.time.delayedCall(lofted ? 650 : 420, () => this.boundary(label, runs, i));
  }

  private boundary(label: string, runs: number, i: number): void {
    if (this.done) return;
    play('coin');
    this.runs += runs;
    this.runsText.setText(String(this.runs));
    const pop = text(this, VIEW.width / 2, 250, tr(`turf.${runs}`, label), 'xl', COLOR.white)
      .setOrigin(0.5)
      .setStroke('#1f2a1e', 6)
      .setScale(0.4);
    this.tweens.add({
      targets: pop,
      scale: 1,
      duration: 260,
      ease: 'Back.easeOut',
      onComplete: () =>
        this.tweens.add({
          targets: pop,
          alpha: 0,
          y: 220,
          delay: 520,
          duration: 260,
          onComplete: () => pop.destroy(),
        }),
    });
    this.time.delayedCall(1100, () => this.bowlNext(i + 1));
  }

  private wrapUp(): void {
    const W = VIEW.width;
    const p = new PixelPanel(this, 10, 96, W - 20, 64, { variant: 'card' });
    p.add(
      text(
        this,
        12,
        10,
        tr(
          'turf.lesson',
          '₹20 chips yesterday, ₹100 match today: {runs} runs! The biryani would have cost you this game.',
          { runs: this.runs },
        ),
        'xs',
        COLOR.ink,
        { wordWrap: { width: W - 48, useAdvancedWrap: true } },
      ),
    );
    this.button.setCaption(tr('btn.next', 'NEXT')).setFill(COLOR.good);
  }

  private finish(): void {
    if (this.done) return;
    this.done = true;
    const cb = this.data_.onDone;
    this.scene.stop();
    cb?.();
  }
}
