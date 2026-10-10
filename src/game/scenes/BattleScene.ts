// THE generic screen. Every task, detour and random event renders here from data.
// Layout follows the money-battle mock: opponent panel + portrait top, player panel
// mid, text box, 2×2 move grid. After a choice: bars tween, Aunty's lesson, effects,
// badges, then the explainer animation, then the Driver routes on.
import Phaser from 'phaser';
import { getSession } from '@/app/session';
import { rupees, t } from '@/shared/i18n';
import type { Choice, Effect, Outcome, Step } from '@/shared/types';
import { advance, save } from '../flow/Driver';
import { Bar } from '../ui/Bar';
import { Button } from '../ui/Button';
import { PixelPanel } from '../ui/PixelPanel';
import { Portrait } from '../ui/Portrait';
import { TextBox } from '../ui/TextBox';
import { COLOR, text, tr } from '../ui/theme';

type BattleStep = Extract<Step, { kind: 'task' } | { kind: 'event' }>;

/** Monthly income per stage (README §6) — only used to size the wallet bar. */
const STAGE_INCOME = { 1: 5000, 2: 25000, 3: 60000 } as const;
const EVENT_PRESSURE = 50;
const LV = { simple: 'EASY', medium: 'MED', hard: 'HARD' } as const;

export class BattleScene extends Phaser.Scene {
  private step!: BattleStep;
  private wallet!: Bar;
  private happy!: Bar;
  private pressure!: Bar;
  private box!: TextBox;
  private moves: Phaser.GameObjects.GameObject[] = [];
  private busy = false;

  constructor() {
    super('Battle');
  }

  init(data: { step: Step }): void {
    this.step = data.step as BattleStep;
    this.moves = [];
    this.busy = false;
  }

  create(): void {
    const game = getSession().game;
    if (!game || !this.step || (this.step.kind !== 'task' && this.step.kind !== 'event')) {
      advance(this);
      return;
    }
    const { width: W } = this.scale;
    const framing = this.step.framing;
    const isTask = this.step.kind === 'task';
    const task = isTask ? (this.step as Extract<Step, { kind: 'task' }>).task : null;
    const bars = game.state.bars;

    // Arena
    this.cameras.main.setBackgroundColor(COLOR.bgBattle);
    this.add.ellipse(290, 150, 130, 30, COLOR.ground);
    this.add.ellipse(80, 268, 140, 30, COLOR.ground);

    // Opponent panel
    const opp = new PixelPanel(this, 12, 48, 206, 66);
    const lv = task ? tr(`battle.lv.${task.difficulty}`, LV[task.difficulty]) : '';
    opp.add(text(this, 10, 10, framing.title, 'sm', COLOR.ink, { wordWrap: { width: 150 } }));
    if (lv)
      opp.add(text(this, 196, 10, `${t('battle.lv')} ${lv}`, 'xs', COLOR.muted).setOrigin(1, 0));
    this.pressure = new Bar(
      this,
      10,
      34,
      { label: t('battle.pressure'), max: 100, color: COLOR.bad, width: 186, hideValue: true },
      task?.pressure ?? EVENT_PRESSURE,
    );
    opp.add(this.pressure);
    new Portrait(this, 290, 108, 76, framing.portrait ?? '', framing.speaker);

    // Badges
    if (task && this.step.kind === 'task' && this.step.returning)
      this.badge(t('battle.returning'), COLOR.warn, 128);
    if (this.step.kind === 'task' && this.step.isDetour)
      this.badge(tr('battle.detour', 'DETOUR'), COLOR.muted, 128, 12);

    // Player
    this.add.image(80, 236, game.state.profile.avatar).setScale(5);
    const me = new PixelPanel(this, 150, 166, 198, 106);
    me.add(text(this, 10, 8, t('battle.you'), 'sm', COLOR.ink));
    me.add(
      text(this, 188, 10, t('hud.stage', { n: game.state.stage }), 'xs', COLOR.muted).setOrigin(
        1,
        0,
      ),
    );
    this.wallet = new Bar(
      this,
      10,
      32,
      {
        label: t('hud.wallet'),
        max: STAGE_INCOME[game.state.stage],
        color: COLOR.money,
        width: 178,
        format: rupees,
      },
      bars.wallet,
    );
    this.happy = new Bar(
      this,
      10,
      66,
      { label: t('hud.happiness'), max: 100, color: COLOR.happy, width: 178 },
      bars.happiness,
    );
    me.add([this.wallet, this.happy]);

    // Text box
    this.box = new TextBox(this, 12, 286, W - 24, 128);
    const opening = framing.intro ? `${framing.intro}\n${framing.text}` : framing.text;
    void this.box.say(opening, framing.speaker, COLOR.muted);

    // Hint (after two fails on the same task)
    if (this.step.kind === 'task' && this.step.hintsOn) this.hint(task?.choices ?? []);

    this.showMoves(
      isTask ? task!.choices : (this.step as Extract<Step, { kind: 'event' }>).event.choices,
    );
  }

