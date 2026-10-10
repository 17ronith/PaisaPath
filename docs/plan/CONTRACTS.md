# CONTRACTS — frozen interfaces

Monish copies §1 **verbatim** into `src/shared/types.ts` in Phase 0. After
that it is frozen: **additive changes only** (new optional fields, new enum
values), announced with `CONTRACT:` in chat. Everyone codes against it.

Mental model: **content** (Aakarsh) is data that satisfies §1's content types ·
**engine** (Saharsh) turns content + a profile into a stream of `Step`s and
accepts choices · **game** (Ronith) renders each `Step` and calls back ·
**app** (Monish) wires it, saves it, reports it.

---

## 1. `src/shared/types.ts`

```ts
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
      incomeCoins: number; livingCostCoins?: number;
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
```

---

## 2. Engine behaviour rules (Saharsh implements, everyone relies on)

### 2.1 Economy

- `coins = round(realRupees × stageIncomeCoins[stage] / stageRealRef[stage])`,
  where `stageRealRef[1] = profile.pocketMoneyMonthly`, `[2] = 20000`,
  `[3] = 50000`. Stage 1 income `5000`, Stage 2 `25000`, Stage 3 `60000`.
- Every chapter start: `wallet += incomeCoins`. Persona does **not** change
  the number, only the label ("Allowance arrived" / "ePASS credited" /
  "Wages this month").
- Display: engine returns coins; UI formats as `₹1,840`.

### 2.2 Chapter loop (10 chapters: Stage 1 = ch 1–4, Stage 2 = ch 5–7, Stage 3 = ch 8–10)

`next()` yields, per chapter, in order:

1. `chapter_start` — income added, happiness −3 decay (floor 0 → _not_ a
   restart here; only tasks restart), scheduled effects whose
   `fireChapter == chapter` applied (repeat → re-queued), their `triggerEvent`s
   queued as pending events.
2. Stage 2/3 only, at ch 5 and ch 8: `invest` (if `savings > 0`).
3. `task` — main task (see selector). After `choose()`:
   - `critical` → `Outcome.critical`; next `next()` returns the **same task**
     again with `bars` restored to `barsAtTaskStart`, `failCounts[task]++`,
     `restarts++`. `hintsOn = failCounts[task] >= 2`.
   - `weak` with `detourTaskId` → next `next()` is that detour `task`
     (`isDetour: true`), then rejoin. `detoursTaken++`.
   - `weak`/`critical` → `task.concept` pushed to `mistakes` (dedupe).
   - `good` on a task whose concept is in `mistakes` → moved to `learned`,
     `Outcome.clearedConcept` set.
4. `event` with probability 0.5 (RNG), or always if a `triggerEvent` is
   pending. Pool = events for this stage passing flag checks; weight ×3 if
   `event.concept ∈ mistakes`.
5. `minigame_offer` with probability 0.4. `locked` if `happiness < 30` or
   `wallet < 0.10 × incomeCoins`.
6. At ch 4, 7, 10: `stage_end` (years skipped 5, 6, 25) — portfolio grows by
   seeded yearly returns (Normal(mean, vol) clipped to [−60, +80]%), cashbox
   loses 5%/yr to inflation in **real terms** (shown, not deducted from coins).
7. After ch 10 `stage_end`: `epilogue` → `quiz_after` → `done`.

Also: **wallet < 0 after a choice = critical** (going broke). Happiness ≤ 0
after a choice = critical.

### 2.3 Task selector

- Main task pool: `tasks` where `stage == current`, `!isDetour`, not in
  `seenTasks`, flags satisfied.
- Prefer `difficulty == profile.difficulty`; if empty, any difficulty.
- **Pillar rotation**: pick the pillar with the fewest completed main tasks
  this stage (ties → RNG). Stage 1 ch 1–4 therefore hits all 4 pillars once.
  Investing-pillar tasks only after ≥ 1 task each from budget, save, safety
  (CONTEXT §2.10) — in practice it lands at ch 4.
- **Returning mistakes**: with probability 0.5, if `mistakes` non-empty and
  a not-yet-seen task shares a banked concept, pick it (`returning: true`).
- Framing: `task.framings[profile.persona] ?? task.framings.default`.

### 2.4 Scoring (`summary()`)

- `perPillar`: good / total over main + detour tasks.
- NCFE: for each item, collect all `ncfe` evidence values from the log's
  chosen choices; item = 1 if mean ≥ 0.5, 0 if evidence exists and mean < 0.5,
  null if none. knowledge = sum over 8, behaviour = sum over 9. Attitude:
  share of `attitude: 'later'` among choices that have an `attitude` →
  <20%→1, <40→2, <60→3, <80→4, else 5. `literate = k≥6 && b≥6 && a≥3`.
- Safety: `faced` = choices answered that have `scam` set; `spotted` = those
  with `'spotted'`.
- `biggestMistake` = log entry with quality weak/critical maximising
  `(before.wallet − after.wallet) + 20 × (before.happiness − after.happiness)`.
