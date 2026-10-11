// Overlay opened from the HUD's REPLAY button: every explainer animation the player has
// unlocked, grouped by pillar. Tapping one plays it in the Explainer overlay on top.
import Phaser from 'phaser';
import { getSession } from '@/app/session';
import type { Explainer, Pillar } from '@/shared/types';
import { Button } from '../ui/Button';
import { PixelPanel } from '../ui/PixelPanel';
import { COLOR, text, tr } from '../ui/theme';
import { fromBottom, VIEW } from '../view';

const PILLARS: Pillar[] = ['budget', 'save', 'invest', 'safety'];
const PILLAR_FILL: Record<Pillar, number> = {
  budget: COLOR.button,
  save: COLOR.good,
  invest: COLOR.warn,
  safety: COLOR.bad,
};

export class ReplayLibraryScene extends Phaser.Scene {
  constructor() {
    super('ReplayLibrary');
  }

  create(): void {
    const s = getSession();
    const game = s.game;
    const { width: W, height: H } = VIEW;
    this.add.rectangle(0, 0, W, H, 0x000000, 0.6).setOrigin(0).setInteractive();
    const p = new PixelPanel(this, 12, 44, W - 24, fromBottom(500));
    p.add(text(this, 14, 12, tr('replay.title', 'Replay library'), 'md', COLOR.ink));

    const seen = new Set(game?.state.seenExplainers ?? []);
    const pillarOf = (x: Explainer): Pillar =>
      s.content.concepts.find((c) => c.id === x.concept)?.pillar ?? 'budget';
    const list = s.content.explainers.filter((x) => seen.has(x.id));

    if (!list.length) {
      p.add(
        text(
          this,
          14,
          48,
          tr('replay.empty', 'Finish a task to unlock its animation here.'),
          'sm',
          COLOR.muted,
          {
            wordWrap: { width: W - 60, useAdvancedWrap: true },
          },
        ),
      );
    }
    let y = 92;
    for (const pillar of PILLARS) {
      const items = list.filter((x) => pillarOf(x) === pillar);
      if (!items.length) continue;
      text(this, 26, y, tr(`pillar.${pillar}`, pillar), 'xs', COLOR.muted);
      y += 22;
      for (const x of items) {
        if (y > fromBottom(520)) break;
        new Button(this, W / 2, y + 20, x.title, () => this.play(x.id), {
          width: W - 52,
          height: 42,
          size: 'sm',
          fill: PILLAR_FILL[pillar],
          align: 'left',
        });
        y += 48;
      }
      y += 6;
    }

    new Button(this, W / 2, fromBottom(586), tr('btn.close', 'CLOSE'), () => this.scene.stop(), {
      fill: 0x505878,
      height: 50,
    });
  }

  private play(explainerId: string): void {
    this.scene.pause();
    this.scene.launch('Explainer', { explainerId, onDone: () => this.scene.resume() });
    this.scene.bringToTop('Explainer');
  }
}
