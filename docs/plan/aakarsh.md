# Aakarsh — Content (tasks, explainers, strings)

**MINE:** `src/content/` (everything).
**NOT MINE:** anything else. Your JSON must satisfy `src/shared/schema.ts`;
you never edit the schema. If a field is missing, post `CONTRACT:`.

You are writing the actual game. Code without your tasks is an empty battle
screen. Quality bar: a 16-year-old in a Hyderabad junior college reads a
framing and thinks "that happened to me last week." Prices in **real ₹**
(engine scales). Lesson lines name the concept in plain words. No jargon
without a definition. **No real brands, tickers, products.** "University
campus", never "IIIT". Festivals: Bonalu, Eid, Sankranti, Diwali — all fine.

`npm run validate:content` is your test suite. Keep it green on every commit.
Its output counts (tasks, framings, explainers, strings) go into M2.pdf.

Idea bank: CONTEXT.md §6.1 (analogies), §6.2 (situations), §12.3 (old 8
missions). Research: `team97_vanguard_context/06_claude_docs_exports/research_landscape.md`
(RBI "Raju and the Forty Thieves" = 40 real scam patterns).

---

## Review gate — nobody builds on unreviewed content

**Rule:** your content is not done until **Monish, Ronith and Saharsh have
each checked it.** Until then nobody builds on it: Ronith and Saharsh keep
working against whatever content is already on `main`.
This overrides README §4 "merge it yourself" for every PR touching `src/content/`.

**How it works**

1. Ship in small batches: **≤ 4 tasks per PR** (or one file such as
   `explainers.json` or `strings/te.json`). Small PRs get reviewed fast.
2. `npm run validate:content` green → open the PR → post
   `REVIEW: content <batch> — <PR link>` in the group chat.
3. Each reviewer checks **their angle** (table below) and approves on GitHub,
   or comments with the exact spot and fix:
   `tasks/stage1.json#save_medium_s1_01 › choices[1].lesson — names no concept`.
4. Reviewers **never edit `src/content/`** (ownership rule). You make every fix.
5. **3 approvals → you rebase-merge** and post `MERGED: content <batch>`.
6. Reviewers answer within **15 minutes** of the `REVIEW:` post, so the gate
   never stalls the clock.

**What each reviewer checks**

| Reviewer    | Angle         | Checks                                                                                                                                                                                                                                                         |
| ----------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Monish**  | Design + rules | Matches CONTEXT.md §2 and plan §6 · no real brands, tickers or products · no "buy X" advice · every projection carries the assumption line · never asks the player for OTP/PIN/Aadhaar · "University campus", never "IIIT" · no team/member/college names |
| **Ronith**  | Screen fit    | Framing text fits the text box in ≤ 2 lines at 360×640 (check in `npm run dev`) · each choice label fits one move button · every string key his scenes use exists · explainers use only the 6 DSL ops and play in `ExplainerScene`                        |
| **Saharsh** | Numbers       | Effects in range (happiness −30…+15 per choice) · real-₹ prices plausible after scaling · every `detourTaskId`, `triggerEvent` and flag points to something that exists · exactly one `good` choice per task · `npm run sim` has no dead ends              |
| **All 3**   | Student test  | Read 2 framings aloud as a 16-year-old in a Hyderabad junior college: does it feel real? Does the lesson name the concept in plain words? Is any jargon left undefined?                                                                                 |

**Timing:** the integration call is at 02:45, so the Phase 1 batches must be
**in review by ~01:15 and ~02:20**, not merged at the last minute.

---

## Before SKELETON IS UP (23:30 → 00:15)

- [x] Read CONTRACTS §1 (content types) and §3 (file layout, canonical task,
      canonical explainer) twice. Read CONTEXT.md §2.3–2.10, §6.
- [x] In a local scratch markdown (not committed), outline the **12 Stage-1
      tasks**: one per pillar × difficulty. For each: the decision, the good
      choice, the trap, the concept id, which persona framings differ most.

