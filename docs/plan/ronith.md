# Ronith — Phaser client

> **Inbox:** `docs/plan/requests/ronith.md` — read it before every edit; OPEN P0/P1 items come before this checklist. To ask someone else for something, append to *their* inbox.

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

- [x] Download Kenney **Tiny Town** and **RPG Urban Pack** (CC0) to
      `public/assets/kenney/` (keep their licence txt). Pick: a 16×16
      character spritesheet for 4 avatars, a tile sheet for the town, 1 UI
      9-slice panel. Pick a pixel font (e.g. "Press Start 2P", OFL) →
      `public/assets/fonts/`.
- [x] Sketch the Battle layout on paper from
      `team97_vanguard_context/04_reference_images/mock_money_battle_screen.png`:
      opponent panel top-left (title · LV · pressure bar), opponent portrait
      top-right, player panel mid-right (YOU · STAGE n · wallet bar · happiness
      bar), text box bottom, 2×2 move grid over the text box when choosing.

## Phase 1 (00:15 → 02:45) — against the STUB engine + seed content

Branch `ronith/scenes`. Merge to `main` at ~01:30 and ~02:40 minimum.

- [x] `scenes/BootScene.ts` + `PreloadScene.ts` — load font, atlas, portraits,
      a few SFX; progress bar; then `Title`.
- [x] `ui/` helpers: `PixelPanel` (9-slice or rect), `Bar` (label + fill with
      tween to new value, colour shifts at 30%), `Button` (big touch target
      ≥ 56px tall, press feedback), `TextBox` (typewriter ≤ 2 lines, tap to
      complete), `Portrait`.
