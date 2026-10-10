// ─────────────────────────────────────────────────────────────────────────
// STUB ENGINE — Saharsh replaces the internals; this file KEEPS exporting
// createGame, loadGame, scaleToCoins (see docs/plan/CONTRACTS.md §1–2).
// The stub: cycles the stage's tasks in order, applies effects (scaled),
// no scheduler, no mistake bank, zero scores. Enough for Ronith's screens.
// ─────────────────────────────────────────────────────────────────────────
import type {
  Bars,
  Choice,
  ContentPack,
  Effect,
  EconomyParams,
  Game,
  GameState,
  InfoStatus,
  MiniGameDef,
  Outcome,
  Pillar,
  Portfolio,
  Profile,
  Report,
  Stage,
  Step,
  Summary,
  Task,
  WhatIfResult,
} from '@/shared/types';

export const ECONOMY: EconomyParams = {
  stageIncomeCoins: { 1: 5000, 2: 25000, 3: 60000 },
  stageRealRef: { 1: 0 /* profile.pocketMoneyMonthly */, 2: 20000, 3: 50000 },
};

export function scaleToCoins(realRupees: number, stage: Stage, profile: Profile): number {
  const ref = stage === 1 ? Math.max(1, profile.pocketMoneyMonthly) : ECONOMY.stageRealRef[stage];
  return Math.round((realRupees * ECONOMY.stageIncomeCoins[stage]) / ref);
}

const STAGE_OF_CHAPTER: Record<number, Stage> = {
  1: 1,
  2: 1,
  3: 1,
  4: 1,
  5: 2,
  6: 2,
  7: 2,
  8: 3,
  9: 3,
  10: 3,
};
const LAST_CHAPTER = 10;

function emptySummary(state: GameState): Summary {
  const pp = (): Record<Pillar, { good: number; total: number }> => ({
    budget: { good: 0, total: 0 },
    save: { good: 0, total: 0 },
    invest: { good: 0, total: 0 },
    safety: { good: 0, total: 0 },
  });
  const items = Object.fromEntries(
    [
      'division',
      'time_value',
      'loan_interest',
      'simple_interest',
      'compound_interest',
      'inflation',
      'risk_return',
      'diversification',
      'keeps_budget',
      'takes_responsibility',
      'major_expense_no_borrow',
      'saves_actively',
      'compares_options',
      'long_term_goals',
      'watches_finances',
      'pays_bills_on_time',
      'considers_affordability',
    ].map((k) => [k, null]),
  ) as Summary['ncfe']['items'];
  return {
    finalBars: { ...state.bars },
    perPillar: pp(),
    ncfe: { knowledge: 0, behaviour: 0, attitude: 1, literate: false, items },
    safety: { spotted: 0, faced: 0 },
    mistakesFixed: [],
    mistakesOpen: [...state.mistakes],
    detoursTaken: state.detoursTaken,
    restarts: state.restarts,
    quizBefore: state.profile.quizBefore,
    quizAfter: state.quizAfter ?? null,
    learningGain: state.quizAfter == null ? null : state.quizAfter - state.profile.quizBefore,
    biggestMistake: null,
    projection: null,
  };
}

class StubGame implements Game {
  state: GameState;
  private content: ContentPack;
  private current: Step | null = null;
  private currentTask: Task | null = null;

  constructor(content: ContentPack, state: GameState) {
    this.content = content;
    this.state = state;
  }

  private applyEffects(effects: Effect[]): Effect[] {
    const s = this.state;
    const fired: Effect[] = [];
    for (const e of effects) {
      if (e.delayChapters && e.delayChapters > 0) continue; // stub: delayed effects dropped
      if (e.wallet) s.bars.wallet += scaleToCoins(e.wallet, s.stage, s.profile);
      if (e.savings) s.bars.savings += scaleToCoins(e.savings, s.stage, s.profile);
      if (e.happiness)
        s.bars.happiness = Math.max(0, Math.min(100, s.bars.happiness + e.happiness));
      if (e.setFlag && !s.flags.includes(e.setFlag)) s.flags.push(e.setFlag);
      if (e.clearFlag) s.flags = s.flags.filter((f) => f !== e.clearFlag);
      fired.push(e);
    }
    return fired;
  }

