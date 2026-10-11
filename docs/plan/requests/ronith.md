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
- Status: DONE 01:27 41e79d5
- Done: git identity set to Ronith Menneni; every commit on ronith/scenes since the art work is authored by Ronith (Claude only as Co-Authored-By). Shows on main once the PR merges.
- What: your 9 commits on main are authored "Claude". In your clone / session: `git config user.name "Ronith Menneni" && git config user.email "<your github email>"`. Add that line to your session prompt so cloud sessions do it too.
- Why: hackathon rule — incremental history with the team members' names; the organisers may live-question it.
- Accept when: your next commit on main shows your name in `git log`.

### R-monish-02 · Wire the end-report buttons to session
- From: monish · To: ronith · At: 00:35 · Priority: P1
- Status: DOING
- Done: on ronith/phase2 — Download builds via sendReport + downloadBlob; Email form (facilitator + optional guardian CC) shows the preview link or the offline line; Facilitator view opens ./ngo/index.html.
- What: in `EndReportScene`: "Download report" → `const { pdfBlob } = await session.sendReport({ facilitatorEmail: '' })` is NOT the way — call `buildReportPdf` via `session.sendReport` only when emailing. For download-only use `downloadBlob(blob, 'report.pdf')` from `@/app/session` after building the PDF through `session.sendReport` with the facilitator email typed; if the facilitator field is empty, still build and download (sendReport returns `pdfBlob` even when the POST fails). Show `previewUrl` as a tappable link when non-null, and "Saved locally (offline)" when null. "Facilitator view" button → `window.open('./ngo/index.html')`.
- Why: the demo path step 9 (README §8).
- Accept when: with `npm run server` running, tapping "Email facilitator" shows a preview URL (or "Saved locally" when the sandbox blocks Ethereal).

### R-saharsh-01 · Hint fallback shows the label "Aunty's hint" instead of a hint
- From: saharsh · To: ronith · At: 01:05 · Priority: P2
- Status: DONE 01:27 24fa7b2
- Done: `battle.hint` is now the panel heading; body = the task's hint or `battle.hint_generic`. Merged in PR #19.
- What: `BattleScene.hint()` falls back to `tr('battle.hint', …)`, but in content `battle.hint` is the panel label ("Aunty's hint"); the generic hint text is `battle.hint_generic`. Use `battle.hint_generic` for the fallback (and `battle.hint` as a heading if you want one).
- Why: on tasks with no `hint` on any choice, after two fails the hint panel just says "Aunty's hint" (seen in a scripted playthrough, Stage 1 "BUS PASS DUE").
- Accept when: failing such a task twice shows "Slow down. Who gains if you choose fast?".

### R-monish-03 · Use the Hyderabad backdrops in BattleScene (and TownMap thumbnails)
- From: monish · To: ronith · At: 01:45 · Priority: P1
- Status: DONE `97b0f21` (superseded by 04)
- What: nine finished 480×270 pixel-art backdrops are in `team97_vanguard_context/08_hyderabad_backgrounds/1x/` with a platforms overlay. Full mapping table and 5-step wiring in `docs/plan/ronith.md` → "Hyderabad backdrops". Copy the **1×** PNGs to `public/assets/backdrops/`, preload them, and draw the one matching `framing.place` in the arena strip at scale 0.75 (360×202) instead of `grassField`; keep `grassField` as fallback. Then, if cheap, the same images at 0.25 as TownMap thumbnails.
- Why: this is the single biggest visual upgrade available before the demo video; every battle currently sits on a procedural green field.
- Accept when: the Charminar scam task renders on the Charminar backdrop at 360×640 with no console errors, `npm run build` precache grows by ≈170 KB not 500 KB, and `npm run check` is green.

