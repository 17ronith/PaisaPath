// Random mini-game offer: locked (with reason) when bars are low, skippable, and launches
// Saharsh's scene from src/minigames when it exists (data { onDone(won) }).
import Phaser from 'phaser';
import { getSession } from '@/app/session';
import { t } from '@/shared/i18n';
import { minigameScenes } from '@/minigames';
import type { Effect, Step } from '@/shared/types';
import { advance, save } from '../flow/Driver';
import { Button } from '../ui/Button';
import { PixelPanel } from '../ui/PixelPanel';
import { COLOR, text, tr } from '../ui/theme';

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
    const { width: W } = this.scale;
    const { minigame, locked, lockReason } = this.step;
    this.cameras.main.setBackgroundColor(COLOR.bg);
    const p = new PixelPanel(this, 20, 90, W - 40, 300);
    p.add(
      text(this, (W - 40) / 2, 24, tr('minigame.title', 'SIDE GIG!'), 'md', COLOR.aunty).setOrigin(
        0.5,
        0,
      ),
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
      new Button(this, W / 2, 460, tr('minigame.play', 'PLAY'), () => this.play(), {
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
        const effects: Effect[] = game.playMinigame(id, won);
        save();
        this.scene.resume();
        this.showResult(won, effects);
      },
    });
    this.scene.bringToTop(id);
  }

  private showResult(won: boolean, effects: Effect[]): void {
    const { width: W, height: H } = this.scale;
    this.children.removeAll(true);
    const msg = won
      ? tr('minigame.won', 'Shift done. You got paid!')
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
