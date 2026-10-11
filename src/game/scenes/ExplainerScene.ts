// Plays an Explainer from the content pack: the 6-op animation DSL (CONTRACTS §1).
// Shapes + on-screen text only, so translating = swapping text. Launched as an overlay
// with data { explainerId, onDone }; stops itself and then calls onDone exactly once.
import Phaser from 'phaser';
import { getSession } from '@/app/session';
import { rupees, t } from '@/shared/i18n';
import type { Explainer, ExplainerStep } from '@/shared/types';
import { growSeries, splitWidths, timeUntilNext } from '../logic/display';
import { play } from '../audio';
import { Button } from '../ui/Button';
import { JAR_LEVELS, WALLET_FRAME } from '../ui/MoneyArt';
import { COLOR, text, tr, type TextSize } from '../ui/theme';
import { VIEW } from '../view';
import { sayAfter, stopVoice } from '../voice';

interface ExplainerData {
  explainerId: string;
  onDone?: () => void;
}

type Op<K extends ExplainerStep['op']> = Extract<ExplainerStep, { op: K }>;

const SLOT_Y = { top: 120, mid: 300, bottom: 500 } as const;
const SIZE: Record<'sm' | 'md' | 'lg', TextSize> = { sm: 'sm', md: 'md', lg: 'lg' };
type Place = 'wallet' | 'savings' | 'outside';
/** Money containers stand on one shelf, left to right in flow order: outside → wallet → savings. */
const SHELF_Y = 440;
const PLACE_ORDER: Place[] = ['outside', 'wallet', 'savings'];
const SPRITE_SCALE = 2;
/** Where coins leave/enter, measured up from the shelf (logical px, sprite at 2×). */
const MOUTH: Record<Place, number> = { wallet: 42, savings: 66, outside: 40 };
/** Who "outside" is, from the explainer id (content stays a plain DSL). */
type Outside = 'salary' | 'lender' | 'scam' | 'shop';
function outsideFor(id: string): Outside {
  if (/otp|pin|scam|fake|too_good|fraud|phish/i.test(id)) return 'scam';
  if (/borrow|loan|emi|credit|interest|debt/i.test(id)) return 'lender';
  if (/pay_yourself|salary|income|earn|stipend/i.test(id)) return 'salary';
  return 'shop';
}
const OUTSIDE_LABEL: Record<Outside, [string, string]> = {
  salary: ['explainer.out.salary', 'PAYDAY'],
  lender: ['explainer.out.lender', 'LENDER'],
  scam: ['explainer.out.scam', 'SCAMMER'],
  shop: ['explainer.out.shop', 'SHOP'],
};

interface Holder {
  place: Place;
  x: number;
  root: Phaser.GameObjects.Container;
  sprite?: Phaser.GameObjects.Sprite;
  count?: Phaser.GameObjects.Text;
}
const PALETTE = [0x4caf50, 0xff9800, 0x2196f3, 0xe91e63, 0x9c27b0];
const parseColor = (c: string | undefined, i: number): number =>
  c && /^#?[0-9a-f]{6}$/i.test(c) ? parseInt(c.replace('#', ''), 16) : PALETTE[i % PALETTE.length];

export class ExplainerScene extends Phaser.Scene {
  private data_!: ExplainerData;
  private layer!: Phaser.GameObjects.Container;
  private slots: Partial<Record<keyof typeof SLOT_Y, Phaser.GameObjects.Text>> = {};
  private bars = new Map<
    string,
    { fill: Phaser.GameObjects.Rectangle; value: Phaser.GameObjects.Text }
  >();
  private holders = new Map<Place, Holder>();
  /** Coins in each container right now (outside is bottomless). */
  private coins: Record<Place, number> = { wallet: 0, savings: 0, outside: 0 };
  private placeX: Partial<Record<Place, number>> = {};
  private outside: Outside = 'shop';
  /** Draw the wooden shelf the containers stand on (only when the explainer moves coins). */
  private shelf = false;
  private done = false;
  private button?: Button;

