// Age 60: what each made-up asset grew into, next to the "kept in a cash box" path, with the
// engine's assumption line in full. NEXT → WhatIf (in-game only), which then proceeds.
import Phaser from 'phaser';
import { drawBackdrop } from '../ui/Backdrop';
import { getSession } from '@/app/session';
import { rupees, t } from '@/shared/i18n';
import type { Step } from '@/shared/types';
import { proceed } from '../flow/Driver';
import { Button } from '../ui/Button';
import { PixelPanel } from '../ui/PixelPanel';
import { COLOR, text, tr } from '../ui/theme';
import { charScale } from '../ui/chars';
import { fromBottom, VIEW } from '../view';

type Epilogue = Extract<Step, { kind: 'epilogue' }>;

const ASSET_COLOURS: Record<string, number> = {
  cashbox: 0x9aa0aa,
  banyan: COLOR.good,
  chai: COLOR.warn,
  mango: 0xf07830,
};

interface Row {
  label: string;
  sub?: string;
  value: number;
  color: number;
}

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
    // ISSUES #4: the same room as Stage 1's home, decades later.
    if (drawBackdrop(this, 'bg_19_home_age60', 0, 0, W, 210))
      this.add.rectangle(0, 0, W, 210, COLOR.bg, 0.55).setOrigin(0);
    text(this, W / 2, 40, t('epilogue.title'), 'lg', COLOR.white, {
      align: 'center',
      wordWrap: { width: W - 40 },
    }).setOrigin(0.5);
    this.add
      .image(W / 2, 128, game.state.profile.avatar)
      .setOrigin(0.5, 1)
      .setScale(charScale(this, game.state.profile.avatar, 4))
      .setTint(0xd8d8d8);

    const rows: Row[] = [
      ...pr.perAsset
        .filter((a) => a.invested > 0)
        .map((a) => ({
          label: a.asset.name,
          sub: `${tr('epilogue.invested', 'What you put in')}: ${rupees(a.invested)}`,
          value: a.finalValue,
          color: ASSET_COLOURS[a.asset.id] ?? COLOR.money,
        })),
    ];
    if (pr.totalInvested > 0)
      rows.push({
        label: tr('epilogue.not_invested', 'If it had stayed in a cash box'),
        value: pr.ifNotInvested,
        color: 0x9aa0aa,
      });
    rows.push({
      label: tr('epilogue.savings', 'Savings'),
      value: pr.savingsFinal,
      color: COLOR.money,
    });

    const max = Math.max(1, ...rows.map((r) => r.value));
    const rowH = 46;
    const panelH = 20 + rows.length * rowH + (pr.totalInvested > 0 ? 30 : 0);
    const p = new PixelPanel(this, 14, 146, W - 28, panelH);
    const barW = W - 60;
    rows.forEach((r, i) => {
      const y = 12 + i * rowH;
      p.add(text(this, 12, y, r.label, 'sm', COLOR.ink));
      p.add(text(this, W - 40, y, rupees(r.value), 'sm', COLOR.ink).setOrigin(1, 0));
      if (r.sub) p.add(text(this, 12, y + 17, r.sub, 'xs', COLOR.muted));
      const fill = this.add.rectangle(12, y + 38, 0, 6, r.color).setOrigin(0, 0.5);
      p.add([this.add.rectangle(12, y + 38, barW, 6, 0xd8d4c8).setOrigin(0, 0.5), fill]);
      this.tweens.add({
        targets: fill,
        width: (barW * r.value) / max,
        duration: 900,
        delay: 200 + i * 180,
        ease: 'Cubic.easeOut',
      });
    });
    if (pr.totalInvested > 0)
      p.add(
        text(
          this,
          12,
          panelH - 26,
          `${tr('epilogue.became', 'What it became')}: ${rupees(pr.totalFinal)}`,
          'sm',
          COLOR.good,
        ),
      );

    text(this, 20, 146 + panelH + 12, pr.assumptionLine, 'xs', COLOR.accent, {
      wordWrap: { width: W - 40, useAdvancedWrap: true },
    });

    new Button(this, W / 2, fromBottom(596), t('btn.next'), () => this.scene.start('WhatIf'), {
      fill: COLOR.good,
    });
  }
}
