// ─────────────────────────────────────────────────────────────────────────
// FROZEN CONTRACT. Additive changes only. See docs/plan/CONTRACTS.md.
// ─────────────────────────────────────────────────────────────────────────

// ---- Enums ---------------------------------------------------------------

export type Pillar = 'budget' | 'save' | 'invest' | 'safety';
export type Difficulty = 'simple' | 'medium' | 'hard';
export type Stage = 1 | 2 | 3;
export type PersonaId = 'pocket_money' | 'scholarship' | 'earner';
export type Lang = 'en' | 'te' | 'hi';
/** good = blue path · ok = neutral · weak = detour + mistake bank · critical = restart */
export type Quality = 'good' | 'ok' | 'weak' | 'critical';
export type AssetId = 'cashbox' | 'banyan' | 'chai' | 'mango';

/** NCFE-FLIS 2019 items. Knowledge 8 · Behaviour 9 · Attitude 3. */
export type NcfeKnowledge =
  | 'division'
  | 'time_value'
  | 'loan_interest'
  | 'simple_interest'
  | 'compound_interest'
  | 'inflation'
  | 'risk_return'
  | 'diversification';
export type NcfeBehaviour =
  | 'keeps_budget'
  | 'takes_responsibility'
  | 'major_expense_no_borrow'
  | 'saves_actively'
  | 'compares_options'
  | 'long_term_goals'
  | 'watches_finances'
  | 'pays_bills_on_time'
  | 'considers_affordability';
export type NcfeItem = NcfeKnowledge | NcfeBehaviour;

// ---- Player profile (output of onboarding) --------------------------------

export interface Profile {
  nickname: string; // typed by student; the ONLY identifier
  lang: Lang;
  avatar: string; // sprite key, e.g. 'avatar_02'
  persona: PersonaId;
  pocketMoneyMonthly: number; // real ₹/month, from L2 band midpoint × 4
  flags: string[]; // from L3/L4: 'has_bank_account', 'upi_own', 'upi_family', 'upi_none'
  difficulty: Difficulty; // from quiz: 0–1 simple, 2–3 medium, 4–5 hard
  quizBefore: number; // 0..5
  quizBeforeAnswers: number[]; // chosen option index per question
  joinCode?: string; // NGO batch code (optional)
}

// ---- Bars ----------------------------------------------------------------

/** wallet/savings are in-game coins (scaled ₹). happiness 0..100. */
export interface Bars {
  wallet: number;
  savings: number;
  happiness: number;
}

// ---- Content: effects, choices, tasks -------------------------------------

/**
 * Money deltas are authored in REAL ₹; the engine scales to coins
 * (CONTRACTS §2.1). Negative = pay. delayChapters>0 = fires at a future
 * chapter start. repeat = EMI-style.
 */
export interface Effect {
  label: string; // shown when it fires: "EMI deducted"
  wallet?: number; // real ₹ delta
  savings?: number; // real ₹ delta (to/from savings jar)
  happiness?: number; // −100..100 delta
  delayChapters?: number; // default 0 = now
  repeat?: { everyChapters: number; times: number };
  setFlag?: string;
  clearFlag?: string;
  /** Fire a follow-up event by id when this effect fires (e.g. 'friend_asks_again'). */
  triggerEvent?: string;
}

export interface Framing {
  title: string; // "SCAM CALL" (opponent name)
  speaker: string; // "Caller" | "Friend" | "Shopkeeper" | ...
  text: string; // 1–2 lines in the text box
  place: string; // Place.id — where it happens in town
  portrait?: string; // sprite key for opponent
  intro?: string; // optional one-line scene setter above the box
}

