# Build Plan — "Learning Money by Living It"

Megathon X · Team 97 · Monish · Ronith · Saharsh · Aakarsh
Written 23:25 IST, Sat 10 Oct. **M2 at 04:00. Final at 11:00. Slides 11:30.**

This folder is the single source of truth for _how_ we build tonight.
Every Claude Code session reads, in order:

1. `docs/plan/README.md` (this file) — rules, timeline, who owns what
2. `docs/plan/CONTRACTS.md` — the frozen TypeScript interfaces + JSON shapes
3. `docs/plan/<yourname>.md` — your checklist

The _what_ lives in `CONTEXT.md` §2 (authoritative design) and
`deliverables/M1.pdf`. This plan turns that into code ownership, interfaces
and a clock. Where CONTEXT.md says **[OPEN]**, this plan **decides** (see §6) —
no more debating tonight; ship, then tune.

---

## 0. The one rule that prevents merge hell

**You only edit files inside the directories you own.** What you need from
others arrives through the frozen interfaces in `CONTRACTS.md`. If the
interface is missing something, post `CONTRACT: <what> — <why>` in the group
chat; Monish adds it (additively) within 15 minutes. You never reach into
someone else's folder.

Four people, four non-overlapping territories, one contract. Everything else
is detail.

---

## 1. Stack (decided — do not relitigate)

| Layer         | Choice                                                                                   | Why                                                                                                        |
| ------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Language      | **TypeScript** (strict)                                                                  | The compiler enforces the contract between four people. It compiles to the "plain JS modules" M1 promised. |
| Build         | **Vite** + `vite-plugin-pwa`                                                             | Fast dev; offline-capable PWA for cheap Androids.                                                          |
| Client        | **Phaser 3** (3.80+)                                                                     | As per M1. Portrait **360×640**, `Scale.FIT`, pixel-art (`pixelArt: true`).                                |
| Tests         | **Vitest**                                                                               | Engine + content tests run headless in CI and give us numbers for M2.                                      |
| Validation    | **zod**                                                                                  | Content JSON validated against the same types the engine uses.                                             |
| Report/email  | **jsPDF** (client-side PDF) + tiny **Express** + **nodemailer → Ethereal** sandbox inbox | Proves "report emailed to facilitator" with a real inbox link, zero account setup.                         |
| NGO dashboard | Static mock page with sample data (`public/ngo/`)                                        | CONTEXT.md §2.13: a mock is acceptable.                                                                    |
| Art           | **Kenney Tiny Town + RPG Urban Pack** (CC0), coloured boxes until art lands              | CONTEXT.md §2.16. Credit in README.                                                                        |
| Format        | **Prettier**, config committed                                                           | Identical formatting = no whitespace conflicts.                                                            |

Node 20+. npm. One root `package.json` with **all** deps pre-installed in
Phase 0, plus `server/package.json`.

---

## 2. Repository layout and ownership

```
.
├── CONTEXT.md, team97_vanguard_context/   ← design context (read-only for all)
├── deliverables/                          ← M1.pdf, M2.pdf, final_report.pdf   [MONISH]
├── docs/plan/                             ← this plan                          [MONISH]
├── public/
│   ├── assets/                            ← sprites, tiles, audio, fonts        [RONITH]
│   └── ngo/                               ← NGO dashboard mock (static html)    [MONISH]
├── src/
│   ├── shared/                            ← types.ts, schema.ts, i18n.ts        [MONISH · FROZEN after Phase 0]
│   ├── engine/                            ← pure game logic, 0 Phaser, 0 DOM    [SAHARSH]
│   ├── content/                           ← JSON: tasks, explainers, strings    [AAKARSH]
│   ├── minigames/                         ← Phaser mini-game scenes             [SAHARSH · Phase 2]
│   ├── game/                              ← Phaser scenes, HUD, explainer player[RONITH]
│   └── app/                               ← bootstrap, session, storage, report [MONISH]
├── server/                                ← Express: /api/report → Ethereal     [MONISH]
├── index.html · vite.config.ts · tsconfig.json · package.json · .prettierrc · .github/   [MONISH]
└── README.md · LICENSE                                                           [MONISH]
```

