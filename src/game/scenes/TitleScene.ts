import Phaser from 'phaser';
import { startMusic } from '../music';
import { getSession } from '@/app/session';
import { t } from '@/shared/i18n';
import type { Lang } from '@/shared/types';
import { advance } from '../flow/Driver';
import { Button } from '../ui/Button';
import { COLOR, text, tr } from '../ui/theme';
import { charScale } from '../ui/chars';
import { AVATARS } from '../logic/onboarding';
import { mapBG, overMap } from '../flow/journeyState';
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
      .image(W / 2, H * 0.6, AVATARS[0])
      .setOrigin(0.5, 1)
      .setScale(charScale(this, AVATARS[0], 6));

    // "₹ PaisaPath": Press Start 2P has no ₹, so the sign is drawn on the font's own 8×8 grid.
    const unit = 3; // one font pixel at 24px
    const name = text(this, 0, H * 0.16, t('title'), 'lg', COLOR.white, {
      fontSize: `${unit * 8}px`,
    }).setOrigin(0, 0.5);
    const signW = unit * 12; // glyph cell plus half a space
    const left = W / 2 - (signW + name.width) / 2;
    name.setX(left + signW);
    drawRupee(this, left, H * 0.16 - (unit * 8) / 2, unit, COLOR.white);
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

/** ₹ in Press Start 2P's style: 7×7 inside an 8×8 cell, 1-px bars, 2–3-px strokes. */
const RUPEE = ['#######', '...###.', '#######', '..###..', '####...', '..###..', '....###'];

function drawRupee(scene: Phaser.Scene, x: number, y: number, unit: number, color: number): void {
  const g = scene.add.graphics().fillStyle(color);
  RUPEE.forEach((row, r) =>
    [...row].forEach((ch, c) => {
      if (ch === '#') g.fillRect(x + c * unit, y + r * unit, unit, unit);
    }),
  );
}
