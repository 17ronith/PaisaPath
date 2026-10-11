// THE generic screen. Every task, detour and random event renders here from data.
// Layout follows the money-battle mock: opponent panel + portrait top, player panel
// mid, text box, 2×2 move grid. After a choice: bars tween, Aunty's lesson, effects,
// badges, then the explainer animation, then the Driver routes on.
import Phaser from 'phaser';
import { getSession } from '@/app/session';
import { rupees, t } from '@/shared/i18n';
import type { Choice, Cutscene, Effect, Outcome, Step } from '@/shared/types';
import { advance, save } from '../flow/Driver';
import { play } from '../audio';
import { say, sayAfter, stopVoice } from '../voice';
import { Bar } from '../ui/Bar';
import { Button } from '../ui/Button';
import { PixelPanel } from '../ui/PixelPanel';
import { Portrait, portraitKey } from '../ui/Portrait';
import { backdropKey, drawBackdrop, grassField } from '../ui/Backdrop';
import { TextBox } from '../ui/TextBox';
import { COLOR, text, tr } from '../ui/theme';
import { charScale } from '../ui/chars';
import { VIEW } from '../view';

type BattleStep = Extract<Step, { kind: 'task' } | { kind: 'event' }>;

/** Monthly income per stage (README §6) — only used to size the wallet bar. */
const STAGE_INCOME = { 1: 5000, 2: 25000, 3: 60000 } as const;
const EVENT_PRESSURE = 50;
const ARENA_BOTTOM = 284;

const PRAISE = [
  "Sharp. That's exactly how it's done.",
  'Good call. Your future self just got richer.',
  "That's the move. On we go.",
  'Well handled. Nothing to teach here.',
];
/** Deterministic per outcome so the same choice always gets the same praise. */
function praiseLine(o: Outcome): string {
  const i = Math.abs(Math.round(o.after.wallet + o.after.happiness)) % PRAISE.length;
  return tr(`professor.praise.${i + 1}`, PRAISE[i]);
}

/** ISSUES #28: a soft ground shadow under a fighter (no coloured platform): a wide faint
 *  penumbra with a darker core, so it reads on every Hyderabad backdrop. */
