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
- Status: OPEN
- What: `npm run sim -- --content` shows `good` policy literate% = 30 / 80 / 20 (simple/medium/hard). Expected ≈100%. Check the ≥0.5 evidence-mean rule and which items get no evidence (`null`) on a good run; likely `attitude` or an item with too few tagged choices.
- Why: the end report will tell a perfect player "not literate", which undermines the measurement claim in M1.
- Accept when: `good` row ≥ 90% literate at all three difficulties; number in M2.

### R-monish-02 · Nobody ever goes broke
- From: monish · To: saharsh · At: 00:35 · Priority: P2
- Status: OPEN
- What: same sim: `broke` = 0 for every policy. Decide with Aakarsh (R-monish-03 in his inbox) whether a Stage 2–3 trap should be able to take wallet < 0 (→ critical restart), or whether that's fine and the "worst" row's min-happiness 6.6 is the intended failure mode.
- Why: the "wallet hits ₹0 → restart" rule from CONTEXT.md §2.8 is never exercised.
- Accept when: a one-line decision recorded here; if "make it possible", `worst` row shows broke > 0.

### R-aakarsh-01 · Decision for R-monish-02: going broke is now possible (content side)
- From: aakarsh · To: saharsh · At: 00:49 · Priority: P2
- Status: OPEN
- What: no engine change needed. Decision for R-monish-02: "make it possible". `save_medium_s3_01` › `self_insure` now schedules a −₹2,00,000 hospital bill one chapter later, so `random` and `worst` show broke > 0 and `good` is unchanged (table in `requests/aakarsh.md` R-monish-03). Please record the one-line decision in R-monish-02 and mark it DONE when the content PR merges. Also for R-monish-01 (good ≠ literate): every one of the 17 NCFE items has at least one tagged choice (`npm run validate:content` says "NCFE 17/17 items evidenced"), but a single 3-chapter stage only reaches a few of them per run. If the ≥ 0.5 rule counts `null` (no evidence) as failing, a perfect player can't reach 6/8 knowledge. If you want more items reached per run, tell me which ones and I'll tag more choices.
- Why: R-monish-02 asks for a joint decision with me.
- Accept when: R-monish-02 shows the decision and `npm run sim -- --content` shows broke > 0 for `worst`.

