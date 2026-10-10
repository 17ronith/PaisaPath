# Play test 01 — team run-through, 02:15 IST 11 Oct

Four of us played the current `main` build on a laptop (device mode 360×640)
and a phone, start to Stage 3. Everything below is what we wrote down. This is
the file we work from after M2: owners tick the Status column, and anything
new goes at the bottom with the next number.

Priority: **P0** = judges will notice in the first 60 s · **P1** = hurts the
teaching or the demo path · **P2** = polish / stretch.

| # | Issue | Owner | Pri | Status | Notes / direction |
|---|---|---|---|---|---|
| 8 | Huge black bars top and bottom; game doesn't fill the phone screen | Ronith | P0 | OPEN | `Scale.FIT` on a 360×640 (9:16) canvas letterboxes on 19.5:9 phones. Switch to `Scale.RESIZE` with a safe-area layout, or `ENVELOP` + backdrop bleed. |
| 18 | Game doesn't use the updated images (Hyderabad backdrops) | Ronith | P0 | OPEN | R-monish-04 in inbox. `home` first. |
| 7 | "Not me? Switch" shows an unrelated persona card | Ronith | P0 | OPEN | Switch must cycle `pocket_money → scholarship → earner` and re-render label + blurb from `content.personas`; check the index isn't reset by the re-render. |
| 6 | Quiz page has no heading — players don't know it's a quiz | Ronith | P0 | OPEN | Use `quiz.before_title` / `quiz.after_title` strings plus "Question n of 5". |
| 13 | What are the hearts? Nobody understood them | Ronith | P0 | OPEN | Label the bar "HAPPY" (string exists) and show the number; first battle gets a one-time tooltip "hearts = how you feel; at zero you restart". |
| 16 | No way back to the map / town from a screen | Ronith | P0 | OPEN | Persistent "◀ Map" in the HUD outside battles; battles are the only place with no exit. |
| 1 | Walking is wrong — avatar should walk with step sounds | Ronith | P1 | OPEN | Tween + 4-frame walk cycle from the Kenney sheet; one short step blip per frame. Plan said "instant travel" — team now wants the walk; keep it ≤ 1.2 s. |
| 2 | Avatars are low quality and not pixel-art enough; offer by sex | Ronith | P1 | OPEN | Use 16×16 Kenney characters at 4× (crisp), 2 male + 2 female + 1 neutral; name input unchanged. |
| 3 | Fonts need to be better | Ronith | P1 | OPEN | Press Start 2P for titles only; a readable pixel body font (e.g. "Pixelify Sans" or "VT323", both OFL) for text boxes. |
| 4 | Backgrounds are bad; align everything to the Hyderabad theme | Ronith | P1 | OPEN | Title → Tank Bund sunset; ChapterMap/TownMap → backdrop thumbnails; StageEnd/Epilogue → 20/19. All in R-monish-04. |
| 5 | Homepage (Title) needs to be much better | Ronith | P1 | OPEN | Backdrop + logo treatment + avatar walking across + language toggle + Start/Continue. One screen; make it the screenshot for slides. |
| 10 | Aunty avatar doesn't look like an aunty | Ronith | P1 | OPEN | Draw/compose a 32×32 portrait: bun, bindi, saree pallu, glasses. Or pick the closest Kenney face and recolour. |
| 14 | Text formatting broken on the "buffer" (chapter-start) screen | Ronith | P1 | OPEN | Word-wrap width and line spacing; income label by persona; fired-effects list as bullet rows. |
| 17 | Avatar + animations in teaching moments don't play properly | Ronith | P1 | OPEN | ExplainerScene: verify every DSL op renders; Aunty portrait beside the text; skip only after 3 s. Test with all 17 explainers. |
| 23 | Investing screen is too busy; simplify without losing it | Ronith | P1 | OPEN | One asset card at a time (swipe/next), running total, assumption footer; keep steppers. |
| 11 | Info page needs a redesign | Ronith | P2 | OPEN | Group: Money · Commitments · Learning · Mini-games. Icons per row. |
| 12 | Background retro music | Ronith | P2 | OPEN | One looping chiptune (CC0, e.g. from OpenGameArt) + mute in HUD; step/select/coin blips already planned. |
| 15 | Scam-or-Legit time limit is far too short | Saharsh | P1 | DONE 04:20 (Monish) — 60 s; Kirana 45 s | 30 s → 60 s, or per-message timer (8 s each) with a visible bar. |
| 20 | Mini-game items and questions are ambiguous — a deodorant can be a need | Saharsh + Aakarsh | P1 | DOING — Kirana pool fixed 04:20 (Monish): body spray + phone cover out; bus pass, recharge, game top-up, second earphones in. Battle choices: Aakarsh | Kirana Rush: only unambiguous items (rice, medicine, bus pass vs Free Fire top-up, second pair of earphones); or make it "need NOW vs can wait". Battle choices: Aakarsh rewrite pass. |
| 21 | Bad decisions don't cost enough; or income should be lower | Saharsh + Aakarsh | P1 | DONE 04:25 (Monish, engine side) — Stages 2–3 now pay rent/food/travel (55% / 60% of income) each chapter; sim: good ends ~₹0.9 L solvent, random ₹6–30 k, worst negative. Aakarsh's ×1.5 effects pass still welcome but no longer required | Tighten: Stage 1 income S=5000 → wallet shouldn't sit at 2 lakh at age 30 after random play. Raise effect magnitudes 1.5× on weak/critical, lower stage incomes, re-run `npm run sim -- --content` until random play ends with ≤ 1 month of income spare. |
| 19 | A random scam *call* side-quest with a dodgy caller DP | Aakarsh + Ronith | P2 | OPEN | Content: event `scam_call_*` with `framing.portrait: 'caller_wonky'`; Ronith: an "incoming call" overlay (ring, accept/decline) that then opens the battle. |
| 9 | Questions and situations are weak | Aakarsh | P1 | OPEN | Read every framing aloud as a 16-year-old; cut vague ones; each must set up ONE concept. Pair with #24. |
| 22a | Hindi is missing (only Telugu) | Aakarsh | P1 | DOING — PR #25 by Monish (159/159 keys + overlay); Aakarsh merges | `strings/hi.json` to ≥ 90 % keys + `hi.content.json` for onboarding, quiz, personas, the two demo tasks. |
| 24 | Solidify the financial-literacy concepts the game teaches | Aakarsh + Monish | P1 | DOING — Monish: CONCEPTS.md generated 03:30 (`534d66a`); Aakarsh: fill + 3 gap tasks (PR #25 drafts) | `docs/plan/CONCEPTS.md`: 17 concepts → one-line definition, the real-life situation, the lesson line, the NCFE item, which tasks evidence it. Anything a task doesn't evidence gets a task or gets cut. |
| 22b | Voiceover: read options aloud in the selected language | Monish | P2 | DONE 03:40 `534d66a` (tts.ts) — HUD/Battle hook with Ronith, R-monish-06 | `src/app/tts.ts` using the Web Speech API (`speechSynthesis`, `te-IN` / `hi-IN` / `en-IN` voices where the device has them), speaker button on Battle + Quiz. Bhashini stays "next step" in the report. |

## Totals
24 issues · P0 6 · P1 14 · P2 4 — Ronith 17 · Aakarsh 6 · Saharsh 3 · Monish 2 (shared items counted for each owner).

## Process
- Each owner's inbox has one block pointing here. Tick Status in **this file**
  (OPEN → DOING → DONE sha), one line per commit, keep the row.
- P0s before anything else. Then the P1s on the demo path (README §8).
- Second play test at **07:00** after the fixes; new findings go to `PLAYTEST-02.md`.
