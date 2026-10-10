// Kirana Rush (30 s): shopping items drop toward the counter one by one. Tap NEED or WANT before
// each lands. ≥ 70% right = the side gig pays. Teaches needs vs wants (budget pillar).
import Phaser from 'phaser';
import { SortGameScene, tr, type AnswerButton, type Palette } from './SortGameScene';
import { fallMsFor, newKiranaRound, type Basket, type KiranaItem } from './kiranaItems';
import type { SortRound, Verdict } from './sortRound';

export class KiranaRushScene extends SortGameScene<Basket, KiranaItem> {
  protected readonly gameId = 'kirana_rush' as const;
  protected readonly palette: Palette = {
    bg: 0x2b1d14,
    panel: 0x4a3222,
    text: '#fff4e0',
    dim: '#c9a98a',
    good: '#8fe388',
    bad: '#ff8a7a',
  };
  protected get answers(): [AnswerButton<Basket>, AnswerButton<Basket>] {
    return [
      { answer: 'need', label: tr('minigame.need', 'NEED'), color: 0x2f7d4f, key: 'LEFT' },
      { answer: 'want', label: tr('minigame.want', 'WANT'), color: 0xb5562b, key: 'RIGHT' },
    ];
  }

  private item?: Phaser.GameObjects.Container;
  private itemAge = 0;
  private fallMs = 0;
  private readonly startY = this.playTop + 60;
  private readonly counterY = this.playBottom - 40;

  constructor() {
    super('kirana_rush');
  }

  protected makeRound(): SortRound<Basket, KiranaItem> {
    return newKiranaRound();
  }

  protected rules(): string[] {
    return [
      tr('minigame.kirana.rule1', 'Tap NEED or WANT before it hits the counter.'),
      tr('minigame.kirana.rule2', 'Get 7 of 10 right to get paid.'),
    ];
  }

  /** Items land on the counter, so the "why" line sits up top where the next item will drop. */
  protected feedbackY(): number {
    return this.playTop + 150;
  }

  create(): void {
    super.create();
    // The shop counter the items fall onto.
    this.add.rectangle(this.W / 2, this.counterY + 52, this.W - 24, 14, 0x8a5a36);
    this.add.rectangle(this.W / 2, this.counterY + 66, this.W - 40, 8, 0x5e3b22);
  }

  protected showItem(item: KiranaItem, index: number): void {
    const w = 210;
    const h = 104;
    const p = this.palette;
    const bg = this.add.rectangle(0, 0, w, h, p.panel).setStrokeStyle(3, 0xf2c14e);
    const icon = this.text(-w / 2 + 16, 0, item.icon, 34, '#ffffff').setOrigin(0, 0.5);
    const name = this.text(-w / 2 + 70, -16, item.name, 15, p.text)
      .setOrigin(0, 0.5)
      .setFontStyle('bold')
      .setWordWrapWidth(w - 80);
    const price = this.text(-w / 2 + 70, 20, `₹${item.price}`, 16, '#f2c14e').setOrigin(0, 0.5);
    this.item = this.add.container(this.W / 2, this.startY, [bg, icon, name, price]);
    this.itemAge = 0;
    this.fallMs = fallMsFor(index, this.round.total);
  }

  protected updateItem(dtMs: number): boolean {
    if (!this.item) return false;
    this.itemAge += dtMs;
    const t = Math.min(1, this.itemAge / this.fallMs);
    this.item.y = this.startY + (this.counterY - this.startY) * t * t; // gravity-ish ease-in
    return t >= 1;
  }

  protected clearItem(v: Verdict<KiranaItem>, answered: Basket | null): void {
    const item = this.item;
    this.item = undefined;
    if (!item) return;
    if (answered === null) {
      // Landed on the counter unsorted: thud and fade.
      this.tweens.add({
        targets: item,
        alpha: 0,
        y: item.y + 20,
        duration: 400,
        onComplete: () => item.destroy(),
      });
      return;
    }
    const toX = answered === 'need' ? this.W * 0.25 : this.W * 0.75;
    this.tweens.add({
      targets: item,
      x: toX,
      y: this.H - 90,
      scale: 0.3,
      alpha: v.correct ? 0.6 : 0,
      angle: v.correct ? 0 : answered === 'need' ? -20 : 20,
      duration: 320,
      ease: 'Quad.In',
      onComplete: () => item.destroy(),
    });
  }
}
