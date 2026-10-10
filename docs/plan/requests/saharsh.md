# Inbox — Saharsh

Owner of: src/engine, src/minigames.
Others: **append** a request block at the bottom (format in `README.md`).
Saharsh: change `Status:` lines only; never delete blocks.

| Status | Meaning |
|---|---|
| OPEN | not started |
| DOING | in progress |
| DONE HH:MM sha | merged to main |
| DECLINED reason | won't do — reason given |

---

### R-monish-01 · "Always good" play should score NCFE-literate
- From: monish · To: saharsh · At: 00:35 · Priority: P1
- Status: DONE 01:05 PR #17 (engine: after-quiz answers count as NCFE knowledge evidence)
- What: `npm run sim -- --content` shows `good` policy literate% = 30 / 80 / 20 (simple/medium/hard). Expected ≈100%. Check the ≥0.5 evidence-mean rule and which items get no evidence (`null`) on a good run; likely `attitude` or an item with too few tagged choices.
- Why: the end report will tell a perfect player "not literate", which undermines the measurement claim in M1.
- Accept when: `good` row ≥ 90% literate at all three difficulties; number in M2.
- Done: (01:05) Not the ≥ 0.5 rule: on a `good` run every evidenced item scores 1; the misses were items with no evidence at all (a 10-chapter run meets ~10 of 24 tasks; `division`, `simple_interest`, `time_value`, `compound_interest` are tagged on 1–2 tasks). NCFE-FLIS measures knowledge with questions, so after-quiz answers now count as knowledge evidence for the items each question's concept tests (behaviour tags ignored), pooled with gameplay under the same mean rule. K1–K5 cover 6 of 8 knowledge items. `good` literate% 30/80/20 → 100/100/100; `random` 10/5/0; `worst` 0. The sim's `good` target now also checks ≥ 90% literate. Table (with Aakarsh's hospital bill):
  ```
  policy  difficulty   wallet  savings    happy  minHappy  portfolio  detours restarts  broke  literate%  done%
  good    simple    234852.1 48645.5    98.4    66.9  197072.4       0       0       0     100     100
  good    medium    251095.1 39556.9    98.1    66.5    176934       0       0       0     100     100
  good    hard      242283.9 43880.6    97.9    65.7  126209.9       0       0       0     100     100
  random  simple    191458.9 35521.7    64.1    50.7  131120.3       1     0.7     0.1      10     100
  random  medium    162813.8 31378.5      45    35.9  123360.9     1.3     1.2     0.3       5     100
  random  hard      203236.8 28780.9    34.1    25.2   90354.2     1.6       1     0.1       0     100
  worst   simple    154295.7   14700    34.7    32.3         0     2.4     2.2     0.2       0     100
  worst   medium     75146.7   19185    12.8     9.1         0     3.9     2.9     0.7       0     100
  worst   hard       27744.2   17575     6.8     3.8         0       3       4     0.9       0     100
  ```

### R-monish-02 · Nobody ever goes broke
- From: monish · To: saharsh · At: 00:35 · Priority: P2
- Status: DONE 01:05 68e654a (content, via R-aakarsh-01)
- What: same sim: `broke` = 0 for every policy. Decide with Aakarsh (R-monish-03 in his inbox) whether a Stage 2–3 trap should be able to take wallet < 0 (→ critical restart), or whether that's fine and the "worst" row's min-happiness 6.6 is the intended failure mode.
- Why: the "wallet hits ₹0 → restart" rule from CONTEXT.md §2.8 is never exercised.
- Accept when: a one-line decision recorded here; if "make it possible", `worst` row shows broke > 0.
- Done: (01:05) Decision: make it possible, from content, no engine change. The engine already restarts when a choice spends into < 0; Aakarsh's delayed ₹2 lakh hospital bill on `save_medium_s3_01` › `self_insure` lets a careless player go broke for a chapter and recover. `broke` is now 0.1–0.3 for `random` and 0.2–0.9 for `worst`; `good` stays 0 (table under R-monish-01).

### R-aakarsh-01 · Decision for R-monish-02: going broke is now possible (content side)
- From: aakarsh · To: saharsh · At: 00:49 · Priority: P2
- Status: DONE 01:05
- What: no engine change needed. Decision for R-monish-02: "make it possible". `save_medium_s3_01` › `self_insure` now schedules a −₹2,00,000 hospital bill one chapter later, so `random` and `worst` show broke > 0 and `good` is unchanged (table in `requests/aakarsh.md` R-monish-03). Please record the one-line decision in R-monish-02 and mark it DONE when the content PR merges. Also for R-monish-01 (good ≠ literate): every one of the 17 NCFE items has at least one tagged choice (`npm run validate:content` says "NCFE 17/17 items evidenced"), but a single 3-chapter stage only reaches a few of them per run. If the ≥ 0.5 rule counts `null` (no evidence) as failing, a perfect player can't reach 6/8 knowledge. If you want more items reached per run, tell me which ones and I'll tag more choices.
- Why: R-monish-02 asks for a joint decision with me.
- Accept when: R-monish-02 shows the decision and `npm run sim -- --content` shows broke > 0 for `worst`.
- Done: (01:05) Recorded in R-monish-02. On literacy: fixed engine-side (after-quiz answers are knowledge evidence, R-monish-01), so no extra tagging needed for that. Separate ask for detours in your inbox (R-saharsh-01).

### R-team-01 · Play test 01 — your 3 items
- From: team · To: saharsh · At: 02:20 · Priority: P1
- Status: OPEN
- What: `docs/plan/PLAYTEST-01.md` — 15 (Scam-or-Legit timer too short), 20 (Kirana Rush item list ambiguous: need vs want must be unarguable), 21 (bad decisions don't cost enough — tighten effects/incomes and re-run the sim until random play ends with ≤ 1 month of income spare; coordinate with Aakarsh who owns the numbers in content).
- Why: Learning quality: the mini-games currently teach the wrong lesson on edge items and the economy is too forgiving.
- Accept when: every one of your rows in PLAYTEST-01.md reads DONE or has a DECLINED reason.
