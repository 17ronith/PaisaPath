# Demo video script — ≤ 4:00, Team 97

Screen: Chrome device mode **360×640 at 2×**, `npm run preview` build, `npm run server` running.
Audio: voiceover recorded separately, stitched over the capture. Say "Team 97", never a name, never "IIIT".
Late-game beats use `?demo=1` (seeded save at Stage 3). Keep every beat ≤ 25 s; total ≈ 3:40 with buffer.

| # | Time | On screen | Voiceover |
|---|---|---|---|
| 0 | 0:00–0:12 | Title screen (Tank Bund sunset), language toggle en → te → en | "Learning Money by Living It. A pixel-art life simulation for Intermediate students in Hyderabad, built for NGO classrooms on cheap phones. It teaches financial literacy by letting you live it." |
| 1 | 0:12–0:40 | Avatar pick, type a nickname, L1–L4 picture questions, persona card, tap "Not me? Switch" once | "No sign-up, no phone number — a nickname and an avatar. Four life questions decide your story: pocket money, scholarship, or earning. The same tasks come to each student framed for their own life. Switch if it's not you." |
| 2 | 0:40–1:00 | Five-question quiz, "Your before score: 2/5 · medium" | "Five quick questions set the difficulty — and they're the *before* score. The same five come back at the end, so every student leaves with a measured learning gain." |
| 3 | 1:00–1:40 | Chapter map → tap place → **money battle** on the Charminar/home backdrop. Pick the trap choice. Bars drop, the Professor walks in, lesson line, abstract animation plays | "Every decision is a money battle. A scam call: pay ₹500 or check the portal? Choose wrong and the wallet and happiness bars drop — then the Professor walks in and a short abstract animation explains the concept, *after* the consequence, never a lecture first. Choose right and he just tells you so, and you move on. The mistake goes into your mistake bank." |
| 4 | 1:40–2:00 | Next chapter start: "EMI deducted ₹…" toast; then a mini-game unlocks, play 10 s of Kirana Rush | "Consequences arrive later, like real life: that no-cost EMI bites every month. Play well and mini-games unlock — a side gig that pays. Play badly and they lock until your bars recover." |
| 5 | 2:00–2:20 | A later battle with the "This again?" badge → answer right → "LEARNED ✓" | "Mistakes come back in disguise. Get it right this time and the concept is cleared — learned, not just seen." |
| 6 | 2:20–2:45 | `?demo=1` → Continue → Stage 3 → Invest screen: split savings across four made-up assets, assumption footer | "Three life stages: student, first salary, earning more. Investing uses only what you saved, in made-up assets — a banyan that grows slowly, a mango orchard with big swings. Nothing real is recommended; every projection is labelled an assumption." |
| 7 | 2:45–3:05 | Epilogue at 60 → What-if: biggest mistake replayed the other way, side by side | "At sixty you look back. And the game replays your single biggest mistake with the choice you didn't make — side by side. That stays in the game; it's just for the student." |
| 8 | 3:05–3:30 | After-quiz → learning gain → report screen → "Email facilitator" → inbox preview / "Saved locally" → Download PDF | "The quiz again — the learning gain. An NCFE-aligned score across knowledge, behaviour and attitude, plus scams spotted. A PDF report goes to the NGO facilitator, guardian in CC, by email. Nickname only — no student data leaves the device." |
| 9 | 3:30–3:50 | Facilitator dashboard mock (`/ngo/`): batch code, before→after, % literate, common mistakes | "Facilitators run batches with a join code and see progress per centre; the sponsor sees only aggregates. One language is one file — Telugu today, Hindi next. Team 97." |

## Recording checklist
- [ ] Fresh profile (`session.reset()` or clear site data) so beat 1 starts clean.
- [ ] Beat 3 must land on a **scam task at `home` or `charminar`** — if the selector gives something else, restart; seed 97 in `?demo=1` is deterministic but the fresh game isn't. Use **`?seed=97`** on the URL for beats 1–5: a fresh game with that seed always serves the same tasks (`session.ts`). Try a few seeds beforehand and note the one whose first battle is the scam call.
- [ ] Mute browser; voiceover is separate. Keep the cursor off the canvas between taps.
- [ ] Export 1080p MP4, ≤ 4:00. Upload to Drive → Anyone with the link → open in incognito.
