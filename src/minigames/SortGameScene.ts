// Base scene for the two-button mini-games (Kirana Rush, Scam or Legit).
// Flow: intro card (rules, TAP TO START) → items one at a time → feedback line after each tap
// (clock paused so the "why" can be read) → result card → CONTINUE → onDone(won) → scene.stop().
// Started with data { onDone }; onDone fires exactly once, including when the game is quit or the
// scene is shut down from outside (then won = false, so the engine is never left waiting).
import Phaser from 'phaser';
import type { MiniGameDef } from '@/shared/types';
import { t } from '@/shared/i18n';
import { getSession } from '@/app/session';
import { once, type OnDone, type SortItem, type SortRound, type Verdict } from './sortRound';

export interface MiniGameData {
  onDone?: OnDone;
}

export interface AnswerButton<A extends string> {
  answer: A;
  label: string;
  color: number;
  /** Keyboard shortcut for desktop demos. */
  key: 'LEFT' | 'RIGHT';
}

export interface Palette {
  bg: number;
  panel: number;
  text: string;
  dim: string;
  good: string;
  bad: string;
}

type Phase = 'intro' | 'play' | 'feedback' | 'result';

export const FEEDBACK_MS = 1100;
const FONT = 'monospace';

/** i18n with an inline English fallback, so strings work before the content team adds keys. */
export function tr(key: string, fallback: string, vars?: Record<string, string | number>): string {
  const s = t(key, vars);
  if (s !== key) return s;
  return fallback.replace(/\{(\w+)\}/g, (_, k) => (vars && k in vars ? String(vars[k]) : `{${k}}`));
}

export abstract class SortGameScene<A extends string, T extends SortItem<A>> extends Phaser.Scene {
  protected round!: SortRound<A, T>;
  protected phase: Phase = 'intro';
  protected done = once(undefined);
  protected W = 360;
  protected H = 640;
  /** Vertical band the subclass draws items in. */
  protected readonly playTop = 78;
  protected readonly playBottom = 470;

  private timerFill!: Phaser.GameObjects.Rectangle;
  private timerWidth = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private feedbackText!: Phaser.GameObjects.Text;
  private buttons: Phaser.GameObjects.Container[] = [];
  private overlay?: Phaser.GameObjects.Container;

  protected abstract readonly gameId: MiniGameDef['id'];
  protected abstract readonly palette: Palette;
  /** Left and right buttons (read at create(), so labels follow the current language). */
  protected abstract readonly answers: [AnswerButton<A>, AnswerButton<A>];
  protected abstract makeRound(): SortRound<A, T>;
  /** One line per rule on the intro card. */
  protected abstract rules(): string[];
  /** Draw the live item. */
  protected abstract showItem(item: T, index: number): void;
  /** Animate the item away after it was answered or missed. */
  protected abstract clearItem(verdict: Verdict<T>, answered: A | null): void;
  /** Per-frame hook while playing; return true when the live item expired (e.g. fell off). */
  protected updateItem(_dtMs: number): boolean {
    return false;
  }
  /** Where the "why" line goes; override when the item area below is busy. */
  protected feedbackY(): number {
    return this.playBottom + 22;
  }
  /** Feedback prefix for a miss. */
  protected missLine(): string {
    return tr('minigame.too_slow', 'Too slow!');
  }

