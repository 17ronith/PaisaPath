// Overlay opened from the HUD's INFO button (PLAYTEST-01 #11 redesign, by Monish for Saharsh):
// four cards — Money · Commitments · Learning · Mini-games — so a student can find one thing
// without reading everything. Read-only; never touches the engine beyond status().
import Phaser from 'phaser';
import { getSession } from '@/app/session';
import { rupees, t } from '@/shared/i18n';
import type { Portfolio } from '@/shared/types';
import { Bar } from '../ui/Bar';
import { Button } from '../ui/Button';
import { PixelPanel } from '../ui/PixelPanel';
import { COLOR, text, tr } from '../ui/theme';
import { VIEW } from '../view';

const total = (p: Portfolio): number => Object.values(p).reduce<number>((a, b) => a + (b ?? 0), 0);
const PAD = 12;

export class InfoPanelScene extends Phaser.Scene {
  constructor() {
    super('InfoPanel');
  }

  create(): void {
    const game = getSession().game;
    const { width: W, height: H } = VIEW;
    this.add.rectangle(0, 0, W, H, 0x000000, 0.65).setOrigin(0).setInteractive();
    if (!game) {
      this.scene.stop();
      return;
    }
    const st = game.status();
    const inner = W - PAD * 2;

    // Title row
    text(this, PAD + 2, 14, tr('info.title', 'Your status'), 'lg', COLOR.white);
    text(
      this,
      W - PAD - 2,
      18,
      `${t('hud.stage', { n: st.stage })} · ${t('hud.month', { n: st.chapter })}`,
      'xs',
      COLOR.accent,
    ).setOrigin(1, 0);

    let y = 44;
    const card = (
      icon: string,
      title: string,
      h: number,
      variant: 'card' | 'blue' | 'green' | 'red',
      fill: (p: PixelPanel, w: number) => void,
    ): void => {
      const p = new PixelPanel(this, PAD, y, inner, h, { variant });
      p.add(text(this, 12, 8, `${icon} ${title}`, 'sm', COLOR.ink));
      fill(p, inner);
      y += h + 8;
    };

    // 1 · Money — three numbers and the happiness bar
    card('💰', tr('info.card.money', 'Money'), 118, 'card', (p, w) => {
      const col = (x: number, k: string, v: string, c: number): void => {
        p.add(text(this, x, 34, k, 'xs', COLOR.muted));
        p.add(text(this, x, 50, v, 'md', c));
      };
      const third = (w - 24) / 3;
      col(
        12,
        t('hud.wallet'),
        rupees(st.bars.wallet),
        st.bars.wallet < 0 ? COLOR.bad : COLOR.money,
      );
      col(12 + third, t('hud.savings'), rupees(st.bars.savings), COLOR.ink);
      const inv = total(st.portfolio);
      col(
        12 + third * 2,
        tr('info.portfolio', 'Investments'),
        inv > 0 ? rupees(inv) : '—',
        COLOR.ink,
      );
      const bar = new Bar(
        this,
        12,
        86,
        { label: t('hud.happiness'), max: 100, color: COLOR.happy, width: w - 24 },
        st.bars.happiness,
      );
      p.add(bar);
    });

    // 2 · Commitments — EMIs and money lent
    const commit = st.commitments.map(
      (c) =>
        `• ${c.label}: ${tr('info.per_month', '{amount} a month · {n} left', { amount: rupees(c.perChapter), n: c.remaining })}`,
    );
    if (st.lentOut > 0)
      commit.push(`• ${tr('info.lent_out', 'Money lent out')}: ${rupees(st.lentOut)}`);
    const commitH = 40 + Math.max(1, commit.length) * 18;
    card('📅', tr('info.commitments', 'Commitments'), commitH, 'blue', (p, w) => {
      p.add(
        text(
          this,
          12,
          32,
          commit.length ? commit.join('\n') : tr('info.none', 'Nothing yet'),
          'xs',
          commit.length ? COLOR.ink : COLOR.muted,
          { wordWrap: { width: w - 24, useAdvancedWrap: true } },
        ),
      );
    });

    // 3 · Learning — still-learning (red) and learned (green) side by side
    const open = st.mistakes.map((c) => c.name);
    const done = st.learned.map((c) => `${c.name} ✓`);
    const learnH = 48 + Math.max(1, open.length, done.length) * 18;
    card('📚', tr('info.card.learning', 'Learning'), Math.min(learnH, 170), 'card', (p, w) => {
      const half = (w - 36) / 2;
      p.add(text(this, 12, 32, tr('info.mistakes', 'Still learning'), 'xs', COLOR.bad));
      p.add(
        text(
          this,
          12,
          48,
          open.length ? open.map((s) => `• ${s}`).join('\n') : tr('info.none', 'Nothing yet'),
          'xs',
          open.length ? COLOR.ink : COLOR.muted,
          {
            wordWrap: { width: half, useAdvancedWrap: true },
          },
        ),
      );
      p.add(text(this, 24 + half, 32, tr('info.learned', 'Learned'), 'xs', COLOR.good));
      p.add(
        text(
          this,
          24 + half,
          48,
          done.length ? done.map((s) => `• ${s}`).join('\n') : tr('info.none', 'Nothing yet'),
          'xs',
          done.length ? COLOR.ink : COLOR.muted,
          {
            wordWrap: { width: half, useAdvancedWrap: true },
          },
        ),
      );
    });

    // 4 · Mini-games — open or locked, and why
    card(
      '🎮',
      tr('info.card.minigames', 'Mini-games'),
      62,
      st.minigamesLocked ? 'red' : 'green',
      (p, w) => {
        p.add(
          text(
            this,
            12,
            32,
            st.minigamesLocked
              ? `${tr('info.minigames_locked', 'Mini-games: locked')}${st.lockReason ? ` — ${st.lockReason}` : ''}`
              : tr('info.minigames_open', 'Mini-games: open'),
            'xs',
            st.minigamesLocked ? COLOR.bad : COLOR.good,
            { wordWrap: { width: w - 24, useAdvancedWrap: true } },
          ),
        );
      },
    );

    new Button(
      this,
      W / 2,
      Math.min(H - 40, y + 20),
      tr('btn.close', 'CLOSE'),
      () => this.scene.stop(),
      {
        fill: 0x505878,
        height: 50,
      },
    );
  }
}