export interface Choice {
  id: string; // unique within the task: 'pay', 'hang_up', ...
  text: string; // ≤ 28 chars, it's a Pokémon move button
  icon?: string;
  quality: Quality;
  effects: Effect[];
  lesson: string; // Aunty's one-liner after the choice (names the concept)
  explainerId?: string; // overrides task.concept's default explainer
  detourTaskId?: string; // weak → go here before rejoining
  /** NCFE evidence this choice gives. value 1 = behaviour shown / knowledge right. */
  ncfe?: { item: NcfeItem; value: 0 | 1 }[];
  /** For attitude score: does this choice favour now or later? */
  attitude?: 'now' | 'later';
  /** Safety pillar: was this a scam spotted or fallen for? */
  scam?: 'spotted' | 'fell';
  /** Hint text shown when hintsOn (after 2 fails of the same task). */
  hint?: string;
}

export interface Task {
  id: string; // 'budget_simple_s1_01'
  pillar: Pillar;
  difficulty: Difficulty;
  stage: Stage;
  concept: string; // Concept.id; the mistake-bank tag
  pressure: number; // 0..100 opponent "HP"
  framings: Partial<Record<PersonaId, Framing>> & { default: Framing };
  choices: Choice[]; // 2..4
  isDetour?: boolean; // detour tasks are never picked as main tasks
  requiresFlags?: string[];
  excludesFlags?: string[];
  source?: string; // "team estimate" | "TGSRTC 2025 fare" | ...
  /** Multi-turn: after this choice, continue to this task id (same battle). */
  // (not needed for Stage 1; add via CONTRACT: if used)
}

export interface Concept {
  id: string; // 'needs_vs_wants'
  pillar: Pillar;
  name: string; // "Needs vs wants"
  explainerId: string; // default explainer for this concept
  ncfe?: NcfeItem[]; // which NCFE items this concept evidences
}

export interface RandomEvent {
  id: string;
  stages: Stage[];
  weight: number; // relative probability
  concept?: string; // if set, mistake bank boosts weight ×3
  framings: Partial<Record<PersonaId, Framing>> & { default: Framing };
  choices: Choice[]; // 1..3; a single choice = "OK"
  requiresFlags?: string[];
  excludesFlags?: string[];
}

// ---- Explainer animation DSL (rendered by game/ExplainerScene) -----------

export type ExplainerStep =
  | {
      at: number;
      op: 'text';
      text: string;
      slot?: 'top' | 'mid' | 'bottom';
      size?: 'sm' | 'md' | 'lg';
    }
  | {
      at: number;
      op: 'bar';
      id: string;
      label: string;
      from: number;
      to: number;
      color?: string;
      slot?: 0 | 1 | 2 | 3;
    }
  | {
      at: number;
      op: 'coins';
      count: number;
      from: 'wallet' | 'savings' | 'outside';
      to: 'wallet' | 'savings' | 'outside';
    }
  | {
      at: number;
      op: 'grow';
      id: string;
      label: string;
      ratePct: number;
      years: number;
      principal: number;
    }
  | { at: number; op: 'split'; parts: { label: string; pct: number; color?: string }[] }
  | { at: number; op: 'clear' };
// `at` = milliseconds from start. Total duration 10–20 s.

export interface Explainer {
  id: string;
  concept: string;
  title: string;
  durationMs: number;
  steps: ExplainerStep[];
}

// ---- Onboarding + quiz content -------------------------------------------

export interface LifeQuestion {
  id: 'L1' | 'L2' | 'L3' | 'L4';
  text: string;
  options: {
    text: string;
    icon?: string;
    persona?: PersonaId;
    pocketMoneyMonthly?: number;
    setFlag?: string;
  }[];
}

export interface QuizQuestion {
  id: string; // 'K1'..'K5'
  concept: string;
  pillar: Pillar;
  text: string;
  options: string[];
  answer: number; // index
}

export interface Persona {
  id: PersonaId;
  label: string; // "Pocket money"
  blurb: string; // the persona card text
  stageIntro: Record<Stage, string>; // "Years later…" lines
  defaultFlags: string[];
}

