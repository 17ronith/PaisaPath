// Random mini-game offer: locked (with reason) when bars are low, skippable, and launches
// Saharsh's scene from src/minigames when it exists (data { onDone(won) }).
import Phaser from 'phaser';
import { getSession } from '@/app/session';
import { rupees, t } from '@/shared/i18n';
import { minigameScenes } from '@/minigames';
import type { Effect, Step } from '@/shared/types';
import { advance, save } from '../flow/Driver';
import { play } from '../audio';
import { Button } from '../ui/Button';
import { PixelPanel } from '../ui/PixelPanel';
import { COLOR, text, tr } from '../ui/theme';
import { overMap } from '../flow/journeyState';
import { VIEW } from '../view';

type Offer = Extract<Step, { kind: 'minigame_offer' }>;

export class MinigameOfferScene extends Phaser.Scene {
  private step!: Offer;

  constructor() {
    super('MinigameOffer');
  }

  init(data: { step: Step }): void {
    this.step = data.step as Offer;
  }

  create(): void {
    const game = getSession().game;
    if (!game || this.step?.kind !== 'minigame_offer') {
      advance(this);
      return;
    }
    const { width: W } = VIEW;
    const { minigame, locked, lockReason } = this.step;
    overMap(this, 0.72, false);
    const p = new PixelPanel(this, 20, 90, W - 40, 300);
    p.add(
      text(
        this,
        (W - 40) / 2,
        24,
        tr('minigame.offer', 'A side gig is free right now!'),
        'md',
        COLOR.aunty,
      ).setOrigin(0.5, 0),
    );
    p.add(
      text(this, (W - 40) / 2, 60, minigame.title, 'sm', COLOR.ink, { align: 'center' }).setOrigin(
        0.5,
        0,
      ),
    );
    p.add(
      text(this, 16, 96, minigame.blurb, 'xs', COLOR.ink, {
        wordWrap: { width: W - 72, useAdvancedWrap: true },
      }),
    );
    const reward = tr('minigame.reward', 'Win: +{pct}% of this month’s income · +{h} happiness', {
      pct: minigame.rewardWalletPct,
      h: minigame.rewardHappiness,
    });
    p.add(
      text(this, 16, 220, reward, 'xs', COLOR.good, {
        wordWrap: { width: W - 72, useAdvancedWrap: true },
      }),
    );

    const scene = minigameScenes[minigame.id];
    if (locked) {
      p.add(
        text(this, 16, 260, lockReason ?? t('minigame.locked'), 'xs', COLOR.bad, {
          wordWrap: { width: W - 72, useAdvancedWrap: true },
        }),
      );
    } else if (scene) {
      new Button(this, W / 2, 460, t('btn.play'), () => this.play(), {
        fill: COLOR.good,
      });
    } else {
      p.add(text(this, 16, 260, tr('minigame.soon', 'Coming soon.'), 'xs', COLOR.muted));
    }
    new Button(
      this,
      W / 2,
      560,
      t('btn.skip'),
      () => {
        game.skipMinigame();
        save();
        advance(this);
      },
      { fill: 0x505878 },
    );
  }

  private play(): void {
    const id = this.step.minigame.id;
    const game = getSession().game!;
    this.scene.pause();
    this.scene.launch(id, {
      onDone: (won: boolean) => {
        const before = game.state.bars.wallet;
        const effects: Effect[] = game.playMinigame(id, won);
        save();
        this.scene.resume();
        this.showResult(won, effects, game.state.bars.wallet - before);
      },
    });
    this.scene.bringToTop(id);
  }

  private showResult(won: boolean, effects: Effect[], earned: number): void {
    const { width: W, height: H } = VIEW;
    this.children.removeAll(true);
    if (won) play('coin');
    const msg = won
      ? tr('minigame.won', 'Well played! You earned {amount}.', { amount: rupees(earned) })
      : tr('minigame.lost', 'Rough shift. No pay this time.');
    text(this, W / 2, H * 0.35, msg, 'md', won ? COLOR.good : COLOR.warn, {
      align: 'center',
      wordWrap: { width: W - 40 },
    }).setOrigin(0.5);
    text(this, W / 2, H * 0.45, effects.map((e) => `• ${e.label}`).join('\n'), 'xs', COLOR.white, {
      align: 'center',
    }).setOrigin(0.5, 0);
    new Button(this, W / 2, 560, t('btn.next'), () => advance(this), { fill: COLOR.good });
  }
}
