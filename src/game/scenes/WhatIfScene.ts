// "What if…?": the single biggest mistake, replayed with the best choice (engine re-simulates
// from the same seed). Shown in-game only, never emailed (CONTEXT.md §2.12).
import Phaser from 'phaser';
import { getSession } from '@/app/session';
import { rupees, t } from '@/shared/i18n';
import type { Bars } from '@/shared/types';
import { proceed } from '../flow/Driver';
import { Button } from '../ui/Button';
import { PixelPanel } from '../ui/PixelPanel';
import { COLOR, text, tr } from '../ui/theme';
import { overMap } from '../flow/journeyState';
import { fromBottom, VIEW } from '../view';

export class WhatIfScene extends Phaser.Scene {
  constructor() {
    super('WhatIf');
  }

  create(): void {
    const s = getSession();
    const game = s.game;
    const w = game?.whatIf() ?? null;
    if (!game || !w) {
      proceed(this);
      return;
    }
    const { width: W } = VIEW;
    overMap(this, 0.78, false);
    this.cameras.main.fadeIn(500);

    const item =
      s.content.tasks.find((x) => x.id === w.entry.taskId) ??
      s.content.events.find((x) => x.id === w.entry.taskId);
    const framing = item
      ? (item.framings[game.state.profile.persona] ?? item.framings.default)
      : undefined;

    text(this, W / 2, 34, tr('whatif.title', 'What if…?'), 'lg', COLOR.white).setOrigin(0.5);
    if (framing) {
      const p = new PixelPanel(this, 14, 62, W - 28, 92);
      p.add(text(this, 12, 10, framing.title, 'sm', COLOR.aunty));
      p.add(
        text(this, 12, 32, framing.text, 'xs', COLOR.ink, {
          wordWrap: { width: W - 52, useAdvancedWrap: true },
          maxLines: 3,
        }),
      );
    }

    const colW = (W - 40) / 2;
    this.column(
      14,
      168,
      colW,
      tr('whatif.you_chose', 'You chose: {choice}', { choice: w.actualChoice.text }),
      w.actualEnd,
      w.actualPortfolioTotal,
      'red',
    );
    this.column(
      26 + colW,
      168,
      colW,
      tr('whatif.alt', 'If you had chosen: {choice}', { choice: w.altChoice.text }),
      w.altEnd,
      w.altPortfolioTotal,
      'green',
    );

    const diff =
      w.altEnd.wallet +
      w.altEnd.savings +
      w.altPortfolioTotal -
      (w.actualEnd.wallet + w.actualEnd.savings + w.actualPortfolioTotal);
    if (diff > 0)
      text(this, W / 2, fromBottom(470), `+${rupees(diff)}`, 'xl', COLOR.good).setOrigin(0.5);
    text(
      this,
      W / 2,
      fromBottom(510),
      tr('whatif.private', 'Not sent to anyone. This is just for you.'),
      'xs',
      COLOR.muted,
      {
        align: 'center',
        wordWrap: { width: W - 40 },
      },
    ).setOrigin(0.5);
    new Button(this, W / 2, fromBottom(596), t('btn.next'), () => proceed(this), {
      fill: COLOR.good,
    });
  }

  private column(
    x: number,
    y: number,
    w: number,
    heading: string,
    end: Bars,
    portfolio: number,
    variant: 'red' | 'green',
  ): void {
    const p = new PixelPanel(this, x, y, w, 270, { variant });
    p.add(
      text(this, 10, 10, heading, 'sm', COLOR.ink, {
        wordWrap: { width: w - 20, useAdvancedWrap: true },
        maxLines: 3,
      }),
    );
    const rows: [string, string][] = [
      [t('hud.wallet'), rupees(end.wallet)],
      [t('hud.savings'), rupees(end.savings)],
      [tr('info.portfolio', 'Investments'), rupees(portfolio)],
      [t('hud.happiness'), String(Math.round(end.happiness))],
    ];
    rows.forEach(([k, v], i) => {
      p.add(text(this, 10, 76 + i * 46, k, 'xs', COLOR.muted));
      p.add(text(this, 10, 92 + i * 46, v, 'md', COLOR.ink));
    });
  }
}
