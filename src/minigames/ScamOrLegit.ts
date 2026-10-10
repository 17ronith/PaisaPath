// Scam or Legit? (30 s): 8 messages land on the phone one at a time. Swipe left / tap SCAM, or
// swipe right / tap LEGIT. ≥ 6 of 8 = the side gig pays. Teaches spotting scams (safety pillar).
import Phaser from 'phaser';
import { PixelPanel } from '@/game/ui/PixelPanel';
import { COLOR, text, tr } from '@/game/ui/theme';
import { SortGameScene, type AnswerButton } from './SortGameScene';
import { newScamRound, type MessageKind, type PhoneMessage } from './scamMessages';
import type { SortRound, Verdict } from './sortRound';

/** Drag further than this (px) to count as a swipe. */
export const SWIPE_PX = 70;
const SCREEN = 0xe8eef8;
const BUBBLE_W = 264;

export class ScamOrLegitScene extends SortGameScene<MessageKind, PhoneMessage> {
  protected readonly gameId = 'scam_or_legit' as const;
  protected readonly arena = COLOR.bg;
  protected get answers(): [AnswerButton<MessageKind>, AnswerButton<MessageKind>] {
    return [
      { answer: 'scam', label: tr('minigame.scam', '< SCAM'), fill: COLOR.bad, key: 'LEFT' },
      { answer: 'legit', label: tr('minigame.legit', 'LEGIT >'), fill: COLOR.good, key: 'RIGHT' },
    ];
  }

  private bubble?: Phaser.GameObjects.Container;
  private cy = 0;

  constructor() {
    super('scam_or_legit');
  }

  protected makeRound(): SortRound<MessageKind, PhoneMessage> {
    return newScamRound();
  }

  protected rules(): string[] {
    return [
      tr('minigame.scam.rule1', 'Swipe left or tap SCAM for fakes.'),
      tr('minigame.scam.rule2', 'Swipe right or tap LEGIT for real ones.'),
      tr('minigame.scam.rule3', 'Get 6 of 8 right to get paid.'),
    ];
  }

  protected prompt(): string {
    return tr('minigame.scam.prompt', 'Real message, or a trap? Check before you trust it.');
  }

  create(): void {
    super.create();
    // Phone: dark body, light screen, speaker slot.
    const top = this.playTop;
    const h = this.playBottom - this.playTop;
    const pw = BUBBLE_W + 40;
    const phone = new PixelPanel(this, (this.W - pw) / 2, top, pw, h, { variant: 'dark' });
    phone.add([
      this.add.rectangle(12, 26, pw - 24, h - 46, SCREEN).setOrigin(0),
      this.add.rectangle(pw / 2, 13, 50, 6, COLOR.muted),
      text(this, 18, 30, tr('minigame.scam.inbox', 'MESSAGES'), 'xs', COLOR.muted),
    ]);
    this.cy = top + 26 + (h - 46) / 2 + 8;
  }

  protected showItem(msg: PhoneMessage): void {
    const w = BUBBLE_W;
    const sender = text(this, 12, 10, msg.sender.toUpperCase(), 'xs', COLOR.money);
    const body = text(this, 12, 28, msg.text, 'sm', COLOR.ink, {
      wordWrap: { width: w - 24, useAdvancedWrap: true },
    });
    const h = Math.round(body.height + 44);
    const panel = new PixelPanel(this, -w / 2, -h / 2, w, h, { variant: 'card' });
    panel.add([sender, body]);
    const cx = this.W / 2;
    const bubble = this.add
      .container(cx, this.cy + 30, [panel])
      .setSize(w, h)
      .setAlpha(0);
    this.tweens.add({ targets: bubble, y: this.cy, alpha: 1, duration: 180, ease: 'Quad.Out' });

    bubble.setInteractive({ draggable: true, useHandCursor: true });
    bubble.on('drag', (_p: Phaser.Input.Pointer, dragX: number) => {
      if (this.phase !== 'play') return;
      bubble.x = dragX;
      bubble.angle = ((dragX - cx) / this.W) * 20;
    });
    bubble.on('dragend', () => {
      if (this.phase !== 'play') return;
      const dx = bubble.x - cx;
      if (dx <= -SWIPE_PX) this.choose('scam');
      else if (dx >= SWIPE_PX) this.choose('legit');
      else this.tweens.add({ targets: bubble, x: cx, angle: 0, duration: 120 });
    });
    this.bubble = bubble;
  }

  protected clearItem(v: Verdict<PhoneMessage>, answered: MessageKind | null): void {
    const bubble = this.bubble;
    this.bubble = undefined;
    if (!bubble) return;
    bubble.disableInteractive();
    const isScam = v.item.answer === 'scam';
    const stamp = text(
      this,
      0,
      0,
      isScam ? tr('minigame.scam', 'SCAM') : tr('minigame.legit', 'LEGIT'),
      'xl',
      isScam ? COLOR.bad : COLOR.good,
    )
      .setOrigin(0.5)
      .setAngle(-12)
      .setStroke('#ffffff', 4);
    bubble.add(stamp);
    const dir = answered === 'scam' ? -1 : answered === 'legit' ? 1 : 0;
    this.tweens.add({
      targets: bubble,
      x: bubble.x + dir * this.W,
      angle: dir * 25,
      alpha: dir === 0 ? 0 : 1,
      delay: 500,
      duration: 300,
      ease: 'Quad.In',
      onComplete: () => bubble.destroy(),
    });
  }
}
