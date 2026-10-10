// Base scene for the two-button mini-games (Kirana Rush, Scam or Legit), drawn with the game's
// UI kit (src/game/ui: pixel font, palette, PixelPanel, Button, Bar, TextBox) so it looks like
// the battle screens.
// Flow: intro card (rules, START) → items one at a time → Aunty's "why" line after each tap
// (clock paused so it can be read) → score card → CONTINUE → onDone(won) → scene.stop().
// The offer screen then shows the pay. Started with data { onDone }; onDone fires exactly once,
// including when the game is quit or the scene is shut down from outside (then won = false, so
// the engine is never left waiting).
import Phaser from 'phaser';
import type { MiniGameDef } from '@/shared/types';
import { getSession } from '@/app/session';
import { Bar } from '@/game/ui/Bar';
import { Button } from '@/game/ui/Button';
import { PixelPanel } from '@/game/ui/PixelPanel';
import { TextBox } from '@/game/ui/TextBox';
import { COLOR, text, tr } from '@/game/ui/theme';
import { VIEW } from '@/game/view';
import { once, type OnDone, type SortItem, type SortRound, type Verdict } from './sortRound';

export interface MiniGameData {
  onDone?: OnDone;
}

export interface AnswerButton<A extends string> {
  answer: A;
  label: string;
  fill: number;
  /** Keyboard shortcut for desktop demos. */
  key: 'LEFT' | 'RIGHT';
}

type Phase = 'intro' | 'play' | 'feedback' | 'result';

export const FEEDBACK_MS = 1300;
const HEADER_H = 60;
const BOX_H = 76;
const BTN_H = 84;
/** Fill that Button maps to its grey Kenney skin. */
const GREY = 0x505878;

export abstract class SortGameScene<A extends string, T extends SortItem<A>> extends Phaser.Scene {
  protected round!: SortRound<A, T>;
  protected phase: Phase = 'intro';
  protected done = once(undefined);
  protected W = 360;
  protected H = 640;
  /** Vertical band the subclass draws items in (set in create()). */
  protected playTop = 0;
  protected playBottom = 0;

  private timer!: Bar;
  private scoreText!: Phaser.GameObjects.Text;
  private box!: TextBox;
  private buttons: Button[] = [];
  private overlay?: Phaser.GameObjects.Container;

  protected abstract readonly gameId: MiniGameDef['id'];
  /** Arena background colour. */
  protected abstract readonly arena: number;
  /** Left and right buttons (read at create(), so labels follow the current language). */
  protected abstract readonly answers: [AnswerButton<A>, AnswerButton<A>];
  protected abstract makeRound(): SortRound<A, T>;
  /** One line per rule on the intro card. */
  protected abstract rules(): string[];
  /** What Aunty says while the first item is up. */
  protected abstract prompt(): string;
  /** Draw the live item. */
  protected abstract showItem(item: T, index: number): void;
  /** Animate the item away after it was answered or missed. */
  protected abstract clearItem(verdict: Verdict<T>, answered: A | null): void;
  /** Per-frame hook while playing; return true when the live item expired (e.g. fell off). */
  protected updateItem(_dtMs: number): boolean {
    return false;
  }

