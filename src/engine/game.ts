// The chapter loop (CONTRACTS §2.2) behind the frozen Game API.
//
// Step protocol for the UI:
//  - 'task' | 'event' | 'minigame_offer' | 'invest' | 'quiz_after' need an answer
//    (choose / playMinigame|skipMinigame / allocate / answerQuiz). Until then next() returns the
//    same Step.
//  - 'chapter_start' | 'stage_end' | 'epilogue' are informational: the following next() call
//    acknowledges them and moves on.
//  - 'done' is terminal.
// toJSON() always returns the state from just before the Step on screen, so a save taken at any
// moment resumes on that same Step.
import type {
  Bars,
  Choice,
  ContentPack,
  Effect,
  Game,
  GameState,
  InfoStatus,
  MiniGameDef,
  Outcome,
  Portfolio,
  Profile,
  Projection,
  Quality,
  RandomEvent,
  Report,
  Step,
  Summary,
  Task,
  WhatIfResult,
} from '@/shared/types';
import { bank, clear } from './bank';
import {
  INVEST_CHAPTERS,
  LAST_CHAPTER,
  STAGE_END_YEARS,
  incomeCoins,
  livingCostCoins,
  realRef,
  stageOfChapter,
} from './economy';
import { applyEffect, fireDue, fireEffect, resolveEffects, scheduledWalletCoins } from './effects';
import { growPortfolio, projection } from './invest';
import { dequeueEvent, pendingEvents, recordAllocation, recordMinigameWin } from './records';
import { bindRng, type Rng } from './rng';
import { summarize } from './scoring';
import { clone, initialState } from './state';
import { framingFor, pickEvent, pickMainTask } from './selector';
import { whatIf } from './whatif';

export const HAPPINESS_DECAY = 3;
export const MINIGAME_CHANCE = 0.4;
export const LOCK_HAPPINESS = 30;
export const LOCK_WALLET_SHARE = 0.1;
export const HINTS_AFTER_FAILS = 2;
const EVENT_PRESSURE = 50;
const PRESSURE_DROP: Record<Quality, number> = { good: 40, ok: 20, weak: 5, critical: 0 };
const INFO_STEPS = new Set<Step['kind']>(['chapter_start', 'stage_end', 'epilogue']);

export class EngineGame implements Game {
  private readonly s: GameState;
  private readonly rng: Rng;
  private current: Step | null = null;
  private anchor: GameState | null = null;

  constructor(
    private readonly content: ContentPack,
    state: GameState,
  ) {
    this.s = state;
    this.rng = bindRng(state);
  }

  get state(): GameState {
    return this.s;
  }

  // ---- stepping ----------------------------------------------------------

  next(): Step {
    if (this.current && !INFO_STEPS.has(this.current.kind)) return this.current;
    this.anchor = clone(this.s);
    this.current = this.produce();
    return this.current;
  }

  private produce(): Step {
    const s = this.s;
    for (let guard = 0; guard < 64; guard++) {
      switch (s.phase) {
        case 'chapter_start':
          return this.startChapter();
        case 'invest':
          return {
            kind: 'invest',
            savingsCoins: s.bars.savings,
            assets: this.content.assets,
            portfolio: { ...s.portfolio },
          };
        case 'main_task': {
          const step = this.serveMainTask();
          if (step) return step;
          s.phase = 'event';
          break;
        }
        case 'detour': {
          const step = this.serveDetour();
          if (step) return step;
          s.phase = this.afterDetourPhase();
          break;
        }
        case 'event': {
          const step = this.serveEvent();
          if (step) return step;
          s.phase = 'minigame';
          break;
        }
        case 'minigame': {
          const step = this.offerMinigame();
          if (step) return step;
          this.endChapter();
          break;
        }
        case 'stage_end':
          return this.endStage();
        case 'epilogue':
          s.phase = 'quiz_after';
          return { kind: 'epilogue', projection: this.projection() };
        case 'quiz_after':
          return { kind: 'quiz_after' };
        case 'done':
          return { kind: 'done', summary: this.summary() };
      }
    }
    throw new Error(`engine: phase loop did not settle (phase ${s.phase})`);
  }

  private startChapter(): Step {
    const s = this.s;
    s.stage = stageOfChapter(s.chapter);
    const income = incomeCoins(s.stage);
    s.bars.wallet += income;
    const living = livingCostCoins(s.stage);
    s.bars.wallet -= living;
    const decay = Math.min(HAPPINESS_DECAY, s.bars.happiness);
    s.bars.happiness -= decay;
    const fired = fireDue(s);
    if (living > 0)
      fired.unshift({ label: `Rent, food and travel: −₹${living.toLocaleString('en-IN')}` });
    s.phase = INVEST_CHAPTERS.includes(s.chapter) && s.bars.savings > 0 ? 'invest' : 'main_task';
    return {
      kind: 'chapter_start',
      chapter: s.chapter,
      stage: s.stage,
      incomeCoins: income,
      livingCostCoins: living,
      fired,
      happinessDecay: decay,
    };
  }

