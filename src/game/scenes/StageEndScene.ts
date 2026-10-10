// "n years later…": the persona's line for the next stage, then each investment's value
// before → after with a sparkline of its seeded yearly returns, and the income note.
import Phaser from 'phaser';
import { getSession } from '@/app/session';
import { rupees, t } from '@/shared/i18n';
import type { AssetId, Portfolio, Stage, Step } from '@/shared/types';
import { proceed } from '../flow/Driver';
import { Button } from '../ui/Button';
import { PixelPanel } from '../ui/PixelPanel';
import { COLOR, text, tr } from '../ui/theme';
import { VIEW } from '../view';

type StageEnd = Extract<Step, { kind: 'stage_end' }>;
const total = (p: Portfolio): number => Object.values(p).reduce<number>((a, b) => a + (b ?? 0), 0);
const ASSETS: AssetId[] = ['cashbox', 'banyan', 'chai', 'mango'];

export class StageEndScene extends Phaser.Scene {
  private step!: StageEnd;

  constructor() {
    super('StageEnd');
  }

  init(data: { step: Step }): void {
    this.step = data.step as StageEnd;
  }

  create(): void {
    const s = getSession();
    const game = s.game;
    if (!game || this.step?.kind !== 'stage_end') {
      proceed(this);
      return;
    }
    const { width: W } = VIEW;
    this.cameras.main.setBackgroundColor(COLOR.bg);
    this.cameras.main.fadeIn(600);
    const st = this.step;
    const nextStage = Math.min(3, st.stage + 1) as Stage;
    const persona = s.content.personas.find((p) => p.id === game.state.profile.persona);

    text(
      this,
      W / 2,
      50,
      tr('stage_end.years_later', '{n} years later…', { n: st.yearsSkipped }),
      'lg',
      COLOR.white,
      {
        align: 'center',
      },
    ).setOrigin(0.5);
    let y = 84;
    if (st.stage < 3) {
      text(this, W / 2, y, t(`stage.${nextStage}`), 'md', COLOR.accent).setOrigin(0.5, 0);
      y += 28;
      if (persona) {
        const intro = text(this, W / 2, y, persona.stageIntro[nextStage], 'sm', COLOR.white, {
          align: 'center',
          wordWrap: { width: W - 48, useAdvancedWrap: true },
        }).setOrigin(0.5, 0);
        y += intro.height + 10;
      }
      const note = text(
        this,
        W / 2,
        y,
        tr('stage_end.income_note', 'New stage, new income. Prices and pay change too.'),
        'xs',
        COLOR.muted,
        {
          align: 'center',
          wordWrap: { width: W - 48, useAdvancedWrap: true },
        },
      ).setOrigin(0.5, 0);
      y += note.height + 6;
    }
    this.add
      .image(W / 2, y + 70, game.state.profile.avatar)
      .setOrigin(0.5, 1)
      .setScale(4);
    y += 84;

    const held = ASSETS.filter(
      (id) => (st.portfolioBefore[id] ?? 0) > 0 || (st.portfolioAfter[id] ?? 0) > 0,
    );
    if (held.length) {
      const rowH = 44;
      const p = new PixelPanel(this, 14, y, W - 28, 40 + held.length * rowH);
      p.add(text(this, 12, 10, tr('stage_end.portfolio', 'Your investments'), 'sm', COLOR.aunty));
      held.forEach((id, i) => {
        const ry = 36 + i * rowH;
        const before = st.portfolioBefore[id] ?? 0;
        const after = st.portfolioAfter[id] ?? 0;
        const name = s.content.assets.find((a) => a.id === id)?.name ?? id;
        p.add(text(this, 12, ry, name, 'xs', COLOR.ink));
        p.add(
          text(
            this,
            12,
            ry + 16,
            `${rupees(before)} → ${rupees(after)}`,
            'sm',
            after >= before ? COLOR.good : COLOR.bad,
          ),
        );
        p.add(this.sparkline(W - 150, ry + 4, 110, 30, st.yearlyReturns[id] ?? []));
      });
      const tb = total(st.portfolioBefore);
      const ta = total(st.portfolioAfter);
      text(
        this,
        W / 2,
        y + 48 + held.length * rowH,
        `${rupees(tb)} → ${rupees(ta)}`,
        'md',
        ta >= tb ? COLOR.good : COLOR.bad,
      ).setOrigin(0.5, 0);
      text(
        this,
        W / 2,
        y + 74 + held.length * rowH,
        tr('stage_end.assumption', 'Made-up assets. Simulated, not a promise.'),
        'xs',
        COLOR.muted,
      ).setOrigin(0.5, 0);
    }
    new Button(this, W / 2, 596, t('btn.next'), () => proceed(this), { fill: COLOR.good });
  }

  /** Cumulative value line from yearly % returns; red years dip. */
  private sparkline(
    x: number,
    y: number,
    w: number,
    h: number,
    returns: number[],
  ): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    g.fillStyle(0xe8e4d8, 1).fillRect(x, y, w, h);
    if (!returns.length) return g;
    const pts = [1];
    for (const r of returns) pts.push(pts[pts.length - 1] * (1 + r / 100));
    const lo = Math.min(...pts);
    const hi = Math.max(...pts);
    const span = hi - lo || 1;
    const px = (i: number): number => x + 3 + (i * (w - 6)) / (pts.length - 1);
    const py = (v: number): number => y + h - 3 - ((v - lo) / span) * (h - 6);
    const up = pts[pts.length - 1] >= 1;
    g.lineStyle(2, up ? COLOR.good : COLOR.bad, 1);
    g.beginPath();
    pts.forEach((v, i) => (i ? g.lineTo(px(i), py(v)) : g.moveTo(px(i), py(v))));
    g.strokePath();
    g.lineStyle(1, 0x9aa0aa, 0.8).lineBetween(x + 3, py(1), x + w - 3, py(1));
    return g;
  }
}