## Phase 1 (00:15 → 02:45) — branch `aakarsh/content-s1`, in review by ~01:15 and ~02:20 (review gate above)

- [x] `validate.ts` — Monish's Phase 0 version runs zod + basic cross-refs.
      Extend with every check in CONTRACTS §3 and make failures readable:
      `tasks/stage1.json#budget_simple_s1_01 › choices[2].detourTaskId → 'x' not found`.
      Add a summary line: `OK · 12 tasks · 36 framings · 8 explainers · 6 events · en 120 keys · te 80 keys (67%)`.
- [x] `concepts.json` — 12 concepts with `pillar`, `name`, `explainerId`,
      `ncfe[]`:
      budget: `needs_vs_wants`, `plan_the_month`, `compare_before_buying`;
      save: `pay_yourself_first`, `emergency_buffer`, `goal_jar`;
      invest: `time_value`, `compounding`, `risk_return`, `diversification`,
      `inflation`; safety: `spot_fake_officials`, `never_share_otp_pin`,
      `too_good_to_be_true`, `instant_loan_trap`, `fake_payment_proof`.
      (That's 16 — fine; the schema doesn't cap it.)
- [x] `personas.json` — 3 personas per CONTEXT §2.3: `label`, `blurb` (card
      text, 2 lines), `stageIntro[1..3]` ("Years later…" one-liners),
      `defaultFlags` (`has_bank_account`, `upi_family`, …).
- [x] `onboarding.json` — L1–L4 and K1–K5 **verbatim from CONTEXT.md §2.4**,
      with L1 options mapping to personas, L2 options to
      `pocketMoneyMonthly` 200/800/2000/4000, L3/L4 to flags.
- [x] `places.json` — home, college, canteen, charminar, durgam_cheruvu,
      gachibowli, campus ("University campus"), bank, kirana, bus_stop,
      clinic, mobile_shop, turf. Normalised x/y spread over the map.
- [x] `assets.json` — cashbox (0%, 0), banyan (8%, 2), chai (10%, 12),
      mango (14%, 30); blurbs from CONTEXT §2.10 + §6.1 analogies.
- [x] `minigames.json` — kirana_rush, scam_or_legit; `rewardWalletPct: 8`,
      `rewardHappiness: 10`.
- [x] **`tasks/stage1.json` — 12 tasks**, each with `default` + all 3 persona
      framings (so 48 framings; `default` can equal `pocket_money`), 3–4
      choices with exactly one `good`, `quality` spread, real-₹ effects,
      `lesson` lines, `ncfe` evidence, `attitude` on spend-now/later choices,
      `scam` on safety choices, `hint` on the trap choices, at least one
      **delayed** effect in 4 of the 12 (lend ₹500 → `triggerEvent:
    friend_asks_again` in 2 chapters; no-cost EMI → `repeat`; skip saving
      → flag `no_buffer` used by an emergency event). Suggested grid:

      | | simple | medium | hard |
      |---|---|---|---|
      | budget | ₹500 Swiggy vs ₹20 chips (turf match tomorrow) | month plan: bus pass, recharge, friend's birthday | festival month: ₹1,200 across 4 wants |
      | save | start a jar: earphones/exam fee/bicycle | friend asks to borrow ₹500 | emergency: cracked screen / trip fee / dad's work stops |
      | invest | ₹1,000 now or ₹1,000 next year | cash box vs Banyan Savings (inflation) | Charminar stall: one item vs mixed stock |
      | safety | "OTP sent by mistake" / fake ePASS fee / fake payment screenshot (canonical) | "enter PIN to receive money" collect request | Telegram "like videos, earn ₹5,000/day" → loan app |

- [x] `tasks/detours.json` — 4 detours (`isDetour: true`), 2 choices each,
      referenced by the weak choices above: `detour_friend_bad_advice`,
      `detour_broke_by_week3`, `detour_no_buffer_borrow`,
      `detour_overspent_bus_pass_due`.
