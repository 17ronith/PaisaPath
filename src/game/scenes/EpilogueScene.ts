// Age 60. Phase 1: totals + the assumption line in bold. Phase 2: per-asset bars vs
// "if not invested", then WhatIf.
import Phaser from 'phaser';
import { getSession } from '@/app/session';
import { rupees, t } from '@/shared/i18n';
import type { Step } from '@/shared/types';
import { proceed } from '../flow/Driver';
import { Button } from '../ui/Button';
import { PixelPanel } from '../ui/PixelPanel';
import { COLOR, text, tr } from '../ui/theme';
import { VIEW } from '../view';

type Epilogue = Extract<Step, { kind: 'epilogue' }>;

export class EpilogueScene extends Phaser.Scene {
  private step!: Epilogue;

  constructor() {
    super('Epilogue');
  }

  init(data: { step: Step }): void {
    this.step = data.step as Epilogue;
  }

  create(): void {
    const game = getSession().game;
    if (!game || this.step?.kind !== 'epilogue') {
      proceed(this);
      return;
    }
    const { width: W } = VIEW;
    const pr = this.step.projection;
    this.cameras.main.setBackgroundColor(COLOR.bg);
    this.cameras.main.fadeIn(800);
    text(this, W / 2, 90, t('epilogue.title'), 'md', COLOR.white, {
      align: 'center',
      wordWrap: { width: W - 40 },
    }).setOrigin(0.5);
    this.add
      .image(W / 2, 180, game.state.profile.avatar)
      .setScale(5)
      .setTint(0xd8d8d8);

    const p = new PixelPanel(this, 20, 250, W - 40, 200);
    const rows: [string, string][] = [
      [tr('epilogue.savings', 'Savings'), rupees(pr.savingsFinal)],
      [tr('epilogue.invested', 'Invested'), rupees(pr.totalInvested)],
      [tr('epilogue.became', 'Became'), rupees(pr.totalFinal)],
      [tr('epilogue.not_invested', 'If it had stayed in a cash box'), rupees(pr.ifNotInvested)],
    ];
    rows.forEach(([k, v], i) => {
      p.add(text(this, 12, 14 + i * 28, k, 'xs', COLOR.muted));
      p.add(text(this, W - 52, 14 + i * 28, v, 'sm', COLOR.ink).setOrigin(1, 0));
    });
    p.add(
      text(this, 12, 130, pr.assumptionLine, 'xs', COLOR.ink, {
        fontStyle: 'bold',
        wordWrap: { width: W - 64, useAdvancedWrap: true },
      }),
    );
    new Button(this, W / 2, 570, t('btn.next'), () => proceed(this), { fill: COLOR.good });
  }
}
