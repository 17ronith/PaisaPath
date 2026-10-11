// Plays an Explainer from the content pack: the 6-op animation DSL (CONTRACTS §1).
// Shapes + on-screen text only, so translating = swapping text. Launched as an overlay
// with data { explainerId, onDone }; stops itself and then calls onDone exactly once.
import Phaser from 'phaser';
import { getSession } from '@/app/session';
import { rupees, t } from '@/shared/i18n';
import type { Explainer, ExplainerStep } from '@/shared/types';
import { growSeries, splitWidths, timeUntilNext } from '../logic/display';
import { Button } from '../ui/Button';
import { COLOR, text, tr, type TextSize } from '../ui/theme';
import { VIEW } from '../view';
import { sayAfter, stopVoice } from '../voice';

interface ExplainerData {
  explainerId: string;
  onDone?: () => void;
}

type Op<K extends ExplainerStep['op']> = Extract<ExplainerStep, { op: K }>;

const SLOT_Y = { top: 120, mid: 300, bottom: 480 } as const;
const SIZE: Record<'sm' | 'md' | 'lg', TextSize> = { sm: 'sm', md: 'md', lg: 'lg' };
const ANCHORS = {
  wallet: { x: 70, y: 400 },
  savings: { x: 290, y: 400 },
  outside: { x: 180, y: 540 },
};
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
  private anchorsDrawn = new Set<string>();
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
    this.anchorsDrawn = new Set();
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
        this.anchorsDrawn.clear();
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

  private anchor(k: keyof typeof ANCHORS): void {
    if (this.anchorsDrawn.has(k)) return;
    this.anchorsDrawn.add(k);
    const a = ANCHORS[k];
    const label = k === 'wallet' ? t('hud.wallet') : k === 'savings' ? t('hud.savings') : '';
    this.layer.add(this.add.rectangle(a.x, a.y, 56, 40, 0x303850).setStrokeStyle(2, COLOR.accent));
    if (label) this.layer.add(text(this, a.x, a.y + 30, label, 'xs', COLOR.accent).setOrigin(0.5));
  }

  private opCoins(s: Op<'coins'>): void {
    this.anchor(s.from);
    this.anchor(s.to);
    const from = ANCHORS[s.from];
    const to = ANCHORS[s.to];
    const n = Math.max(1, Math.min(20, s.count));
    for (let i = 0; i < n; i++) {
      const c = this.add.circle(from.x, from.y, 6, COLOR.warn).setStrokeStyle(2, 0x8a5a00);
      this.layer.add(c);
      this.tweens.add({
        targets: c,
        x: to.x + Phaser.Math.Between(-14, 14),
        y: to.y + Phaser.Math.Between(-10, 10),
        delay: i * 90,
        duration: 600,
        ease: 'Quad.easeInOut',
      });
    }
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