  constructor() {
    super('Explainer');
  }

  init(data: ExplainerData): void {
    this.data_ = data;
    this.done = false;
    this.slots = {};
    this.bars = new Map();
    this.holders = new Map();
    this.coins = { wallet: 0, savings: 0, outside: 0 };
    this.placeX = {};
    this.button = undefined;
  }

  create(): void {
    const ex = getSession().content.explainers.find((x) => x.id === this.data_.explainerId);
    if (!ex) {
      this.finish();
      return;
    }
    const { width: W, height: H } = VIEW;
    // Opaque backdrop that also swallows taps meant for the scene underneath.
    this.add.rectangle(0, 0, W, H, COLOR.bg).setOrigin(0, 0).setInteractive();
    this.add.rectangle(0, 0, W, 4, COLOR.accent).setOrigin(0, 0);
    text(this, W / 2, 48, ex.title, 'md', COLOR.accent, {
      align: 'center',
      wordWrap: { width: W - 40 },
    }).setOrigin(0.5);
    this.layer = this.add.container(0, 0);

    stopVoice(); // a lesson still being read gives way to the animation's narration
    this.events.once('shutdown', stopVoice);
    const steps = [...ex.steps].sort((a, b) => a.at - b.at);
    this.planMoney(ex, steps);
    steps.forEach((s, i) => this.time.delayedCall(s.at, () => this.run(s, steps, i, ex)));
    this.time.delayedCall(3000, () => this.showButton(tr('explainer.skip', 'SKIP'), 0x505878));
    this.time.delayedCall(ex.durationMs, () => this.showButton(t('btn.next'), COLOR.good));
  }

  private showButton(caption: string, fill: number): void {
    if (this.done) return;
    const { width: W } = VIEW;
    this.button?.destroy();
    this.button = new Button(this, W / 2, 600, caption, () => this.finish(), { fill, height: 52 });
  }

  private finish(): void {
    if (this.done) return;
    this.done = true;
    const cb = this.data_.onDone;
    this.scene.stop();
    cb?.();
  }

  private run(s: ExplainerStep, all: ExplainerStep[], i: number, ex: Explainer): void {
    switch (s.op) {
      case 'text':
        return this.opText(s);
      case 'bar':
        return this.opBar(s);
      case 'coins':
        return this.opCoins(s);
      case 'grow':
        return this.opGrow(s, timeUntilNext(all, i, ex.durationMs));
      case 'split':
        return this.opSplit(s);
      case 'clear':
        this.layer.removeAll(true);
        this.slots = {};
        this.bars.clear();
        this.holders.clear();
        return;
    }
  }

  private opText(s: Op<'text'>): void {
    sayAfter(s.text); // the Professor narrates each caption, one after another, never overlapping
    const W = VIEW.width;
    const slot = s.slot ?? 'mid';
    this.slots[slot]?.destroy();
    const tx = text(this, W / 2, SLOT_Y[slot], s.text, SIZE[s.size ?? 'md'], COLOR.white, {
      align: 'center',
      wordWrap: { width: W - 40, useAdvancedWrap: true },
    })
      .setOrigin(0.5)
      .setAlpha(0);
    this.layer.add(tx);
    this.slots[slot] = tx;
    this.tweens.add({ targets: tx, alpha: 1, duration: 400 });
  }

  private opBar(s: Op<'bar'>): void {
    const y = 190 + (s.slot ?? 0) * 56;
    const x = 30;
    const w = 300;
    const pct = (v: number): number => Math.max(0, Math.min(100, v)) / 100;
    let bar = this.bars.get(s.id);
    if (!bar) {
      this.layer.add(text(this, x, y - 16, s.label, 'xs', COLOR.white));
      this.layer.add(
        this.add
          .rectangle(x, y, w, 16, 0x303850)
          .setOrigin(0, 0)
          .setStrokeStyle(2, COLOR.panelEdge),
      );
      const fill = this.add
        .rectangle(x + 2, y + 2, (w - 4) * pct(s.from), 12, parseColor(s.color, s.slot ?? 0))
        .setOrigin(0, 0);
      const value = text(this, x + w, y - 16, '', 'xs', COLOR.accent).setOrigin(1, 0);
      this.layer.add([fill, value]);
      bar = { fill, value };
      this.bars.set(s.id, bar);
    }
    const b = bar;
    this.tweens.addCounter({
      from: s.from,
      to: s.to,
      duration: 1200,
      ease: 'Cubic.easeOut',
      onUpdate: (tw) => {
        const v = tw.getValue() ?? s.to;
        b.fill.width = (w - 4) * pct(v);
        b.value.setText(`${Math.round(v)}`);
      },
    });
  }

