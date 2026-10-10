// Avatar → name → L1–L4 → persona card ("Not me? Switch") → Quiz{before}.
import Phaser from 'phaser';
import { getSession } from '@/app/session';
import { t } from '@/shared/i18n';
import type { LifeQuestion, PersonaId } from '@/shared/types';
import {
  AVATARS,
  NAME_MAX,
  draftFromLifeAnswers,
  nextPersona,
  sanitizeName,
  type LifeAnswers,
  type ProfileDraft,
} from '../logic/onboarding';
import { Button } from '../ui/Button';
import { PixelPanel } from '../ui/PixelPanel';
import { COLOR, FONT_BODY, text, tr } from '../ui/theme';
import { VIEW } from '../view';

type StepId = 'avatar' | 'name' | LifeQuestion['id'] | 'persona';

export class OnboardingScene extends Phaser.Scene {
  private root!: Phaser.GameObjects.Container;
  private nameInput?: Phaser.GameObjects.DOMElement;
  private avatar: string = AVATARS[0];
  private nickname = '';
  private answers: LifeAnswers = {};
  private persona: PersonaId = 'pocket_money';

  constructor() {
    super('Onboarding');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLOR.bg);
    this.avatar = AVATARS[0];
    this.nickname = '';
    this.answers = {};
    this.root = this.add.container(0, 0);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.clearInput());
    this.show('avatar');
  }

  private order(): StepId[] {
    return ['avatar', 'name', ...getSession().content.lifeQuestions.map((q) => q.id), 'persona'];
  }

  private go(delta: 1 | -1, from: StepId): void {
    const o = this.order();
    const i = o.indexOf(from) + delta;
    if (i < 0) this.scene.start('Title');
    else this.show(o[i]);
  }

  private clearInput(): void {
    this.nameInput?.destroy();
    this.nameInput = undefined;
  }

  private show(step: StepId): void {
    this.root.removeAll(true);
    this.clearInput();
    const o = this.order();
    this.progressDots(o.indexOf(step), o.length);
    if (step === 'avatar') this.showAvatar();
    else if (step === 'name') this.showName();
    else if (step === 'persona') this.showPersona();
    else this.showLife(step);
    // Back arrow on every step.
    this.root.add(
      new Button(this, 40, 40, '<', () => this.go(-1, step), { width: 48, height: 48, size: 'md' }),
    );
  }

  private progressDots(i: number, n: number): void {
    const W = VIEW.width;
    for (let k = 0; k < n; k++) {
      const x = W / 2 - ((n - 1) * 14) / 2 + k * 14;
      this.root.add(this.add.rectangle(x, 40, 8, 8, k <= i ? COLOR.accent : 0x404060));
    }
  }

  private heading(str: string, y = 100): void {
    const W = VIEW.width;
    this.root.add(
      text(this, W / 2, y, str, 'md', COLOR.white, {
        align: 'center',
        wordWrap: { width: W - 40 },
      }).setOrigin(0.5),
    );
  }

  private showAvatar(): void {
    const { width: W } = VIEW;
    this.heading(t('onboard.pick_avatar'));
    const frames: Phaser.GameObjects.Rectangle[] = [];
    AVATARS.forEach((key, i) => {
      const x = W / 2 + (i % 2 === 0 ? -72 : 72);
      const y = 230 + Math.floor(i / 2) * 150;
      const frame = this.add
        .rectangle(x, y, 120, 130, COLOR.panelEdge)
        .setStrokeStyle(4, key === this.avatar ? COLOR.accent : 0x404060)
        .setInteractive({ useHandCursor: true });
      const img = this.add.image(x, y, key).setScale(6);
      frame.on('pointerup', () => {
        this.avatar = key;
        frames.forEach((f, j) => f.setStrokeStyle(4, AVATARS[j] === key ? COLOR.accent : 0x404060));
      });
      frames.push(frame);
      this.root.add([frame, img]);
    });
    this.root.add(new Button(this, W / 2, 570, t('btn.next'), () => this.go(1, 'avatar')));
  }

  private showName(): void {
    const { width: W } = VIEW;
    this.heading(t('onboard.name'));
    this.root.add(this.add.image(W / 2, 200, this.avatar).setScale(5));
    this.root.add(
      text(
        this,
        W / 2,
        330,
        tr('onboard.name_hint', 'Only a nickname. No real name needed.'),
        'xs',
        COLOR.accent,
        {
          align: 'center',
          wordWrap: { width: W - 60 },
        },
      ).setOrigin(0.5),
    );
    const el = document.createElement('input');
    el.type = 'text';
    el.maxLength = NAME_MAX;
    el.autocomplete = 'off';
    el.spellcheck = false;
    el.value = this.nickname;
    el.setAttribute('aria-label', t('onboard.name'));
    Object.assign(el.style, {
      width: '240px',
      height: '44px',
      fontFamily: FONT_BODY,
      fontSize: '14px',
      textAlign: 'center',
      border: '3px solid #9fd3c7',
      background: '#f8f8f0',
      color: '#202028',
      outline: 'none',
      borderRadius: '0',
    });
    this.nameInput = this.add.dom(W / 2, 280, el);
    const next = new Button(this, W / 2, 570, t('btn.next'), () => {
      const name = sanitizeName(el.value);
      if (!name) {
        el.focus();
        return;
      }
      this.nickname = name;
      this.go(1, 'name');
    });
    const sync = (): void => {
      next.setEnabled(sanitizeName(el.value).length > 0);
    };
    el.addEventListener('input', sync);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && sanitizeName(el.value)) {
        this.nickname = sanitizeName(el.value);
        this.go(1, 'name');
      }
    });
    sync();
    this.root.add(next);
  }

  private showLife(id: LifeQuestion['id']): void {
    const { width: W } = VIEW;
    const q = getSession().content.lifeQuestions.find((x) => x.id === id);
    if (!q) return this.go(1, id);
    this.heading(q.text, 130);
    q.options.forEach((opt, i) => {
      const chosen = this.answers[id] === i;
      this.root.add(
        new Button(
          this,
          W / 2,
          250 + i * 76,
          opt.text,
          () => {
            this.answers[id] = i;
            this.go(1, id);
          },
          { height: 60, size: 'xs', fill: chosen ? COLOR.good : COLOR.button },
        ),
      );
    });
  }

  private draft(): ProfileDraft {
    const s = getSession();
    return draftFromLifeAnswers(s.content.lifeQuestions, this.answers, {
      nickname: this.nickname,
      lang: s.lang,
      avatar: this.avatar,
    });
  }

  private showPersona(firstTime = true): void {
    const { width: W } = VIEW;
    const s = getSession();
    if (firstTime) this.persona = this.draft().persona;
    const p = s.content.personas.find((x) => x.id === this.persona) ?? s.content.personas[0];
    this.heading(t('onboard.persona_card'), 90);
    const card = new PixelPanel(this, 24, 130, W - 48, 330);
    card.add(this.add.image((W - 48) / 2, 60, this.avatar).setScale(4));
    card.add(text(this, (W - 48) / 2, 112, this.nickname, 'md', COLOR.ink).setOrigin(0.5));
    card.add(
      text(this, (W - 48) / 2, 140, p.label.toUpperCase(), 'sm', COLOR.aunty).setOrigin(0.5),
    );
    card.add(
      text(this, 16, 170, p.blurb, 'xs', COLOR.ink, {
        wordWrap: { width: W - 80, useAdvancedWrap: true },
      }),
    );
    this.root.add(card);
    this.root.add(
      new Button(
        this,
        W / 2,
        500,
        t('btn.switch'),
        () => {
          this.persona = nextPersona(
            s.content.personas.map((x) => x.id),
            this.persona,
          );
          this.root.removeAll(true);
          this.progressDots(this.order().length - 1, this.order().length);
          this.root.add(
            new Button(this, 40, 40, '<', () => this.go(-1, 'persona'), {
              width: 48,
              height: 48,
              size: 'md',
            }),
          );
          this.showPersona(false);
        },
        { fill: 0x505878, size: 'xs', height: 48 },
      ),
    );
    this.root.add(
      new Button(
        this,
        W / 2,
        575,
        t('btn.confirm'),
        () => {
          const draft: ProfileDraft = { ...this.draft(), persona: this.persona };
          this.scene.start('Quiz', { mode: 'before', draft });
        },
        { fill: COLOR.good },
      ),
    );
  }
}
