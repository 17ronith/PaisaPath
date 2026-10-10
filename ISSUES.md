# ISSUES — the 24 play-test findings that must be fixed before the demo

> Reported by Monish at **02:15 IST, 11 Oct** after the team played the build.
> **This is the fix list.** Owners change the Status column (OPEN → DOING → DONE sha) in this file.
> 🔴 open · 🟡 in progress · ✅ done. Detailed directions per item: `docs/plan/PLAYTEST-01.md`.
> Still open: **20 of 24**. Ronith's open items: **1, 2, 3, 4, 5, 6, 7, 8, 10, 13, 14, 16, 17, 18, 19, 23**.

| # | | Pri | Owner | Reported (verbatim) | Status |
|---|---|---|---|---|---|
| 1 | 🔴 | P1 | Ronith | the walking is wrong, we want it to walk and make noises for each step | OPEN |
| 2 | 🔴 | P1 | Ronith | better quality avatars required, they're too less pixelated, assign based on the sex too | OPEN |
| 3 | 🔴 | P1 | Ronith | we need better fonts | OPEN |
| 4 | 🔴 | P1 | Ronith | background is so bad, we need to figure out a way to make it better, maybe align it to the hyderabad theme too | OPEN |
| 5 | 🔴 | P1 | Ronith | homepage needs to be way way better | OPEN |
| 6 | 🔴 | P0 | Ronith | mention that the quiz page is a QUIZ page, it's blank | OPEN |
| 7 | 🔴 | P0 | Ronith | the "not me, switch" gives some random thing, we need to fix that too | OPEN |
| 8 | 🔴 | P0 | Ronith | there's a huge black space in the top and bottom of the thing, we need to fit it to screen | OPEN |
| 9 | 🔴 | P1 | Aakarsh | questions and situations are bad | OPEN |
| 10 | 🔴 | P1 | Ronith | aunty avatar doesn't look like it's an aunty | OPEN |
| 11 | ✅ | P2 | Ronith → Saharsh → Monish | info page needs a redesign, it's not bad, it's just not the best we can do | DONE 04:35 — four cards (Money · Commitments · Learning · Mini-games), happiness bar, colour-coded lock state |
| 12 | ✅ | P2 | Ronith → Saharsh → Monish | add a background retro music or something | DONE 04:35 — `src/game/music.ts`: synthesised 8-bar chiptune loop + `stepBlip()`, honours mute. **Needs Ronith's 1-line hook** (R-monish-07) |
| 13 | 🔴 | P0 | Ronith | what are lives? what do the hearts represent? | OPEN |
| 14 | 🔴 | P1 | Ronith | fix text formatting on the buffer screen | OPEN |
| 15 | ✅ | P1 | Saharsh | scam game is good but we need to fix the time limit, it's way too short | DONE 04:20 (Monish) — 60 s; Kirana 45 s |
| 16 | 🔴 | P0 | Ronith | we need a "back to map screen" option | OPEN |
| 17 | 🔴 | P1 | Ronith | avatar + animations for teaching moments need to work properly | OPEN |
| 18 | 🔴 | P0 | Ronith | game doesn't use updated images | OPEN |
| 19 | 🔴 | P2 | Aakarsh + Ronith | at some point of the game, there should be a scam call that comes up which is a random sidequest. the dp of the call should be some wonky guy | OPEN |
| 20 | 🟡 | P1 | Saharsh + Aakarsh | questions are way too ambiguous, imo they're not depicting the financial concepts that we're looking to instill in the students. for example, in the kirana rush game, the deo that we dropped could be a need | DOING — Kirana pool fixed 04:20 (Monish): body spray + phone cover out; bus pass, recharge, game top-up, second earphones in. Battle choices: Aakarsh |
| 21 | ✅ | P1 | Saharsh + Aakarsh | need to lose more money on bad decisions as consequences or earn less money | DONE 04:25 (Monish, engine side) — Stages 2–3 now pay rent/food/travel (55% / 60% of income) each chapter; sim: good ends ~₹0.9 L solvent, random ₹6–30 k, worst negative. Aakarsh's ×1.5 effects pass still welcome but no longer required |
| 22 | 🔴 | P1 | Aakarsh / Monish | voiceovers (reading out the options in the selected language) and multilinguality (add hindi, only telugu is there right now) | 22a: DOING — PR #25 by Monish (159/159 keys + overlay); Aakarsh merges · 22b: DONE 03:40 `534d66a` (tts.ts) — HUD/Battle hook with Ronith, R-monish-06 |
| 23 | 🔴 | P1 | Ronith | too much happening in some screens like the investing screen, don't barebone back to zero | OPEN |
| 24 | 🟡 | P1 | Aakarsh + Monish | solidify financial literacy concepts we want to depict via this game | DOING — Monish: CONCEPTS.md generated 03:30 (`534d66a`); Aakarsh: fill + 3 gap tasks (PR #25 drafts) |

## Order of attack for Ronith (P0 first — judges see these in the first minute)
8 → 18 → 7 → 6 → 13 → 16, then 5 → 4 → 2 → 3 → 14 → 17, then 1 → 10 → 23.
Each one: fix → `npm run check` → commit with `game:` prefix → flip the row here to DONE <sha>.

## Already handled by others (don't redo)
- 11 InfoPanel, 12 music, 15 timer, 20 (mini-game half), 21 economy — Monish, on `main`.
- 22 Hindi (PR #25) + read-aloud (`src/app/tts.ts`, hook R-monish-06), 19 scam call (PR #26 + overlay R-monish-08), 24 CONCEPTS.md — in progress.