  next(): Step {
    if (this.current) return this.current;
    const s = this.state;
    if (s.phase === 'done') return (this.current = { kind: 'done', summary: this.summary() });
    if (s.phase === 'quiz_after') return (this.current = { kind: 'quiz_after' });
    if (s.phase === 'epilogue') {
      return (this.current = {
        kind: 'epilogue',
        projection: {
          ageAt: 60,
          assumptionLine:
            'Assumes 8% a year. Real returns vary and can be negative. Simulations are assumptions, not promises.',
          perAsset: [],
          totalInvested: 0,
          totalFinal: 0,
          ifNotInvested: 0,
          savingsFinal: s.bars.savings,
        },
      });
    }
    if (s.phase === 'chapter_start') {
      s.stage = STAGE_OF_CHAPTER[s.chapter] ?? 3;
      const income = ECONOMY.stageIncomeCoins[s.stage];
      s.bars.wallet += income;
      s.phase = 'main_task';
      return (this.current = {
        kind: 'chapter_start',
        chapter: s.chapter,
        stage: s.stage,
        incomeCoins: income,
        fired: [],
        happinessDecay: 0,
      });
    }
    if (s.phase === 'main_task') {
      const pool = this.content.tasks.filter(
        (t) => t.stage === s.stage && !t.isDetour && !s.seenTasks.includes(t.id),
      );
      const task =
        pool[0] ??
        this.content.tasks.filter((t) => !t.isDetour)[s.chapter % this.content.tasks.length];
      this.currentTask = task;
      s.barsAtTaskStart = { ...s.bars };
      const framing = task.framings[s.profile.persona] ?? task.framings.default;
      return (this.current = {
        kind: 'task',
        task,
        framing,
        isDetour: false,
        hintsOn: false,
        returning: false,
      });
    }
    // stage_end / advance
    if (s.phase === 'stage_end') {
      const stage = s.stage;
      s.chapter += 1;
      if (s.chapter > LAST_CHAPTER) s.phase = 'epilogue';
      else s.phase = 'chapter_start';
      return (this.current = {
        kind: 'stage_end',
        stage,
        yearsSkipped: stage === 1 ? 5 : stage === 2 ? 6 : 25,
        portfolioBefore: { ...s.portfolio },
        portfolioAfter: { ...s.portfolio },
        yearlyReturns: { cashbox: [], banyan: [], chai: [], mango: [] },
      });
    }
    s.phase = 'chapter_start';
    return this.next();
  }

  choose(choiceId: string): Outcome {
    const s = this.state;
    const task = this.currentTask;
    if (!task || !this.current || this.current.kind !== 'task')
      throw new Error('choose() called without a task step');
    const choice: Choice | undefined = task.choices.find((c) => c.id === choiceId);
    if (!choice) throw new Error(`unknown choice ${choiceId} for task ${task.id}`);
    const before = { ...s.bars };
    const firedNow = this.applyEffects(choice.effects);
    const after = { ...s.bars };
    const critical = choice.quality === 'critical' || s.bars.wallet < 0 || s.bars.happiness <= 0;
    s.log.push({
      chapter: s.chapter,
      taskId: task.id,
      choiceId,
      quality: choice.quality,
      before,
      after,
      isDetour: false,
      isEvent: false,
    });
    const concept = this.content.concepts.find((c) => c.id === task.concept);
    const explainerId = choice.explainerId ?? concept?.explainerId ?? this.content.explainers[0].id;
    if (!s.seenExplainers.includes(explainerId)) s.seenExplainers.push(explainerId);
    if (critical) {
      s.bars = { ...(s.barsAtTaskStart ?? before) };
      s.restarts += 1;
      s.failCounts[task.id] = (s.failCounts[task.id] ?? 0) + 1;
      // next() re-serves the same task (phase stays main_task)
    } else {
      s.seenTasks.push(task.id);
      const chapterIsStageEnd = s.chapter === 4 || s.chapter === 7 || s.chapter === 10;
      if (chapterIsStageEnd) s.phase = 'stage_end';
      else {
        s.chapter += 1;
        s.phase = 'chapter_start';
      }
    }
    this.current = null;
    return {
      before,
      after,
      quality: choice.quality,
      lesson: choice.lesson,
      explainerId,
      firedNow,
      scheduled: choice.effects.filter((e) => (e.delayChapters ?? 0) > 0),
      critical,
      detourTaskId: choice.detourTaskId,
      pressureAfter: critical ? task.pressure : Math.max(0, task.pressure - 40),
    };
  }

