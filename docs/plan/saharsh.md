# Saharsh — Engine (then mini-games)

> **Inbox:** `docs/plan/requests/saharsh.md` — read it before every edit; OPEN P0/P1 items come before this checklist. To ask someone else for something, append to *their* inbox.

## After M2 (04:00 → 11:00) — Saharsh

Engine is done; your job now is learning quality + sound + the numbers for the
final report. Two UI items are **delegated to you by Ronith**: edit only
`src/game/scenes/InfoPanelScene.ts` and a new `src/game/audio/` folder; ask
Ronith (inbox) for any hook line elsewhere in `src/game`. Nap **05:30–07:00**.

- [ ] **04:00–05:30** PLAYTEST-01 #15 Scam-or-Legit timer: 30 s → 60 s, or 8 s per message with a visible bar.
- [ ] #20 Kirana Rush item list: only unarguable items (rice, medicine, bus pass vs game top-up, second earphones); rename the question to "need NOW vs can wait" if it helps.
- [ ] #21 economy with Aakarsh: raise weak/critical effect magnitudes 1.5× in content (his), lower Stage 2/3 incomes if needed (yours), **new sim target**: random play ends with ≤ 1 month of income spare; worst play broke ≥ 50 %. Re-run `npm run sim -- --content` until targets pass; paste the table in PLAYTEST-01.
- [ ] **05:30–07:00** nap.
- [ ] **07:00** play test 2.
- [ ] **07:15–08:30** delegated UI: #12 one looping CC0 chiptune + step/select/good/bad/coin blips in `src/game/audio/` with a `Sound` helper and a mute flag (Ronith wires the HUD button) · #11 InfoPanel redesign: groups Money · Commitments · Learning · Mini-games with icons.
- [ ] **08:30** feature freeze. Cross-playtest Ronith's build on a phone; file bugs in PLAYTEST-02.
- [ ] **09:30** send Monish: final test count by area (`npx vitest run --reporter=json --outputFile=/tmp/vt.json`), the final `npm run sim -- --content` table, and one sentence on what the balance pass changed.
- [ ] **10:15** last PR merged, `npm run check` green.

> Everything below this line is the original phase plan. Where it disagrees with **After M2**, After M2 wins.

**MINE:** `src/engine/` (everything), `src/minigames/` (Phase 2).
**NOT MINE:** anything else. The engine imports **only** `src/shared`. No
Phaser, no `window`, no content JSON (tests use inline fixtures in
`src/engine/__fixtures__/`). If a type is missing, post `CONTRACT:`.

Your API is already fixed: CONTRACTS §1 (`Game`, `Step`, `Outcome`, …) and the
behaviour rules in CONTRACTS §2. Phase 0 ships a **stub** `src/engine/index.ts`
with the right exports. You replace its internals; `index.ts` keeps exporting
`createGame`, `loadGame`, `scaleToCoins`.

Everything you build is testable with Vitest and **test counts go straight
into M2.pdf at 03:30** — write tests as you go, not after.

---

## Before SKELETON IS UP (23:30 → 00:15)

- [x] Read CONTRACTS §1–2 twice. Read CONTEXT.md §2.5, 2.7–2.12.
- [x] Draft the module split on paper (below). Write the fixture content
      pack in your head: 4 pillars × 1 task for Stage 1, 1 detour, 1 event,
      1 explainer, personas, 5 quiz Qs.

## Phase 1 (00:15 → 02:45) — branch `saharsh/engine`, merge at ~01:30 and 02:40

Module split (one file each, one test file each):

- [x] `rng.ts` — xorshift32: `createRng(seed)` → `{ next(): number /*0..1*/, state }`,
      `fromState(state)`. Test: same seed → same sequence; state round-trips.
- [x] `economy.ts` — `ECONOMY: EconomyParams` (5000/25000/60000;
      pocketMoney/20000/50000), `scaleToCoins(real, stage, profile)`,
      `incomeCoins(stage)`, `incomeLabel(persona, stage)`.
      Tests: the M1 table — ₹200 bat → ₹200 coins at ₹5,000 pocket money,
      ₹400 at ₹2,500, ₹1,000 at ₹1,000; stage 2 ₹20,000 → 25,000.
- [x] `effects.ts` — `applyEffect(bars, effect, stage, profile) → bars`,
      `scheduleEffect(state, effect, sourceTaskId)`,
      `fireDue(state) → Effect[]` (handles `repeat`, `triggerEvent`, flags).
      Tests: delayChapters 2 fires at chapter+2 not before; EMI
      `everyChapters:1,times:3` fires exactly 3×; flags set/cleared.
- [x] `selector.ts` — `pickMainTask(state, content, rng)` per CONTRACTS §2.3
      (stage, !detour, unseen, flags, difficulty preference w/ fallback,
      pillar rotation, invest-gate, returning-mistake 50%).
      `pickEvent(state, content, rng)` (stage, flags, weight ×3 if banked).
      `framingFor(task, persona)`.
      Tests: 4 chapters of Stage 1 cover 4 distinct pillars; invest never
      before budget+save+safety; banked concept returns when a matching task
      exists; empty-bucket fallback to any difficulty.
