// Scam or Legit? (30 s): 8 messages land on the phone one at a time. Swipe left / tap SCAM, or
// swipe right / tap LEGIT. ≥ 6 of 8 = the side gig pays. Teaches spotting scams (safety pillar).
import Phaser from 'phaser';
import { SortGameScene, tr, type AnswerButton, type Palette } from './SortGameScene';
import { newScamRound, type MessageKind, type PhoneMessage } from './scamMessages';
import type { SortRound, Verdict } from './sortRound';

/** Drag further than this (px) to count as a swipe. */
export const SWIPE_PX = 70;

export class ScamOrLegitScene extends SortGameScene<MessageKind, PhoneMessage> {
  protected readonly gameId = 'scam_or_legit' as const;
  protected readonly palette: Palette = {
    bg: 0x14182b,
    panel: 0x252c4a,
    text: '#eef1ff',
    dim: '#9aa3c7',
    good: '#8fe388',
    bad: '#ff8a7a',
  };
  protected get answers(): [AnswerButton<MessageKind>, AnswerButton<MessageKind>] {
    return [
      { answer: 'scam', label: tr('minigame.scam', '◀ SCAM'), color: 0xb83a3a, key: 'LEFT' },
      { answer: 'legit', label: tr('minigame.legit', 'LEGIT ▶'), color: 0x2f7d4f, key: 'RIGHT' },
    ];
  }

  private bubble?: Phaser.GameObjects.Container;
  private readonly bubbleW = 280;

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

  create(): void {
    super.create();
    // Phone frame behind the messages.
    const cy = (this.playTop + this.playBottom) / 2;
    const h = this.playBottom - this.playTop - 10;
    this.add.rectangle(this.W / 2, cy, this.bubbleW + 30, h, 0x0b0e1a).setStrokeStyle(4, 0x5a6390);
    this.add.rectangle(this.W / 2, this.playTop + 14, 60, 6, 0x5a6390);
  }

  protected showItem(msg: PhoneMessage): void {
    const p = this.palette;
    const w = this.bubbleW - 16;
    const sender = this.text(-w / 2 + 14, 0, msg.sender, 13, '#f2c14e').setFontStyle('bold');
    const body = this.text(-w / 2 + 14, 0, msg.text, 15, p.text)
      .setWordWrapWidth(w - 28)
      .setLineSpacing(3);
    const h = body.height + 56;
    sender.setY(-h / 2 + 12);
    body.setY(-h / 2 + 36);
    const bg = this.add.rectangle(0, 0, w, h, p.panel).setStrokeStyle(2, 0x8a93c0);
    const cx = this.W / 2;
    const cy = (this.playTop + this.playBottom) / 2;
    const bubble = this.add
      .container(cx, cy + 40, [bg, sender, body])
      .setSize(w, h)
      .setAlpha(0);
    this.tweens.add({ targets: bubble, y: cy, alpha: 1, duration: 180, ease: 'Quad.Out' });

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
    const dir = answered === 'scam' ? -1 : answered === 'legit' ? 1 : 0;
    const stamp = this.text(0, 0, v.item.answer === 'scam' ? 'SCAM' : 'LEGIT', 30, '#ffffff')
      .setOrigin(0.5)
      .setFontStyle('bold')
      .setAngle(-12)
      .setColor(v.item.answer === 'scam' ? '#ff5d5d' : '#6fe07a');
    bubble.add(stamp);
    this.tweens.add({
      targets: bubble,
      x: bubble.x + dir * this.W,
      angle: dir * 25,
      alpha: dir === 0 ? 0 : 1,
      delay: 450,
      duration: 300,
      ease: 'Quad.In',
      onComplete: () => bubble.destroy(),
    });
  }
}
