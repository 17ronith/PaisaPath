// Vertical node path: 10 chapters in 3 stage bands, current node pulsing, detours as side
// nodes (team sketch: blue = main path, dashed = detours). The bottom card is the
// chapter_start toast: income, fired scheduled effects, happiness decay.
import Phaser from 'phaser';
import { getSession } from '@/app/session';
import { rupees, t } from '@/shared/i18n';
import type { Stage, Step } from '@/shared/types';
import { proceed } from '../flow/Driver';
import { Button } from '../ui/Button';
import { PixelPanel } from '../ui/PixelPanel';
import { COLOR, text, tr } from '../ui/theme';

type ChapterStart = Extract<Step, { kind: 'chapter_start' }>;

const CHAPTERS = 10;
const STAGE_RANGES: Record<Stage, [number, number]> = { 1: [1, 4], 2: [5, 7], 3: [8, 10] };
const BAND_COLOURS: Record<Stage, number> = { 1: 0x24304a, 2: 0x2a3a3a, 3: 0x3a2f44 };
const MAP_TOP = 56;
const MAP_BOTTOM = 420;
/** Path runs right of centre so stage labels fit on the left. */
const PATH_X = (W: number): number => W / 2 + 50;

export class ChapterMapScene extends Phaser.Scene {
  private step?: ChapterStart;

  constructor() {
    super('ChapterMap');
  }

  init(data: { step?: Step }): void {
    this.step = data.step?.kind === 'chapter_start' ? data.step : undefined;
  }

  private nodePos(ch: number): { x: number; y: number } {
    const W = this.scale.width;
    const span = (MAP_BOTTOM - MAP_TOP - 20) / (CHAPTERS - 1);
    const y = MAP_BOTTOM - 10 - (ch - 1) * span;
    const x = PATH_X(W) + (ch % 2 === 0 ? 50 : -50) * (ch % 4 < 2 ? 1 : 0.4);
    return { x, y };
  }

  create(): void {
    const game = getSession().game;
    if (!game) {
      this.scene.start('Title');
      return;
    }
    const { width: W } = this.scale;
    this.cameras.main.setBackgroundColor(COLOR.bg);
    const current = this.step?.chapter ?? game.state.chapter;

    // Stage bands
    const g = this.add.graphics();
    ([1, 2, 3] as Stage[]).forEach((st) => {
      const [a, b] = STAGE_RANGES[st];
      const top = this.nodePos(b).y - 18;
      const bottom = this.nodePos(a).y + 18;
      g.fillStyle(BAND_COLOURS[st]).fillRect(0, top, W, bottom - top);
      text(
        this,
        8,
        top + 6,
        tr(`stage.${st}`, `Stage ${st}`).toUpperCase(),
        'xs',
        COLOR.accent,
      ).setAlpha(0.8);
    });

    // Path
    for (let ch = 1; ch < CHAPTERS; ch++) {
      const p = this.nodePos(ch);
      const q = this.nodePos(ch + 1);
      g.lineStyle(4, ch < current ? 0x4fa3ff : 0x50607a).lineBetween(p.x, p.y, q.x, q.y);
    }

    // Detours taken, as dashed side nodes off the chapter where they happened
    const detourChapters = new Set(game.state.log.filter((e) => e.isDetour).map((e) => e.chapter));
    detourChapters.forEach((ch) => {
      const p = this.nodePos(ch);
      const side = p.x < PATH_X(W) ? -1 : 1;
      const dx = p.x + side * 60;
      for (let k = 0; k < 6; k++) {
        const t0 = k / 6;
        if (k % 2 === 0)
          g.lineStyle(2, COLOR.muted).lineBetween(
            p.x + (dx - p.x) * t0,
            p.y - 10 * t0,
            p.x + (dx - p.x) * (t0 + 1 / 6),
            p.y - 10 * (t0 + 1 / 6),
          );
      }
      g.fillStyle(COLOR.warn).fillCircle(dx, p.y - 10, 6);
    });

    // Nodes
    for (let ch = 1; ch <= CHAPTERS; ch++) {
      const { x, y } = this.nodePos(ch);
      const done = ch < current;
      const isNow = ch === current;
      const node = this.add
        .circle(x, y, isNow ? 14 : 11, done ? 0x4fa3ff : isNow ? COLOR.warn : 0x303850)
        .setStrokeStyle(3, isNow ? COLOR.white : COLOR.panelEdge);
      text(this, x, y, String(ch), 'xs', done || isNow ? COLOR.ink : COLOR.muted).setOrigin(0.5);
      if (isNow) {
        this.tweens.add({ targets: node, scale: 1.25, yoyo: true, repeat: -1, duration: 600 });
        this.add
          .image(x + (x < PATH_X(W) ? -30 : 30), y - 6, game.state.profile.avatar)
          .setScale(2);
        node.setInteractive({ useHandCursor: true }).on('pointerup', () => proceed(this));
      }
    }

    this.card(current, game.state.profile.persona);
  }

  private card(chapter: number, persona: string): void {
    const { width: W } = this.scale;
    const st = this.step;
    const panel = new PixelPanel(this, 12, 432, W - 24, 140);
    const stage = (st?.stage ?? getSession().game?.state.stage ?? 1) as Stage;
    panel.add(
      text(
        this,
        12,
        12,
        `${t('hud.month', { n: chapter })} · ${tr(`stage.${stage}`, `Stage ${stage}`)}`,
        'xs',
        COLOR.aunty,
      ),
    );
    const lines: string[] = [];
    if (st) {
      lines.push(`+${rupees(st.incomeCoins)}  ${tr(`chapter.income.${persona}`, 'Money arrived')}`);
      for (const e of st.fired) lines.push(`• ${e.label}`);
      if (st.happinessDecay)
        lines.push(`${tr('hud.happiness', 'HAPPY')} −${Math.abs(st.happinessDecay)}`);
    }
    panel.add(
      text(
        this,
        12,
        34,
        lines.join('\n') || tr('map.tap_node', 'Tap the glowing stop to begin.'),
        'xs',
        COLOR.ink,
        {
          wordWrap: { width: W - 56, useAdvancedWrap: true },
        },
      ),
    );
    new Button(this, W / 2, 604, tr('map.go', 'GO ▸'), () => proceed(this), { fill: COLOR.good });
  }
}
