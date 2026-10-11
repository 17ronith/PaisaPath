import Phaser from 'phaser';
import { startMusic } from '../music';
import { getSession } from '@/app/session';
import { t } from '@/shared/i18n';
import type { Lang } from '@/shared/types';
import { advance } from '../flow/Driver';
import { Button } from '../ui/Button';
import { COLOR, text, tr } from '../ui/theme';
import { VIEW } from '../view';
import { drawBackdrop, townStrip } from '../ui/Backdrop';

const LANG_NAMES: Partial<Record<Lang, string>> = { en: 'English', te: 'తెలుగు' };

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create(): void {
    const s = getSession();
    const { width: W, height: H } = VIEW;
    this.cameras.main.setBackgroundColor(COLOR.bg);

    // Hyderabad backdrop (ISSUES #4/#5): Tank Bund at sunset; Tiny Town street as the fallback.
    if (!drawBackdrop(this, 'bg_03_tank_bund_buddha', 0, H * 0.36, W, 160))
      townStrip(this, H * 0.36, W, 160);
    this.add.rectangle(0, H * 0.36 + 160, W, 3, COLOR.accent).setOrigin(0, 0);
    this.add
      .image(W / 2, H * 0.36 + 150, 'avatar_01')
      .setOrigin(0.5, 1)
      .setScale(4);

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

    const langs: Lang[] = ['en', 'te', 'hi']; // ISSUES #22: Hindi joins (PR #25 fills the strings)
    langs.forEach((l, i) => {
      const b = new Button(
        this,
        W / 2 - 112 + i * 112,
        H * 0.7,
        tr(`lang.${l}`, LANG_NAMES[l] ?? l),
        () => {
          s.setLang(l);
          this.scene.restart();
        },
        {
          width: 104,
          height: 48,
          size: l === 'en' ? 'xs' : 'md',
          fill: s.lang === l ? COLOR.good : COLOR.button,
        },
      );
      b.setAlpha(s.lang === l ? 1 : 0.8);
    });

    new Button(this, W / 2, H * 0.8, t('btn.start'), () => {
      startMusic(); // ISSUES #12: needs a user gesture; idempotent; obeys the mute button
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