- [x] `scenes/TitleScene.ts` — title text (never a game name; use "Learning
      Money by Living It"), **language toggle en/te** (`session.setLang`),
      "Start" / "Continue" (if `session.hasSave()`).
- [x] `scenes/OnboardingScene.ts` — a tiny state machine: avatar picker (4
      sprites) → name input (DOM `<input>` overlay via `this.add.dom`, max 12
      chars, no emoji) → L1–L4 picture questions from `content.lifeQuestions`
      → persona card (`content.personas`) with **"Not me? Switch"** cycling
      personas → builds a partial `Profile` and goes to `Quiz` `{mode:'before'}`.
- [x] `scenes/QuizScene.ts` — 5 questions from `content.quiz`, one per screen,
      big option buttons, no feedback per question (it's a measurement).
      `mode: 'before'` → computes `quizBefore`, `difficulty` (0–1 simple,
      2–3 medium, 4–5 hard), calls `session.startGame(profile)`, shows "Your
      before score: n/5 · medium", then `ChapterMap`. `mode: 'after'` →
      `game.answerQuiz(answers)`, then `game.next()` → `EndReport`.
- [x] `scenes/ChapterMapScene.ts` — vertical node path (10 nodes, 3 stage
      bands, current node pulsing, detour nodes as small side nodes, completed
      = filled). Tap current node → `TownMap` (Phase 2) or straight to the
      driver (Phase 1).
- [x] `flow/Driver.ts` — **the router.** `advance()` calls `game.next()` and
      switches on `step.kind`:
      `chapter_start` → `ChapterStartScene` (toast: income label by persona,
      fired effects list, "Day 1 of month n") →
      `task`/`event` → `Battle` → `invest` → `InvestScene` (Phase 2, stub =
      allocate 0) → `minigame_offer` → `MinigameOfferScene` (Phase 1: show
      locked/skip; Phase 2: launch Saharsh's scene) → `stage_end` → `StageEnd`
      → `epilogue` → `Epilogue` → `quiz_after` → `Quiz{after}` → `done` →
      `EndReport`. After every `choose()`, `await session.save()`.
- [x] `scenes/BattleScene.ts` — **the generic screen.** Input `{ step }`.
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
- [x] `scenes/ExplainerScene.ts` — plays an `Explainer` from the content pack
      using the 6-op DSL (CONTRACTS §1): `text` (slot top/mid/bottom, fade),
      `bar` (4 slots, tween from→to), `coins` (N small circles tween between
      3 anchor points), `grow` (stack of squares growing per year, label with
      ₹ value via `principal × (1+r)^t`), `split` (horizontal stacked bar),
      `clear`. Skip button after 3 s. Adds id to replay (engine already
      tracks `seenExplainers`). Calls `onDone`.
- [x] `scenes/HUDScene.ts` — persistent overlay: hearts (happiness/20),
      wallet ₹, stage badge, **Info button** (opens `InfoPanel`), **Replay
      button** (opens `ReplayLibrary`). Phase 1: Info/Replay buttons can be no-ops.
- [x] Play 5 battles end-to-end at 360×640 in Chrome device mode. Fix touch
      targets. **Merge.**

## Hyderabad backdrops — ready-made art, FULL COVERAGE (updated 02:05 by Monish)

`team97_vanguard_context/08_hyderabad_backgrounds/1x/` — **20 finished pixel-art
backdrops + a platforms overlay**, all 480×270, 372 KB total. Our own original
art (generated by `source/scenes.py`; credit line already in README). Look at
`contact_sheet.png` first and `battle_preview.png` for how the platforms sit.
Every `places.json` id now has its own backdrop — **no fallbacks needed.**

| `places.json` id | Backdrop file (`1x/`) | Framings using it |
|---|---|---|
| `home` | `10_home.png` | 40 |
| `gachibowli` | `09_hitec_city.png` | 14 |
| `kirana` | `11_kirana.png` | 12 |
| `college` | `12_college.png` | 12 |
| `bank` | `13_bank.png` | 12 |
| `charminar` | `01_charminar.png` | 8 |
| `mobile_shop` | `14_mobile_shop.png` | 6 |
| `clinic` | `15_clinic.png` | 6 |
| `canteen` | `16_canteen.png` | 6 |
| `bus_stop` | `08_bus_stop.png` | 4 |
| `turf` | `17_turf.png` | 1 |
| `durgam_cheruvu` | `02_durgam_cheruvu.png` | 1 |
| `campus` | `18_campus.png` | 1 |

**Non-battle screens (big payoff, cheap):**

| Screen | Backdrop |
|---|---|
| `StageEndScene` Stage 1 → 2 ("5 years later… first salary") | `20_office_lobby.png` |
| `StageEndScene` Stage 2 → 3 ("6 years later… a raise") | `09_hitec_city.png` |
| `EpilogueScene` (age 60) | `19_home_age60.png` — the same room as `10_home`, decades later. Let the player notice. |
| `TitleScene` | `03_tank_bund_buddha.png` (sunset) behind the title, if you want it |
| Spares | `04_film_city`, `05_shilparamam`, `06_birla_mandir`, `07_qutb_shahi_tombs` — random-event flavour or TownMap decoration |

**Fit on our 360×640 screen:** 480×270 × 0.75 = **360×202**: exactly the
arena strip `BattleScene` fills with `grassField(...)` from `y = 40`. Draw the
backdrop for `framing.place` there; the platforms overlay goes on top at the
same scale (opponent portrait on the right platform, player avatar on the left).
Keep `grassField` only as a safety net for an unknown id.

**Wiring (your folders only):**
1. `mkdir -p public/assets/backdrops && cp team97_vanguard_context/08_hyderabad_backgrounds/1x/*.png public/assets/backdrops/`
   — **1× only**; the `4x/` set (1920×1080) is for slides and the video and must not enter the PWA precache.
2. `PreloadScene`: load each as `bg_<placeId>` (and `bg_stage2`, `bg_stage3`, `bg_epilogue`, `bg_platforms`).
3. `backdropFor(placeId)` in `src/game/ui/Backdrop.ts` with the table above.
4. `BattleScene`: `this.add.image(0, 40, backdropFor(framing.place)).setOrigin(0).setScale(0.75)`; then `bg_platforms` the same way; then sprites.
   `pixelArt: true` is on, so 0.75 stays reasonably crisp; if it shimmers on a phone, draw at 0.5 (240×135) centred.
5. `TownMapScene`: the same images at 0.25 (120×68) make great tappable place thumbnails.

After step 1, `npm run build` precache should grow by ≈370 KB. Still well
under the 6 MB per-file cap and fine for the Fast-3G numbers.

## Phase 2 (04:05 → 08:30) — nap 04:15–05:45, then build

- [ ] `TownMapScene.ts` — Kenney tiles, 10 `places` from content at
      normalised x/y, the current task's place blinks; tap → **instant travel**
      (avatar sprite jumps there, 300 ms tween, no walk anim) → `Battle`.
      Other places show a one-line tooltip.
- [x] `InvestScene.ts` — savings coins shown; 4 asset cards from
      `content.assets` with blurb + "typical year ±x%"; slider or +/- buttons
      per asset; sum ≤ savings; "Assumptions, not promises" footer;
      `game.allocate(alloc)`.
- [x] `StageEndScene.ts` — "n years later…" with persona `stageIntro`, then
      portfolio before → after bars from `step`, yearly returns as a tiny
      sparkline per asset, income rescale note.
- [x] `EpilogueScene.ts` — age 60: `projection.perAsset` bars vs
      `ifNotInvested`, `assumptionLine` in bold. Then `WhatIf`.
- [x] `WhatIfScene.ts` — `game.whatIf()`: the biggest-mistake framing text,
      "You chose: X" vs "If you had chosen: Y", two bar sets side by side.
      "Not sent to anyone — this is just for you."
- [x] `EndReportScene.ts` — `summary()`: before→after quiz with learning
      gain, NCFE k/8 b/9 a/5 + literate, safety spotted/faced, pillar table,
      mistakes fixed, detours. Buttons: "Download report", "Email facilitator"
      (DOM input for facilitator email + optional guardian CC →
      `session.sendReport`, show preview URL), "Facilitator view" (opens
      `/ngo/`), "Play again".
- [x] `InfoPanelScene.ts` — overlay from `game.status()`: bars, stage,
      commitments (EMI rows), lent out, mistake bank chips, learned chips,
      mini-game lock status, portfolio.
- [x] `ReplayLibraryScene.ts` — grid of `seenExplainers` by pillar; tap →
      `Explainer`.
- [x] `MinigameOfferScene.ts` — launch `minigameScenes[id]` with `onDone`;
      locked state shows the `lockReason`; skip button. On done: show
      reward effects.
- [x] Audio: 4 blips (select, good, bad, coin) via tiny WAVs; mute toggle in HUD.
- [ ] Touch polish: nothing smaller than 48 px; text ≥ 12 px pixel font;
      colours readable on cheap screens (test with DevTools "vision deficiency").
- [x] Replace rectangles with Kenney art where it's cheap. Keep "University
      campus" as the campus place label.

## Phase 3 (08:30 → 11:00)

- [ ] Bug fixes from cross-playtests (Aakarsh and Saharsh play your build).
- [ ] Record the demo screen capture (Chrome device mode 360×640, 2× zoom)
      following `docs/demo-script.md`. Use `?demo=1` save for the late game.
- [ ] Final `npm run check` green on your last PR before **10:15**.

## Definition of done

Every `Step.kind` has a screen · a full seeded run from Title to EndReport
works with no console errors · 360×640 touch-friendly · `npm run check` green.
