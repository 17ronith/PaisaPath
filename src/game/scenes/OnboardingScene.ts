// Who's setting up? → [facilitator: batch + contacts → hand the phone over] → avatar → name →
// L1–L4 → persona card ("Not me? Switch") → Quiz{before}. (ISSUES #36 added the first three.)
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
import { COLOR, text, tr } from '../ui/theme';
import { charScale } from '../ui/chars';
import { disposeInput, htmlInput } from '../ui/HtmlInput';
import { overMap } from '../flow/journeyState';
import { fromBottom, VIEW } from '../view';

type StepId = 'who' | 'setup' | 'handover' | 'avatar' | 'name' | LifeQuestion['id'] | 'persona';

export class OnboardingScene extends Phaser.Scene {
  private root!: Phaser.GameObjects.Container;
  private nameInput?: HTMLInputElement;
  private setupInputs: HTMLInputElement[] = [];
  private setupBy: 'student' | 'facilitator' = 'student';
  private joinCode = '';
  private avatar: string = AVATARS[0];
  private nickname = '';
  private answers: LifeAnswers = {};
  private persona: PersonaId = 'pocket_money';

  constructor() {
    super('Onboarding');
  }

  create(): void {
    overMap(this, 0.72, true);
    this.avatar = AVATARS[0];
    this.nickname = '';
    this.answers = {};
    this.setupBy = getSession().setup.by;
    this.joinCode = getSession().setup.joinCode ?? '';
    this.root = this.add.container(0, 0);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.clearInput());
    this.show('who');
  }

  private order(): StepId[] {
    const setup: StepId[] = this.setupBy === 'facilitator' ? ['who', 'setup', 'handover'] : ['who'];
    return [
      ...setup,
      'avatar',
      'name',
      ...getSession().content.lifeQuestions.map((q) => q.id),
      'persona',
    ];
  }

  private go(delta: 1 | -1, from: StepId): void {
    const o = this.order();
    const i = o.indexOf(from) + delta;
    if (i < 0) this.scene.start('Title');
    else this.show(o[i]);
  }

  private clearInput(): void {
    disposeInput(this.nameInput);
    this.nameInput = undefined;
    this.setupInputs.forEach((el) => disposeInput(el));
    this.setupInputs = [];
  }

  private show(step: StepId): void {
    this.root.removeAll(true);
    this.clearInput();
    const o = this.order();
    this.progressDots(o.indexOf(step), o.length);
    if (step === 'who') this.showWho();
    else if (step === 'setup') this.showSetup();
    else if (step === 'handover') this.showHandover();
    else if (step === 'avatar') this.showAvatar();
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
      this.root.add(this.add.rectangle(x, 40, 8, 8, k <= i ? COLOR.accent : 0x3e4a36));
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
    // Five characters: three on top, two below, centred.
    AVATARS.forEach((key, i) => {
      const row = i < 3 ? 0 : 1;
      const col = row ? i - 3 : i;
      const x = W / 2 + (row ? (col - 0.5) * 112 : (col - 1) * 112);
      const y = 240 + row * 156;
      const frame = this.add
        .rectangle(x, y, 104, 140, COLOR.panelEdge)
        .setStrokeStyle(4, key === this.avatar ? COLOR.accent : 0x3e4a36)
        .setInteractive({ useHandCursor: true });
      const img = this.add.image(x, y, key).setScale(charScale(this, key, 6));
      frame.on('pointerup', () => {
        this.avatar = key;
        frames.forEach((f, j) => f.setStrokeStyle(4, AVATARS[j] === key ? COLOR.accent : 0x3e4a36));
      });
      frames.push(frame);
      this.root.add([frame, img]);
    });
    this.root.add(
      new Button(this, W / 2, fromBottom(570), t('btn.next'), () => this.go(1, 'avatar')),
    );
  }

  private showName(): void {
    const { width: W } = VIEW;
    this.heading(t('onboard.name'));
    this.root.add(
      this.add.image(W / 2, 200, this.avatar).setScale(charScale(this, this.avatar, 6)),
    );
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
    const el = htmlInput(this, W / 2, 280, {
      width: 240,
      height: 46,
      maxLength: NAME_MAX,
      value: this.nickname,
      placeholder: tr('onboard.name_placeholder', 'Nickname'),
      label: t('onboard.name'),
    });
    this.nameInput = el;
    const next = new Button(this, W / 2, fromBottom(570), t('btn.next'), () => {
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

  private draftWithSetup(): ProfileDraft {
    const d = this.draft();
    return this.setupBy === 'facilitator' && this.joinCode ? { ...d, joinCode: this.joinCode } : d;
  }

  // ---- ISSUES #36: who is setting this up? ------------------------------------------------

  private showWho(): void {
    const { width: W } = VIEW;
    this.heading(tr('onboard.who', 'Who is setting this up?'), 110);
    const pick = (by: 'student' | 'facilitator'): void => {
      this.setupBy = by;
      getSession().setSetup({ ...getSession().setup, by });
      this.go(1, 'who');
    };
    this.root.add(
      new Button(
        this,
        W / 2,
        250,
        tr('onboard.who_student', "I'm the student"),
        () => pick('student'),
        {
          width: 290,
          height: 72,
          size: 'md',
        },
      ),
    );
    this.root.add(
      text(
        this,
        W / 2,
        300,
        tr('onboard.who_student_hint', 'You play on your own phone.'),
        'xs',
        COLOR.accent,
      ).setOrigin(0.5),
    );
    this.root.add(
      new Button(
        this,
        W / 2,
        380,
        tr('onboard.who_facilitator', 'NGO facilitator, for a student'),
        () => pick('facilitator'),
        { width: 290, height: 72, size: 'sm', fill: 0x56684a },
      ),
    );
    this.root.add(
      text(
        this,
        W / 2,
        438,
        tr(
          'onboard.who_facilitator_hint',
          'You enter the batch code and the report contacts, then hand the phone over.',
        ),
        'xs',
        COLOR.accent,
        { align: 'center', wordWrap: { width: W - 60 } },
      ).setOrigin(0.5),
    );
  }

  private showSetup(): void {
    const { width: W } = VIEW;
    const setup = getSession().setup;
    this.heading(tr('onboard.setup', 'Facilitator setup'), 92);
    const label = (y: number, str: string): void => {
      this.root.add(text(this, 36, y, str, 'xs', COLOR.accent));
    };
    label(128, tr('onboard.batch', 'Batch code'));
    const batch = htmlInput(this, W / 2, 162, {
      width: 290,
      maxLength: 16,
      value: this.joinCode || setup.joinCode,
      placeholder: 'HYD-097',
      label: tr('onboard.batch', 'Batch code'),
    });
    label(198, tr('onboard.fac_email', 'Your email (the report comes here)'));
    const fac = htmlInput(this, W / 2, 232, {
      type: 'email',
      width: 290,
      value: setup.facilitatorEmail,
      placeholder: 'facilitator@ngo.org',
      label: tr('onboard.fac_email', 'Facilitator email'),
    });
    label(268, tr('onboard.guardian_email', "Guardian's email (optional, CC)"));
    const guard = htmlInput(this, W / 2, 302, {
      type: 'email',
      width: 290,
      value: setup.guardianEmail,
      placeholder: 'optional',
      label: tr('onboard.guardian_email', 'Guardian email'),
    });
    this.setupInputs = [batch, fac, guard];

    let consent = setup.guardianConsent ?? false;
    const consentBtn = new Button(
      this,
      W / 2,
      364,
      '',
      () => {
        consent = !consent;
        paint();
      },
      { width: 290, height: 44, size: 'xs', fill: 0x56684a, align: 'left' },
    );
    const paint = (): void => {
      consentBtn.setCaption(
        `${consent ? '☑' : '☐'}  ${tr('onboard.consent', 'Guardian consent collected at enrolment')}`,
      );
    };
    paint();
    this.root.add(consentBtn);
    this.root.add(
      text(
        this,
        W / 2,
        410,
        tr(
          'onboard.setup_note',
          "Stored on this phone only. The guardian is CC'd only with consent. The student never types an email.",
        ),
        'xs',
        COLOR.muted,
        { align: 'center', wordWrap: { width: W - 60 } },
      ).setOrigin(0.5),
    );

    const next = new Button(this, W / 2, fromBottom(570), t('btn.next'), () => {
      const code = batch.value.trim().toUpperCase();
      if (!code) {
        batch.focus();
        return;
      }
      this.joinCode = code;
      getSession().setSetup({
        by: 'facilitator',
        joinCode: code,
        facilitatorEmail: fac.value.trim() || undefined,
        guardianEmail: consent ? guard.value.trim() || undefined : undefined,
        guardianConsent: consent,
      });
      this.go(1, 'setup');
    });
    const sync = (): void => {
      next.setEnabled(batch.value.trim().length > 0);
    };
    batch.addEventListener('input', sync);
    sync();
    this.root.add(next);
  }

  private showHandover(): void {
    const { width: W } = VIEW;
    this.heading(tr('onboard.handover', 'Now hand the phone to the student'), 120);
    this.root.add(text(this, W / 2, 230, '📱  ➜  🙂', 'xl', COLOR.white).setOrigin(0.5));
    this.root.add(
      text(
        this,
        W / 2,
        310,
        tr(
          'onboard.handover_hint',
          'Batch {code} is set. From here the student chooses an avatar, a nickname and answers four questions about their own life.',
          { code: this.joinCode },
        ),
        'sm',
        COLOR.accent,
        { align: 'center', wordWrap: { width: W - 50 } },
      ).setOrigin(0.5),
    );
    this.root.add(
      new Button(
        this,
        W / 2,
        fromBottom(570),
        tr('onboard.handover_go', "I'm the student, let's start"),
        () => this.go(1, 'handover'),
      ),
    );
  }

  private showPersona(firstTime = true): void {
    const { width: W } = VIEW;
    const s = getSession();
    if (firstTime) this.persona = this.draft().persona;
    const p = s.content.personas.find((x) => x.id === this.persona) ?? s.content.personas[0];
    this.heading(t('onboard.persona_card'), 90);
    const card = new PixelPanel(this, 24, 130, W - 48, 330);
    card.add(
      this.add.image((W - 48) / 2, 60, this.avatar).setScale(charScale(this, this.avatar, 6)),
    );
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
        { fill: 0x56684a, size: 'xs', height: 48 },
      ),
    );
    this.root.add(
      new Button(
        this,
        W / 2,
        fromBottom(575),
        t('btn.confirm'),
        () => {
          const draft: ProfileDraft = { ...this.draftWithSetup(), persona: this.persona };
          this.scene.start('Quiz', { mode: 'before', draft });
        },
        { fill: COLOR.good },
      ),
    );
  }
}
