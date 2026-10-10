import Phaser from 'phaser';
import { getSession } from '@/app/session';
import { t } from '@/shared/i18n';
import type { Lang } from '@/shared/types';
import { advance } from '../flow/Driver';
import { Button } from '../ui/Button';
import { COLOR, text, tr } from '../ui/theme';

const LANG_NAMES: Partial<Record<Lang, string>> = { en: 'English', te: 'తెలుగు' };

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create(): void {
    const s = getSession();
    const { width: W, height: H } = this.scale;
    this.cameras.main.setBackgroundColor(COLOR.bg);

    // Little pixel skyline so the title isn't a blank page.
    const g = this.add.graphics();
    g.fillStyle(0x2a2a48).fillRect(0, H * 0.42, W, H * 0.2);
    [30, 70, 120, 200, 250, 300].forEach((x, i) =>
      g.fillStyle(0x34345a).fillRect(x, H * 0.42 - 20 - (i % 3) * 18, 34, 40 + (i % 3) * 18),
    );
    g.fillStyle(COLOR.accent).fillRect(0, H * 0.62, W, 4);
    this.add.image(W / 2, H * 0.55, 'avatar_01').setScale(4);

    text(this, W / 2, H * 0.16, t('title'), 'lg', COLOR.white, {
      align: 'center',
      wordWrap: { width: W - 40 },
    }).setOrigin(0.5);
    text(
      this,
      W / 2,
      H * 0.28,
      tr('title.tagline', 'Learn money by living it.'),
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
        LANG_NAMES[l] ?? l,
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
          const game = await s.resume();
          if (game) advance(this);
        },
        { fill: COLOR.good },
      );
    });
  }
}
