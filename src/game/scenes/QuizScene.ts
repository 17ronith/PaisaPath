// The 5-question difficulty quiz. 'before' = onboarding (sets difficulty, starts the game);
// 'after' = after the epilogue (learning gain). No per-question feedback: it's a measurement.
import Phaser from 'phaser';
import { getSession } from '@/app/session';
import { t } from '@/shared/i18n';
import { advance, save } from '../flow/Driver';
import { finishProfile, type ProfileDraft } from '../logic/onboarding';
import { Button } from '../ui/Button';
import { PixelPanel } from '../ui/PixelPanel';
import { COLOR, text, tr } from '../ui/theme';
import { VIEW } from '../view';
import { afterQuiz } from '@/shared/quiz';

interface QuizData {
  mode: 'before' | 'after';
  draft?: ProfileDraft;
}

export class QuizScene extends Phaser.Scene {
  private mode: QuizData['mode'] = 'before';
  private draft?: ProfileDraft;
  private answers: number[] = [];
  private root!: Phaser.GameObjects.Container;

  constructor() {
    super('Quiz');
  }

  init(data: QuizData): void {
    this.mode = data.mode ?? 'before';
    this.draft = data.draft;
    this.answers = [];
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLOR.bg);
    this.root = this.add.container(0, 0);
    this.intro();
  }

  private intro(): void {
    const { width: W } = VIEW;
    const title = this.mode === 'before' ? t('quiz.before_title') : t('quiz.after_title');
    this.root.add(
      text(this, W / 2, 220, title, 'md', COLOR.white, {
        align: 'center',
        wordWrap: { width: W - 40 },
      }).setOrigin(0.5),
    );
    this.root.add(
      text(
        this,
        W / 2,
        300,
        tr('quiz.before_intro', "Just pick what you think. There's no penalty for guessing."),
        'xs',
        COLOR.accent,
        { align: 'center', wordWrap: { width: W - 60 } },
      ).setOrigin(0.5),
    );
    this.root.add(new Button(this, W / 2, 540, t('btn.start'), () => this.ask(0)));
  }

  private ask(i: number): void {
    const content = getSession().content;
    // ISSUES #34: the after-quiz asks the same concepts a different way
    const quiz = this.mode === 'after' ? afterQuiz(content) : content.quiz;
    if (i >= quiz.length) return this.finish();
    const q = quiz[i];
    const { width: W } = VIEW;
    this.root.removeAll(true);
    this.root.add(
      text(
        this,
        W / 2,
        36,
        `${(this.mode === 'before' ? t('quiz.before_title') : t('quiz.after_title')).toUpperCase()} · ${t('quiz.progress', { n: i + 1, total: quiz.length })}`,
        'xs',
        COLOR.accent,
      ).setOrigin(0.5),
    );
    const panel = new PixelPanel(this, 20, 64, W - 40, 170);
    panel.add(
      text(this, 14, 14, q.text, 'sm', COLOR.ink, {
        wordWrap: { width: W - 68, useAdvancedWrap: true },
      }),
    );
    this.root.add(panel);
    q.options.forEach((opt, k) => {
      this.root.add(
        new Button(
          this,
          W / 2,
          290 + k * 84,
          opt,
          () => {
            this.answers[i] = k;
            this.ask(i + 1);
          },
          { height: 68, size: 'xs' },
        ),
      );
    });
  }

  private finish(): void {
    const s = getSession();
    const { width: W } = VIEW;
    this.root.removeAll(true);
    if (this.mode === 'before') {
      if (!this.draft) {
        this.scene.start('Onboarding');
        return;
      }
      const profile = finishProfile(this.draft, s.content.quiz, this.answers);
      s.startGame(profile);
      save();
      const diffLabel = tr(`diff.${profile.difficulty}`, profile.difficulty);
      this.root.add(
        text(
          this,
          W / 2,
          250,
          t('quiz.before_score', { score: profile.quizBefore, difficulty: diffLabel }),
          'md',
          COLOR.white,
          {
            align: 'center',
            wordWrap: { width: W - 40 },
          },
        ).setOrigin(0.5),
      );
      this.root.add(this.add.image(W / 2, 360, profile.avatar).setScale(4));
      this.root.add(
        new Button(this, W / 2, 540, t('btn.next'), () => advance(this), { fill: COLOR.good }),
      );
      return;
    }
    const game = s.game;
    if (!game) {
      this.scene.start('Title');
      return;
    }
    const score = game.answerQuiz(this.answers);
    save();
    const before = game.state.profile.quizBefore;
    this.root.add(
      text(
        this,
        W / 2,
        250,
        `${tr('quiz.after_score', 'Your after score: {score}/5', { score })}\n${t('report.before_after', { before, after: score })}`,
        'md',
        COLOR.white,
        {
          align: 'center',
          wordWrap: { width: W - 40 },
        },
      ).setOrigin(0.5),
    );
    this.root.add(
      new Button(this, W / 2, 540, t('btn.next'), () => advance(this), { fill: COLOR.good }),
    );
  }
}