  private taskStep(task: Task, isDetour: boolean, returning: boolean): Step {
    return {
      kind: 'task',
      task,
      framing: framingFor(task, this.s.profile.persona),
      isDetour,
      hintsOn: (this.s.failCounts[task.id] ?? 0) >= HINTS_AFTER_FAILS,
      returning,
    };
  }

  /** Re-serving after a critical choice: bars go back to where the task started. */
  private takeRestart(id: string): boolean {
    const s = this.s;
    if (s.pendingRestart !== id) return false;
    s.bars = { ...(s.barsAtTaskStart ?? s.bars) };
    delete s.pendingRestart;
    return true;
  }

  private beginItem(): void {
    this.s.barsAtTaskStart = { ...this.s.bars };
  }

  private serveMainTask(): Step | null {
    const s = this.s;
    if (s.pendingRestart) {
      const task = this.task(s.pendingRestart);
      if (task && this.takeRestart(task.id)) return this.taskStep(task, false, false);
      delete s.pendingRestart;
    }
    const pick = pickMainTask(s, this.content, this.rng);
    if (!pick) return null;
    s.seenTasks.push(pick.task.id);
    this.beginItem();
    return this.taskStep(pick.task, false, pick.returning);
  }

  private serveDetour(): Step | null {
    const s = this.s;
    const task = s.pendingDetour ? this.task(s.pendingDetour) : undefined;
    if (!task) {
      delete s.pendingDetour;
      return null;
    }
    if (!this.takeRestart(task.id)) {
      if (!s.seenTasks.includes(task.id)) s.seenTasks.push(task.id);
      this.beginItem();
    }
    return this.taskStep(task, true, false);
  }

  /** After a detour, rejoin where its origin left off (main task → event, event → mini-game). */
  private afterDetourPhase(): GameState['phase'] {
    for (let i = this.s.log.length - 1; i >= 0; i--) {
      const e = this.s.log[i];
      if (!e.isDetour) return e.isEvent ? 'minigame' : 'event';
    }
    return 'event';
  }

  private serveEvent(): Step | null {
    const s = this.s;
    if (s.pendingRestart) {
      const ev = this.event(s.pendingRestart);
      if (ev && this.takeRestart(ev.id)) {
        return { kind: 'event', event: ev, framing: framingFor(ev, s.profile.persona) };
      }
      delete s.pendingRestart;
    }
    for (const id of pendingEvents(s)) if (!this.event(id)) dequeueEvent(s, id);
    const ev = pickEvent(s, this.content, this.rng);
    if (!ev) return null;
    dequeueEvent(s, ev.id);
    this.beginItem();
    return { kind: 'event', event: ev, framing: framingFor(ev, s.profile.persona) };
  }

  private lockReason(): string | undefined {
    const s = this.s;
    if (s.bars.happiness < LOCK_HAPPINESS) return 'Too stressed for a side gig right now.';
    if (s.bars.wallet < LOCK_WALLET_SHARE * incomeCoins(s.stage)) {
      return 'Too broke to take the time off for a side gig.';
    }
    return undefined;
  }

  private offerMinigame(): Step | null {
    const games = this.content.minigames;
    if (games.length === 0 || this.rng.next() >= MINIGAME_CHANCE) return null;
    const minigame = this.rng.pick(games);
    const lockReason = this.lockReason();
    return lockReason
      ? { kind: 'minigame_offer', minigame, locked: true, lockReason }
      : { kind: 'minigame_offer', minigame, locked: false };
  }

  private endChapter(): void {
    const s = this.s;
    if (STAGE_END_YEARS[s.chapter]) {
      s.phase = 'stage_end';
    } else {
      s.chapter += 1;
      s.phase = 'chapter_start';
    }
  }

  private endStage(): Step {
    const s = this.s;
    const stage = s.stage;
    const yearsSkipped = STAGE_END_YEARS[s.chapter] ?? 0;
    const portfolioBefore = { ...s.portfolio };
    const { after, yearlyReturns } = growPortfolio(
      s.portfolio,
      this.content.assets,
      yearsSkipped,
      this.rng,
    );
    s.portfolio = after;
    if (s.chapter >= LAST_CHAPTER) {
      s.phase = 'epilogue';
    } else {
      s.chapter += 1;
      s.phase = 'chapter_start';
    }
    return {
      kind: 'stage_end',
      stage,
      yearsSkipped,
      portfolioBefore,
      portfolioAfter: { ...after },
      yearlyReturns,
    };
  }

  // ---- answers -----------------------------------------------------------