  // ---- money flow: wallet / savings jar / outside --------------------------------------------

  /**
   * Lay out only the containers this explainer uses, evenly on the shelf, and work out how many
   * coins each must start with so no container ever goes below zero.
   */
  private planMoney(ex: Explainer, steps: ExplainerStep[]): void {
    this.outside = outsideFor(ex.id);
    const used = new Set<Place>();
    const level: Record<Place, number> = { wallet: 0, savings: 0, outside: 0 };
    const low: Record<Place, number> = { wallet: 0, savings: 0, outside: 0 };
    for (const st of steps) {
      if (st.op !== 'coins' || st.from === st.to) continue;
      used.add(st.from);
      used.add(st.to);
      const n = this.coinCount(st);
      level[st.from] -= n;
      level[st.to] += n;
      low[st.from] = Math.min(low[st.from], level[st.from]);
    }
    const order = PLACE_ORDER.filter((p) => used.has(p));
    this.shelf = order.length > 0;
    const W = VIEW.width;
    order.forEach((p, i) => {
      this.placeX[p] = order.length === 1 ? W / 2 : 60 + (i * (W - 120)) / (order.length - 1);
      if (order.length === 2) this.placeX[p] = i === 0 ? 90 : W - 90;
    });
    this.coins = { wallet: -low.wallet, savings: -low.savings, outside: 0 };
  }

  private coinCount(s: Op<'coins'>): number {
    return Math.max(1, Math.min(20, s.count));
  }

  /** Draw a container once (pops in), with its label and coin counter. */
  private holder(place: Place): Holder {
    const have = this.holders.get(place);
    if (have) return have;
    if (this.holders.size === 0 && this.shelf) this.drawShelf();
    const x = this.placeX[place] ?? VIEW.width / 2;
    const root = this.add.container(x, SHELF_Y);
    this.layer.add(root);
    root.add(this.add.ellipse(0, 2, 70, 10, 0x000000, 0.35));
    const key =
      place === 'wallet' ? 'ex_wallet' : place === 'savings' ? 'ex_jar' : `ex_out_${this.outside}`;
    let sprite: Phaser.GameObjects.Sprite | undefined;
    if (this.textures.exists(key)) {
      sprite = this.add.sprite(0, 0, key, 0).setOrigin(0.5, 1).setScale(SPRITE_SCALE);
      root.add(sprite);
    } else {
      root.add(this.add.rectangle(0, -20, 56, 40, 0x303850).setStrokeStyle(2, COLOR.accent));
    }
    const label =
      place === 'wallet'
        ? t('hud.wallet')
        : place === 'savings'
          ? t('hud.savings')
          : tr(...OUTSIDE_LABEL[this.outside]);
    root.add(
      text(
        this,
        0,
        16,
        label,
        'xs',
        place === 'outside' && this.outside === 'scam' ? COLOR.bad : COLOR.accent,
      ).setOrigin(0.5, 0),
    );
    let count: Phaser.GameObjects.Text | undefined;
    if (place !== 'outside') {
      count = text(this, 0, 31, '', 'xs', COLOR.happy).setOrigin(0.5, 0);
      root.add(count);
    }
    const h: Holder = { place, x, root, sprite, count };
    this.holders.set(place, h);
    this.showState(h);
    root.setScale(0.2).setAlpha(0);
    this.tweens.add({ targets: root, scale: 1, alpha: 1, duration: 320, ease: 'Back.easeOut' });
    return h;
  }

