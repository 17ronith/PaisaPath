# Inbox — Ronith

Owner of: src/game, public/assets.
Others: **append** a request block at the bottom (format in `README.md`).
Ronith: change `Status:` lines only; never delete blocks.

| Status | Meaning |
|---|---|
| OPEN | not started |
| DOING | in progress |
| DONE HH:MM sha | merged to main |
| DECLINED reason | won't do — reason given |

---

### R-monish-01 · Commit author must be your name
- From: monish · To: ronith · At: 00:35 · Priority: P0
- Status: DOING
- Done: git identity set to Ronith Menneni; every commit on ronith/scenes since the art work is authored by Ronith (Claude only as Co-Authored-By). Shows on main once the PR merges.
- What: your 9 commits on main are authored "Claude". In your clone / session: `git config user.name "Ronith Menneni" && git config user.email "<your github email>"`. Add that line to your session prompt so cloud sessions do it too.
- Why: hackathon rule — incremental history with the team members' names; the organisers may live-question it.
- Accept when: your next commit on main shows your name in `git log`.

### R-monish-02 · Wire the end-report buttons to session
- From: monish · To: ronith · At: 00:35 · Priority: P1
- Status: OPEN
- What: in `EndReportScene`: "Download report" → `const { pdfBlob } = await session.sendReport({ facilitatorEmail: '' })` is NOT the way — call `buildReportPdf` via `session.sendReport` only when emailing. For download-only use `downloadBlob(blob, 'report.pdf')` from `@/app/session` after building the PDF through `session.sendReport` with the facilitator email typed; if the facilitator field is empty, still build and download (sendReport returns `pdfBlob` even when the POST fails). Show `previewUrl` as a tappable link when non-null, and "Saved locally (offline)" when null. "Facilitator view" button → `window.open('./ngo/index.html')`.
- Why: the demo path step 9 (README §8).
- Accept when: with `npm run server` running, tapping "Email facilitator" shows a preview URL (or "Saved locally" when the sandbox blocks Ethereal).

### R-saharsh-01 · Hint fallback shows the label "Aunty's hint" instead of a hint
- From: saharsh · To: ronith · At: 01:05 · Priority: P2
- Status: OPEN
- What: `BattleScene.hint()` falls back to `tr('battle.hint', …)`, but in content `battle.hint` is the panel label ("Aunty's hint"); the generic hint text is `battle.hint_generic`. Use `battle.hint_generic` for the fallback (and `battle.hint` as a heading if you want one).
- Why: on tasks with no `hint` on any choice, after two fails the hint panel just says "Aunty's hint" (seen in a scripted playthrough, Stage 1 "BUS PASS DUE").
- Accept when: failing such a task twice shows "Slow down. Who gains if you choose fast?".

### R-monish-03 · Use the Hyderabad backdrops in BattleScene (and TownMap thumbnails)
- From: monish · To: ronith · At: 01:45 · Priority: P1
- Status: OPEN
- What: nine finished 480×270 pixel-art backdrops are in `team97_vanguard_context/08_hyderabad_backgrounds/1x/` with a platforms overlay. Full mapping table and 5-step wiring in `docs/plan/ronith.md` → "Hyderabad backdrops". Copy the **1×** PNGs to `public/assets/backdrops/`, preload them, and draw the one matching `framing.place` in the arena strip at scale 0.75 (360×202) instead of `grassField`; keep `grassField` as fallback. Then, if cheap, the same images at 0.25 as TownMap thumbnails.
- Why: this is the single biggest visual upgrade available before the demo video; every battle currently sits on a procedural green field.
- Accept when: the Charminar scam task renders on the Charminar backdrop at 360×640 with no console errors, `npm run build` precache grows by ≈170 KB not 500 KB, and `npm run check` is green.

### R-monish-04 · Backdrops now cover every place — plus epilogue and stage-transition art
- From: monish · To: ronith · At: 02:05 · Priority: P1
- Status: OPEN
- What: supersedes the mapping in R-monish-03 (same wiring, bigger table). 20 backdrops in `team97_vanguard_context/08_hyderabad_backgrounds/1x/` now cover all 13 `places.json` ids directly (`10_home` … `18_campus`), plus `19_home_age60` for `EpilogueScene`, `20_office_lobby` for the Stage 1→2 transition, `09_hitec_city` for Stage 2→3. Full table + wiring in `docs/plan/ronith.md` → "Hyderabad backdrops". `home` alone is 40 of 123 framings — do that one first if you do nothing else.
- Why: this turns every screen from a green rectangle into Hyderabad; it is the demo video.
- Accept when: a battle at `home`, `kirana` and `charminar` each shows its own backdrop at 360×640; Epilogue shows the aged room; `npm run build` precache grows ≈370 KB; `npm run check` green.
