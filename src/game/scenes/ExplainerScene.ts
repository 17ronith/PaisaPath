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

  private opGrow(s: Op<'grow'>, budgetMs: number): void {
    const series = growSeries(s.principal, s.ratePct, s.years);
    const n = series.length;
    const left = 30;
    const base = 360;
    const maxH = 170;
    const colW = Math.max(3, Math.floor(300 / n) - 1);
    const max = series[n - 1] || 1;
    const label = text(this, left, base + 10, '', 'xs', COLOR.white);
    this.layer.add(label);
    this.layer.add(this.add.rectangle(left, base, 300, 2, COLOR.muted).setOrigin(0, 0));
    const per = Math.max(30, (budgetMs * 0.9) / n);
    series.forEach((v, year) => {
      this.time.delayedCall(year * per, () => {
        const h = Math.max(2, Math.round((v / max) * maxH));
        const col = this.add
          .rectangle(left + year * (colW + 1), base, colW, h, year === 0 ? COLOR.money : COLOR.good)
          .setOrigin(0, 1);
        this.layer.add(col);
        label.setText(
          `${s.label}: ${rupees(v)} · ${tr('explainer.year', 'year {n}', { n: year })}`,
        );
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
