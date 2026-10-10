# Monish — Integrator, platform, deliverables

> **Inbox:** `docs/plan/requests/monish.md` — read it before every edit; OPEN P0/P1 items come before this checklist. To ask someone else for something, append to *their* inbox.

## After M2 (04:00 → 11:00) — Monish

Role until the end: integrator, every PDF, the video, the forms. Nap **05:30–07:00**.

- [x] **04:00** confirm on GitHub that `deliverables/M2.pdf` is on `main` and the last commit is before 04:00. Post `MERGED: M2 in` in chat.
- [ ] **04:15–05:15** `docs/plan/CONCEPTS.md` skeleton (PLAYTEST #24): table of the 17 concepts → one-line definition · the real-life situation · the lesson line · NCFE item · tasks that evidence it. Aakarsh fills the content columns after his nap.
- [ ] **04:15–05:30** `src/app/tts.ts` (PLAYTEST #22b, P2): `speak(text, lang)` over the Web Speech API (`en-IN`/`te-IN`/`hi-IN` if the device has voices, else silent), `stop()`, a `ttsEnabled` flag persisted in localStorage. Hand Ronith one line to call it from Battle and Quiz (request in his inbox).
- [ ] **05:30–07:00** nap.
- [ ] **07:00** play test 2 (all four, phone + laptop). Write `docs/plan/PLAYTEST-02.md` in the same format; re-check every PLAYTEST-01 row marked DONE.
- [ ] **07:30** integration call, 20 min. Decide cuts from the list: second mini-game → Telugu beyond onboarding → Stage 3 depth → town map → live email → what-if screen. Record the decision in `PLAYTEST-02.md`.
- [ ] **08:00–09:00** `deliverables/src/final_report.tex` (≤ 3 pages: solution, approach, features, results). Numbers from Saharsh by 09:30 (tests, sim table) and from the validator. Team 97, no names, no IIIT. Compile here with xelatex.
- [ ] **08:30** feature freeze announced in chat.
- [ ] **09:00** `docs/demo-script.md` — ≤ 4 min, the 9 beats of README §8 with what's on screen + the voiceover line each. Ronith records the screen at 09:30 using `?demo=1` for the late game; you record the voiceover; stitch; upload to Drive; **"Anyone with the link"**; test in incognito by **10:30**.
- [ ] **09:30** README final pass: setup/run only + credits (Kenney CC0, Press Start 2P OFL, any body font, music track licence, "original pixel-art backdrops by the team").
- [ ] **10:15 code freeze**: `git checkout main && git pull && npm ci && npm run check && npm run build`. Only you push after this. `git archive -o team97.zip HEAD`.
- [ ] **10:45** verify the latest commit on GitHub `main`; submit video link + zip through the forms on Discord.
- [ ] **11:00–11:25** slides PDF with Aakarsh (6–8 slides: problem · approach · solution with screenshots · results · NGO integration · next steps). Submit by 11:30.

> Everything below this line is the original phase plan. Where it disagrees with **After M2**, After M2 wins.

**MINE:** `src/shared/`, `src/app/`, `server/`, `public/ngo/`, root configs
(`package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig.json`,
`index.html`, `.prettierrc`, `.eslintrc.cjs`, `.github/`), `docs/`,
`deliverables/`, `README.md`, `LICENSE`.
**NOT MINE:** `src/engine`, `src/game`, `src/content`, `src/minigames`, `public/assets`.
(Exception: Phase 0 creates the _seed_ files inside everyone's folders once;
after `v0-skeleton` you never touch them again.)

You are also the only person allowed to push to `main` during
03:50–04:05 and 10:15–11:00. You write every PDF. You keep `main` green.

---

## Phase 0 — Skeleton (23:30 → 00:15). Blocks everyone. Go fast.

One branch `monish/skeleton`, several small commits (incremental history
rule), rebase-merged to `main`, tagged `v0-skeleton`.

- [x] `npm create vite@latest . -- --template vanilla-ts` style root; set
      `"type": "module"`; Node 20 in `.nvmrc`.
- [x] Install **all** deps now so nobody else touches `package.json`:
      `phaser vite vite-plugin-pwa typescript vitest zod tsx prettier eslint
    @typescript-eslint/parser @typescript-eslint/eslint-plugin
    eslint-plugin-import idb-keyval jspdf`.
      Server: `express cors nodemailer` + `@types/*`, `tsx`.
- [x] `tsconfig.json`: `strict`, `moduleResolution: bundler`, `resolveJsonModule`,
      path alias `@/* → src/*`. `vite.config.ts`: alias, `base: './'`,
      `VitePWA({ registerType: 'autoUpdate', manifest: {...portrait, 360x640 icons} })`.
- [x] `.prettierrc` (`singleQuote, semi, printWidth 100, trailingComma all`),
      `.eslintrc.cjs` with `import/no-restricted-paths` enforcing the one-way
      import rule from README §2 (engine ↛ game/app/content/phaser; content ↛ engine/game).
- [x] `src/shared/types.ts` — **copy CONTRACTS.md §1 verbatim.**
- [x] `src/shared/schema.ts` — zod schemas mirroring every content type
      (`TaskSchema`, `ContentPackSchema`, …). Export `parseContentPack(json): ContentPack`.
- [x] `src/shared/i18n.ts` — `t()`, `setLang()`, `getLang()` per CONTRACTS §4.5.
- [x] `src/engine/index.ts` — **stub**: `createGame`/`loadGame`/`scaleToCoins`
      with a naïve implementation (cycles tasks of the stage in order, applies
      effects unscaled, no scheduler, `summary()` zeros). Must satisfy the
      `Game` type exactly. Header comment: `// STUB — Saharsh replaces internals, keeps exports.`
- [x] `src/engine/__tests__/stub.test.ts` — one test: `createGame(seed).next().kind === 'chapter_start'`.
- [x] `src/content/` — seed per CONTRACTS §3: `index.ts` (`loadContent`,
      `localize`), `validate.ts` (zod parse + the cross-ref checks, exits 1 on
      failure with a readable list), and minimal JSON: 3 personas, L1–L4 and
      K1–K5 **verbatim from CONTEXT.md §2.4**, 4 concepts, **3 tasks** (one of
      them the canonical scam task from CONTRACTS §3.1), 1 detour, 1 event,
      2 explainers (one is CONTRACTS §3.2), 2 minigame defs, 4 asset defs
      (CONTEXT §2.10 table), 10 places (`campus`, never iiit), `strings/en.json`
      with ~30 chrome keys, `strings/te.json` `{}`, `strings/hi.json` `{}`.
- [x] `src/minigames/index.ts` — `export const minigameScenes = {} as Record<...>`.
- [x] `src/game/scenes/index.ts` — imports `minigameScenes`, exports `scenes`
      with one `BootScene` that shows "SKELETON OK" text. `src/game/config.ts`
      with the Phaser config (360×640, `Scale.FIT`, `pixelArt`).
- [x] `src/app/main.ts` (creates `new Phaser.Game`), `src/app/session.ts`
      (in-memory `getSession()` satisfying CONTRACTS §4.1; `save()`/`resume()`
      no-ops for now), `index.html` (viewport, `user-scalable=no`, dark bg).
- [x] `server/` — `package.json`, `tsconfig.json`, `src/index.ts` with
      `GET /health`.
- [x] `.github/workflows/ci.yml` — on push/PR: `npm ci`, `npm run check`,
      `npm run build`, `cd server && npm ci && npx tsc --noEmit`.
- [x] Root `package.json` scripts exactly as CONTRACTS §6.
- [x] `npm run check && npm run build` green locally. Commit, PR, rebase-merge,
      `git tag v0-skeleton && git push --tags`. Post **"SKELETON IS UP"**.

---

## Phase 1 (00:15 → 03:15)

- [x] `src/app/storage.ts` — `idb-keyval` wrappers: `saveState(GameState)`,
      `loadState()`, `clear()`, plus `saveProfileDraft` for mid-onboarding.
- [x] `session.ts` real: `startGame` seeds from `Date.now()`, `save()` after
      every `choose()` (Ronith calls it), `resume()` → `loadGame`. `setLang`
      re-localizes and persists in `localStorage`.
- [x] PWA: manifest icons (any 192/512 PNG placeholder), `navigateFallback`,
      runtime caching of `/assets/**`. Verify offline reload in DevTools.
- [x] `server/src/index.ts` — `POST /api/report`: `nodemailer.createTestAccount()`
      once at boot, send mail with PDF attachment, return
      `{ previewUrl: nodemailer.getTestMessageUrl(info) }`. CORS.
- [x] `src/app/report.ts` — `buildReportPdf(report: Report): Blob` with jsPDF:
      Team-neutral header (nickname, date), before/after quiz, NCFE k/b/a +
      literate flag + "27% national reference", safety x/y, per-pillar table,
      mistakes fixed, assumption footer. **No what-if.** Then `sendReport()` in
      session: POST base64; on network error return `previewUrl: null`.
- [x] GitHub Pages deploy workflow (`gh-pages` branch via `actions/deploy-pages`)
      — nice-to-have; skip if > 20 min.
- [ ] Review PRs touching `src/shared/` and merge `DEP:`/`CONTRACT:` requests
      within 15 min. Keep a running list of contract additions in
      `docs/plan/CHANGELOG.md`.
- [ ] 02:45 integration call: you drive. Merge order: content → engine → game → app.
- [x] `deliverables/M2.tex` skeleton from `team97_vanguard_context/03_submissions/M1/M1.tex`
      (same preamble, "M2 — Progress", Team No. 97, no names).

## M2 crunch (03:15 → 03:55)

- [x] Collect numbers: `npm test` count + pass, `npm run validate:content`
      output (tasks/framings/explainers counts), scaler table (₹200 bat at
      4 pocket-money bands), one DevTools slow-3G load time, playtest notes
      from the 02:45 call (time to first battle, confusions).
- [x] Write M2 (≤ 2 pages): (1) current approach + changes since M1 (decisions
      in README §6: S=5000, 10 chapters, 2 mini-games, Telugu, Aunty, hints;
      stack = TS/Phaser/Vite); (2) experiments + results (the numbers above);
      (3) testing progress (unit tests, schema validation, play test, device
      throttle); (4) plan for remaining time (Phase 2 table + cut list).
- [x] `xelatex` → `deliverables/M2.pdf`. Open it. **Team 97 on top. No names.
      No IIIT.** Commit directly to `main`, push, **verify on GitHub by 03:55**.

## Phase 2 (04:05 → 08:30) — nap 05:45–07:15

- [x] `public/ngo/index.html` — static dashboard mock: batch code `HYD-097`,
      3 centres, joined/active/finished, avg before→after, % NCFE-literate,
      top-5 banked concepts bar list, "Export CSV (Vanguard sees aggregates
      only)" button. Plain HTML/CSS, same pixel font as the game. Link from
      the EndReport screen ("Facilitator view").
- [ ] Wire `sendReport` UI contract with Ronith: EndReport calls
      `session.sendReport({facilitatorEmail, guardianEmail})`, shows
      preview URL + "Download PDF".
- [x] `public/demo-save.json` — a `GameState` at chapter 8 with a banked
      mistake and a portfolio, for the demo. Add `?demo=1` handling in
      `main.ts` that loads it.
- [x] Perf: DevTools slow 3G + 4× CPU on `npm run preview` build → record
      load time; Lighthouse PWA installable. Numbers go in final report.
- [ ] 07:30 integration call: you drive. Decide cuts from README §3 cut list.
- [x] `deliverables/final_report.tex` draft (≤ 3 pages: solution, approach,
      features, results). Reuse M2 numbers; add final test count, content
      counts, playtest results, perf.
- [x] `README.md` rewrite — **setup/run only** (Node 20, `npm i`, `npm run dev`,
      `npm run server`, `npm run build`, tests), plus **asset credits**
      (Kenney Tiny Town, RPG Urban Pack — CC0; fonts; any audio). No solution
      explanation. Keep MIT `LICENSE`.

## Phase 3 (08:30 → 11:00)

- [ ] Demo script (`docs/demo-script.md`), ≤ 4 min, following README §8.
      Ronith records screen; you record voiceover (no names, no IIIT, say
      "Team 97"). Export MP4 → Drive → "Anyone with the link" → test in
      incognito.
- [ ] `final_report.pdf` built, checked, committed.
- [ ] 10:15 **code freeze**: `git checkout main && git pull && npm ci && npm run check && npm run build`.
      Zip: `git archive -o team97.zip HEAD` (no node_modules by construction).
- [ ] 10:45: verify latest commit on GitHub `main`; submit video link + zip via forms.
- [ ] 11:00–11:25: slides PDF (6–8 slides: problem, approach, solution w/
      screenshots, results numbers, NGO integration, next steps). Aakarsh
      helps. Submit by 11:30.

## Definition of done

`main` green at 03:55 and 10:45 · M2.pdf and final_report.pdf in
`deliverables/` with Team 97 on top and zero names · README is setup-only
with credits · reload resumes a game · report PDF downloads and an Ethereal
preview opens · dashboard mock linked · video link opens in incognito.
