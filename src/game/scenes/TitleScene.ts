import Phaser from 'phaser';
import { getSession } from '@/app/session';
import { t } from '@/shared/i18n';
import type { Lang } from '@/shared/types';
import { advance } from '../flow/Driver';
import { Button } from '../ui/Button';
import { COLOR, text, tr } from '../ui/theme';
import { mapBG, overMap } from '../flow/journeyState';
import { startMusic } from '../music';
import { VIEW } from '../view';

const LANG_NAMES: Partial<Record<Lang, string>> = { en: 'English', te: 'తెలుగు' };

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create(): void {
    const s = getSession();
    const { width: W, height: H } = VIEW;
    overMap(this, 0.3, true);

    const bg = mapBG(this);
    bg?.setTimeOfDay('day', 0);
    bg?.setDone([]);
    // Title plate over the living map, the player standing on the road below it.
    this.add
      .rectangle(W / 2, H * 0.215, W - 24, 150, COLOR.bg, 0.82)
      .setStrokeStyle(2, COLOR.accent);
    this.add.ellipse(W / 2, H * 0.6 + 4, 70, 14, 0x000000, 0.35);
    this.add
      .image(W / 2, H * 0.6, 'avatar_01')
      .setOrigin(0.5, 1)
      .setScale(5);

    text(this, W / 2, H * 0.16, t('title'), 'lg', COLOR.white, {
      align: 'center',
      wordWrap: { width: W - 40 },
    }).setOrigin(0.5);
    text(
      this,
      W / 2,
      H * 0.28,
      tr('subtitle', 'Make choices. See consequences. Try again.'),
      'xs',
      COLOR.accent,
      {
        align: 'center',
        wordWrap: { width: W - 60 },
      },
    ).setOrigin(0.5);

    const langs: Lang[] = ['en', 'te'];
    langs.forEach((l, i) => {
      const b = new Button(
        this,
        W / 2 - 70 + i * 140,
        H * 0.7,
        tr(`lang.${l}`, LANG_NAMES[l] ?? l),
        () => {
          s.setLang(l);
          this.scene.restart();
        },
        {
          width: 128,
          height: 48,
          size: l === 'en' ? 'xs' : 'md',
          fill: s.lang === l ? COLOR.good : COLOR.button,
        },
      );
      b.setAlpha(s.lang === l ? 1 : 0.8);
    });

    new Button(this, W / 2, H * 0.8, t('btn.start'), () => {
      startMusic();
      void s.reset().then(() => this.scene.start('Onboarding'));
    });

    void s.hasSave().then((has) => {
      if (!has || !this.scene.isActive()) return;
      new Button(
        this,
        W / 2,
        H * 0.9,
        t('btn.continue'),
        async () => {
          startMusic();
          const game = await s.resume();
          if (game) advance(this);
        },
        { fill: COLOR.good },
      );
    });
  }
}