- [x] `events.json` — 6 Stage-1 events: `friend_asks_again` (concept
      `pay_yourself_first`), cousin's wedding gift, phone recharge expired,
      quiz prize ₹200, surprise canteen price hike (inflation), refund
      collect-request scam (concept `never_share_otp_pin`, disguise).
- [x] `explainers.json` — 8 explainers using the 6-op DSL, 10–16 s each:
      needs_vs_wants (split), plan_the_month (bars), pay_yourself_first
      (coins wallet→savings first), emergency_buffer (bar drops, buffer
      absorbs), time_value (two coins, one grows), compounding (CONTRACTS
      §3.2, banyan), spot_fake_officials (text beats: "money IN never needs
      money OUT"), never_share_otp_pin (text beats). Every invest explainer
      ends with the assumption line.
- [x] `strings/en.json` — all UI chrome keys Ronith uses (coordinate: he
      posts keys he needs in chat; you add them). Start with: title,
      buttons (start, continue, next, skip, switch, confirm, info, replay,
      download, email), HUD labels (wallet, happiness, stage, month), battle
      chrome (lv, pressure, you, learned, restart, returning), onboarding
      prompts, end report labels.
- [x] `index.ts` `localize()` — apply `strings/<lang>.content.json` overlay by
      dotted path; missing → English.
- [ ] `validate:content` green → **review gate passed (Monish ✓ Ronith ✓
      Saharsh ✓)** → merge. Post `MERGED: content s1`.

## Phase 2 (04:05 → 08:30) — nap 04:15–05:45, then build

- [x] `tasks/stage2.json` — 6 tasks (first salary, ~22–24): rent vs home,
      first EMI phone, emergency fund target, SIP-style monthly into Banyan
      (made-up), "double in 6 months" WhatsApp group, family asks for a
      loan. 3 persona framings each (use `stageIntro` tone).
- [x] `tasks/stage3.json` — 6 tasks (~30): home loan vs rent maths, "digital
      arrest" call, diversification across 4 assets before a bad-weather
      year, insurance vs self-insure, chit fund with a sketchy organiser,
      kid's education goal. 3 framings each.
- [x] 4 more detours, 6 more events for stages 2–3 (EMI pressure, salary
      delayed, medical bill, bonus, market bad year, scam follow-up).
- [x] Remaining explainers so **every concept has one** (16 total).
- [x] `strings/te.json` — Telugu for: title, all onboarding prompts, L1–L4,
      K1–K5 (with options), HUD + battle chrome, end-report labels.
      `strings/te.content.json` — Telugu overlay for the canonical scam task
      and the Swiggy-vs-chips task (framings + choices + lessons).
      `strings/hi.json` — title + buttons only (proves fallback).
- [ ] Every Phase 2 batch (Stage 2, Stage 3, detours/events, explainers,
      Telugu) goes through the **review gate** before merge. Nobody builds on
      it until all 3 have approved.
- [ ] Balance pass with Saharsh (06:30): adjust effects/pressure from his
      simulation table. Goal: always-good ends happy and solvent; random
      detours 2–4×; always-worst restarts ≥ 1 but can finish.
- [ ] Read every lesson line aloud once. Cut words. Name the concept.

## Phase 3 (08:30 → 11:00)

- [ ] Cross-playtest Ronith's build as a "student": note every confusing
      framing; fix text (content-only changes are safe until 10:15).
- [ ] Help Monish with slides 11:00–11:25 (you know the content best).

## Definition of done

`validate:content` green with 24 main tasks, 8 detours, 12 events, 16
explainers, 5 quiz Qs, en + te strings · every stage has ≥1 task per pillar ·
at least 6 delayed/repeat effects across the pack · no `IIIT`, no brands ·
every projection text carries the assumption line · **every content PR
approved by Monish, Ronith and Saharsh before merge.**
