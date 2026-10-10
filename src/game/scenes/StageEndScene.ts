// "n years later…": persona's intro line for the next stage + portfolio before → after.
// Phase 1 keeps it to text; Phase 2 adds per-asset bars and sparklines.
import Phaser from 'phaser';
import { getSession } from '@/app/session';
import { rupees, t } from '@/shared/i18n';
import type { Portfolio, Stage, Step } from '@/shared/types';
import { proceed } from '../flow/Driver';
import { Button } from '../ui/Button';
import { PixelPanel } from '../ui/PixelPanel';
import { COLOR, text, tr } from '../ui/theme';
import { VIEW } from '../view';

type StageEnd = Extract<Step, { kind: 'stage_end' }>;
const total = (p: Portfolio): number => Object.values(p).reduce<number>((a, b) => a + (b ?? 0), 0);

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
      110,
      tr('stage_end.years', '{n} years later…', { n: st.yearsSkipped }),
      'lg',
      COLOR.white,
      {
        align: 'center',
      },
    ).setOrigin(0.5);
    if (st.stage < 3) {
      text(this, W / 2, 160, t(`stage.${nextStage}`), 'sm', COLOR.accent).setOrigin(0.5);
      if (persona)
        text(this, W / 2, 230, persona.stageIntro[nextStage], 'xs', COLOR.white, {
          align: 'center',
          wordWrap: { width: W - 48, useAdvancedWrap: true },
        }).setOrigin(0.5);
    }
    this.add.image(W / 2, 320, game.state.profile.avatar).setScale(5);

    const before = total(st.portfolioBefore);
    const after = total(st.portfolioAfter);
    if (before > 0 || after > 0) {
      const p = new PixelPanel(this, 24, 390, W - 48, 90);
      p.add(text(this, 12, 12, tr('stage_end.portfolio', 'Your investments'), 'xs', COLOR.aunty));
      p.add(
        text(
          this,
          12,
          36,
          `${rupees(before)} → ${rupees(after)}`,
          'md',
          after >= before ? COLOR.good : COLOR.bad,
        ),
      );
      p.add(
        text(
          this,
          12,
          64,
          tr('stage_end.assumption', 'Simulated. Not a promise.'),
          'xs',
          COLOR.muted,
        ),
      );
    }
    new Button(this, W / 2, 570, t('btn.next'), () => proceed(this), { fill: COLOR.good });
  }
}