  /** Would this choice break the wallet (spend into < 0) or happiness (drop to ≤ 0)? */
  private breaches(before: Bars, choice: Choice): boolean {
    let bars = before;
    let dHappy = 0;
    for (const e of choice.effects) {
      if ((e.delayChapters ?? 0) > 0) continue;
      bars = applyEffect(bars, e, this.s.stage, this.s.profile);
      dHappy += e.happiness ?? 0;
    }
    const broke = bars.wallet < 0 && bars.wallet < before.wallet;
    const miserable = dHappy < 0 && before.happiness + dHappy <= 0;
    return broke || miserable;
  }

  choose(choiceId: string): Outcome {
    const step = this.current;
    if (!step || (step.kind !== 'task' && step.kind !== 'event')) {
      throw new Error(`choose() needs a task or event step; current is ${step?.kind ?? 'none'}`);
    }
    const s = this.s;
    const isEvent = step.kind === 'event';
    const isDetour = step.kind === 'task' && step.isDetour;
    const item: Task | RandomEvent = step.kind === 'task' ? step.task : step.event;
    const choice = item.choices.find((c) => c.id === choiceId);
    if (!choice) throw new Error(`unknown choice '${choiceId}' for ${item.id}`);

    const before = { ...s.bars };
    // Going broke / hitting zero happiness only restarts when another choice would have avoided it.
    const escapable = item.choices.some(
      (c) => c.quality !== 'critical' && !this.breaches(before, c),
    );
    const critical = choice.quality === 'critical' || (escapable && this.breaches(before, choice));
    const quality: Quality = critical ? 'critical' : choice.quality;

    const { firedNow, scheduled } = resolveEffects(s, choice.effects, item.id);
    const after = { ...s.bars };
    s.log.push({
      chapter: s.chapter,
      taskId: item.id,
      choiceId,
      quality,
      before,
      after,
      isDetour,
      isEvent,
    });

    const concept = step.kind === 'task' ? step.task.concept : step.event.concept;
    let bankedConcept: string | undefined;
    let clearedConcept: string | undefined;
    if (concept && (quality === 'weak' || quality === 'critical')) {
      bank(s, concept);
      bankedConcept = concept;
    } else if (concept && quality === 'good' && clear(s, concept)) {
      clearedConcept = concept;
    }

    const explainerId = choice.explainerId ?? this.explainerFor(concept) ?? '';
    if (explainerId && !s.seenExplainers.includes(explainerId)) s.seenExplainers.push(explainerId);

    let detourTaskId: string | undefined;
    if (critical) {
      s.failCounts[item.id] = (s.failCounts[item.id] ?? 0) + 1;
      s.restarts += 1;
      s.pendingRestart = item.id;
    } else if (
      quality === 'weak' &&
      !isDetour &&
      choice.detourTaskId &&
      this.task(choice.detourTaskId)
    ) {
      detourTaskId = choice.detourTaskId;
      s.pendingDetour = detourTaskId;
      s.detoursTaken += 1;
      s.phase = 'detour';
    } else if (isDetour) {
      delete s.pendingDetour;
      s.phase = this.afterDetourPhase();
    } else {
      s.phase = isEvent ? 'minigame' : 'event';
    }
    this.current = null;

    const pressure = step.kind === 'task' ? step.task.pressure : EVENT_PRESSURE;
    const outcome: Outcome = {
      before,
      after,
      quality,
      lesson: choice.lesson,
      explainerId,
      firedNow,
      scheduled,
      critical,
      pressureAfter: Math.max(0, pressure - PRESSURE_DROP[quality]),
    };
    if (detourTaskId) outcome.detourTaskId = detourTaskId;
    if (bankedConcept) outcome.bankedConcept = bankedConcept;
    if (clearedConcept) outcome.clearedConcept = clearedConcept;
    return outcome;
  }

  playMinigame(id: MiniGameDef['id'], won: boolean): Effect[] {
    const step = this.current;
    if (step?.kind !== 'minigame_offer') {
      throw new Error(`playMinigame() needs a minigame_offer step; current is ${step?.kind}`);
    }
    const s = this.s;
    const def = this.content.minigames.find((m) => m.id === id) ?? step.minigame;
    const fired: Effect[] = [];
    if (won && !step.locked) {
      const reward: Effect = {
        label: `${def.title}: side gig paid`,
        wallet: (realRef(s.stage, s.profile) * def.rewardWalletPct) / 100,
        happiness: def.rewardHappiness,
      };
      fireEffect(s, reward, s.stage);
      recordMinigameWin(s, s.chapter);
      fired.push(reward);
    }
    this.current = null;
    this.endChapter();
    return fired;
  }

  skipMinigame(): void {
    if (this.current?.kind !== 'minigame_offer') {
      throw new Error(
        `skipMinigame() needs a minigame_offer step; current is ${this.current?.kind}`,
      );
    }
    this.current = null;
    this.endChapter();
  }