  init(data: MiniGameData): void {
    this.done = once(data?.onDone);
    this.phase = 'intro';
    this.buttons = [];
    this.overlay = undefined;
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.done.call(false));
  }

  create(): void {
    // Logical 360×640 layout; the camera is zoomed by RES (src/game/view.ts).
    this.W = VIEW.width;
    this.H = VIEW.height;
    this.playTop = 8 + HEADER_H + 8;
    this.playBottom = this.H - 12 - BTN_H - 10 - BOX_H - 8;
    this.round = this.makeRound();
    this.cameras.main.setBackgroundColor(this.arena);
    // Swallow taps so nothing underneath (the paused offer screen) reacts.
    this.add.zone(0, 0, this.W, this.H).setOrigin(0).setInteractive();

    this.makeHeader(this.def());
    this.box = new TextBox(this, 8, this.playBottom + 8, this.W - 16, BOX_H);
    this.makeButtons();
    this.refreshHud();
    this.showIntro(this.def());
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
    this.say(this.prompt(), COLOR.muted);
    this.serve();
  }

  private serve(): void {
    const item = this.round.current;
    if (!item) {
      this.showResult();
      return;
    }
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
    const head = v.missed
      ? tr('minigame.too_slow', 'Too slow!')
      : v.correct
        ? tr('minigame.right', 'Right!')
        : tr('minigame.wrong', 'Not quite.');
    this.say(`${head} ${v.item.why}`, v.correct ? COLOR.good : COLOR.bad);
    if (v.correct) this.cameras.main.flash(120, 120, 220, 120);
    else this.cameras.main.shake(120, 0.006);
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
    const lines = [
      tr('minigame.score', '{correct} / {total} right', { correct: r.correct, total: r.total }),
      r.won
        ? tr('minigame.hit_target', 'You hit the target of {pass}!', { pass: r.opts.passCount })
        : tr('minigame.missed_target', 'You needed {pass}. Next shift!', {
            pass: r.opts.passCount,
          }),
    ];
    if (r.timeUp && r.verdicts.length < r.total) lines.unshift(tr('minigame.time_up', 'Time up!'));
    this.overlay = this.card(
      r.won ? tr('minigame.shift_done', 'SHIFT DONE!') : tr('minigame.shift_over', 'SHIFT OVER'),
      lines,
      tr('btn.continue', 'CONTINUE'),
      () => this.finish(r.won),
      r.won ? COLOR.good : COLOR.bad,
    );
  }

  private showIntro(def: MiniGameDef): void {
    this.overlay = this.card(
      def.title.toUpperCase(),
      [def.blurb, '', ...this.rules()],
      tr('btn.start', 'START'),
      () => this.start(),
      COLOR.aunty,
    );
  }

  /** Ends the mini-game: report once, then stop this scene (CONTRACTS §4.3). */
  protected finish(won: boolean): void {
    this.phase = 'result';
    this.done.call(won);
    this.scene.stop();
  }

  // ---- UI -------------------------------------------------------------------

  private def(): MiniGameDef {
    try {
      const d = getSession().content.minigames.find((m) => m.id === this.gameId);
      if (d) return d;
    } catch {
      /* no session (scene previewed standalone) */
    }
    return {
      id: this.gameId,
      title: this.gameId,
      blurb: '',
      rewardWalletPct: 8,
      rewardHappiness: 10,
    };
  }

  private makeHeader(def: MiniGameDef): void {
    const W = this.W;
    const quitW = 48;
    const panelW = W - 24 - quitW;
    const head = new PixelPanel(this, 8, 8, panelW, HEADER_H);
    head.add(text(this, 10, 6, def.title.toUpperCase(), 'xs', COLOR.ink));
    this.scoreText = text(this, panelW - 10, 6, '', 'xs', COLOR.money).setOrigin(1, 0);
    this.timer = new Bar(
      this,
      10,
      32,
      {
        label: tr('minigame.time', 'TIME'),
        max: this.round.opts.timeLimitMs / 1000,
        color: COLOR.warn,
        width: panelW - 20,
        format: (v) => tr('minigame.time_left', '{n}s', { n: Math.ceil(v) }),
      },
      this.round.opts.timeLimitMs / 1000,
    );
    head.add([this.scoreText, this.timer]);
    new Button(this, W - 8 - quitW / 2, 8 + HEADER_H / 2 - 1, 'X', () => this.finish(false), {
      width: quitW,
      height: HEADER_H - 3,
      fill: GREY,
    });
  }

  protected say(line: string, color: number): void {
    void this.box.say(line, tr('aunty.name', 'Aunty'), color);
    this.box.complete();
  }

  private refreshHud(): void {
    const r = this.round;
    this.timer.setValue(r.remainingMs / 1000, false);
    this.scoreText.setText(`${r.correct}/${r.total}`);
  }

  private makeButtons(): void {
    const gap = 12;
    const w = (this.W - 16 - gap) / 2;
    const y = this.H - 12 - BTN_H / 2;
    this.answers.forEach((a, i) => {
      const x = 8 + w / 2 + i * (w + gap);
      const btn = new Button(this, x, y, a.label, () => this.choose(a.answer), {
        width: w,
        height: BTN_H,
        size: 'lg',
        fill: a.fill,
      });
      this.input.keyboard?.on(`keydown-${a.key}`, () => this.choose(a.answer));
      this.buttons.push(btn);
    });
  }

  private setButtonsEnabled(on: boolean): void {
    for (const b of this.buttons) b.setEnabled(on);
  }

  /** A centred modal card with a title, body lines and one big button. */
  private card(
    title: string,
    lines: string[],
    cta: string,
    onTap: () => void,
    titleColor: number,
  ): Phaser.GameObjects.Container {
    const w = this.W - 40;
    const shade = this.add.rectangle(0, 0, this.W, this.H, COLOR.ink, 0.55).setOrigin(0);
    shade.setInteractive();
    const body = text(this, w / 2, 52, lines.join('\n'), 'xs', COLOR.ink, {
      align: 'center',
      wordWrap: { width: w - 32, useAdvancedWrap: true },
    }).setOrigin(0.5, 0);
    const h = body.height + 140;
    const y = Math.round((this.H - h) / 2);
    const panel = new PixelPanel(this, 20, y, w, h);
    panel.add([text(this, w / 2, 20, title, 'lg', titleColor).setOrigin(0.5, 0), body]);
    const btn = new Button(this, this.W / 2, y + h - 44, cta, onTap, {
      width: w - 48,
      fill: COLOR.good,
    });
    const wrap = this.add.container(0, 0, [shade, panel, btn]).setDepth(100);
    panel.setAlpha(0);
    btn.setAlpha(0);
    this.tweens.add({ targets: [panel, btn], alpha: 1, duration: 160 });
    return wrap;
  }
}