  /** A pixel wooden plank under the containers: lit top edge, grain, dark underside, brackets. */
  private drawShelf(): void {
    const g = this.add.graphics();
    const x0 = 16;
    const w = VIEW.width - 32;
    const y = SHELF_Y + 1;
    g.fillStyle(0x6a4226, 1).fillRect(x0, y, w, 6);
    g.fillStyle(0x8a5a32, 1).fillRect(x0, y, w, 2);
    g.fillStyle(0xb07c48, 1).fillRect(x0, y, w, 1);
    g.fillStyle(0x2e1a10, 1).fillRect(x0, y + 6, w, 1);
    for (let gx = x0 + 12; gx < x0 + w - 8; gx += 37)
      g.fillStyle(0x5a3620, 1).fillRect(gx, y + 3, 9, 1);
    for (const bx of [x0 + 4, x0 + w - 10]) {
      g.fillStyle(0x454c5e, 1).fillRect(bx, y + 7, 6, 3);
      g.fillStyle(0x2e3444, 1).fillRect(bx + 2, y + 10, 2, 4);
    }
    g.setAlpha(0);
    this.layer.add(g);
    this.tweens.add({ targets: g, alpha: 1, duration: 300 });
  }

  /** Sprite frame + counter for the current coin count. */
  private showState(h: Holder, open = false): void {
    const n = this.coins[h.place];
    h.count?.setText(`● ${n}`);
    if (!h.sprite) return;
    if (h.place === 'wallet')
      h.sprite.setFrame(open ? WALLET_FRAME.open : n >= 6 ? WALLET_FRAME.fat : WALLET_FRAME.thin);
    else if (h.place === 'savings') h.sprite.setFrame(Math.min(JAR_LEVELS, n));
    else if (!open) {
      h.sprite.anims.stop();
      h.sprite.setFrame(this.outside === 'salary' && this.coins.outside < 0 ? 1 : 0);
    } else if (this.outside === 'scam') h.sprite.play('ex_out_scam');
    else h.sprite.setFrame(1);
  }

  /** A quick squash, as if the container just swallowed or spat a coin. */
  private gulp(h: Holder): void {
    if (!h.sprite) return;
    this.tweens.killTweensOf(h.sprite);
    h.sprite.setScale(SPRITE_SCALE * 1.08, SPRITE_SCALE * 0.9);
    this.tweens.add({
      targets: h.sprite,
      scaleX: SPRITE_SCALE,
      scaleY: SPRITE_SCALE,
      duration: 160,
      ease: 'Back.easeOut',
    });
  }

  private opCoins(s: Op<'coins'>): void {
    if (s.from === s.to) return;
    const src = this.holder(s.from);
    const dst = this.holder(s.to);
    const n = this.coinCount(s);
    const gap = 120;
    const fly = 620;
    // open up: wallet flap lifts (ajar → open), envelope/phone/stall react
    if (src.place === 'wallet' && src.sprite) {
      src.sprite.setFrame(WALLET_FRAME.ajar);
      this.time.delayedCall(90, () => this.showState(src, true));
    } else this.showState(src, true);
    if (dst.place !== 'savings')
      this.time.delayedCall(Math.max(0, fly - 150), () => this.showState(dst, true));
    this.tweens.add({ targets: src.root, y: SHELF_Y - 4, duration: 110, yoyo: true });

    const from = { x: src.x, y: SHELF_Y - MOUTH[src.place] };
    const to = { x: dst.x, y: SHELF_Y - MOUTH[dst.place] };
    for (let i = 0; i < n; i++) {
      this.time.delayedCall(i * gap, () => {
        if (src.place !== 'outside') this.coins[src.place] = Math.max(0, this.coins[src.place] - 1);
        else this.coins.outside -= 1;
        if (src.place !== 'outside') this.showState(src, true);
        this.gulp(src);
        this.flyCoin(from, to, i, () => {
          if (dst.place !== 'outside') this.coins[dst.place] += 1;
          else this.coins.outside += 1;
          this.showState(dst, dst.place !== 'savings');
          this.gulp(dst);
          this.sparkle(to.x, to.y);
          if (i === 0 || i === n - 1 || i % 3 === 0) play('coin');
        });
      });
    }
    const end = (n - 1) * gap + fly + 260;
    this.time.delayedCall(end, () => {
      this.showState(src);
      this.showState(dst);
      this.delta(src, -n);
      this.delta(dst, n);
      if (dst.place === 'outside' && this.outside === 'scam') {
        play('bad');
        this.cameras.main.shake(160, 0.004);
      }
      // an emptied wallet lets a moth out — only when the money left for the outside world
      if (src.place === 'wallet' && dst.place === 'outside' && this.coins.wallet === 0)
        this.moth(src.x, SHELF_Y - 44);
    });
  }