  private badge(label: string, color: number, y: number, x = 230): void {
    const b = this.add.container(x, y);
    const tx = text(this, 8, 4, label, 'xs', COLOR.white);
    b.add([this.add.rectangle(0, 0, tx.width + 16, 18, color).setOrigin(0, 0), tx]);
  }

  private hint(choices: Choice[]): void {
    const h =
      choices.find((c) => c.hint)?.hint ??
      tr('battle.hint', 'Think: what will you need later this month?');
    const W = this.scale.width;
    const p = new PixelPanel(this, 12, 120, W - 140, 40, { fill: 0xfbe8f2, edge: COLOR.aunty });
    p.add(
      text(this, 8, 6, h, 'xs', COLOR.ink, { wordWrap: { width: W - 160, useAdvancedWrap: true } }),
    );
  }

  private showMoves(choices: Choice[]): void {
    const W = this.scale.width;
    const cols = choices.length === 1 ? 1 : 2;
    const bw = cols === 1 ? W - 24 : (W - 36) / 2;
    choices.forEach((c, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = cols === 1 ? W / 2 : 12 + bw / 2 + col * (bw + 12);
      const y = 466 + row * 92;
      const b = new Button(this, x, y, c.text, () => this.pick(c.id), {
        width: bw,
        height: 80,
        size: 'xs',
      });
      this.moves.push(b);
    });
  }

  private async pick(choiceId: string): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    const game = getSession().game!;
    let o: Outcome;
    try {
      o = game.choose(choiceId);
    } catch (e) {
      console.error(e);
      this.busy = false;
      return;
    }
    save();
    this.moves.forEach((m) => m.destroy());
    this.moves = [];

    await Promise.all([
      this.wallet.setValue(o.after.wallet),
      this.happy.setValue(o.after.happiness),
      this.pressure.setValue(o.pressureAfter),
    ]);
    if (o.quality === 'good') this.cameras.main.flash(200, 120, 220, 120);
    else if (o.quality !== 'ok') this.cameras.main.shake(200, 0.008);

    const auntyLine = o.lesson;
    void this.box.say(auntyLine, tr('aunty.name', 'Aunty'), COLOR.aunty);
    this.results(o);

    if (o.critical) this.restartFlash();
    else if (o.clearedConcept) this.badge(t('battle.learned'), COLOR.good, 128);

    const W = this.scale.width;
    new Button(this, W / 2, 600, t('btn.next'), () => this.toExplainer(o.explainerId), {
      fill: o.critical ? COLOR.bad : COLOR.good,
      height: 52,
    });
  }

  private results(o: Outcome): void {
    const W = this.scale.width;
    const lines: string[] = [];
    for (const e of o.firedNow) lines.push(`• ${e.label}${this.deltaText(e)}`);
    for (const e of o.scheduled) lines.push(`• ${e.label} ${t('battle.later')}`);
    if (o.bankedConcept) lines.push(`• ${tr('battle.banked', 'Added to "still learning"')}`);
    if (!lines.length) return;
    const p = new PixelPanel(this, 12, 424, W - 24, 140, { shadow: false });
    p.add(
      text(this, 10, 10, lines.slice(0, 6).join('\n'), 'xs', COLOR.ink, {
        wordWrap: { width: W - 48, useAdvancedWrap: true },
      }),
    );
  }

  private deltaText(e: Effect): string {
    const h = e.happiness;
    if (!h) return '';
    return `  ${h > 0 ? '+' : ''}${h} ${t('hud.happiness').toLowerCase()}`;
  }

  private restartFlash(): void {
    const { width: W, height: H } = this.scale;
    this.cameras.main.flash(300, 220, 40, 40);
    const r = this.add.rectangle(W / 2, H * 0.36, W, 56, COLOR.bad).setAlpha(0.92);
    const tx = text(this, W / 2, H * 0.36, t('battle.restart'), 'xl', COLOR.white).setOrigin(0.5);
    this.tweens.add({
      targets: [r, tx],
      alpha: { from: 0, to: 1 },
      duration: 200,
      yoyo: true,
      hold: 900,
      repeat: 0,
    });
  }

  private toExplainer(explainerId: string): void {
    const has = getSession().content.explainers.some((x) => x.id === explainerId);
    if (!has) {
      advance(this);
      return;
    }
    this.scene.pause();
    this.scene.launch('Explainer', { explainerId, onDone: () => advance(this) });
    this.scene.bringToTop('Explainer');
  }
}