**Import direction is one-way:**

```
shared ← engine ← game ← app
shared ← content ← game
shared ← engine ← minigames ← game
```

- `engine` imports **only** `shared`. Never Phaser, never `window`, never content.
- `content` imports **only** `shared`.
- `game`, `minigames` may import `engine`, `content`, `shared`.
- `app` may import anything. `server` imports only `shared` types.

| Person                                 | Owns                                                                                                      | Never touches                                                             |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **Monish** (integrator + deliverables) | `src/shared`, `src/app`, `server/`, `public/ngo`, root configs, CI, `docs/`, `deliverables/`, `README.md` | `src/engine`, `src/game`, `src/content`, `src/minigames`, `public/assets` |
| **Ronith** (client)                    | `src/game`, `public/assets`                                                                               | everything else                                                           |
| **Saharsh** (engine)                   | `src/engine`, `src/minigames`                                                                             | everything else                                                           |
| **Aakarsh** (content)                  | `src/content`                                                                                             | everything else                                                           |

`package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig.json`,
`index.html` are **Monish-only**. Need a dep? Post `DEP: <name> — <why>`.
Monish adds it on `main` in minutes; you `git pull --rebase origin main`.

---

## 3. The clock (IST, tonight)

| Time            | What                                                                                                                                                                                                                                                                                                                                                                                         | Who                                   |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| **23:25–00:15** | **Phase 0 — skeleton.** Monish lands one commit on `main`: tooling, frozen contracts, stub engine, seed content, placeholder scenes, session, server `/health`, CI. Tag `v0-skeleton`. Everyone else: Node 20 installed, repo cloned, plan read, start drafting _in your own folder locally only_ (content outlines in markdown, asset downloads). **Nobody pushes until "SKELETON IS UP".** | Monish                                |
| **00:15–03:15** | **Phase 1 — Stage 1 playable.** Four parallel tracks (below). Merge to `main` every ~90 min minimum.                                                                                                                                                                                                                                                                                         | all                                   |
| **02:45**       | **Integration call #1 (20 min).** Swap stub engine → real engine, seed content → real content. Play Stage 1 start-to-finish on one laptop. Fix only blockers.                                                                                                                                                                                                                                | all                                   |
| **03:15–03:50** | **M2 crunch.** Monish writes `deliverables/M2.pdf` from real numbers (test count, scaler table, load time). Everyone: last push to `main` by **03:40**. `main` must be green.                                                                                                                                                                                                                | Monish writes; others push + playtest |
| **03:50**       | **Pre-deadline freeze.** No pushes to `main` 03:50–04:05 except Monish.                                                                                                                                                                                                                                                                                                                      | —                                     |
| **04:00**       | **M2 DEADLINE.**                                                                                                                                                                                                                                                                                                                                                                             | —                                     |
| **04:05–08:30** | **Phase 2 — full game.** Stages 2–3 (lighter), investing + epilogue, what-if, after-quiz, report PDF + email, mini-games, Telugu onboarding, dashboard mock, polish.                                                                                                                                                                                                                         | all                                   |
| **07:30**       | **Integration call #2 (20 min).** Full 3-stage playthrough. Report lands in the Ethereal inbox. Decide cuts.                                                                                                                                                                                                                                                                                 | all                                   |
| **08:30**       | **FEATURE FREEZE.** Only bug fixes after this.                                                                                                                                                                                                                                                                                                                                               | —                                     |
| **08:30–10:00** | **Phase 3 — ship.** Demo video recorded (Ronith drives, Monish voiceover script), `final_report.pdf`, README (setup/run + asset credits), bug fixes from cross-playtesting.                                                                                                                                                                                                                  | all                                   |
| **10:15**       | **CODE FREEZE.** Final `npm run check && npm run build` on `main`. Zip the repo (no `node_modules`).                                                                                                                                                                                                                                                                                         | Monish                                |
| **10:45**       | Final push verified on GitHub. Video on Drive, "Anyone with the link". Forms submitted.                                                                                                                                                                                                                                                                                                      | Monish                                |
| **11:00**       | **FINAL DEADLINE.**                                                                                                                                                                                                                                                                                                                                                                          | —                                     |
| **11:00–11:25** | Slides PDF (problem, approach, solution, results) — built from `final_report.pdf` content.                                                                                                                                                                                                                                                                                                   | Monish + Aakarsh                      |
| **11:30**       | **SLIDES DEADLINE.**                                                                                                                                                                                                                                                                                                                                                                         | —                                     |