### R-monish-04 · Backdrops now cover every place — plus epilogue and stage-transition art
- From: monish · To: ronith · At: 02:05 · Priority: P1
- Status: DONE `97b0f21` — all 20 backdrops via `backdropForPlace()`; epilogue home_age60; stage ends office/hitec/tankbund
- What: supersedes the mapping in R-monish-03 (same wiring, bigger table). 20 backdrops in `team97_vanguard_context/08_hyderabad_backgrounds/1x/` now cover all 13 `places.json` ids directly (`10_home` … `18_campus`), plus `19_home_age60` for `EpilogueScene`, `20_office_lobby` for the Stage 1→2 transition, `09_hitec_city` for Stage 2→3. Full table + wiring in `docs/plan/ronith.md` → "Hyderabad backdrops". `home` alone is 40 of 123 framings — do that one first if you do nothing else.
- Why: this turns every screen from a green rectangle into Hyderabad; it is the demo video.
- Accept when: a battle at `home`, `kirana` and `charminar` each shows its own backdrop at 360×640; Epilogue shows the aged room; `npm run build` precache grows ≈370 KB; `npm run check` green.

### R-team-01 · Play test 01 — your 17 items (6 are P0)
- From: team · To: ronith · At: 02:20 · Priority: P0
- Status: OPEN
- What: `docs/plan/PLAYTEST-01.md` — items 8, 18, 7, 6, 13, 16 are P0 (letterbox, backdrops, Switch bug, quiz heading, hearts label, back-to-map). Then 1, 2, 3, 4, 5, 10, 14, 17, 23. Tick Status in that file as you go.
- Why: The team played the build; these are what the judges will see first.
- Accept when: every one of your rows in PLAYTEST-01.md reads DONE or has a DECLINED reason.

### R-monish-05 · Delegation on record: Saharsh edits InfoPanelScene.ts and src/game/audio/
- From: monish · To: ronith · At: 03:25 · Priority: P1
- Status: OPEN
- What: PLAYTEST #11 (info panel) and #12 (music/SFX) move to Saharsh. He may edit **only** `src/game/scenes/InfoPanelScene.ts` and create `src/game/audio/`. He will ask you (inbox) for the HUD mute-button line and any scene hook. Please don't touch those two paths until he posts MERGED.
- Why: you have 17 play-test items; he has 3 and the engine is done.
- Accept when: you reply DONE here (acknowledged), and the mute hook request from Saharsh is handled.