export interface Place {
  id: string; // 'charminar', 'college', 'campus' (never 'iiit')
  name: string;
  x: number;
  y: number; // 0..1 normalised position on the town map
  icon?: string;
}

export interface MiniGameDef {
  id: 'kirana_rush' | 'scam_or_legit';
  title: string;
  blurb: string;
  rewardWalletPct: number; // % of monthly income coins on a win (8)
  rewardHappiness: number; // (10)
}

export interface AssetDef {
  id: AssetId;
  name: string; // "Banyan Savings"
  blurb: string;
  meanYearlyPct: number; // 0 · 8 · 10 · 14
  volatilityPct: number; // 0 · 2 · 12 · 30
  teaches: string; // concept id
}

// ---- The content pack ----------------------------------------------------

export interface ContentPack {
  version: string;
  personas: Persona[];
  lifeQuestions: LifeQuestion[];
  quiz: QuizQuestion[]; // exactly 5
  concepts: Concept[];
  tasks: Task[];
  events: RandomEvent[];
  explainers: Explainer[];
  minigames: MiniGameDef[];
  assets: AssetDef[];
  places: Place[];
}

// ---- Engine runtime state ------------------------------------------------

export interface ScheduledEffect {
  effect: Effect;
  fireChapter: number; // absolute chapter index (1-based across stages)
  sourceTaskId: string;
  remaining: number; // repeats left incl. this one
}

export interface LogEntry {
  chapter: number;
  taskId: string;
  choiceId: string;
  quality: Quality;
  before: Bars;
  after: Bars;
  isDetour: boolean;
  isEvent: boolean;
}

export type Portfolio = Partial<Record<AssetId, number>>; // coins per asset

export interface GameState {
  profile: Profile;
  seed: number;
  rng: number; // current RNG state (xorshift32)
  chapter: number; // 1..10 absolute
  stage: Stage;
  bars: Bars;
  flags: string[];
  scheduled: ScheduledEffect[];
  mistakes: string[]; // concept ids currently banked
  learned: string[]; // concept ids cleared from the bank
  log: LogEntry[];
  seenTasks: string[];
  seenExplainers: string[]; // replay library
  failCounts: Record<string, number>; // taskId → times restarted
  detoursTaken: number;
  restarts: number;
  pendingDetour?: string; // detour task id to run before rejoining
  pendingRestart?: string; // task id to restart
  barsAtTaskStart?: Bars; // restored on restart
  portfolio: Portfolio;
  quizAfter?: number;
  quizAfterAnswers?: number[];
  phase:
    | 'chapter_start'
    | 'main_task'
    | 'detour'
    | 'event'
    | 'minigame'
    | 'invest'
    | 'stage_end'
    | 'epilogue'
    | 'quiz_after'
    | 'done';
}

// ---- What the engine hands the UI ----------------------------------------

export type Step =
  | {
      kind: 'chapter_start';
      chapter: number;
      stage: Stage;
      incomeCoins: number;
      fired: Effect[];
      happinessDecay: number;
    }
  | {
      kind: 'task';
      task: Task;
      framing: Framing;
      isDetour: boolean;
      hintsOn: boolean;
      returning: boolean; /* mistake-bank disguise */
    }
  | { kind: 'event'; event: RandomEvent; framing: Framing }
  | { kind: 'minigame_offer'; minigame: MiniGameDef; locked: boolean; lockReason?: string }
  | { kind: 'invest'; savingsCoins: number; assets: AssetDef[]; portfolio: Portfolio }
  | {
      kind: 'stage_end';
      stage: Stage;
      yearsSkipped: number;
      portfolioBefore: Portfolio;
      portfolioAfter: Portfolio;
      yearlyReturns: Record<AssetId, number[]>;
    }
  | { kind: 'epilogue'; projection: Projection }
  | { kind: 'quiz_after' }
  | { kind: 'done'; summary: Summary };