Sleep: nobody sleeps before 04:00. After M2, two people nap 04:15–05:45
(Aakarsh, Ronith), the other two nap 05:45–07:15 (Monish, Saharsh). A fresh
brain at 09:00 is worth more than one more feature at 05:00.

### Phase 1 tracks (00:15 → 03:15)

| Person      | Deliverable by 02:45                                                                                                                                                                                                           | Proof                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| **Saharsh** | Real engine behind the frozen API: state, economy scaler, chapter loop, task selector, consequence scheduler, mistake bank, restart/detour routing, decision log. **≥ 20 unit tests.**                                         | `npm test` green; a 30-step seeded run prints bars going up and down          |
| **Aakarsh** | Validator with helpful errors; Stage 1 content complete: **12 tasks** (4 pillars × 3 difficulties) × 3 persona framings, 4 detours, 6 events, 8 explainers, 12 concepts, onboarding L1–L4 + K1–K5, personas, `strings/en.json` | `npm run validate:content` green                                              |
| **Ronith**  | Boot/Preload → Title → Onboarding (lang, avatar+name, L1–L4, persona card + Switch) → Quiz → ChapterMap → **MoneyBattle** (the one generic screen) → Explainer player → HUD. Works against stub engine + seed content.         | `npm run dev`, play 5 battles at 360×640                                      |
| **Monish**  | Phase 0, then: `storage.ts` (IndexedDB save/resume), PWA manifest + offline, `session.ts` real, `server/` `/api/report` → Ethereal, CI, GitHub Pages deploy, M2.pdf skeleton in LaTeX                                          | Reload mid-game → resumes; `curl /api/report` returns an Ethereal preview URL |

### Phase 2 tracks (04:05 → 08:30)

| Person      | Deliverable                                                                                                                                                                                                                                              |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Saharsh** | Investing sim (4 made-up assets, seeded returns, stage-jump compounding, epilogue projection), `whatIf()`, `summary()` with NCFE 20-item + safety score, hints-after-two-fails, 2 mini-game scenes in `src/minigames/`, balance pass with Aakarsh        |
| **Aakarsh** | Stage 2 + 3 content (6 tasks each × 3 framings), 4 more detours, 6 more events, remaining explainers, `assets.json` blurbs, `strings/te.json` for onboarding + HUD + battle chrome, Telugu for 2 Stage-1 tasks, content balance pass                     |
| **Ronith**  | TownMap (tap-to-travel, **instant travel**, no walk anim), StageTransition, Invest screen (allocation sliders), InfoPanel overlay, ReplayLibrary, Epilogue, WhatIf, EndReport screen, AfterQuiz reuse, Kenney tiles in, audio blips, mobile touch polish |
| **Monish**  | Report PDF (jsPDF) + "Email to facilitator" flow + Ethereal link shown in UI, NGO dashboard mock with sample batch data, DevTools slow-3G/4× CPU timing numbers, Lighthouse PWA pass, final_report.pdf draft, demo script, README                        |

### Cut list (in this order, if behind at 07:30 call)

1. Mini-game #2 → keep one
2. Telugu beyond onboarding
3. Stage 3 depth → 3 tasks instead of 6
4. TownMap → ChapterMap goes straight to battle
5. Real email → "Download report PDF" button only
6. What-if → text-only comparison, no replay screen

---

## 4. Git workflow (read twice)