function platform(scene: Phaser.Scene, x: number, y: number, w: number): void {
  scene.add.ellipse(x, y, w * 0.95, w * 0.2, 0x000000, 0.16);
  scene.add.ellipse(x, y, w * 0.7, w * 0.14, 0x000000, 0.22);
  scene.add.ellipse(x, y, w * 0.42, w * 0.08, 0x000000, 0.26);
}
const LV = { simple: 'EASY', medium: 'MED', hard: 'HARD' } as const;
/** ISSUES #19: events whose caller is the scam caller arrive as a ringing phone first. */
const CALL_PORTRAIT = 'caller_wonky'; // older content marks calls by the caller's face
/** Choice cutscene id → the scene that plays it. */
const CUTSCENE_SCENES: Record<Cutscene, string> = { turf_cricket: 'TurfCricket' };

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
    const { width: W } = VIEW;
    const framing = this.step.framing;
    const isTask = this.step.kind === 'task';
    const task = isTask ? (this.step as Extract<Step, { kind: 'task' }>).task : null;
    const bars = game.state.bars;

    // Arena: the place's Hyderabad backdrop (ISSUES #18), grass field as the fallback.
    this.cameras.main.setBackgroundColor(COLOR.bg);
    if (!drawBackdrop(this, backdropKey(framing.place), 0, 40, W, ARENA_BOTTOM - 40))
      grassField(this, 0, 40, W, ARENA_BOTTOM - 40, 2, 3);
    this.add.rectangle(0, ARENA_BOTTOM - 2, W, 3, COLOR.panelEdge).setOrigin(0, 0);
    platform(this, 284, 150, 124);
    platform(this, 86, 266, 140);

    // Opponent panel
    const opp = new PixelPanel(this, 10, 50, 208, 66, { variant: 'blue' });
    const lv = task ? tr(`battle.level.${task.difficulty}`, LV[task.difficulty]) : '';
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
    const oppKey = portraitKey(this, framing.portrait, framing.speaker);
    if (oppKey)
      this.add
        .image(284, 152, oppKey)
        .setOrigin(0.5, 1)
        .setScale(charScale(this, oppKey, 5));
    else new Portrait(this, 284, 110, 76, framing.portrait ?? '', framing.speaker);

    // Badges
    if (task && this.step.kind === 'task' && this.step.returning)
      this.badge(t('battle.returning'), COLOR.warn, 128);
    if (this.step.kind === 'task' && this.step.isDetour)
      this.badge(tr('battle.detour', 'DETOUR'), COLOR.muted, 128, 12);

    // Player
    const avatar = game.state.profile.avatar;
    // From behind, head turned toward the opponent (three-quarter view); back view as fallback.
    const back = [`${avatar}_quarter`, `${avatar}_back`, avatar].find((k) =>
      this.textures.exists(k),
    )!;
    this.add
      .image(86, 270, back)
      .setOrigin(0.5, 1)
      .setScale(charScale(this, back, 6));
    const me = new PixelPanel(this, 152, 170, 198, 104, { variant: 'blue' });
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
    const call = framing.call ?? (framing.portrait === CALL_PORTRAIT ? 'voice' : undefined);
    const begin = (): void => {
      void this.box.say(opening, framing.speaker, COLOR.muted);
      if (!call) say(framing.text); // voice-over: the friend / shopkeeper's opening line (a caller already spoke on the call)
    };
    this.events.once('shutdown', stopVoice);
    if (call) this.incomingCall(call, begin);
    else begin();

    // Hint (after two fails on the same task)
    if (this.step.kind === 'task' && this.step.hintsOn) this.hint(task?.choices ?? []);

    this.showMoves(
      isTask ? task!.choices : (this.step as Extract<Step, { kind: 'event' }>).event.choices,
    );
  }

  /** ISSUES #19: ring first (IncomingCall on top); on Answer, the line opens and a call timer runs. */
  /** ISSUES #19: the call rings full screen first; once it has ended, the choices appear here. */
  private incomingCall(kind: 'voice' | 'video', begin: () => void): void {
    const f = this.step.framing;
    this.scene.launch('IncomingCall', {
      caller: f.speaker,
      line: f.text,
      kind,
      portrait: f.portrait,
      place: f.place,
      onEnded: (secs: number) => {
        begin();
        const m = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
        this.badge(`📞 ${tr('battle.call_ended', 'CALL ENDED')} ${m}`, 0x56684a, 122, 12);
      },
    });
    this.scene.bringToTop('IncomingCall');
  }

  private badge(label: string, color: number, y: number, x = 230): void {
    const b = this.add.container(x, y);
    const tx = text(this, 8, 4, label, 'xs', COLOR.white);
    b.add([this.add.rectangle(0, 0, tx.width + 16, 18, color).setOrigin(0, 0), tx]);
  }

  private hint(choices: Choice[]): void {
    // battle.hint is the panel's heading ("Aunty's hint"); the body is the task's own hint,
    // or the generic nudge when the task has none.
    const body =
      choices.find((c) => c.hint)?.hint ??
      tr('battle.hint_generic', 'Slow down. Who gains if you choose fast?');
    const W = VIEW.width;
    // The Professor's face beside his hint (48 px sprite at 1×).
    const face = this.textures.exists('professor') ? 46 : 0;
    const tx = 10 + face;
    const heading = text(this, tx, 7, tr('professor.hint', "Professor's hint"), 'xs', COLOR.aunty);
    const msg = text(this, tx, 7 + heading.height, body, 'xs', COLOR.ink, {
      wordWrap: { width: W - 164 - face, useAdvancedWrap: true },
    });
    const h = Math.max(msg.y + msg.height + 9, face ? 54 : 0);
    const p = new PixelPanel(this, 10, 122, W - 144, h, { variant: 'red' });
    p.add([heading, msg]);
    if (face) p.add(this.add.image(4, h - 4, 'professor').setOrigin(0, 1));
    sayAfter(body); // the Professor reads the hint once the opening line is done
  }

  private showMoves(choices: Choice[]): void {
    const W = VIEW.width;
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
    if (o.quality === 'good') {
      this.cameras.main.flash(200, 120, 220, 120);
      play('good');
    } else if (o.quality !== 'ok') {
      this.cameras.main.shake(200, 0.008);
      play('bad');
    }

    // ISSUES #17 — the Professor walks in after the consequence.
    // weak/critical: his lesson line, then the concept's animation. ok: the lesson line, no animation.
    // good: one line of praise and on we go — the animation stays in the replay library.
    const isMistake = o.quality === 'weak' || o.quality === 'critical';
    const professor = tr('professor.name', 'Professor');
    const line = o.quality === 'good' ? praiseLine(o) : o.lesson;
    void this.box.say(
      line,
      professor,
      COLOR.aunty,
      o.quality === 'good' ? 'professor_happy' : 'professor',
    );
    say(line);
    this.results(o);

    if (o.critical) this.restartFlash();
    else if (o.clearedConcept) this.badge(t('battle.learned'), COLOR.good, 128);

    // A choice can earn a short scene after its lesson (the turf match you saved for).
    const choices = this.step.kind === 'task' ? this.step.task.choices : this.step.event.choices;
    const cutscene = choices.find((c) => c.id === choiceId)?.cutscene;

    const W = VIEW.width;
    new Button(
      this,
      W / 2,
      600,
      t('btn.next'),
      () =>
        isMistake
          ? this.toExplainer(o.explainerId)
          : cutscene
            ? this.toCutscene(cutscene)
            : advance(this),
      { fill: o.critical ? COLOR.bad : COLOR.good, height: 52 },
    );
  }

  private toCutscene(cutscene: Cutscene): void {
    const key = CUTSCENE_SCENES[cutscene];
    if (!this.scene.manager.keys[key]) {
      advance(this);
      return;
    }
    this.scene.pause();
    this.scene.launch(key, { onDone: () => advance(this) });
    this.scene.bringToTop(key);
  }

  private results(o: Outcome): void {
    const W = VIEW.width;
    const lines: string[] = [];
    for (const e of o.firedNow) lines.push(`• ${e.label}${this.deltaText(e)}`);
    for (const e of o.scheduled) lines.push(`• ${e.label} ${t('battle.later')}`);
    if (o.bankedConcept) lines.push(`• ${tr('battle.banked', 'Added to "still learning"')}`);
    if (!lines.length) return;
    const body = text(this, 12, 10, lines.slice(0, 6).join('\n'), 'xs', COLOR.ink, {
      wordWrap: { width: W - 48, useAdvancedWrap: true },
    });
    const h = Math.min(150, Math.max(40, body.height + 22));
    const p = new PixelPanel(this, 12, 424, W - 24, h, { variant: 'card' });
    p.add(body);
  }

  private deltaText(e: Effect): string {
    const h = e.happiness;
    if (!h) return '';
    return `  ${h > 0 ? '+' : ''}${h} ${t('hud.happiness').toLowerCase()}`;
  }

  private restartFlash(): void {
    const { width: W, height: H } = VIEW;
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