  allocate(alloc: Portfolio): void {
    const step = this.current;
    if (step?.kind !== 'invest') {
      throw new Error(`allocate() needs an invest step; current is ${step?.kind}`);
    }
    const s = this.s;
    const clean: Portfolio = {};
    let total = 0;
    for (const [id, raw] of Object.entries(alloc)) {
      const v = Math.floor(raw ?? 0);
      if (!Number.isFinite(v) || v < 0) throw new Error(`allocate(): bad amount for ${id}`);
      if (!this.content.assets.some((a) => a.id === id)) {
        throw new Error(`allocate(): unknown asset ${id}`);
      }
      if (v > 0) clean[id as keyof Portfolio] = v;
      total += v;
    }
    if (total > s.bars.savings) {
      throw new Error(`allocate(): ${total} exceeds savings ${s.bars.savings}`);
    }
    const savingsBefore = s.bars.savings;
    s.bars.savings -= total;
    for (const [id, v] of Object.entries(clean) as [keyof Portfolio, number][]) {
      s.portfolio[id] = (s.portfolio[id] ?? 0) + v;
    }
    if (total > 0)
      recordAllocation(s, { chapter: s.chapter, savings: savingsBefore, alloc: clean });
    this.current = null;
    s.phase = 'main_task';
  }

  answerQuiz(answers: number[]): number {
    const s = this.s;
    if (s.phase !== 'quiz_after')
      throw new Error(`answerQuiz() needs quiz_after; phase ${s.phase}`);
    const score = this.content.quiz.reduce((n, q, i) => n + (answers[i] === q.answer ? 1 : 0), 0);
    s.quizAfter = score;
    s.quizAfterAnswers = [...answers];
    s.phase = 'done';
    this.current = null;
    return score;
  }

  // ---- read-only views ---------------------------------------------------

  status(): InfoStatus {
    const s = this.s;
    const commitments = s.scheduled
      .filter((x) => (x.effect.wallet ?? 0) < 0)
      .map((x) => ({
        label: x.effect.label,
        perChapter: Math.abs(scheduledWalletCoins(x, s.profile)),
        remaining: x.remaining,
      }));
    const lentOut = s.scheduled
      .filter((x) => (x.effect.wallet ?? 0) > 0)
      .reduce((a, x) => a + scheduledWalletCoins(x, s.profile) * x.remaining, 0);
    const lockReason = this.lockReason();
    const status: InfoStatus = {
      bars: { ...s.bars },
      stage: s.stage,
      chapter: s.chapter,
      commitments,
      lentOut,
      mistakes: s.mistakes.flatMap((id) => this.content.concepts.filter((c) => c.id === id)),
      learned: s.learned.flatMap((id) => this.content.concepts.filter((c) => c.id === id)),
      minigamesLocked: lockReason !== undefined,
      portfolio: { ...s.portfolio },
    };
    if (lockReason) status.lockReason = lockReason;
    return status;
  }

  private reachedEpilogue(): boolean {
    const p = this.s.phase;
    return (
      p === 'epilogue' || p === 'quiz_after' || p === 'done' || this.current?.kind === 'epilogue'
    );
  }

  private projection(): Projection {
    return projection(this.s, this.content.assets);
  }

  summary(): Summary {
    return summarize(this.s, this.content, this.reachedEpilogue() ? this.projection() : null);
  }

  whatIf(): WhatIfResult | null {
    return whatIf(this.content, this.s, (c, st) => new EngineGame(c, st));
  }

  report(): Report {
    const p = this.s.profile;
    const report: Report = {
      nickname: p.nickname,
      persona: p.persona,
      difficulty: p.difficulty,
      generatedAt: new Date().toISOString(),
      summary: this.summary(),
    };
    if (p.joinCode) report.joinCode = p.joinCode;
    return report;
  }

  toJSON(): GameState {
    return clone(this.current && this.anchor ? this.anchor : this.s);
  }

  // ---- content lookups ---------------------------------------------------

  private task(id: string): Task | undefined {
    return this.content.tasks.find((t) => t.id === id);
  }

  private event(id: string): RandomEvent | undefined {
    return this.content.events.find((e) => e.id === id);
  }

  private explainerFor(concept: string | undefined): string | undefined {
    if (!concept) return undefined;
    return (
      this.content.concepts.find((c) => c.id === concept)?.explainerId ??
      this.content.explainers.find((e) => e.concept === concept)?.id
    );
  }
}

export function createGame(content: ContentPack, profile: Profile, seed = Date.now()): Game {
  return new EngineGame(content, initialState(profile, seed));
}

export function loadGame(content: ContentPack, state: GameState): Game {
  return new EngineGame(content, clone(state));
}
