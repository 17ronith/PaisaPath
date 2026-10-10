// Overlay opened from the HUD's INFO button: everything about "where am I" in one place —
// bars, commitments (EMIs), money lent, still-learning vs learned concepts, mini-game lock,
// investments. Read-only; never touches the engine beyond status().
import Phaser from 'phaser';
import { getSession } from '@/app/session';
import { rupees, t } from '@/shared/i18n';
import type { Portfolio } from '@/shared/types';
import { Button } from '../ui/Button';
import { PixelPanel } from '../ui/PixelPanel';
import { COLOR, text, tr } from '../ui/theme';
import { VIEW } from '../view';

const total = (p: Portfolio): number => Object.values(p).reduce<number>((a, b) => a + (b ?? 0), 0);

export class InfoPanelScene extends Phaser.Scene {
  constructor() {
    super('InfoPanel');
  }

  create(): void {
    const game = getSession().game;
    const { width: W, height: H } = VIEW;
    this.add.rectangle(0, 0, W, H, 0x000000, 0.6).setOrigin(0).setInteractive();
    if (!game) {
      this.scene.stop();
      return;
    }
    const st = game.status();
    const p = new PixelPanel(this, 12, 44, W - 24, 500);
    let y = 12;
    const add = (o: Phaser.GameObjects.Text): void => {
      p.add(o);
      y += o.height + 6;
    };
    const head = (s: string): void => add(text(this, 14, y + 4, s, 'sm', COLOR.aunty));
    const row = (k: string, v: string, color: number = COLOR.ink): void => {
      p.add(text(this, 14, y, k, 'xs', COLOR.muted));
      add(text(this, W - 52, y, v, 'sm', color).setOrigin(1, 0));
    };
    const chips = (items: string[], color: number): void => {
      add(
        text(
          this,
          14,
          y,
          items.length ? items.map((i) => `• ${i}`).join('\n') : tr('info.none', 'Nothing yet'),
          'xs',
          items.length ? color : COLOR.muted,
          {
            wordWrap: { width: W - 60, useAdvancedWrap: true },
          },
        ),
      );
    };

    add(text(this, 14, y, tr('info.title', 'Your status'), 'md', COLOR.ink));
    p.add(
      text(
        this,
        W - 52,
        16,
        `${t('hud.stage', { n: st.stage })} · ${t('hud.month', { n: st.chapter })}`,
        'xs',
        COLOR.muted,
      ).setOrigin(1, 0),
    );
    row(t('hud.wallet'), rupees(st.bars.wallet), st.bars.wallet < 0 ? COLOR.bad : COLOR.ink);
    row(t('hud.savings'), rupees(st.bars.savings));
    row(t('hud.happiness'), `${Math.round(st.bars.happiness)}/100`);
    const inv = total(st.portfolio);
    if (inv > 0) row(tr('info.portfolio', 'Investments'), rupees(inv));

    head(tr('info.commitments', 'Commitments'));
    chips(
      st.commitments.map(
        (c) =>
          `${c.label}: ${tr('info.per_month', '{amount} a month · {n} left', { amount: rupees(c.perChapter), n: c.remaining })}`,
      ),
      COLOR.ink,
    );
    if (st.lentOut > 0) row(tr('info.lent_out', 'Money lent out'), rupees(st.lentOut));

    head(tr('info.mistakes', 'Still learning'));
    chips(
      st.mistakes.map((c) => c.name),
      COLOR.bad,
    );
    head(tr('info.learned', 'Learned'));
    chips(
      st.learned.map((c) => `${c.name} ✓`),
      COLOR.good,
    );

    y += 4;
    add(
      text(
        this,
        14,
        y,
        st.minigamesLocked
          ? `${tr('info.minigames_locked', 'Mini-games: locked')}${st.lockReason ? ` — ${st.lockReason}` : ''}`
          : tr('info.minigames_open', 'Mini-games: open'),
        'xs',
        st.minigamesLocked ? COLOR.bad : COLOR.good,
        { wordWrap: { width: W - 60, useAdvancedWrap: true } },
      ),
    );

    new Button(this, W / 2, 586, tr('btn.close', 'CLOSE'), () => this.scene.stop(), {
      fill: 0x505878,
      height: 50,
    });
  }
}