  init(data: MiniGameData): void {
    this.done = once(data?.onDone);
    this.phase = 'intro';
    this.buttons = [];
    this.overlay = undefined;
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.done.call(false));
  }

  create(): void {
    this.W = this.scale.width;
    this.H = this.scale.height;
    this.round = this.makeRound();
    const p = this.palette;
    this.add.rectangle(0, 0, this.W, this.H, p.bg).setOrigin(0).setInteractive(); // eat clicks

    const def = this.def();
    this.text(16, 16, def.title.toUpperCase(), 16, p.text).setFontStyle('bold');
    const quit = this.text(this.W - 16, 14, '✕', 20, p.dim).setOrigin(1, 0);
    quit.setPadding(8).setInteractive({ useHandCursor: true });
    quit.on('pointerdown', () => this.finish(false));

    // Timer track + fill, score on the right.
    this.timerWidth = this.W - 110;
    this.add.rectangle(16, 50, this.timerWidth, 10, p.panel).setOrigin(0, 0.5);
    this.timerFill = this.add.rectangle(16, 50, this.timerWidth, 10, 0xf2c14e).setOrigin(0, 0.5);
    this.scoreText = this.text(this.W - 16, 50, '', 14, p.text).setOrigin(1, 0.5);

    this.feedbackText = this.text(this.W / 2, this.feedbackY(), '', 14, p.text)
      .setOrigin(0.5)
      .setAlign('center')
      .setWordWrapWidth(this.W - 32)
      .setDepth(10);

    this.makeButtons();
    this.refreshHud();
    this.showIntro(def);
  }

  update(_time: number, delta: number): void {
    if (this.phase !== 'play') return;
    this.round.tick(delta);
    this.refreshHud();
    if (this.round.timeUp) {
      this.resolve(null);
      return;
    }
    if (this.updateItem(delta)) this.resolve(null);
  }

  // ---- flow -----------------------------------------------------------------

  private start(): void {
    this.overlay?.destroy();
    this.overlay = undefined;
    this.phase = 'play';
    this.serve();
  }

  private serve(): void {
    const item = this.round.current;
    if (!item) {
      this.showResult();
      return;
    }
    this.feedbackText.setText('');
    this.setButtonsEnabled(true);
    this.showItem(item, this.round.position);
    this.phase = 'play';
  }

  protected choose(a: A): void {
    if (this.phase !== 'play') return;
    this.resolve(a);
  }

  private resolve(a: A | null): void {
    const v = a === null ? this.round.miss() : this.round.answer(a);
    if (!v) {
      this.showResult();
      return;
    }
    this.phase = 'feedback';
    this.setButtonsEnabled(false);
    this.clearItem(v, a);
    const p = this.palette;
    const head = v.missed ? this.missLine() : v.correct ? '✓' : '✗';
    this.feedbackText.setColor(v.correct ? p.good : p.bad).setText(`${head} ${v.item.why}`);
    this.refreshHud();
    this.time.delayedCall(FEEDBACK_MS, () => {
      if (this.phase !== 'feedback') return;
      if (this.round.finished) this.showResult();
      else this.serve();
    });
  }

  private showResult(): void {
    if (this.phase === 'result') return;
    this.phase = 'result';
    this.setButtonsEnabled(false);
    const r = this.round;
    const won = r.won;
    const p = this.palette;
    const lines = [
      tr('minigame.score', '{correct} / {total} right', { correct: r.correct, total: r.total }),
      won
        ? tr('minigame.win', 'Side gig done. You got paid!')
        : tr('minigame.lose', 'Needed {pass}. No pay this time.', { pass: r.opts.passCount }),
    ];
    if (r.timeUp && r.verdicts.length < r.total) lines.push(tr('minigame.time_up', 'Time up!'));
    this.overlay = this.card(
      won ? tr('minigame.paid', '★ PAID ★') : tr('minigame.unpaid', 'NOT THIS TIME'),
      lines,
      tr('btn.continue', 'CONTINUE'),
      () => this.finish(won),
      won ? p.good : p.bad,
    );
  }

  private showIntro(def: MiniGameDef): void {
    this.overlay = this.card(
      def.title,
      [def.blurb, '', ...this.rules()],
      tr('btn.start', 'START'),
      () => this.start(),
      this.palette.text,
    );
  }

  /** Ends the mini-game: report once, then stop this scene (CONTRACTS §4.3). */
  protected finish(won: boolean): void {
    this.phase = 'result';
    this.done.call(won);
    this.scene.stop();
  }

  // ---- UI helpers -------------------------------------------------------------

  private def(): MiniGameDef {
    try {
      const d = getSession().content.minigames.find((m) => m.id === this.gameId);
      if (d) return d;
    } catch {
      /* no session (e.g. scene previewed standalone) */
    }
    return {
      id: this.gameId,
      title: this.gameId,
      blurb: '',
      rewardWalletPct: 8,
      rewardHappiness: 10,
    };
  }

  protected text(
    x: number,
    y: number,
    s: string,
    size: number,
    color: string,
  ): Phaser.GameObjects.Text {
    return this.add.text(x, y, s, {
      fontFamily: FONT,
      fontSize: `${size}px`,
      color,
      resolution: 2,
    });
  }

  private refreshHud(): void {
    const r = this.round;
    this.timerFill.width = this.timerWidth * (r.remainingMs / r.opts.timeLimitMs);
    this.timerFill.fillColor = r.remainingMs < 8000 ? 0xe4572e : 0xf2c14e;
    this.scoreText.setText(`✓ ${r.correct}/${r.total}`);
  }

  private makeButtons(): void {
    const gap = 12;
    const w = (this.W - 32 - gap) / 2;
    const h = 92;
    const y = this.H - h / 2 - 28;
    this.answers.forEach((a, i) => {
      const x = 16 + w / 2 + i * (w + gap);
      const bg = this.add.rectangle(0, 0, w, h, a.color).setStrokeStyle(3, 0xffffff, 0.9);
      const label = this.text(0, 0, a.label, 22, '#ffffff').setOrigin(0.5).setFontStyle('bold');
      const btn = this.add.container(x, y, [bg, label]).setSize(w, h);
      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => {
        this.tweens.add({ targets: btn, scale: 0.94, duration: 60, yoyo: true });
        this.choose(a.answer);
      });
      this.input.keyboard?.on(`keydown-${a.key}`, () => this.choose(a.answer));
      this.buttons.push(btn);
    });
  }

  private setButtonsEnabled(on: boolean): void {
    for (const b of this.buttons) b.setAlpha(on ? 1 : 0.45);
  }

  /** A centred modal card with a title, body lines and one big button. */
  private card(
    title: string,
    lines: string[],
    cta: string,
    onTap: () => void,
    titleColor: string,
  ): Phaser.GameObjects.Container {
    const p = this.palette;
    const w = this.W - 40;
    const shade = this.add.rectangle(0, 0, this.W, this.H, 0x000000, 0.6).setOrigin(0);
    shade.setInteractive();
    const body = this.text(0, 0, lines.join('\n'), 14, p.text)
      .setAlign('center')
      .setWordWrapWidth(w - 32)
      .setLineSpacing(4)
      .setOrigin(0.5, 0);
    const h = body.height + 150;
    const panel = this.add.rectangle(0, 0, w, h, p.panel).setStrokeStyle(3, 0xffffff, 0.8);
    const head = this.text(0, -h / 2 + 18, title, 20, titleColor)
      .setOrigin(0.5, 0)
      .setFontStyle('bold');
    body.setY(-h / 2 + 56);
    const btnBg = this.add
      .rectangle(0, h / 2 - 40, w - 60, 52, 0x3a7d44)
      .setStrokeStyle(2, 0xffffff);
    const btnLabel = this.text(0, h / 2 - 40, cta, 18, '#ffffff')
      .setOrigin(0.5)
      .setFontStyle('bold');
    const box = this.add.container(this.W / 2, this.H / 2, [panel, head, body, btnBg, btnLabel]);
    btnBg.setInteractive({ useHandCursor: true }).once('pointerdown', onTap);
    const wrap = this.add.container(0, 0, [shade, box]).setDepth(100);
    box.setScale(0.9);
    this.tweens.add({ targets: box, scale: 1, duration: 140, ease: 'Back.Out' });
    return wrap;
  }
}
