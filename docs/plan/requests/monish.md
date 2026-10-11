# Inbox — Monish

Owner of: shared types/schema, root configs, deps, CI, src/app, server, public/ngo, docs, deliverables.
Others: **append** a request block at the bottom (format in `README.md`).
Monish: change `Status:` lines only; never delete blocks.

| Status | Meaning |
|---|---|
| OPEN | not started |
| DOING | in progress |
| DONE HH:MM sha | merged to main |
| DECLINED reason | won't do — reason given |

---


### R-team-01 · Play test 01 — your 2 items
- From: team · To: monish · At: 02:20 · Priority: P1
- Status: DONE 03:55 534d66a
- Done: CONCEPTS.md generated (3 gaps → Aakarsh R-monish-05/06); tts.ts shipped, hook requested from Ronith (R-monish-06); M2 play-test paragraph in the submitted PDF.
- What: `docs/plan/PLAYTEST-01.md` — 24 (CONCEPTS.md with Aakarsh), 22b (TTS voiceover via Web Speech API, P2). Also: M2 play-test paragraph updated with these findings.
- Why: Owner-of-record so the shared items don't fall through.
- Accept when: every one of your rows in PLAYTEST-01.md reads DONE or has a DECLINED reason.

### R-aakarsh-02 · Credit the voice-over engine in README
- From: aakarsh · To: monish · At: 07:00 · Priority: P2
- Status: OPEN
- What: under asset credits in `README.md` add: "Voice-over generated offline with Kokoro-82M by hexgrad (Apache-2.0), via kokoro-onnx (MIT). Clips in `public/assets/voice/`; how to regenerate: `src/content/voice/README.md`."
- Why: the voice-over PR (`aakarsh/voiceover`) adds generated clips; the rules want every third-party asset credited in README, which is your file.
- Accept when: README has the line.