- [x] `bank.ts` — `bank(state, concept)`, `clear(state, concept)`, `isBanked`.
      Tests: dedupe; clear moves to `learned`.
- [x] `game.ts` — the `Game` class implementing the chapter loop state
      machine (CONTRACTS §2.2) with `phase` in `GameState`, idempotent
      `next()`, `choose()` → `Outcome` incl. restart/detour/bank/clear,
      `barsAtTaskStart` restore, `failCounts` + `hintsOn`, wallet<0 and
      happiness≤0 critical, `pressureAfter` (good −40, ok −20, weak −5,
      critical 0), `log` entries, `playMinigame` (reward = `rewardWalletPct`%
      of income coins + happiness), `skipMinigame`, `allocate` (Phase 2 can
      be a store-only version now), `answerQuiz`, `status()`, `toJSON`.
      `createGame`/`loadGame` in `index.ts`.
      Tests: 30-step seeded run never throws and ends with `phase` advancing;
      critical restores bars and re-serves same task; weak serves detour then
      rejoins; `next()` twice without answering returns equal steps;
      `loadGame(toJSON())` continues identically to the original (compare 10
      more steps).
- [x] `scoring.ts` v1 — `summary()`: perPillar, quizBefore/After,
      learningGain, biggestMistake, detours/restarts; NCFE + safety can be
      zeros until Phase 2 **but the shape must be complete**.
- [x] `__fixtures__/pack.ts` — a minimal valid `ContentPack` built in TS (not
      JSON) so tests don't depend on Aakarsh.
- [x] `scripts/simulate.ts` (inside `src/engine/`, run with `tsx`) — plays a
      seeded game with a policy (`always good` / `always worst` / `random`)
      and prints bars per chapter. Output table goes into M2.pdf as an
      "experiment". `npm run sim` → ask Monish to add the script (`DEP:`).
- [x] **≥ 20 tests green.** `npm run check`. Merge. Post `MERGED: engine v1`.
- [x] 02:45 call: swap stub → real with Ronith's Driver; fix mismatches.

## Phase 2 (04:05 → 08:30) — nap 05:45–07:15

- [x] `invest.ts` — `allocate()` real; `yearlyReturn(asset, rng)` =
      Normal(mean, vol) via Box–Muller, clipped [−60, +80]; `growPortfolio(
    portfolio, years, rng) → { after, yearlyReturns }`; stage_end at ch 4/7/10
      with 5/6/25 years; `projection()` for the epilogue incl. `ifNotInvested`
      (cashbox after 5%/yr inflation in real terms) and the mandatory
      `assumptionLine`. Tests: zero-vol asset grows exactly (1+r)^t; seeded
      returns reproducible; cashbox nominal unchanged.
- [x] `scoring.ts` v2 — NCFE items from `ncfe` evidence (mean ≥ 0.5 rule),
      attitude thresholds, `literate`, safety spotted/faced (CONTRACTS §2.4).
      Tests: a log with all-good choices on the fixture → literate true;
      all-bad → false; attitude bands at 19/20/39/40 %.
- [x] `whatif.ts` — `whatIf()` per CONTRACTS §2.5: replay from seed with the
      log's choice ids, substituting the best choice at `biggestMistake`.
      Test: result deterministic across two calls; altEnd ≥ actualEnd in
      wallet for a fixture where the mistake is a pure loss.
- [x] Balance pass with Aakarsh (06:30): run `simulate.ts` on the real
      content with the 3 policies × 3 difficulties; tune pressure, happiness
      deltas and the lock thresholds so `always good` finishes stable,
      `random` detours 2–4 times, `always worst` restarts at least once
      without being unwinnable. Report numbers to Monish for final_report.
- [x] `src/minigames/KiranaRush.ts` — 30 s: items fall/appear with price +
      "need/want" implied; player taps NEED or WANT; ≥ 70% correct = win.
      Data from a small inline list (10 items). Starts with
      `{ onDone }`, calls it once, stops itself. Big buttons.
- [x] `src/minigames/ScamOrLegit.ts` — 30 s: 8 messages (UPI collect
      request, "OTP by mistake", real bank SMS, scholarship portal notice,
      "like videos earn ₹5,000/day"…); swipe/tap LEGIT or SCAM; ≥ 6/8 = win.
      No real brand names.
- [x] `src/minigames/index.ts` exports both under their `MiniGameDef['id']`.
- [x] Hints: `hintsOn` after 2 fails — verify end-to-end with Ronith.

## Phase 3 (08:30 → 11:00)

- [ ] Cross-playtest Ronith's build on a phone; file P0 issues.
- [ ] Final test count + simulate table to Monish by 09:30.
- [ ] Last PR green before **10:15**.

## Definition of done

`Game` implements every method in CONTRACTS §1 · ≥ 35 tests by final ·
seeded runs reproducible · `loadGame(toJSON())` resumes exactly ·
`whatIf()` deterministic · two mini-games call `onDone` exactly once ·
no import of Phaser anywhere under `src/engine/`.