```bash
# once
git clone https://github.com/IIIT-ECell/megathon26-mars.git && cd megathon26-mars
npm install && (cd server && npm install)

# start every work session
git fetch origin
git checkout -b <you>/<topic> origin/main          # e.g. saharsh/scheduler

# commit small and often — cloud sessions are ephemeral, and the rules REQUIRE
# incremental history (no squashed/imported history, see CONTEXT.md §1)
npm run format && npm run check
git add -A && git commit -m "engine: consequence scheduler with repeat"
git pull --rebase origin main                       # ALWAYS before push
git push -u origin <you>/<topic>

# open a PR, wait for CI green, MERGE IT YOURSELF (rebase-merge, not squash —
# keeps incremental history). Exception: PRs touching src/shared/ or root
# configs need Monish's 👍.
```

Rules:

1. **Branches**: `monish/*`, `ronith/*`, `saharsh/*`, `aakarsh/*`.
2. **Merge to `main` every ≤ 90 minutes.** Half-done is fine if
   `npm run check` passes. Long branches are how you lose a hackathon.
3. **Rebase, don't merge** `main` into your branch. **Rebase-merge** PRs (GitHub
   "Rebase and merge") so every commit survives — the organisers check for
   incremental history.
4. **Never force-push `main`.** Force-push your own branch freely.
5. **Commit prefix** = area: `engine:`, `content:`, `game:`, `app:`, `server:`,
   `shared:`, `plan:`, `docs:`.
6. **Conflict in a file you don't own** → take `main`'s version and ask the
   owner. **Conflict in `package-lock.json`** →
   `git checkout origin/main -- package-lock.json && npm install`.
7. **Contract changes** (`src/shared/types.ts`, `schema.ts`) are **additive
   only**: new _optional_ fields, new enum values. Never rename, remove or make
   something required. Post `CONTRACT:` in chat; Monish merges in ≤ 15 min.
8. **Red `main` = stop the line.** Whoever broke it fixes it before anything else.
9. **03:50–04:05 and 10:15–11:00: only Monish pushes to `main`.**

---

## 5. Claude Code session prompt (paste at the start of EVERY session)

Replace `<NAME>`, `<name>`, `<BRANCH>`.

```
You are working in the Megathon X repo "megathon26-mars" ("Learning Money by
Living It", Team 97) on branch <BRANCH>. I am <NAME>. It is a hackathon;
the final deadline is 11:00 IST on 11 Oct. Speed with correctness.

First read, in order: docs/plan/README.md, docs/plan/CONTRACTS.md,
docs/plan/<name>.md. Skim CONTEXT.md §2 for the game design. Follow the plan
exactly.

Hard rules:
- Only create or modify files inside the directories listed as MINE in
  docs/plan/<name>.md. If a change is needed elsewhere, stop and tell me
  exactly what to ask the owner for (one line, prefixed DEP: or CONTRACT:).
- src/shared/types.ts and src/shared/schema.ts are frozen. Code against them;
  never edit them.
- Before every push: npm run format && npm run check, then
  git pull --rebase origin main. Commit small and push often — this session
  is ephemeral and the organisers require incremental commit history.
- Commit messages start with my area prefix (README §4).
- Write Vitest tests for logic. Do not test Phaser rendering.
- Never put real company names, tickers or product recommendations in game
  text. Never ask the player for OTP/PIN/Aadhaar/phone/email.
- The landmark "IIIT Hyderabad" must appear in code/content as
  "University campus" (double-blind rule).
- When you finish a task from my file, tick its checkbox in that file
  (docs/plan/<name>.md is the one file outside my area I may edit —
  checkbox lines only).

Start with the first unchecked task in docs/plan/<name>.md.
```

---

## 6. Decisions on CONTEXT.md's [OPEN] items (decided here, tune later)