  playMinigame(_id: MiniGameDef['id'], won: boolean): Effect[] {
    this.current = null;
    if (!won) return [];
    const e: Effect = { label: 'Side gig paid', happiness: 10 };
    this.state.bars.wallet += Math.round(ECONOMY.stageIncomeCoins[this.state.stage] * 0.08);
    this.state.bars.happiness = Math.min(100, this.state.bars.happiness + 10);
    return [e];
  }
  skipMinigame(): void {
    this.current = null;
  }
  allocate(alloc: Portfolio): void {
    const s = this.state;
    let total = 0;
    for (const v of Object.values(alloc)) total += v ?? 0;
    if (total > s.bars.savings) throw new Error('allocation exceeds savings');
    s.bars.savings -= total;
    for (const [k, v] of Object.entries(alloc))
      s.portfolio[k as keyof Portfolio] = (s.portfolio[k as keyof Portfolio] ?? 0) + (v ?? 0);
    this.current = null;
  }
  answerQuiz(answers: number[]): number {
    const score = this.content.quiz.reduce((n, q, i) => n + (answers[i] === q.answer ? 1 : 0), 0);
    this.state.quizAfter = score;
    this.state.quizAfterAnswers = answers;
    this.state.phase = 'done';
    this.current = null;
    return score;
  }
  status(): InfoStatus {
    const s = this.state;
    return {
      bars: { ...s.bars },
      stage: s.stage,
      chapter: s.chapter,
      commitments: [],
      lentOut: 0,
      mistakes: this.content.concepts.filter((c) => s.mistakes.includes(c.id)),
      learned: this.content.concepts.filter((c) => s.learned.includes(c.id)),
      minigamesLocked:
        s.bars.happiness < 30 || s.bars.wallet < ECONOMY.stageIncomeCoins[s.stage] * 0.1,
      portfolio: { ...s.portfolio },
    };
  }
  summary(): Summary {
    return emptySummary(this.state);
  }
  whatIf(): WhatIfResult | null {
    return null;
  }
  report(): Report {
    const p = this.state.profile;
    return {
      nickname: p.nickname,
      joinCode: p.joinCode,
      persona: p.persona,
      difficulty: p.difficulty,
      generatedAt: new Date().toISOString(),
      summary: this.summary(),
    };
  }
  toJSON(): GameState {
    return JSON.parse(JSON.stringify(this.state));
  }
}

export function createGame(content: ContentPack, profile: Profile, seed = Date.now()): Game {
  const bars: Bars = { wallet: 0, savings: 0, happiness: 70 };
  const state: GameState = {
    profile,
    seed,
    rng: seed >>> 0 || 1,
    chapter: 1,
    stage: 1,
    bars,
    flags: [...profile.flags],
    scheduled: [],
    mistakes: [],
    learned: [],
    log: [],
    seenTasks: [],
    seenExplainers: [],
    failCounts: {},
    detoursTaken: 0,
    restarts: 0,
    portfolio: {},
    phase: 'chapter_start',
  };
  return new StubGame(content, state);
}

export function loadGame(content: ContentPack, state: GameState): Game {
  return new StubGame(content, JSON.parse(JSON.stringify(state)));
}