### R-monish-06 · Read-aloud hook (PLAYTEST #22b, P2 — only after your P0/P1s)
- From: monish · To: ronith · At: 03:35 · Priority: P2
- Status: OPEN
- What: `src/app/tts.ts` exports `speak(text, lang)`, `speakChoices(situation, options, lang)`, `stop()`, `ttsEnabled()`, `setTtsEnabled(on)`, `ttsSupported()`. Add (1) a 🔊 toggle in the HUD next to mute that calls `setTtsEnabled`, hidden when `!ttsSupported()`; (2) in `BattleScene`, after the framing text finishes typing: `speakChoices(framing.text, choices.map(c => c.text), session.lang)`; (3) in `QuizScene`: `speakChoices(q.text, q.options, session.lang)`; (4) `stop()` on scene shutdown. Import from `@/app/tts` (the lint rule allows `@/app/session` only — I'll widen it to `@/app/tts` in the same commit as this request).
- Why: "voiceovers reading out the options in the selected language" — play-test item 22. Works offline with the device's own voices; silent where a Telugu voice is missing.
- Accept when: with TTS on, an English battle reads the situation and numbered options; switching to Telugu either reads in Telugu or stays silent (never English voice on Telugu text).

### R-monish-07 · Two one-line hooks: start the music, step blips in the walk
- From: monish · To: ronith · At: 04:35 · Priority: P1
- Status: DONE `97b0f21` startMusic on START/CONTINUE · `dcd4c22` stepBlip per stride
- What: `src/game/music.ts` exports `startMusic()`, `stopMusic()`, `stepBlip(left)`. (1) In `TitleScene`, call `startMusic()` inside the START/CONTINUE tap handler (needs a user gesture; it is idempotent and already obeys your mute flag — the HUD ♪/× button now silences music too without changes). (2) In the walk you're adding for #1, call `stepBlip(frame % 2 === 0)` on each frame change. Nothing else to wire.
- Why: PLAYTEST #12 and the sound half of #1, without touching `audio.ts`.
- Accept when: music starts on START, mutes with the HUD button, and the avatar's steps tick.

### R-monish-08 · Incoming-call overlay for the scam-call side quest (PLAYTEST #19)
- From: monish · To: ronith · At: 04:55 · Priority: P2 (after your P0/P1s)
- Status: OPEN
- What: event `scam_call_sidequest` (PR #26, Aakarsh merges) has `framing.portrait: "caller_wonky"` on every persona. (1) Add a 32×32 dodgy-caller portrait under that key (sunglasses, blurry — compose from a Kenney face + recolour); until then `portraitKey()` already falls back by speaker role. (2) When a `Step.kind === 'event'` framing has `portrait === 'caller_wonky'`, show a 2-second "incoming call" overlay (ringing phone panel, the portrait, ACCEPT button) before the normal battle screen. Decline isn't offered — the lesson is in the choices.
- Why: play-test note 19: "a scam call that comes up as a random side quest, with a wonky DP".
- Accept when: the event renders with the call overlay then the battle; `npm run check` green.

### R-monish-09 · READ `/ISSUES.md` — the 24 play-test items, your open ones listed at the top
- From: monish · To: ronith · At: 04:45 · Priority: P0
- Status: DOING — #1, #4, #16, #18 DONE; #5 DOING
- What: `ISSUES.md` at the repo root is the fix list, in Monish's original words, with an attack order for you (8 → 18 → 7 → 6 → 13 → 16 first). Flip each row to DONE <sha> as you merge. Per-item directions remain in `docs/plan/PLAYTEST-01.md`.
- Why: the demo is judged on these; nothing else in your file outranks them before 06:00.
- Accept when: every Ronith row in ISSUES.md is ✅ or carries a DECLINED reason.

### R-monish-10 · Teaching moments = the Professor (ISSUES #17 + #10, redefined by Monish 05:40)
- From: monish · To: ronith · At: 05:40 · Priority: P1
- Status: OPEN
- What: in `BattleScene` after `choose()`: bars animate → Professor portrait (key `professor`, 32×32, you draw it; falls back to the current guide portrait until then) slides in beside the text box → **weak/critical:** show `o.lesson`, tap → `Explainer(o.explainerId)`, then detour/restart as now · **good/ok:** show one of `professor.praise.1..4` (use `tr()` with English fallbacks until Aakarsh adds them), tap → continue, **no Explainer**. Replay library unchanged (engine still records the explainer). Full spec: `docs/plan/PLAYTEST-01.md` rows 17 and 10.
- Why: the team's redefinition of #17: the lesson lands after the consequence, and a good choice is rewarded in one beat instead of a 15-second animation.
- Accept when: a weak choice shows lesson → animation; a good choice shows praise → next step with no animation; `npm run check` green.

### R-aakarsh-03 · Voice-over + 3-way sound panel are in a PR for you to review (supersedes R-monish-06)
- From: aakarsh · To: ronith · At: 07:00 · Priority: P2
- Status: OPEN
- What: PR `aakarsh/voiceover` touches your folder: `src/game/voice.ts` (new), `scenes/AudioSettingsScene.ts` (new, registered in `scenes/index.ts`), `audio.ts` split into music / sfx / voice channels (`isMuted`/`setMuted`/`onMuteChange` still work), `music.ts` follows the music channel, the corner ♪ and HUD ♪ now open the panel, and one-line hooks in `BattleScene` (opening line, hint, Professor line) and `ExplainerScene` (captions). Clips are in `public/assets/voice/`. Please review those files on the PR.
- Why: Aakarsh decided the voice-over covers only the Professor, the explainers and the characters' lines (not options or quiz), with generated clips (Kokoro) instead of the device voice. That makes R-monish-06 unnecessary; mark it DECLINED (superseded) if you agree.
- Accept when: you approve the PR or comment with fixes.
