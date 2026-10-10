# Ronith — Phaser client

**MINE:** `src/game/` (everything), `public/assets/`.
**NOT MINE:** anything else. You consume `Game`/`Step`/`Outcome` from the
engine via `getSession().game`, `ContentPack` via `getSession().content`,
and `t()` from `src/shared/i18n`. You never edit the engine or content; if a
`Step` lacks a field you need, post `CONTRACT:`.

Golden rule of this codebase (CONTEXT.md §2.16): **one generic battle screen
driven by data.** Every task, detour and event renders through `BattleScene`.
Build that first and best; everything else is menus.

Resolution **360×640 portrait**, `Scale.FIT`, `pixelArt: true`. Use coloured
rectangles + a pixel font until Phase 2; swap Kenney tiles in later. Don't
block on art.

---

## Before SKELETON IS UP (23:30 → 00:15)
- [ ] Download Kenney **Tiny Town** and **RPG Urban Pack** (CC0) to
      `public/assets/kenney/` (keep their licence txt). Pick: a 16×16
      character spritesheet for 4 avatars, a tile sheet for the town, 1 UI
      9-slice panel. Pick a pixel font (e.g. "Press Start 2P", OFL) →
      `public/assets/fonts/`.
- [ ] Sketch the Battle layout on paper from
      `team97_vanguard_context/04_reference_images/mock_money_battle_screen.png`:
      opponent panel top-left (title · LV · pressure bar), opponent portrait
      top-right, player panel mid-right (YOU · STAGE n · wallet bar · happiness
      bar), text box bottom, 2×2 move grid over the text box when choosing.

## Phase 1 (00:15 → 02:45) — against the STUB engine + seed content

Branch `ronith/scenes`. Merge to `main` at ~01:30 and ~02:40 minimum.

- [ ] `scenes/BootScene.ts` + `PreloadScene.ts` — load font, atlas, portraits,
      a few SFX; progress bar; then `Title`.
- [ ] `ui/` helpers: `PixelPanel` (9-slice or rect), `Bar` (label + fill with
      tween to new value, colour shifts at 30%), `Button` (big touch target
      ≥ 56px tall, press feedback), `TextBox` (typewriter ≤ 2 lines, tap to
      complete), `Portrait`.