  /** One coin on a spinning arc from → to (quadratic curve, peaks above the higher mouth). */
  private flyCoin(
    from: { x: number; y: number },
    to: { x: number; y: number },
    i: number,
    onLand: () => void,
  ): void {
    const coin = this.textures.exists('ex_coin')
      ? this.add.sprite(from.x, from.y, 'ex_coin', i % 4).setScale(SPRITE_SCALE)
      : this.add.circle(from.x, from.y, 6, COLOR.warn).setStrokeStyle(2, 0x8a5a00);
    if (coin instanceof Phaser.GameObjects.Sprite && this.anims.exists('ex_coin'))
      coin.play('ex_coin');
    this.layer.add(coin);
    const spread = ((i % 5) - 2) * 4;
    const peak = Math.min(from.y, to.y) - 64 - (i % 3) * 8;
    const cx = (from.x + to.x) / 2 + spread;
    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 620,
      ease: 'Sine.easeInOut',
      onUpdate: (tw) => {
        const k = tw.getValue() ?? 1;
        const a = (1 - k) * (1 - k);
        const b = 2 * (1 - k) * k;
        const c = k * k;
        coin.setPosition(a * from.x + b * cx + c * to.x, a * from.y + b * peak + c * to.y);
        coin.setScale(SPRITE_SCALE * (1 + 0.25 * Math.sin(Math.PI * k)));
      },
      onComplete: () => {
        coin.destroy();
        onLand();
      },
    });
  }

  private sparkle(x: number, y: number): void {
    if (!this.textures.exists('ex_poof')) return;
    const p = this.add.sprite(x, y - 4, 'ex_poof', 0).setScale(SPRITE_SCALE);
    this.layer.add(p);
    if (this.anims.exists('ex_poof')) {
      p.play('ex_poof');
      p.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => p.destroy());
    } else this.time.delayedCall(280, () => p.destroy());
  }

  /** "+5" / "−2" floating up from a wallet or jar after a transfer. */
  private delta(h: Holder, n: number): void {
    if (h.place === 'outside') return;
    const tx = text(
      this,
      h.x,
      SHELF_Y - MOUTH[h.place] - 18,
      `${n > 0 ? '+' : '−'}${Math.abs(n)}`,
      'md',
      n > 0 ? COLOR.good : COLOR.bad,
    ).setOrigin(0.5);
    this.layer.add(tx);
    this.tweens.add({
      targets: tx,
      y: tx.y - 26,
      alpha: 0,
      delay: 500,
      duration: 700,
      onComplete: () => tx.destroy(),
    });
  }

  /** An empty wallet lets a moth out. */
  private moth(x: number, y: number): void {
    if (!this.textures.exists('ex_moth')) return;
    const m = this.add.sprite(x, y, 'ex_moth', 0).setScale(SPRITE_SCALE);
    if (this.anims.exists('ex_moth')) m.play('ex_moth');
    this.layer.add(m);
    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 1800,
      onUpdate: (tw) => {
        const k = tw.getValue() ?? 1;
        m.setPosition(x + Math.sin(k * 9) * 14 + k * 30, y - k * 90);
        m.setAlpha(k < 0.7 ? 1 : (1 - k) / 0.3);
      },
      onComplete: () => m.destroy(),
    });
  }

  /**
   * ISSUES #30: compounding as a banyan that grows year by year — the trunk thickens, the
   * canopy spreads, aerial roots drop and become new trunks, coins fill the branches — with a
   * big running value and a small curve underneath that bends upward (growth on growth).
   */
  private opGrow(s: Op<'grow'>, budgetMs: number): void {
    const series = growSeries(s.principal, s.ratePct, s.years);
    const n = series.length;
    const max = series[n - 1] || 1;
    const CX = 180;
    const GROUND = 395;

    const value = text(this, CX, 150, rupees(series[0]), 'lg', COLOR.happy).setOrigin(0.5);
    const caption = text(this, CX, 172, '', 'xs', COLOR.white).setOrigin(0.5);
    const tree = this.add.graphics();
    const curve = this.add.graphics();
    const withLabel = text(this, 0, 0, '', 'xs', COLOR.happy).setOrigin(0, 0.5);
    const withoutLabel = text(this, 0, 0, '', 'xs', COLOR.muted).setOrigin(0, 0.5);
    const legend = text(
      this,
      46,
      GROUND + 12,
      `— ${tr('explainer.with_compounding', 'with compounding')}   ··· ${tr('explainer.without_compounding', 'interest taken out')}`,
      'xs',
      COLOR.muted,
    );
    this.layer.add([tree, curve, value, caption, withLabel, withoutLabel, legend]);

    // ground: soil band + grass lip
    const ground = this.add.graphics();
    ground.fillStyle(0x6d4c41, 1).fillRect(40, GROUND, 280, 10);
    ground.fillStyle(0x66bb6a, 1).fillRect(40, GROUND - 2, 280, 3);
    this.layer.add(ground);

    // a fixed scatter of canopy spots for coins (deterministic, so replays look the same)
    const spots = [
      [-0.55, -0.1],
      [0.5, -0.2],
      [0.05, -0.5],
      [-0.3, 0.2],
      [0.3, 0.15],
      [-0.75, 0.25],
      [0.78, 0.2],
      [-0.15, -0.25],
      [0.25, -0.45],
      [0.6, 0.35],
      [-0.5, 0.4],
      [0.0, 0.05],
    ];
    const blobs: [number, number, number][] = [
      [0, 0, 1],
      [-0.68, 0.12, 0.74],
      [0.68, 0.12, 0.74],
      [-0.38, -0.42, 0.7],
      [0.38, -0.42, 0.7],
      [-1.0, 0.36, 0.52],
      [1.0, 0.36, 0.52],
    ];

    const draw = (v: number, year: number): void => {
      const f = Math.min(1, v / max);
      const trunkH = 46 + 104 * f;
      const trunkW = 8 + 16 * Math.sqrt(f);
      const topY = GROUND - trunkH;
      const R = 26 + 64 * Math.sqrt(f);
      const g = tree.clear();
      // aerial roots: more of them as the years pass; older ones are thicker (they become trunks)
      const roots = Math.floor((year / Math.max(1, n - 1)) * 6);
      for (let r = 0; r < roots; r++) {
        const side = r % 2 ? 1 : -1;
        const x = CX + side * R * (0.38 + 0.11 * Math.floor(r / 2));
        const w = Math.max(2, Math.min(6, 2 + (roots - r)));
        g.fillStyle(0x795548, 1).fillRect(x - w / 2, topY + R * 0.3, w, GROUND - (topY + R * 0.3));
      }
      // trunk with a darker left edge
      g.fillStyle(0x6d4c41, 1).fillRect(CX - trunkW / 2, topY, trunkW, trunkH);
      g.fillStyle(0x4e342e, 1).fillRect(CX - trunkW / 2, topY, Math.max(2, trunkW * 0.3), trunkH);
      // canopy: dark base blobs, then lighter highlights up-left
      for (const [dx, dy, k] of blobs)
        g.fillStyle(0x2e7d32, 1).fillCircle(CX + dx * R, topY + dy * R, R * 0.58 * k);
      for (const [dx, dy, k] of blobs)
        g.fillStyle(0x4caf50, 1).fillCircle(
          CX + dx * R - R * 0.12,
          topY + dy * R - R * 0.14,
          R * 0.36 * k,
        );
      // coins: one more for every doubling-ish step of growth
      const coins = Math.min(
        spots.length,
        Math.max(0, Math.round(Math.log2(Math.max(1, v / series[0])) * 3)),
      );
      for (let c = 0; c < coins; c++) {
        const [sx, sy] = spots[c];
        const x = CX + sx * R;
        const y = topY + sy * R;
        g.fillStyle(0x8a5a00, 1).fillCircle(x + 0.6, y + 0.6, 4);
        g.fillStyle(0xf0b030, 1).fillCircle(x, y, 3.6);
        g.fillStyle(0xffe08a, 1).fillRect(x - 1.5, y - 2, 1.5, 1.5);
      }
      // the growth curve so far (bends upward = growth on growth) against a dashed straight line
      // for the same money without compounding (interest taken out every year)
      const cw = 230;
      const ch = 44;
      const cx0 = 46;
      const cy0 = GROUND + 60;
      const xAt = (t: number): number => cx0 + (t / Math.max(1, n - 1)) * cw;
      const yAt = (v2: number): number => cy0 - (v2 / max) * ch;
      const simple = (t: number): number => series[0] * (1 + (s.ratePct / 100) * t);
      const k = curve.clear();
      k.lineStyle(1, COLOR.muted, 1).lineBetween(cx0, cy0, cx0 + cw, cy0);
      k.fillStyle(COLOR.muted, 1);
      for (let t = 0; t < year; t += 0.5) k.fillRect(xAt(t), yAt(simple(t)) - 1, 3, 2);
      k.lineStyle(2, COLOR.happy, 1).beginPath();
      for (let t = 0; t <= year; t++) {
        if (t === 0) k.moveTo(xAt(t), yAt(series[t]));
        else k.lineTo(xAt(t), yAt(series[t]));
      }
      k.strokePath();
      withLabel.setPosition(xAt(year) + 4, yAt(series[year])).setText(rupees(v));
      withoutLabel
        .setPosition(xAt(year) + 4, yAt(simple(year)) + 2)
        .setText(rupees(Math.round(simple(year))));
      value.setText(rupees(v));
      caption.setText(`${s.label} · ${tr('explainer.year', 'year {n}', { n: year })}`);
    };

    draw(series[0], 0);
    const per = Math.max(30, (budgetMs * 0.9) / n);
    series.forEach((v, year) => {
      if (year === 0) return;
      this.time.delayedCall(year * per, () => {
        draw(v, year);
        if (year === n - 1)
          this.tweens.add({ targets: value, scale: 1.15, yoyo: true, duration: 220 });
      });
    });
  }

  private opSplit(s: Op<'split'>): void {
    const x = 30;
    const y = 240;
    const w = 300;
    const widths = splitWidths(
      s.parts.map((p) => p.pct),
      w,
    );
    let cx = x;
    s.parts.forEach((p, i) => {
      const r = this.add.rectangle(cx, y, 0, 40, parseColor(p.color, i)).setOrigin(0, 0);
      this.layer.add(r);
      this.tweens.add({
        targets: r,
        width: widths[i],
        duration: 700,
        delay: i * 250,
        ease: 'Cubic.easeOut',
      });
      const lx = cx + widths[i] / 2;
      const lab = text(
        this,
        lx,
        y + 52 + (i % 2) * 16,
        `${p.label} ${p.pct}%`,
        'xs',
        parseColor(p.color, i),
      )
        .setOrigin(0.5, 0)
        .setAlpha(0);
      this.layer.add(lab);
      this.tweens.add({ targets: lab, alpha: 1, delay: 300 + i * 250, duration: 300 });
      cx += widths[i];
    });
  }
}