- `learningGain = quizAfter − quizBefore` (null until answered).

### 2.5 `whatIf()`

Re-simulate from `seed` with the identical sequence of choice ids, except at
`biggestMistake` substitute the task's best choice (`good` > `ok`). Return both
end states. Deterministic because all randomness goes through the seeded RNG
and the UI's choices are replayed from the log.

### 2.6 Determinism & persistence

- All randomness via xorshift32 seeded from `seed`; state in `state.rng`.
- `toJSON()` returns `GameState`; `loadGame(content, state)` resumes exactly.
- `next()` is idempotent: calling it twice without answering returns the same
  `Step`.

---

## 3. Content file layout (Aakarsh owns; Phase 0 creates seeds)

```
src/content/
  index.ts            loadContent(): ContentPack  — assembles the JSON below
                      localize(pack, lang): ContentPack — applies strings/<lang>/content.json overlay
  validate.ts         zod parse + cross-ref checks (run by `npm run validate:content`)
  personas.json       Persona[]
  onboarding.json     { lifeQuestions: LifeQuestion[], quiz: QuizQuestion[] }
  concepts.json       Concept[]
  places.json         Place[]
  assets.json         AssetDef[]
  minigames.json      MiniGameDef[]
  explainers.json     Explainer[]
  events.json         RandomEvent[]
  tasks/
    stage1.json       Task[]  (12: 4 pillars × 3 difficulties)
    stage2.json       Task[]  (6)
    stage3.json       Task[]  (6)
    detours.json      Task[]  (isDetour: true)
  strings/
    en.json           UI chrome strings { "title": "...", "btn.start": "..." }
    te.json           same keys, Telugu (missing keys fall back to en)
    hi.json           same keys, Hindi (may be mostly empty → fallback)
    te.content.json   overlay: { "<taskId>.framings.<persona>.text": "...", "<taskId>.choices.<choiceId>.text": "..." }
```

**Cross-ref checks the validator must enforce** (all are M2 "testing" evidence):
every `task.concept` exists in concepts · every `concept.explainerId` and
`choice.explainerId` exists in explainers · every `detourTaskId` points at a
task with `isDetour: true` · every `framing.place` exists in places · every
`triggerEvent` exists in events · task ids unique · choice ids unique per task ·
each task has 2–4 choices with ≥1 `good` · exactly 5 quiz questions · each
stage has ≥ 1 task per pillar · `strings/te.json` keys ⊆ `en.json` keys ·
no string anywhere matches `/IIIT|Paisa Path/i`.

### 3.1 One complete task (the canonical example)

```json
{
  "id": "safety_medium_s1_01",
  "pillar": "safety",
  "difficulty": "medium",
  "stage": 1,
  "concept": "spot_fake_officials",
  "pressure": 80,
  "source": "team estimate",
  "framings": {
    "default": {
      "title": "SCAM CALL",
      "speaker": "Caller",
      "place": "home",
      "text": "I'm from the scholarship office. Pay ₹500 now or your money is cancelled!"
    },
    "pocket_money": {
      "title": "SCAM TEXT",
      "speaker": "Unknown number",
      "place": "home",
      "text": "Mom's phone buzzes: 'OTP 448213 sent by mistake. Please share it back urgently.'"
    },
    "scholarship": {
      "title": "SCAM CALL",
      "speaker": "'ePASS officer'",
      "place": "college",
      "text": "Your allowance is approved! Pay a ₹500 processing fee now or it lapses today."
    },
    "earner": {
      "title": "FAKE PAYMENT",
      "speaker": "Customer",
      "place": "kirana",
      "text": "He shows a 'Payment successful ₹500' screenshot and grabs the bag. Your phone hasn't pinged."
    }
  },
  "choices": [
    {
      "id": "pay",
      "text": "PAY ₹500",
      "quality": "critical",
      "effects": [{ "label": "Paid the scammer", "wallet": -500, "happiness": -25 }],
      "scam": "fell",
      "ncfe": [{ "item": "risk_return", "value": 0 }],
      "lesson": "Real offices never ask you to pay to receive money. That ₹500 is gone.",
      "hint": "Who asks for money to GIVE you money?"
    },
    {
      "id": "friend",
      "text": "ASK A FRIEND",
      "quality": "weak",
      "effects": [{ "label": "Wasted an afternoon", "happiness": -5 }],
      "detourTaskId": "detour_friend_bad_advice",
      "lesson": "Friends guess. The official portal knows.",
      "ncfe": [{ "item": "compares_options", "value": 0 }]
    },
    {
      "id": "hang_up",
      "text": "HANG UP",
      "quality": "ok",
      "effects": [{ "label": "Safe", "happiness": 0 }],
      "scam": "spotted",
      "lesson": "Safe. Even safer: check the portal so you know for sure."
    },
    {
      "id": "portal",
      "text": "CHECK PORTAL",
      "quality": "good",
      "effects": [{ "label": "Verified yourself", "happiness": 5 }],
      "scam": "spotted",
      "ncfe": [{ "item": "compares_options", "value": 1 }],
      "lesson": "You verified at the source. That's the whole trick against scams."
    }
  ]
}
```