export interface Outcome {
  before: Bars;
  after: Bars;
  quality: Quality;
  lesson: string;
  explainerId: string;
  firedNow: Effect[]; // immediate effects applied
  scheduled: Effect[]; // effects queued for later (to show "… will come back")
  critical: boolean; // task will restart
  detourTaskId?: string;
  bankedConcept?: string; // added to mistake bank
  clearedConcept?: string; // removed from mistake bank → "learned" badge
  pressureAfter: number;
}

export interface Projection {
  ageAt: number; // 60
  assumptionLine: string; // "Assumes 8% a year. Real returns vary and can be negative…"
  perAsset: { asset: AssetDef; invested: number; finalValue: number }[];
  totalInvested: number;
  totalFinal: number;
  ifNotInvested: number; // same coins kept in cashbox after inflation
  savingsFinal: number;
}

export interface NcfeScore {
  knowledge: number; // 0..8
  behaviour: number; // 0..9
  attitude: number; // 1..5
  literate: boolean; // k≥6 && b≥6 && a≥3
  items: Record<NcfeItem, 0 | 1 | null>; // null = no evidence
}

export interface Summary {
  finalBars: Bars;
  perPillar: Record<Pillar, { good: number; total: number }>;
  ncfe: NcfeScore;
  safety: { spotted: number; faced: number };
  mistakesFixed: string[];
  mistakesOpen: string[];
  detoursTaken: number;
  restarts: number;
  quizBefore: number;
  quizAfter: number | null;
  learningGain: number | null;
  biggestMistake: LogEntry | null;
  projection: Projection | null;
}

export interface WhatIfResult {
  entry: LogEntry;
  actualChoice: Choice;
  altChoice: Choice; // the best choice they didn't make
  actualEnd: Bars;
  altEnd: Bars;
  actualPortfolioTotal: number;
  altPortfolioTotal: number;
}

export interface InfoStatus {
  bars: Bars;
  stage: Stage;
  chapter: number;
  commitments: { label: string; perChapter: number; remaining: number }[];
  lentOut: number;
  mistakes: Concept[];
  learned: Concept[];
  minigamesLocked: boolean;
  lockReason?: string;
  portfolio: Portfolio;
}

export interface Report {
  nickname: string;
  joinCode?: string;
  persona: PersonaId;
  difficulty: Difficulty;
  generatedAt: string; // ISO
  summary: Summary;
  // what-if is deliberately NOT here (in-game only, CONTEXT.md §2.12)
}

// ---- The engine API (src/engine/index.ts exports createGame, loadGame, scaleToCoins) ----

export interface Game {
  readonly state: GameState;
  /** Advance. Idempotent until the UI answers the current step. */
  next(): Step;
  /** Answer a 'task' or 'event' step. */
  choose(choiceId: string): Outcome;
  /** Answer a 'minigame_offer' step. */
  playMinigame(id: MiniGameDef['id'], won: boolean): Effect[];
  skipMinigame(): void;
  /** Answer an 'invest' step. Sum must be ≤ savingsCoins; remainder stays in savings. */
  allocate(alloc: Portfolio): void;
  /** Answer 'quiz_after'. Returns score 0..5. */
  answerQuiz(answers: number[]): number;
  /** Any time. */
  status(): InfoStatus;
  summary(): Summary;
  whatIf(): WhatIfResult | null;
  report(): Report;
  toJSON(): GameState;
}

export type CreateGame = (content: ContentPack, profile: Profile, seed?: number) => Game;
export type LoadGame = (content: ContentPack, state: GameState) => Game;

// ---- Economy helpers (also exported by engine) ---------------------------

export interface EconomyParams {
  stageIncomeCoins: Record<Stage, number>; // 5000 · 25000 · 60000
  stageRealRef: Record<Stage, number>; // pocketMoneyMonthly · 20000 · 50000
}
export type ScaleToCoins = (realRupees: number, stage: Stage, profile: Profile) => number;
