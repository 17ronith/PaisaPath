// Answer an 'invest' step: split savings across the 4 made-up assets with − / + steppers.
// Whatever isn't allocated stays in savings. Made-up assets only, every number labelled as
// an assumption (Vanguard guardrail: educate, never recommend).
import Phaser from 'phaser';
import { getSession } from '@/app/session';
import { rupees, t } from '@/shared/i18n';
import type { AssetDef, AssetId, Portfolio, Step } from '@/shared/types';
import { advance, save } from '../flow/Driver';
import { Button } from '../ui/Button';
import { PixelPanel } from '../ui/PixelPanel';
import { COLOR, text, tr } from '../ui/theme';
import { overMap } from '../flow/journeyState';
import { VIEW } from '../view';

type Invest = Extract<Step, { kind: 'invest' }>;

/** Sheet + frame used as each asset's icon. */
const ICON: Record<AssetId, [sheet: string, frame: number]> = {
  cashbox: ['dungeon', 89],
  banyan: ['town', 28],
  chai: ['town', 130],
  mango: ['town', 27],
};
const STEPS = 10; // each tap moves 10% of savings

/** First sentence of a blurb, so cards stay two lines. */
const firstSentence = (s: string): string => s.split(/(?<=[.!?])\s/)[0];

export class InvestScene extends Phaser.Scene {
  private step!: Invest;
  private alloc: Record<AssetId, number> = { cashbox: 0, banyan: 0, chai: 0, mango: 0 };
  private amounts = new Map<AssetId, Phaser.GameObjects.Text>();
  private leftText!: Phaser.GameObjects.Text;
  private investBtn!: Button;

  constructor() {
    super('Invest');
  }

  init(data: { step: Step }): void {
    this.step = data.step as Invest;
    this.alloc = { cashbox: 0, banyan: 0, chai: 0, mango: 0 };
    this.amounts = new Map();
  }

  create(): void {
    const game = getSession().game;
    if (!game || this.step?.kind !== 'invest') {
      advance(this);
      return;
    }
    const { width: W } = VIEW;
    overMap(this, 0.8, false);
    const savings = this.step.savingsCoins;
    const unit = Math.max(1, Math.round(savings / STEPS));

    text(this, W / 2, 30, tr('invest.title', 'Grow your savings?'), 'lg', COLOR.white).setOrigin(
      0.5,
    );
    text(
      this,
      W / 2,
      60,
      tr('invest.savings', 'Savings available: {amount}', { amount: rupees(savings) }),
      'sm',
      COLOR.accent,
    ).setOrigin(0.5);

    this.step.assets.forEach((a, i) => this.card(a, 12, 82 + i * 98, W - 24, unit));

    this.leftText = text(this, W / 2, 482, '', 'sm', COLOR.white).setOrigin(0.5);
    text(
      this,
      W / 2,
      516,
      tr('invest.assumption', 'Made-up assets. Assumptions, not promises.'),
      'xs',
      COLOR.muted,
      {
        align: 'center',
        wordWrap: { width: W - 40, useAdvancedWrap: true },
      },
    ).setOrigin(0.5);

    new Button(this, W / 2 - 86, 596, t('btn.keep_saving'), () => this.finish(true), {
      width: 160,
      height: 52,
      size: 'sm',
      fill: 0x56684a,
    });
    this.investBtn = new Button(this, W / 2 + 86, 596, t('btn.invest'), () => this.finish(false), {
      width: 160,
      height: 52,
      size: 'sm',
      fill: COLOR.good,
    });
    this.refresh();
  }

  private total(): number {
    return Object.values(this.alloc).reduce((x, y) => x + y, 0);
  }

  private card(a: AssetDef, x: number, y: number, w: number, unit: number): void {
    const p = new PixelPanel(this, x, y, w, 90, { variant: 'card' });
    const [sheet, frame] = ICON[a.id];
    if (this.textures.exists(sheet)) p.add(this.add.image(30, 45, sheet, frame).setScale(3));
    p.add(text(this, 58, 8, a.name, 'sm', COLOR.ink));
    p.add(
      text(
        this,
        58,
        28,
        tr('invest.typical', 'Typical year: {mean}% · swings ±{vol}%', {
          mean: a.meanYearlyPct,
          vol: a.volatilityPct,
        }),
        'xs',
        COLOR.muted,
      ),
    );
    p.add(
      text(this, 58, 46, firstSentence(a.blurb), 'xs', COLOR.ink, {
        wordWrap: { width: w - 170, useAdvancedWrap: true },
        maxLines: 2,
      }),
    );
    // Risk meter: 5 pips, filled by volatility.
    const pips = Math.min(5, Math.ceil(a.volatilityPct / 6));
    for (let k = 0; k < 5; k++)
      p.add(
        this.add.rectangle(58 + k * 9, 82, 7, 4, k < pips ? COLOR.bad : 0xc8ccd4).setOrigin(0, 1),
      );

    const cx = w - 58;
    const amt = text(this, cx, 45, rupees(0), 'sm', COLOR.ink).setOrigin(0.5);
    p.add(amt);
    this.amounts.set(a.id, amt);
    const step = (dir: 1 | -1): void => {
      const savings = this.step.savingsCoins;
      const next = this.alloc[a.id] + dir * unit;
      const room = savings - this.total() + this.alloc[a.id];
      this.alloc[a.id] = Math.max(0, Math.min(room, next));
      this.refresh();
    };
    p.add(
      new Button(this, cx - 38, 45, '−', () => step(-1), { width: 36, height: 44, size: 'md' }),
    );
    p.add(new Button(this, cx + 38, 45, '+', () => step(1), { width: 36, height: 44, size: 'md' }));
  }

  private refresh(): void {
    for (const [id, txt] of this.amounts) txt.setText(rupees(this.alloc[id]));
    const left = this.step.savingsCoins - this.total();
    this.leftText.setText(
      tr('invest.left', 'Stays in savings: {amount}', { amount: rupees(left) }),
    );
    this.investBtn?.setEnabled(this.total() > 0);
  }

  private finish(keepAll: boolean): void {
    const game = getSession().game;
    if (!game) return;
    const alloc: Portfolio = {};
    if (!keepAll)
      for (const [id, v] of Object.entries(this.alloc)) if (v > 0) alloc[id as AssetId] = v;
    game.allocate(alloc);
    save();
    advance(this);
  }
}
