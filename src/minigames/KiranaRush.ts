// Kirana Rush (30 s): shopping items drop toward the counter one by one. Tap NEED or WANT before
// each lands. ≥ 70% right = the side gig pays. Teaches needs vs wants (budget pillar).
import Phaser from 'phaser';
import { PixelPanel } from '@/game/ui/PixelPanel';
import { COLOR, text, tr } from '@/game/ui/theme';
import { SortGameScene, type AnswerButton } from './SortGameScene';
import { fallMsFor, newKiranaRound, type Basket, type KiranaItem } from './kiranaItems';
import type { SortRound, Verdict } from './sortRound';

const WALL = 0xf3e3c3;
const WOOD = 0xb07840;
const CARD_W = 260;
const CARD_H = 84;
/** Little boxes on the shelves, purely decorative. */
const GOODS = [0xd04848, 0x48a058, 0x4878c8, 0xe0a030, 0xc05890, 0x9fd3c7];

export class KiranaRushScene extends SortGameScene<Basket, KiranaItem> {
  protected readonly gameId = 'kirana_rush' as const;
  protected readonly arena = WALL;
  protected get answers(): [AnswerButton<Basket>, AnswerButton<Basket>] {
    return [
      { answer: 'need', label: tr('minigame.need', 'NEED'), fill: COLOR.good, key: 'LEFT' },
      { answer: 'want', label: tr('minigame.want', 'WANT'), fill: 0xd07030, key: 'RIGHT' },
    ];
  }

  private item?: Phaser.GameObjects.Container;
  private itemAge = 0;
  private fallMs = 0;
  private startY = 0;
  private landY = 0;

  constructor() {
    super('kirana_rush');
  }

  protected makeRound(): SortRound<Basket, KiranaItem> {
    return newKiranaRound();
  }

  protected rules(): string[] {
    return [
      tr('minigame.kirana.rule1', 'Tap NEED or WANT before it lands on the counter.'),
      tr('minigame.kirana.rule2', 'Get 7 of 10 right to get paid.'),
    ];
  }

  protected prompt(): string {
    return tr('minigame.kirana.prompt', 'Does the family NEED it, or just WANT it?');
  }

  create(): void {
    super.create();
    const W = this.W;
    const counterTop = this.playBottom - 36;
    this.startY = this.playTop + CARD_H / 2 + 8;
    this.landY = counterTop - CARD_H / 2 - 2;
    this.drawShelves(W);
    const counter = new PixelPanel(this, 4, counterTop, W - 8, 36, { fill: WOOD, shadow: false });
    counter.add(
      text(this, (W - 8) / 2, 12, tr('minigame.kirana.counter', 'COUNTER'), 'xs', WALL).setOrigin(
        0.5,
        0,
      ),
    );
  }

  private drawShelves(W: number): void {
    const g = this.add.graphics();
    const rows = [this.playTop + 70, this.playTop + 170];
    rows.forEach((y, r) => {
      g.fillStyle(WOOD, 1).fillRect(12, y, W - 24, 6);
      for (let x = 20, i = r; x < W - 36; x += 26, i++) {
        const h = 14 + ((i * 7) % 12);
        g.fillStyle(GOODS[i % GOODS.length], 0.45).fillRect(x, y - h, 18, h);
      }
    });
  }

  protected showItem(item: KiranaItem, index: number): void {
    const card = new PixelPanel(this, -CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H);
    card.add([
      this.add.text(14, CARD_H / 2, item.icon, { fontSize: '34px' }).setOrigin(0, 0.5),
      text(this, 66, 14, item.name, 'sm', COLOR.ink, {
        wordWrap: { width: CARD_W - 80, useAdvancedWrap: true },
      }),
      text(this, 66, CARD_H - 30, `₹${item.price}`, 'md', COLOR.money),
    ]);
    this.item = this.add.container(this.W / 2, this.startY, [card]);
    this.itemAge = 0;
    this.fallMs = fallMsFor(index, this.round.total);
  }

  protected updateItem(dtMs: number): boolean {
    if (!this.item) return false;
    this.itemAge += dtMs;
    const t = Math.min(1, this.itemAge / this.fallMs);
    this.item.y = this.startY + (this.landY - this.startY) * t * t; // gravity-ish ease-in
    return t >= 1;
  }

  protected clearItem(v: Verdict<KiranaItem>, answered: Basket | null): void {
    const item = this.item;
    this.item = undefined;
    if (!item) return;
    if (answered === null) {
      // Landed on the counter unsorted: bump and fade.
      this.tweens.add({
        targets: item,
        y: item.y - 8,
        alpha: 0,
        duration: 450,
        ease: 'Bounce.Out',
        onComplete: () => item.destroy(),
      });
      return;
    }
    this.tweens.add({
      targets: item,
      x: answered === 'need' ? this.W * 0.25 : this.W * 0.75,
      y: this.H - 60,
      scale: 0.25,
      alpha: v.correct ? 0.7 : 0,
      angle: v.correct ? 0 : answered === 'need' ? -20 : 20,
      duration: 320,
      ease: 'Quad.In',
      onComplete: () => item.destroy(),
    });
  }
}