- [ ] `scenes/TitleScene.ts` — title text (never a game name; use "Learning
      Money by Living It"), **language toggle en/te** (`session.setLang`),
      "Start" / "Continue" (if `session.hasSave()`).
- [ ] `scenes/OnboardingScene.ts` — a tiny state machine: avatar picker (4
      sprites) → name input (DOM `<input>` overlay via `this.add.dom`, max 12
      chars, no emoji) → L1–L4 picture questions from `content.lifeQuestions`
      → persona card (`content.personas`) with **"Not me? Switch"** cycling
      personas → builds a partial `Profile` and goes to `Quiz` `{mode:'before'}`.
- [ ] `scenes/QuizScene.ts` — 5 questions from `content.quiz`, one per screen,
      big option buttons, no feedback per question (it's a measurement).
      `mode: 'before'` → computes `quizBefore`, `difficulty` (0–1 simple,
      2–3 medium, 4–5 hard), calls `session.startGame(profile)`, shows "Your
      before score: n/5 · medium", then `ChapterMap`. `mode: 'after'` →
      `game.answerQuiz(answers)`, then `game.next()` → `EndReport`.
- [ ] `scenes/ChapterMapScene.ts` — vertical node path (10 nodes, 3 stage
      bands, current node pulsing, detour nodes as small side nodes, completed
      = filled). Tap current node → `TownMap` (Phase 2) or straight to the
      driver (Phase 1).
- [ ] `flow/Driver.ts` — **the router.** `advance()` calls `game.next()` and
      switches on `step.kind`:
      `chapter_start` → `ChapterStartScene` (toast: income label by persona,
      fired effects list, "Day 1 of month n") →
      `task`/`event` → `Battle` → `invest` → `InvestScene` (Phase 2, stub =
      allocate 0) → `minigame_offer` → `MinigameOfferScene` (Phase 1: show
      locked/skip; Phase 2: launch Saharsh's scene) → `stage_end` → `StageEnd`
      → `epilogue` → `Epilogue` → `quiz_after` → `Quiz{after}` → `done` →
      `EndReport`. After every `choose()`, `await session.save()`.
- [ ] `scenes/BattleScene.ts` — **the generic screen.** Input `{ step }`.
      Render framing (title, speaker, text, portrait, pressure bar), player
      panel from `game.state.bars`, stage label. "Returning in disguise" badge
      when `step.returning`. If `step.hintsOn`, show Aunty hint bubble (choice
      `hint` or a generic one). Moves grid: `choices.map(text)`. On tap:
      `const o = game.choose(id)` → animate bars `before → after`, show
      `o.lesson` in text box with Aunty portrait, list `o.firedNow` labels,
      and `o.scheduled` labels as "…will come back later". Then
      `Explainer{ explainerId: o.explainerId }`. Then: `o.critical` → red
      flash "RESTART" → `Driver.advance()` (engine re-serves the task);
      `o.clearedConcept` → "LEARNED ✓" badge; else `Driver.advance()`.
- [ ] `scenes/ExplainerScene.ts` — plays an `Explainer` from the content pack
      using the 6-op DSL (CONTRACTS §1): `text` (slot top/mid/bottom, fade),
      `bar` (4 slots, tween from→to), `coins` (N small circles tween between
      3 anchor points), `grow` (stack of squares growing per year, label with
      ₹ value via `principal × (1+r)^t`), `split` (horizontal stacked bar),
      `clear`. Skip button after 3 s. Adds id to replay (engine already
      tracks `seenExplainers`). Calls `onDone`.
- [ ] `scenes/HUDScene.ts` — persistent overlay: hearts (happiness/20),
      wallet ₹, stage badge, **Info button** (opens `InfoPanel`), **Replay
      button** (opens `ReplayLibrary`). Phase 1: Info/Replay buttons can be no-ops.
- [ ] Play 5 battles end-to-end at 360×640 in Chrome device mode. Fix touch
      targets. **Merge.**

## Phase 2 (04:05 → 08:30) — nap 04:15–05:45, then build

- [ ] `TownMapScene.ts` — Kenney tiles, 10 `places` from content at
      normalised x/y, the current task's place blinks; tap → **instant travel**
      (avatar sprite jumps there, 300 ms tween, no walk anim) → `Battle`.
      Other places show a one-line tooltip.
- [ ] `InvestScene.ts` — savings coins shown; 4 asset cards from
      `content.assets` with blurb + "typical year ±x%"; slider or +/- buttons
      per asset; sum ≤ savings; "Assumptions, not promises" footer;
      `game.allocate(alloc)`.
- [ ] `StageEndScene.ts` — "n years later…" with persona `stageIntro`, then
      portfolio before → after bars from `step`, yearly returns as a tiny
      sparkline per asset, income rescale note.
- [ ] `EpilogueScene.ts` — age 60: `projection.perAsset` bars vs
      `ifNotInvested`, `assumptionLine` in bold. Then `WhatIf`.
- [ ] `WhatIfScene.ts` — `game.whatIf()`: the biggest-mistake framing text,
      "You chose: X" vs "If you had chosen: Y", two bar sets side by side.
      "Not sent to anyone — this is just for you."
- [ ] `EndReportScene.ts` — `summary()`: before→after quiz with learning
      gain, NCFE k/8 b/9 a/5 + literate, safety spotted/faced, pillar table,
      mistakes fixed, detours. Buttons: "Download report", "Email facilitator"
      (DOM input for facilitator email + optional guardian CC →
      `session.sendReport`, show preview URL), "Facilitator view" (opens
      `/ngo/`), "Play again".
- [ ] `InfoPanelScene.ts` — overlay from `game.status()`: bars, stage,
      commitments (EMI rows), lent out, mistake bank chips, learned chips,
      mini-game lock status, portfolio.
- [ ] `ReplayLibraryScene.ts` — grid of `seenExplainers` by pillar; tap →
      `Explainer`.
- [ ] `MinigameOfferScene.ts` — launch `minigameScenes[id]` with `onDone`;
      locked state shows the `lockReason`; skip button. On done: show
      reward effects.
- [ ] Audio: 4 blips (select, good, bad, coin) via tiny WAVs; mute toggle in HUD.
- [ ] Touch polish: nothing smaller than 48 px; text ≥ 12 px pixel font;
      colours readable on cheap screens (test with DevTools "vision deficiency").
- [ ] Replace rectangles with Kenney art where it's cheap. Keep "University
      campus" as the campus place label.

## Phase 3 (08:30 → 11:00)
- [ ] Bug fixes from cross-playtests (Aakarsh and Saharsh play your build).
- [ ] Record the demo screen capture (Chrome device mode 360×640, 2× zoom)
      following `docs/demo-script.md`. Use `?demo=1` save for the late game.
- [ ] Final `npm run check` green on your last PR before **10:15**.

## Definition of done
Every `Step.kind` has a screen · a full seeded run from Title to EndReport
works with no console errors · 360×640 touch-friendly · `npm run check` green.