### 3.2 One explainer (compounding, 14 s)

```json
{
  "id": "exp_compounding",
  "concept": "compounding",
  "title": "Growth that makes more growth",
  "durationMs": 14000,
  "steps": [
    { "at": 0, "op": "text", "text": "₹1,000 saved today", "slot": "top" },
    {
      "at": 500,
      "op": "grow",
      "id": "g",
      "label": "Banyan Savings",
      "ratePct": 8,
      "years": 30,
      "principal": 1000
    },
    {
      "at": 6000,
      "op": "text",
      "text": "A banyan drops roots. Roots become trunks. Trunks grow branches.",
      "slot": "bottom",
      "size": "sm"
    },
    {
      "at": 9000,
      "op": "bar",
      "id": "a",
      "label": "Without compounding",
      "from": 0,
      "to": 34,
      "slot": 0
    },
    {
      "at": 9000,
      "op": "bar",
      "id": "b",
      "label": "With compounding",
      "from": 0,
      "to": 100,
      "slot": 1
    },
    {
      "at": 12000,
      "op": "text",
      "text": "Assumes 8% a year. Real returns vary and can be negative.",
      "slot": "bottom",
      "size": "sm"
    }
  ]
}
```

---

## 4. Game ↔ app seams (Ronith ↔ Monish)

### 4.1 `src/app/session.ts` (Monish provides from Phase 0)

```ts
export interface Session {
  content: ContentPack; // localized to current lang
  game: Game | null; // null until onboarding completes
  lang: Lang;
  setLang(l: Lang): void; // re-localizes content, persists
  startGame(profile: Profile, seed?: number): Game;
  save(): Promise<void>; // IndexedDB; call after every choose()
  hasSave(): Promise<boolean>;
  resume(): Promise<Game | null>;
  reset(): Promise<void>;
  sendReport(opts: {
    facilitatorEmail: string;
    guardianEmail?: string;
  }): Promise<{ previewUrl: string | null; pdfBlob: Blob }>;
}
export function getSession(): Session; // singleton
```

### 4.2 `src/game/scenes/index.ts` (Ronith) — exports the scene array;

already imports `minigameScenes` from `src/minigames` (Phase 0 wires it):

```ts
import { minigameScenes } from '../../minigames';
export const scenes = [BootScene, PreloadScene, TitleScene, ..., ...Object.values(minigameScenes)];
```

### 4.3 `src/minigames/index.ts` (Saharsh)

```ts
export const minigameScenes: Record<MiniGameDef['id'], typeof Phaser.Scene> = { ... };
// Each scene is started with data { onDone: (won: boolean) => void } and must
// call onDone exactly once, then this.scene.stop().
```

### 4.4 Scene keys (Ronith; fixed so others can `scene.start()` them)

`Boot` · `Preload` · `Title` · `Onboarding` · `Quiz` (data `{ mode: 'before' | 'after' }`) ·
`ChapterMap` · `TownMap` · `Battle` (data `{ step: Step }`) · `Explainer`
(data `{ explainerId, onDone }`) · `Invest` · `StageEnd` · `Epilogue` · `WhatIf` ·
`EndReport` · `InfoPanel` (overlay, launch/stop) · `ReplayLibrary` · `HUD` (overlay).

### 4.5 `src/shared/i18n.ts` (Monish, Phase 0)

`t(key: string, vars?: Record<string, string | number>): string` · `setLang(l)` ·
`getLang()`. Keys from `src/content/strings/<lang>.json`, fallback `en`,
missing → the key itself (so missing strings are visible, not blank).

---

## 5. Server API (Monish)

`server/` — Express on `:8787`, CORS open for dev.

| Route              | Body                                                                                      | Returns                                                  |
| ------------------ | ----------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `GET /health`      | —                                                                                         | `{ ok: true }`                                           |
| `POST /api/report` | `{ report: Report, pdfBase64: string, facilitatorEmail: string, guardianEmail?: string }` | `{ previewUrl: string }` — Ethereal message preview link |

Client falls back to download-only when the server is unreachable (offline).
No student PII ever leaves the device except `nickname` and scores.

---

## 6. Scripts (root `package.json`, Phase 0)

| Script             | Does                                                                            |
| ------------------ | ------------------------------------------------------------------------------- |
| `dev`              | `vite --host`                                                                   |
| `build`            | `tsc --noEmit && vite build`                                                    |
| `preview`          | `vite preview --host`                                                           |
| `test`             | `vitest run`                                                                    |
| `test:watch`       | `vitest`                                                                        |
| `typecheck`        | `tsc --noEmit`                                                                  |
| `lint`             | `eslint src --ext .ts`                                                          |
| `format`           | `prettier --write .`                                                            |
| `validate:content` | `tsx src/content/validate.ts`                                                   |
| `check`            | `npm run typecheck && npm run lint && npm run test && npm run validate:content` |
| `server`           | `npm --prefix server run dev`                                                   |
