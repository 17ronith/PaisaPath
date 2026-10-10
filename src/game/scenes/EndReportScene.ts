// Phase 1: the summary numbers + Play again. Phase 2 adds the download/email flow,
// the facilitator-view link and the WhatIf screen before this.
import Phaser from 'phaser';
import { getSession } from '@/app/session';
import { t } from '@/shared/i18n';
import type { Summary } from '@/shared/types';
import { Button } from '../ui/Button';
import { PixelPanel } from '../ui/PixelPanel';
import { COLOR, text, tr } from '../ui/theme';
import { VIEW } from '../view';

export class EndReportScene extends Phaser.Scene {
  private summary?: Summary;

  constructor() {
    super('EndReport');
  }

  init(data: { summary?: Summary }): void {
    this.summary = data.summary;
  }

  create(): void {
    const s = getSession();
    const sum = this.summary ?? s.game?.summary();
    const { width: W } = VIEW;
    this.cameras.main.setBackgroundColor(COLOR.bg);
    if (this.scene.isActive('HUD')) this.scene.stop('HUD');
    text(this, W / 2, 50, t('report.title'), 'md', COLOR.white).setOrigin(0.5);
    if (!sum) {
      new Button(this, W / 2, 570, t('btn.play_again'), () => this.scene.start('Title'));
      return;
    }
    const p = new PixelPanel(this, 16, 84, W - 32, 420);
    const lines = [
      t('report.before_after', { before: sum.quizBefore, after: sum.quizAfter ?? '–' }),
      sum.learningGain != null
        ? tr('report.gain', 'Learning gain: {n}', { n: sum.learningGain })
        : '',
      '',
      `${t('report.ncfe')}: K ${sum.ncfe.knowledge}/8 · B ${sum.ncfe.behaviour}/9 · A ${sum.ncfe.attitude}/5`,
      sum.ncfe.literate ? t('report.literate') : '',
      t('report.national'),
      '',
      t('report.safety', { spotted: sum.safety.spotted, faced: sum.safety.faced }),
      '',
      ...(['budget', 'save', 'invest', 'safety'] as const).map(
        (k) =>
          `${tr(`pillar.${k}`, k.toUpperCase())}: ${sum.perPillar[k].good}/${sum.perPillar[k].total}`,
      ),
      '',
      tr('report.fixed', 'Mistakes fixed: {n}', { n: sum.mistakesFixed.length }),
      tr('report.detours', 'Detours: {n} · Restarts: {r}', {
        n: sum.detoursTaken,
        r: sum.restarts,
      }),
    ].filter((l, i, a) => !(l === '' && a[i - 1] === ''));
    p.add(
      text(this, 12, 14, lines.join('\n'), 'xs', COLOR.ink, {
        wordWrap: { width: W - 56, useAdvancedWrap: true },
      }),
    );
    new Button(this, W / 2, 570, t('btn.play_again'), () => {
      void s.reset().then(() => this.scene.start('Title'));
    });
  }
}