| #   | Open item                  | Decision tonight                                                                                                                                                                                                                                                           |
| --- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Economy formula / S        | Proportional formula as in M1. **S = ₹5,000** coins/month in Stage 1. Monthly pocket money from L2 band midpoint × 4: `<100→₹200`, `100–300→₹800`, `300–700→₹2,000`, `>700→₹4,000`. Stage 2 income **₹25,000** (real ref ₹20,000); Stage 3 **₹60,000** (real ref ₹50,000). |
| 2   | Happiness model            | 0–100, start 70. Deltas authored per choice (−30…+15). Decays −3 at each chapter start. **0 → restart task.** Mini-games locked when happiness < 30 or wallet < 10% of monthly income.                                                                                     |
| 3   | Mini-games                 | Two: **Kirana Rush** (needs-vs-wants sort, 30 s) and **Scam or Legit** (swipe messages, 30 s). Reward: side-gig framing, **+8% of monthly income coins** and **+10 happiness** on a win. Skippable.                                                                        |
| 4   | Task list                  | 12 Stage-1 tasks (one per pillar × difficulty), 6 each for Stages 2–3, in `src/content/tasks/`. Aakarsh writes; idea bank = CONTEXT.md §6.2 and §12.3.                                                                                                                     |
| 5   | Chapters / stage, playtime | **Stage 1: 4 chapters · Stage 2: 3 · Stage 3: 3** = 10 chapters, 1 main task each + detours/events. Target 20–25 min. Persona carry-over to stages 2–3 is **framing text only** (Aakarsh writes a short "Years later…" line per persona per stage).                        |
| 6   | Real prices                | Use public/plausible numbers, label them "team estimate" in content `source` field. No student survey tonight.                                                                                                                                                             |
| 7   | Second language            | **Telugu** for onboarding + chrome + 2 tasks. Hindi file exists with English fallback (proves "add a file = add a language").                                                                                                                                              |
| 8   | Guardian CC consent        | Facilitator email typed by the **facilitator** on the report screen (not the student); guardian CC optional field. Shown as "consent collected at NGO enrolment" in the report footer.                                                                                     |
| 9   | Dashboard / email          | Dashboard = static mock with sample data. Email = real send to **Ethereal** sandbox, preview URL shown in the UI.                                                                                                                                                          |
| 10  | Guide character / hints    | **Guide "Aunty" yes**: one portrait, delivers lesson lines and hints. **Hints after two fails on the same task: yes** (engine sets `hintsOn`).                                                                                                                             |
| 11  | Explainer animations       | Data-driven: a tiny 6-op DSL in JSON (`text`, `bar`, `coins`, `grow`, `split`, `clear`) rendered by one Phaser scene with tweens. Translation = swap text.                                                                                                                 |
| 12  | Roles / repo               | This document.                                                                                                                                                                                                                                                             |
| 13  | IIIT landmark              | Content and code say **"University campus"**.                                                                                                                                                                                                                              |

---

## 7. Communication

See `docs/plan/TRACKING.md` for how to see what everyone is doing without asking. `./scripts/status.sh` is the 10-second version.

- Group chat prefixes: `DEP:` `CONTRACT:` `BLOCKED:` `MERGED:` `CUT:`. Skimmable.
- Two integration calls: **02:45** and **07:30**. 20 minutes max, on one laptop.
- Phase 3 bugs → GitHub issues, assignee = directory owner, label `P0` if it
  breaks the demo path.
- Idle? Playtest `main` on your phone (`npm run dev -- --host`). Nobody is
  ever done.

---

## 8. Demo path (what the video and the judges see, in order — 4 min max)

1. Title → language toggle (en/te) → avatar + typed name → L1–L4 → persona
   card → "Not me? Switch".
2. Difficulty quiz (5 Qs) → "Your before score: 2/5 · medium".
3. Chapter map → tap place → **money battle** (scam call, persona-framed).
   Weak choice → bars drop, Aunty lesson line, **abstract animation**, mistake
   banked.
4. Chapter start: "EMI deducted ₹…" — a scheduled consequence fires.
5. Mini-game unlocks because bars are healthy; play 15 s.
6. Mistake returns in disguise → answered right → "learned" badge.
7. Stage transition → first salary; prices rescale; invest screen (4 made-up
   assets, assumption label).
8. Epilogue at 60 → what-if of biggest mistake, side by side.
9. After-quiz → learning gain → report PDF → "Emailed to facilitator" with
   inbox screenshot → NGO dashboard mock.

**No team/member/college names on screen. No "IIIT" anywhere.** Keep a seeded
save (`public/demo-save.json`) that jumps to step 7 so the demo never depends
on luck.
