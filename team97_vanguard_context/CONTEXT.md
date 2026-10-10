# PROJECT CONTEXT: Megathon X · Vanguard "Financial Literacy" problem statement · Team 97

> Snapshot: **Sat 10 Oct 2026, ~21:30 IST**, before the M1 deadline.
> This file compresses everything decided and researched so far. **Section 2 is the current, authoritative design.** Anything in the history (Section 12) or in the exported docs (`06_claude_docs_exports/`) that disagrees with Section 2 is outdated.
> Status tags: **[DECIDED]** team-confirmed · **[PROPOSED]** suggested, not explicitly confirmed · **[OPEN]** still to decide · **[SUPERSEDED]** replaced by a later decision.

---

## 0. TL;DR (read this if nothing else)

- **Hackathon:** Megathon X: Singularity (E-Cell, IIIT Hyderabad; offline). Problem statement by **Vanguard**. **Team No. 97.**
- **Brief:** a digital experience that teaches **financial literacy** to **Grade 11–12 (Intermediate) students from underserved communities in Hyderabad**. ~1,500 students at launch via **NGOs**; must scale. 4 pillars: **Plan & budget · Save & manage · Understand investing · Stay financially safe**.
- **Our solution:** a browser-based **pixel-art life-simulation RPG** (Phaser 3). The student lives a compressed life in **3 stages**: **Intermediate student → first salary → earning more**, then an **epilogue at ~55–60**. Every task is a **Pokémon-style "money battle"**. Teaching happens **after** each choice through **short abstract animations**. Mistakes go into a **mistake bank** and come back in disguise.
- **Onboarding:** life questions (incl. an indirect pocket-money question) → **persona** (framing only). A separate **5-question difficulty quiz** → **simple/medium/hard** bucket. The same quiz repeats at the end = **before/after learning gain**.
- **Status bars:** **wallet** and **happiness**. Happiness mirrors the real mental state: an impulse buy raises it now; being too broke for plans with friends later drops it.
- **End:** an in-game **"what if" replays the student's biggest mistake** (in-game only). A **progress report is emailed to the NGO facilitator**, guardian CC'd.
- **No game name** in submissions. "Paisa Path" was a working name and has been removed. M1 title: **"Learning Money by Living It"**.
- **M1 PDF is done** (LaTeX, 2 pages): `03_submissions/M1/M1.pdf`. Commit it as `deliverables/M1.pdf` on `main` **before 22:00**.
- **Next deadlines:** M2 **04:00** (progress PDF + code push) · Final **11:00** (code, README, LICENSE, final_report.pdf ≤3 pp, demo video ≤4 min, zip) · Slides **11:30**.

---

## 1. Hackathon rules and deliverables (from `02_hackathon_rules/`)

**Event:** Megathon X: Singularity · title sponsor **Lloyds Bank** · in association with **Qualcomm, Bhashini, Vanguard** · organised by **E-Cell, IIIT Hyderabad** · fully **offline** · overnight stay mandatory · Wi-Fi provided · external servers/cloud allowed · **AI tools/LLMs allowed** · any language/stack.

**Team:** up to 5 members; team composition was frozen 9 Oct 2026, 23:59. Problem statement allocated by organisers (ours: Vanguard).

### Deadlines (no grace period)

| Stage | When | What | File / where |
|---|---|---|---|
| **M1 Approach** | **22:00, 10 Oct** | PDF, **max 2 pages**: (1) problem statement + our understanding, (2) idea/abstract, (3) high-level approach/pipeline/architecture, (4) planned testing methodology | `deliverables/M1.pdf` on `main` |
| **M2 Mid-submission** | **04:00, 11 Oct** | PDF, **max 2 pages**: current approach + changes since M1; experiments run and results; progress on testing; plan for remaining time. **Plus a code push** of everything so far | `deliverables/M2.pdf` + code on `main` |
| **Final** | **11:00, 11 Oct** | Full code on `main`; `README.md` (**setup/run instructions only**, plus links to external datasets/weights; do NOT explain the solution); `LICENSE` (**MIT**); `deliverables/final_report.pdf` (**max 3 pages**: solution, approach, features, results); **demo video ≤4 min** with voiceover (Google Drive, "Anyone with the link", submitted via form); **code zip** via form (exclude node_modules, venvs, datasets, weights) | repo + forms |
| **Slides** | **11:30, 11 Oct** | Slides PDF (problem, approach, solution, results), via slides form (the repo is archived at 11:00) | form |

**Hard rules**
- Missing or late **M1 or M2 = direct disqualification**. A late final = not evaluated further.
- **Write the team number (97) at the top of every PDF.**
- **Double-blind R0:** no team name, member names or college names in any PDF or video. ⚠️ The game world has an "IIIT Hyderabad" landmark: keep it out of PDFs and the demo video (rename it to a generic "university campus" or hide it).
- All PDFs (except slides) go in `deliverables/` with the **exact file names**. Don't delete earlier deliverables.
- Only the **default branch `main`** is evaluated. The latest commit at each deadline is recorded; local commit timestamps are ignored. Keep `main` working; force-pushes or deleted branches won't be restored.
- Every member needs a GitHub account and must **accept the repo invite by the M1 deadline (22:00)**. The repo is private, in the **IIIT-ECell GitHub org**. Don't create your own repos.
- **Originality:** only work built during the hackathon window (from problem-statement release). **Incremental commit history required**: no squashed or imported history, and the first commit must not be a near-complete solution. Third-party libraries and assets are OK if licensed and **credited in README.md**. No forks or rebrands of existing projects. Organisers may live-question the team.
- No files over 100 MB; host large files externally.
- Live deployment **not required**. Judging is on the repo plus the in-person demo.
- **IP:** MIT by default. The sponsor gets a perpetual, royalty-free, non-exclusive licence to the solution.

**Evaluation:** **R0** online double-blind check of final submissions from 11:00, 11 Oct (basic requirements) → **R1** in-person evaluation by the sponsor (Vanguard); criteria at their discretion; top 3 per problem statement advance → **R2** final pitch to sponsors and independent judges → 1 winner + 2 runners-up per problem statement.

**Food:** dinner 10 Oct; breakfast and lunch 11 Oct (vegetarian only).

---

## 2. CURRENT DESIGN (authoritative)

### 2.1 Concept and identity
- **[DECIDED]** Browser-based **pixel-art life-simulation RPG**. **No game name** in any submission ("Paisa Path" removed). The M1 report is titled **"Learning Money by Living It"**.
- **[DECIDED]** Two explicit design claims (both written in M1):
  1. **The game is designed to teach the concepts while being relatable to the target demographic.**
  2. **The teaching is done through short abstract animations.**
- **[DECIDED]** Visual vibe: a top-down pixel town like Pokémon on the DS (`04_reference_images/vibe_01…`), an RPG asset-pack look (`vibe_02_druid_story…`), and a pixel HUD with hearts, levelled skill icons and a score (`vibe_03…`). **Every task looks like a Pokémon battle screen** (`ref_pokemon_battle_screen.png`), in **our own original pixel art**: no ripped Pokémon sprites, and check the Druid Story pack's licence before using any of it.

### 2.2 Player journey
1. **Language + avatar:** pick a language and the avatar's look; **the student types the avatar's name** [DECIDED]. Persona names are placeholders only. **No festival choice** [DECIDED; removed].
2. **Life questions → persona** (3–4 picture questions, incl. an **indirect pocket-money question**).
3. **Persona card** shown, with a **"Not me? Switch"** button [DECIDED].
4. **Difficulty quiz** (5 knowledge Qs) → **simple / medium / hard** bucket [DECIDED]. Doubles as the **"before" score**.
5. **Three life stages** [DECIDED], each made of a few **monthly chapters** (chapter = 1 month [DECIDED]; number per stage [OPEN]):

   | Stage | Approx. age | Money situation | Natural focus |
   |---|---|---|---|
   | 1 Intermediate student (current) | 16–17 | pocket money / scholarship / part-time earnings (by persona) | budgeting, saving, everyday scams |
   | 2 First salary | ~22–24 | first regular income, first big expenses, family expectations | bigger budgets, emergency fund, starting to invest |
   | 3 Earning more | ~30 | a raise; EMIs, loans, goals | debt vs saving, diversification, harder scams |
   | Epilogue | ~55–60 | looking back | what savings/investments became (assumptions labelled) |

6. **Inside a stage:** chapter map (node path) → tap a place in town → avatar walks there (**tap-to-travel with walk animation; free walking only inside small areas** [DECIDED]) → **money battle** (task). **Random side quests / events** and **random mini-games** appear along the way. The **info button** and **replay library** are always available.
7. **Epilogue (~55–60):** shows what their investments and savings turned out to be, with every projection labelled as an assumption [DECIDED].
8. **End:** the difficulty quiz is asked again (**"after" score**). An in-game **"what if"** screen. The **progress report is emailed** (see 2.12).

### 2.3 Personas: framing only [DECIDED]
- **Personas never change difficulty.** They only change **how a task is framed**: the story, the setting and the analogies. Same concept, same difficulty, different story.
- A fixed number of personas (3), assigned from the life questions; the student can switch.

| | Pocket money | Scholarship | Earner |
|---|---|---|---|
| Money in stage 1 | parents, monthly, sometimes late | **TS ePASS allowance** as a lump into own bank account + a little from family | evening job at a shop/deliveries/tuitions, weekly, uneven; part goes home |
| Has | no bank account; family phone | own account; shared phone | own phone, own UPI |
| Same scam task framed as | "OTP sent by mistake" text on mom's phone | fake scholarship officer demands a ₹500 "processing fee" | customer "pays" with a fake payment screenshot at the shop |
| Same emergency framed as | phone screen cracks (₹1,500) | college trip fee due before the allowance arrives | dad's work stops for 2 weeks; family needs your pay |
| Stages 2–3 | [OPEN] | [OPEN] | [OPEN] |

- Persona labels are placeholders; earlier draft names (Priya / Ayesha / Ravi) are **[SUPERSEDED]**, since the student names the avatar.

### 2.4 Onboarding questions (drafts by Claude; the team edits) [DECIDED: Claude drafts, team edits]
**Life questions → persona and flags**

| # | Question | Options | Use |
|---|---|---|---|
| L1 | Where does most of your money come from? | My family gives it · A scholarship · I earn it · I don't really get money | **picks persona** (family/none → Pocket money; scholarship → Scholarship; earn → Earner) |
| L2 | In a normal week, how much do you spend on yourself? | <₹100 · ₹100–300 · ₹300–700 · >₹700 | **pocket-money band** for price scaling; asked indirectly and as a range, never an exact amount |
| L3 | Do you have your own bank account? | Yes · No · Not sure | flag used in task text |
| L4 | Whose phone do you use for UPI? | My own · Family's · I don't use UPI | flag (the scam arrives on *your* phone or *mom's*) |

**Difficulty quiz (= before/after quiz).** Scoring: 0–1 correct → **simple**, 2–3 → **medium**, 4–5 → **hard**.

| # | Concept | Question | Answer |
|---|---|---|---|
| K1 | Time value of money | Uncle offers ₹1,000 today or ₹1,000 a year from now. Which is better? | Today |
| K2 | Interest on a loan | Borrow ₹500, agree to pay back ₹600. Interest? | ₹100 |
| K3 | Compound interest | ₹1,000 at 10%/yr, nothing withdrawn; after 2 yrs: >₹1,200 / =₹1,200 / < | More than ₹1,200 (₹1,210) |
| K4 | Inflation | Prices +5%, pocket money unchanged; next year you can buy: more / same / less | Less |
| K5 | Diversification | One Charminar vendor sells only umbrellas; another sells umbrellas + water bottles. Who earns more safely across the year? | The one selling both |

### 2.5 Economy scaling (pocket money) [DECIDED in principle; exact formula OPEN]
- Everyone **starts with the same fixed in-game amount S** (placeholder: ₹5,000/month). **In-game prices are scaled to the student's pocket money**, so the game "feels" like their real life.
- **Formula used in M1** (keeps each item at the same share of the budget as in real life):
  `in-game price = real price × S ÷ student's monthly pocket money` (weekly band × ~4 ≈ monthly).

  | Pocket money | Real bat price | Share of their money | In-game price (S = ₹5,000) |
  |---|---|---|---|
  | ₹5,000 | ₹200 | 4% | ₹200 |
  | ₹2,500 | ₹200 | 8% | **₹400** |

- ⚠️ **[OPEN] Team to confirm.** The team's original example said the bat should be **₹100** for a ₹2,500 student. That makes it 2% of in-game money when it's 8% of their real money, so the game would feel 4× easier than real life. Claude recommended the proportional formula (₹400), and that is what M1 says.
- The earlier rule "₹1 in-game = ₹1 real" is **[SUPERSEDED]**: in-game rupees are scaled rupees.
- Real price list (bus pass, recharge, snacks, cricket bat, festival spend, wages…) is **[OPEN]**. Fixed public prices (TGSRTC student bus pass, recharge plans) can be looked up online; life numbers (pocket money, shop wages, festival spend) ideally come from 5–10 real students.

### 2.6 Tasks: buckets and the money-battle screen
- **[DECIDED]** **Tasks are our own.** The earlier NCFE-derived 8-mission list (M1 First budget … M8 Charminar stall) is **[SUPERSEDED]**. NCFE stays only as a scoring lens (2.11).
- **[DECIDED]** Tasks sit in **buckets: pillar × difficulty** = 4 × 3 = **12 buckets**. Each task has **one framing per persona**. Difficulty quiz → bucket; persona → framing; life stage → setting. **Task list = [OPEN]** (placeholders in all buckets).
- Optional idea bank for writing tasks: see 6.2 (everyday situations) and 12.3 (old mission list).
- **[DECIDED] Money-battle screen** (mock: `04_reference_images/mock_money_battle_screen.png`, also in M1):

  | Pokémon element | Ours |
  |---|---|
  | Opponent panel + name + level | **the situation**, e.g. "SCAM CALL · LV MED", "FESTIVAL SALE · EASY" |
  | Opponent HP bar | **pressure/temptation bar**; drops with good moves |
  | Your panel + HP/level | **"YOU" + stage**, **wallet** bar (₹), **happiness** bar |
  | Text box | what's happening, 1–2 lines (e.g. "I'm from the scholarship office. Pay ₹500 now or your money is cancelled!") |
  | 4-move menu | **2–4 choices** (e.g. PAY ₹500 · ASK A FRIEND · HANG UP · CHECK PORTAL) |
  | "It's super effective!" | lesson line / triggers the abstract animation |

  Multi-turn tasks = 2–3 turn battles (e.g. the scammer pushes harder after your first reply) [PROPOSED].

### 2.7 Teaching loop [DECIDED]
1. **Situation:** a task from the student's difficulty bucket, framed for their persona.
2. **Choice:** 2–4 options with pictures (and audio).
3. **Consequence:** bars change at once; some choices also schedule **delayed effects**.
4. **Teach:** a **10–20 s abstract animation** (shapes + on-screen text, no voice needed, so it translates by swapping text) explains the concept behind the decision, **after** the choice, never as a lecture first. It's added to the **replay library**.
5. **Remember:** a weak choice puts its concept tag into the **mistake bank**; it comes back later in a new disguise and is cleared only when answered right.
- **Money comes from life, not tasks.** Allowance, scholarship and wages are the income; tasks don't pay ("do quests, get rich" isn't how money works). **Exception: mini-games** (2.9). Progress shows as pillar levels and "learned" badges.
- **[PROPOSED]** Safety net: fail the same task twice and hints turn on.
- **[PROPOSED]** Guide character: a funny, nosy "aunty" (inspired by HDFC's Vigil Aunty) who delivers hints and lesson lines. Not confirmed.

### 2.8 Consequences, detours, restarts, delayed effects, mistake bank [DECIDED]
- **Chapter map = the team's sketch** (`04_reference_images/sketch_chapter_map_node_path.jpg`; clean version `05_diagrams/chapter_map_v2_placeholders.png`): the **blue path** is the optimal route (all good choices); **black/dashed branches** are detours taken after wrong answers. Each has consequences and rejoins the main path.
- **Weak but survivable choice → detour:** 1–2 consequence tasks, then rejoin. Costs money, happiness and time; feeds the mistake bank.
- **Critical failure → restart the task (mission)** [DECIDED]. Triggers: **falling for a scam, wallet hitting ₹0 before month-end, happiness hitting 0.** The lesson/animation is shown, then the task restarts.
- **Delayed consequences:** a choice can set a **flag** and **schedule** a future event; at each chapter start the game fires any due events. Examples: lend a friend ₹500 → 2 chapters later he hasn't repaid and asks again; take a "no-cost EMI" phone → deducted every later chapter; skip saving → the emergency hits with no buffer.
  ```json
  {"label":"Lend him ₹500","effects":{"wallet":-500},"set_flag":"lent_friend",
   "schedule":{"event":"friend_asks_again","in_chapters":2}}
  ```
- **Mistake bank:** a list in the save data of concept tags the player got wrong (e.g. "needs vs wants", "spot fake payments"). It **(1)** weights random side quests toward banked concepts, **(2)** fills detour nodes, and **(3)** feeds the end report ("mistakes fixed"). Lifecycle: wrong → banked + lesson → later meets it in disguise → right = cleared + "learned" badge; wrong again = stays (hints on).
  Traced example: the Earner accepts a fake payment screenshot → "spot fake payments" is banked → 2 chapters later a "refund" collect request arrives → he declines → cleared.
- **Side quests / random events:** drawn **at random from the persona's event pool**, weighted by the mistake bank [DECIDED]. They're not on the chapter map; they pop up while travelling.

### 2.9 Status bars, mini-games, info button, replay library [DECIDED]
**Happiness bar** (latest definition, from the team): it mirrors the student's **actual mental state**, including short-term pleasure vs later regret.
- An **impulsive decision raises happiness right away**: e.g. ordering **Swiggy for ₹500** instead of making a snack at home or buying a **₹20 chips packet**.
- **Later it bites:** the next day friends invite them to a **paid turf cricket match** and they can't afford it. Being forced to say no **drops happiness**. It also **drops** when low money forces them to **skip mini-games**, or when they get scammed (paying the fake officer drains wallet and happiness together).
- **At zero → task restart.** Low happiness also locks mini-games.
- Lesson felt, not told: impulse buys feel good for a day and then cost you the things you actually wanted.
- Numeric model (how much up/down, decay, thresholds) = **[OPEN]**.

**Wallet bar:** ₹ balance (scaled rupees). **Savings jars** [PROPOSED]: named goals ("Phone fund"), a visible fill, a small "sure?" pause before withdrawing (piggy-bank psychology, 6.4).

**Mini-games** [DECIDED]: pop up **randomly**, **skippable**, **reward** the player in-game when played well, and are **locked whenever a status bar is below its threshold** (e.g. after a run of bad choices). Reward type = **[OPEN]**. Suggestion: frame it as a side gig that pays (e.g. a kirana rush hour) or as a happiness boost, so "money comes from work" still holds.

**Info button** [DECIDED]: always on screen; shows current status: wallet, savings, happiness, stage, active commitments (EMIs, money lent), open mistakes, mini-game lock status.

**Replay library** [DECIDED]: re-watch the short **abstract, text-driven explainer animation** of any completed task.

**HUD mapping** [PROPOSED, from `vibe_03_pixel_hud.png`]: hearts → happiness · small item icons → savings jars · levelled skill icons (L1–L3) → 4 pillar badges · SCORE → wallet. The NCFE score is **not** shown during play (it would feel like an exam).

### 2.10 Investing [DECIDED]
- **Unlocks after one task each from Budget, Save and Safety.** Uses **only what the student has saved**. Grows naturally across stages 2–3 (once there's a salary).
- **No stock market simulator, ever.** Only **made-up assets**, no real companies, tickers or products, and nothing recommended (Vanguard guardrail).

  | Made-up asset | Behaves like | Teaches |
  |---|---|---|
  | Cash box at home | earns nothing; inflation eats it | inflation, time value |
  | Banyan Savings | slow, steady growth | compounding (Pillalamarri banyan analogy) |
  | Chai Stall Fund | medium swings | risk vs return |
  | Mango Orchard Co. | big swings | risk vs return, diversification |

- Stage jumps make compounding visible. A diversification task: spread money across assets, then random events (rain, heat, bad harvest). The epilogue (~55–60) shows the outcomes next to the "didn't invest" path.
- Every projected number carries: *"Assumes X% a year. Real returns change and can be negative. Simulations are assumptions, not promises."*

### 2.11 Scoring and measurement
- **[DECIDED] Before/after quiz** = the same 5-question difficulty quiz at onboarding and after the epilogue. The difference = **learning gain**, per student, per pillar, aggregated per NGO batch.
- **[DECIDED, teammate's idea] NCFE-aligned in-game score** as the **measurement lens** (NOT the task source). Tasks get tagged with the NCFE items they give evidence for. Pass rule from NCFE: **knowledge ≥6/8 AND behaviour ≥6/9 AND attitude ≥3/5** (= at least 15/22). Reference point: **27%** of Indian adults (18–80) are literate (NCFE-FLIS 2019). Full spec in 7.1.
- **Safety score** (our own): scams spotted / scams faced, because the NCFE items don't cover fraud.
- Caveats to state: (1) scams aren't in NCFE's 20 items; (2) in-game behaviour is a proxy, so call it an "NCFE-aligned in-game score", never a certification; (3) NCFE surveyed adults, so the teen comparison is only a reference.
- **No leaderboard** [DECIDED].

### 2.12 End report and "what if" [DECIDED]
- **In-game "what if" (NOT emailed):** from the student's **decision log**, find the **single biggest mistake** (largest negative impact). Replay the game with the choice they didn't make (same random seed) and show the two outcomes side by side.
- **Emailed progress report:** to the **NGO facilitator/organiser in charge of that student**, with the **guardian/parents in CC** ("maybe parents" in the team's words; consent needed). Contents: scores (NCFE-aligned + safety), before/after quiz, pillar progress, mistakes fixed. **The "what if" is not part of the email.**
- [PROPOSED] Privacy handling: the student never types any email. The NGO enrols the guardian contact with consent; students use a nickname only.

### 2.13 NGO integration [DECIDED in principle]
- The NGO is the delivery channel: Vanguard funds, NGOs run sessions at their centres. Scaling = more NGOs × centres × batches.
- **Facilitator dashboard:** batch **join codes** (no student phone/email), progress per centre (joined / active / finished), aggregate before/after scores, % NCFE-literate, the concepts most often in mistake banks, flags for students who need help, and an export for Vanguard (CSR reporting). Vanguard sees **aggregates only**.
- For the hackathon, a **mock dashboard with sample data** is acceptable [PROPOSED].

### 2.14 World [DECIDED]
A made-up town built from **real Hyderabad landmarks**: **Charminar + Laad Bazaar** (festival shopping, stalls), **Durgam Cheruvu** (cable bridge, lake: hangouts, peer-pressure spending), **Gachibowli** towers ("part-time job" scam ads; later-stage jobs), **IIIT Hyderabad** (career fair with a real vs fake scholarship desk; ⚠️ hide from PDFs and video for double-blind), plus home, government junior college + canteen, bank branch, shop/kirana, bus stop, clinic, mobile shop. Turf cricket ground (for the happiness example) [PROPOSED].
- Telangana calls Grades 11–12 **"Intermediate"**, taught at **junior colleges**. Use that wording in the game.

### 2.15 Language and accessibility
- One string file per language; adding a language = adding a file. **Bhashini** translation APIs (a hackathon sponsor) + human check. Audio narration [PROPOSED]. Demo second language: Telugu? [OPEN]. Hyderabad languages: Telugu, Urdu, Hindi, English.
- Big buttons, one decision per screen, works on cheap 5-inch Androids, no sign-up form, PWA, offline-capable.

### 2.16 Tech architecture (as written in M1)
- **Client: Phaser 3** in the phone browser, PWA/offline-capable [DECIDED: browser + Phaser]. Scenes: onboarding, town map (tap-to-travel), money battle, mini-games, info panel, replay library, epilogue, end screen.
- **Game engine (plain JS modules, unit-tested):** state store (wallet, savings, happiness, stage, flags) · **economy scaler** · **task selector** (pillar × difficulty → persona framing) · **consequence scheduler** (delayed effects) · **mistake bank** · **scoring** (NCFE-aligned + safety) · **decision log** (for "what if").
- **Content (JSON, editable by non-coders and by NGOs for other cities):** task buckets with persona framings · random events · mini-games · abstract explainer animations · strings per language. Suggested files: `personas.json`, `tasks.json` (buckets), `events.json`, `minigames.json`, `strings/en.json`, `strings/te.json`.
- **Services:** Translation (Bhashini) · NGO dashboard · **Report service** (progress-report PDF emailed to facilitator, guardian CC) · Storage (local-first save in localStorage, syncs when online; nickname only, no student PII).
- **Key build insight:** build **one generic battle/event screen** driven by JSON. Every task and side quest is data, so content can be written in parallel by non-coders.
- Example task-choice data shape:
  ```json
  {"task":"safety_med_01","persona":"scholarship","place":"college",
   "text":"A caller says he's from ePASS. Pay ₹500 now or your allowance is cancelled.",
   "choices":[
    {"label":"Pay ₹500 by UPI","effects":{"wallet":-500,"happiness":-2},"outcome":"restart",
     "bank":"spot_fake_officials","animation":"scholarships_never_charge"},
    {"label":"Hang up, check the official portal","outcome":"next","safety":"+1",
     "animation":"verify_on_official_site"}]}
  ```
- **Game state:** persona, pocket-money band, difficulty, language, avatar name/look · stage, chapter, map node · wallet, savings jars, happiness · flags, schedule, mistake bank · NCFE values (8 knowledge, 9 behaviour, 3 attitude), safety score, quiz before/after, detours · decision log.
- **Art (nobody on the team draws):** **Kenney** packs: [Tiny Town](https://kenney.nl/assets/tiny-town) (130 assets, 16×16, CC0) and [RPG Urban Pack](https://kenney.nl/assets/rpg-urban-pack) (480 assets, 16×16, CC0, city + characters). Landmark sprites (Charminar, cable bridge, a tower, a campus gate) traced as simple 32×32 silhouettes in **[Piskel](https://www.piskelapp.com/)** (free, browser-based). Use coloured placeholder boxes until the logic works. Credit all assets in README.

### 2.17 Guardrail (from the brief; still binding even though the M1 footer was removed)
**Educate, do not recommend investments · Simulations are assumptions, not promises.** No real products, tickers or "buy X"; every projection is labelled with its assumption. The app must **never ask for what it teaches students to protect** (OTP, PIN, Aadhaar). In India, giving investment advice requires SEBI registration (general knowledge), which is why the guardrail exists.

---

## 3. Submission status

### 3.1 M1: DONE (needs commit) → `03_submissions/M1/`
- `M1.pdf` (2 pages, A4) built from `M1.tex` with **xelatex** (fontspec; main font **Inter**, ₹ via **DejaVu Sans**; packages tikz, tabularx, booktabs, enumitem, titlesec, xcolor). Figure: `battle.png` (money-battle mock). On Overleaf or another machine without Inter, change `\setmainfont{Inter}`.
- Header: **"Learning Money by Living It"**, subtitle "A pixel-art life simulation that teaches financial literacy by letting students live it", **Team No.: 97**, "M1 — Approach". The guardrail footer line was **removed** (the user asked); the guardrail is still mentioned in §1 "What makes it hard" and in the "Guardrail" row of the design table.
- Contents:
  1. Problem statement and our understanding (audience/scale, 4 pillars, what financial literacy means here, 5 difficulties).
  2. Idea/abstract (both explicit claims in bold).
  3. High-level approach: 3.1 pipeline (Onboard → Persona + economy → Difficulty quiz ("before") → Three life stages → Epilogue ~55–60 → Report (quiz again "after"; emailed)); 3.2 core teaching loop + money-battle mock + happiness bar paragraph (latest Swiggy/turf version); 3.3 key design decisions table (Persona, Difficulty, Economy scaling with formula, Consequences, Mini-games, Info & replay, End of game ("what if" in-game only; report emailed), Guardrail).
  4. Proposed architecture (TikZ: Client · Game engine · Content + Translation/Bhashini · NGO dashboard · Report service · Storage).
  5. Planned testing methodology (Learning gain = before/after quiz + NCFE framework; Usability (unguided play tests, time to first task, help requests, drop-off); Engine correctness (unit tests on scaler/scheduler/mistake bank/scoring/"what if" with seeded histories + JSON schema validation); Devices & network (DevTools slow 3G, 4× CPU, budget-Android profile, offline run, <5 s load); Language (string-key coverage + screenshots); Report & privacy (sandbox inboxes, content checklist, nickname-only)).
- No team/member/college names. "IIIT" is not mentioned.
- Superseded earlier version: an HTML→PDF M1 with pixel fonts and "Paisa Path" branding (`03_submissions/M1_superseded_html_version/`). **Don't submit it.**

### 3.2 M2 (due 04:00): TODO
`deliverables/M2.pdf` (≤2 pages, Team 97 on top, no names): current approach + **changes since M1**; **experiments run and results** (e.g. engine unit-test results, scaler checks, a play-test of the first stage with a few peers, load time on throttled devices); **testing progress**; **plan for the remaining time**. **Plus a code push to `main`**, committing incrementally all night (originality rules).

### 3.3 Final (due 11:00) and slides (11:30): TODO
Full code; README (setup/run only + asset credits); MIT LICENSE; `deliverables/final_report.pdf` (≤3 pages: solution, approach, features, results); demo video ≤4 min with voiceover (Drive, "Anyone with the link"; **no names, no IIIT**); code zip; slides PDF via form.

### 3.4 Suggested build order [PROPOSED]
1. Phaser skeleton: title → onboarding (language, avatar + name, life Qs, persona card + switch, difficulty quiz) → chapter map (placeholders).
2. Generic **money-battle screen** fed by JSON + state store + HUD (wallet, happiness) + economy scaler.
3. Stage 1 playable: a few tasks per pillar, persona framings, detours/restarts, delayed effects (flags + schedule), mistake bank v1, side quests.
4. Info button, replay library (abstract animations via Phaser tweens/text), 1–2 mini-games with the lock rule.
5. Stages 2–3 (lighter), investing assets + epilogue, end screen with "what if", report generation (PDF) + email (sandbox/mock), NGO dashboard mock, Telugu strings for a few screens.
6. Unit tests (scaler, scheduler, mistake bank, scoring, what-if) → numbers for M2/final reports.
- **Cut list if behind:** walk animation → instant travel; Telugu beyond onboarding; stage 3 depth; NGO dashboard → a slide; real email → a generated PDF.

---

## 4. Problem statement (from `01_problem_statement/Vanguard-ps.pdf`, 5 pages, "Vanguard India · Community Stewardship · For internal use only")
- Title: **"Empowering the Next Generation Through Financial Literacy"**. "Design a digital experience students want – with the theme of Financial Literacy". **For Grades 11–12 students, particularly from underserved communities across Hyderabad.** (Page 2 is a blank video placeholder.)
- Principles: **01 Simple + relatable** (translate financial concepts into everyday decisions students recognise) · **02 Interactive + fun** (games, stories, simulations, challenges, rewards or quizzes) · **03 Safe to explore & integrate** (experiment, make mistakes, build confidence without real-world consequences).
- "**Learn by doing — Make choices. See consequences. Try again.**" · "**Start with ~1,500 students • Design to scale**".
- What to build: "Four learning pillars. Six measures of success. Keep the experience educational, scalable and privacy-conscious."
  - **01 Plan & budget:** needs vs wants • choices • goals
  - **02 Save & manage:** habits • spending • unexpected needs
  - **03 Understand investing:** risk • time • compounding • diversification
  - **04 Stay financially safe:** protect information • spot suspicious offers
- **Success measures** (the slide says "six" but lists **seven**; treat all as the rubric): **Simple** (easy for a beginner) · **Relatable** (connected to real life) · **Persona-led** (adapt by age, context and financial maturity) · **Language-ready** (translation capability for wider accessibility) · **Game-based** (test learning and evaluate understanding) · **Intuitive UI** (simple navigation with minimal guidance) · **NGO-integrated** (enable delivery, rollout and progress support).
- **Guardrail:** "Educate, do not recommend investments • Simulations are assumptions, not promises."
- How M1 maps to the success measures: Simple = one decision per screen, short lessons · Relatable = Hyderabad places, everyday rupee situations, scaled prices · Persona-led = persona framing + difficulty buckets · Language-ready = string files + Bhashini + audio · Game-based = in-game measurement + before/after quiz · Intuitive UI = tap-to-travel, battle screen, info button, no sign-up · NGO-integrated = join codes, dashboard, emailed reports · Safe sandbox = fake money, detours, restarts.

### 4.1 Interpretation notes
- **Vanguard** is a large US asset manager (index funds). "Community Stewardship" is its CSR/social-impact arm, so this is a free tool delivered through NGOs, not a product they sell.
- Indian companies spend CSR through NGOs registered on **Form CSR-1** (mandatory since **1 April 2021**, under Section 135 of the Companies Act). That's why "NGO-integrated" matters.
- **"Financial literacy" here** = the knowledge, habits and confidence to make sensible decisions with one's **own** money: pocket money, scholarship, UPI, first salary. **Not** finance as a subject, and **not** stock trading.
- Traps most teams will fall into: a stock-trading simulator (breaks the guardrail, not relatable); a quiz app with coins (a textbook with confetti); ignoring the NGO side.

---

## 5. The team's own raw notes (paraphrased; questions all answered above)
- Target: ~1,500 NGO students from lower-income communities in Hyderabad; scalability + integration ("is it just scaled with NGOs?" → yes).
- Plan & budget: needs vs wants (wants > needs is common among students); smart spending (weak when a lot of money is in hand); financial goals (rarely set → reward system, "small goal gives X").
- Save & manage: saving habits ("how does a piggy bank work, why do kids save with them?"); daily spend management; preparing for unexpected needs.
- Investing in an age-appropriate way: risk, time horizons, compounding, diversification.
- Financial safety: digital safety (protecting personal info); identifying suspicious offers/scams.
- Judging: interactive & fun; relatable (jargon → everyday decisions of 16–18-year-olds); safe sandbox; accessible & persona-led (maturity levels, multi-language, self-explanatory UI); NGO-integrated; intuitive UI; privacy-conscious.
- Wanted local analogies: compounding without "snowball" (no snow in Hyderabad); diversification without "egg basket".

---

## 6. Content research and teaching material

### 6.1 Hyderabad analogies
- **Compounding = the Pillalamarri banyan** (Mahabubnagar, Telangana; ~**700 years** old; branches over ~**3 acres**; "Pillalu" = children, "marri" = banyan in Telugu). A banyan's branches drop roots that become new trunks, which grow branches that drop more roots: **growth that makes more growth**. Teen one-liner: a reel going viral (each sharer brings new viewers who share again). Formula: **A = P(1 + r)^t**. Assuming 8%/yr (an assumption): ₹10,000 for 30 years → **₹34,000** without compounding vs **≈₹1,00,627** with it (the ₹66,627 gap is growth on growth); 40 years → **≈₹2,17,245** (starting 10 years earlier roughly doubles it).
- **Diversification = the Charminar vendor:** one sells only umbrellas (great in monsoon, nothing in April); another sells umbrellas + caps/water bottles and earns every season. Own things that **don't fail at the same time**. Teen one-liner: you don't pick 11 openers for SRH (Sunrisers Hyderabad).
- **Risk** = the chance things turn out differently than expected, including worse; a bigger possible reward usually means bigger risk. **Time horizon** = how long until you need the money.

### 6.2 Everyday money situations for this demographic (raw material for tasks/events; to be validated with real students)
- **Budget:** ₹2,000/month across bus pass, recharge, a friend's birthday, festival spending (Bonalu/Eid/Sankranti) · Free Fire/BGMI top-ups (₹50 here, ₹100 there) · new-phone pressure bought on "no-cost EMI" (a fixed monthly payment the family carries for a year) · coaching fees for **TG EAPCET** vs everything else · grocery runs at the kirana (comparing prices and pack sizes) · **Swiggy ₹500 vs ₹20 chips** · paid **turf cricket** with friends.
- **Save:** scholarship money landing in **their own** account (**TS ePASS** post-matric: Class 11 onward; SC/ST family income <₹2L, BC/EBC <₹1.5L; maintenance allowance via DBT to an Aadhaar-linked account; tuition paid to the college) · part-time earnings (shop helper, deliveries, tuitions) · a parent's daily-wage work stops or a hospital bill (emergency fund) · the family **chit fund** (members pay in monthly and take turns getting the pot; common, sometimes fraudulent) · a friend asks to borrow ₹500.
- **Invest:** the family saves in gold jewellery (an asset whose price moves) · first salary in ~4 years: start saving now or at 30? · "double your money in 6 months" (where investing ends and scams begin).
- **Safety:** someone asks for an OTP/UPI PIN; "enter PIN to *receive* money" (you never need a PIN to receive) · UPI **collect request / QR** tricks · fake call: "scholarship approved, pay a ₹500 processing fee" · Telegram/WhatsApp "part-time job: like videos, earn ₹5,000/day" task scams · instant-loan apps (easy money now, harassment later) · betting/real-money gaming apps (**banned by the Promotion and Regulation of Online Gaming Act 2025**: real-money games, their ads and payments for them are prohibited, so any still reaching you are illegal) · "digital arrest" calls from fake police/CBI · fake payment screenshots (shopkeepers).

### 6.3 Legal and privacy facts
- **DPDP Act (India):** under-18s are "children". Processing their data needs **verifiable parental consent**; **no tracking, behavioural monitoring or targeted ads** aimed at children (Section 9; DPDP Rule 12 commentary). Educational institutions may get limited relief (check the official text).
- Design consequences: nickname + avatar only; no real name/phone/email/photo from students; join via NGO code; never link real bank/UPI; no location tracking; store progress, not personal life details; the NGO sees individuals, Vanguard sees totals; the app never asks for OTP/PIN/Aadhaar.

### 6.4 Why piggy banks work (for savings-jar design)
1. **Labelling / mental accounting:** money in a box marked "for X" feels off-limits. **Kenya study (J-PAL, Dupas & Robinson):** a simple locked **Safe Box** (key held by the person) raised preventive-health spending **+66%**; a **Health Pot** (group commitment) **+128%**; a **Lock Box** (no key) had **no effect**. Labelling beat lock-in.
2. **Friction:** opening it takes effort; the impulse fades.
3. **Visibility:** you see and hear it fill.
→ Named jars, a small "sure?" pause before withdrawing, a visible fill.

### 6.5 Persona-maturity idea from early discussion (background)
Level 1: only small pocket money, no UPI/bank · Level 2: uses family PhonePe/GPay, buys groceries for home, may get scholarship · Level 3: earns, contributes to household. (This became the 3 personas; difficulty is now separate.)

---

## 7. NCFE material

### 7.1 The teammate's NCFE integration spec (NCFE Financial Literacy & Inclusion Survey 2019, OECD/INFE-based)
| Component | Items | Range | Pass mark |
|---|---|---|---|
| Financial Knowledge (FK) | 8 | 0–8 | 6 |
| Financial Behaviour (FB) | 9 | 0–9 | 6 |
| Financial Attitude (FA) | 3 | 1–5 | 3 |
| Total | 20 | 1–22 | 15 |
- Literate only if **all three** components pass (the minimums sum to 15). National 2019 result: **27%** literate.
- **Knowledge (0/1 each):** division, time value of money, interest paid on a loan, simple interest, compound interest, inflation, risk vs return, diversification.
- **Behaviour (0/1 each):** keeps a budget; takes responsibility for money management; can meet a major expense without borrowing; saves actively (with a return); compares options before choosing a product; sets long-term goals; keeps a close watch on finances; pays bills on time; considers affordability before buying.
- **Attitude (each 1–5 agree/disagree, averaged; disagreeing scores higher):** "I tend to live for today and let tomorrow take care of itself" · "I find it more satisfying to spend money than to save it for the long term" · "Money is there to be spent".
- **Mapping to game:** knowledge items = situations with one correct option; behaviour items = recurring situations, scored 1 if the behaviour-consistent option is picked consistently; attitude = spend-now vs plan-ahead trade-offs, with the proportion of future-oriented choices mapped to 1–5 (Claude's thresholds: <20% → 1, 20–39 → 2, 40–59 → 3, 60–79 → 4, ≥80 → 5).
- **Backend state:** 20 values (8 + 9 binary, 3 on 1–5). FK and FB are sums, FA is the average; status = FK ≥6 AND FB ≥6 AND FA ≥3. Bands below/near/above threshold; failing items steer which situations come next (= the mistake bank).
- **Item-level national rates (teammate's numbers from the full report; NOT re-verified):** Knowledge: division 85, time value 46, interest on loan 75, simple interest 58, **compound interest 6**, risk-return 84, inflation 81, diversification 61. Behaviour: budget 74, **major expense without borrowing 45**, **compares options 9**, long-term goals 82, watches finances 83, pays bills on time 63, considers affordability 75. Component pass rates: attitude 89%, behaviour 53%, knowledge 49%.
- **Verified by Claude (NCFE executive summary):** 27% of adults (18–80) literate; criteria 15/22 with minimums 3/5 attitude, 6/9 behaviour, 6/8 knowledge; component pass rates 89% / 53% / 49%. Survey period June 2018–Oct 2019. Item-level rates are not in the summary.
- **Weakest spots to cover well in tasks:** compound interest (6%), comparing options (9%), major expense without borrowing (45%), time value of money (46%). Pitch line: "We built the game around the things Indian adults score worst on."
- **Team decision:** tasks are **not** derived from these items (the team thought the alignment was too tight); NCFE = measurement lens only.

### 7.2 Other NCFE items
- **NFLAT:** free annual national financial-literacy test for Classes 6–12 since 2013–14. Our quiz could align to its syllabus → "ready for NFLAT" credential [idea].
- **NCFE Innovate4FinLit Game Challenge (2026):** a national challenge for gamified financial literacy. **Track C = students** (budgeting, saving, needs vs wants, safe digital behaviour). Rules: cover **≥3 themes**; **rural-ready** (lightweight, low bandwidth, offline-capable, **voice + visuals over text**); **behaviour over theory** (decision mechanics with consequences, not just quizzes). Prize pool ₹5L. Ran Dec 2025–Apr 2026. **Treat these rules as a hidden rubric.**

---

## 8. Landscape research: existing games and programs (full tables in `06_claude_docs_exports/research_landscape.md`)
Pillar key: P1 budget, P2 save, P3 invest, P4 safety.

**Global**
- **Spent** (Urban Ministries of Durham + McKinney): survive a month on $1,000; job, housing distance, insurance, a debt collector; consequences echo forward (ignoring the collector doesn't erase the debt). → *our core loop.*
- **JA Finance Park** (Junior Achievement; grades 7–12): Entry level assigns a random life persona and a monthly budget; Advanced lets students choose career/education, set up to 3 savings goals, and track a Financial Health Meter; teacher-led + volunteers (≥3 hrs). → *personas + volunteer delivery.*
- **Banqer** (NZ/AU): class gets mock Everyday + Savings accounts, class jobs, interest/tax/insurance modules; teacher sets the economy rules and enables modules; leaderboard; free when a partner pays. → *facilitator unlocks chapters; sponsor-pays model.*
- **EVERFI** (Blackbaud): free bank-sponsored K–12 courses; sponsor impact dashboard + year-end report; 6.5M+ learners (2024–25); 47% of schools low/moderate income; study +21% confidence, +10% healthy behaviours, +9% family money conversations. → *sponsor dashboard.*
- **NGPF Arcade:** 11 free games. **STAX** (20 years of investing in one session), Spent, **PAYBACK** (college choices vs debt and happiness), Money Magic (budget to a savings goal), **Shady Sam** (play the loan shark). → *compress decades; play the scammer; track happiness alongside money.*
- **Commonwealth "Financial Entertainment"** (FableVision): **Farm Blitz** (match-3; debt/savings; RCT: knowledge gain similar to reading pamphlets, slightly more saving), **Bite Club** (vampire club + retirement saving), **SavingsQuest** (badges + a dancing pig per save; **saves 25% more often**), Ramp It Up; ~200k users. → *celebrate every save; fun alone isn't the product.*
- **Zogo:** 300+ bite-size modules, points → gift cards; banks distribute access codes that brand the app. → *per-NGO join codes.*
- **Google Be Internet Awesome / Interland:** levels on protecting info and spotting fakes; launched in India in 2021 with Amar Chitra Katha comics in 8 languages. → *safety as levels.*

**India**
- **Meri Dukaan** (UBS + Pratham, 2019): Android grocery-store sim (cash, inventory, banking, insurance); pilot in 100 Pratham centres. → *closest precedent: a finance firm builds, an NGO delivers.*
- **FunDhan** (HBCSE-TIFR, Feb 2026): board game, 14+, 2–4 players, **15–20 min**, card flips; spend/save/accounts; ₹699.
- **FUN धन prototype** (Maker's Asylum): rotating board modules for uncertainty; accidents, income shocks, insurance, **chit funds**. Their Snakes & Ladders version was **too predictable, and learning dropped on replay** → *our events must be random.*
- **RBI comics:** *Raju and the Money Tree* (banking; Telugu version exists), ***Raju and the Forty Thieves*** (40 real fraud cases with do's and don'ts = **a ready scam-scenario bank**), *Money Kumar* series.
- **SEBI Saa₹thi** (Jan 2022; English + Hindi): market basics, KYC, mutual funds, grievances; explains, never recommends.
- **HDFC Vigil Aunty** (2022): anti-fraud chat shows hosted by actor Anuradha Menon; social media + a WhatsApp number. → *nosy-aunty guide idea.*
- **Svatah Education Foundation** (**Hyderabad** NGO): *Bhavishya* = year-long curriculum for **Grades 6–9** in government and low-income private schools (Hyderabad and Bengaluru): "Money Matters" workbooks, needs vs wants, budgeting, savings goals, digital safety, assessments. *Shikshak* trains government teachers in Narayanpet. *Pragya* (women). Partners incl. Zerodha, Zomato, L&T; SVP support from Mar 2025. → *likely the kind of delivery partner Vanguard would use; Grades 11–12 digital is open.*
- **Aflatoun/AflaTeen via MelJol:** AflaTeen ages 13–14 and 15–16, 38 hrs/stage, 5 modules (incl. My Finances, Career & Entrepreneurship), games and role plays, 82 countries. MelJol: 514,406 children, 3,923 schools, 11 states, 14 local NGOs (2016). → *NGO franchise model for scale.*
- **Magic Bus:** adolescent life-skills curriculum, 22–24 states; a "Financial Literacy for Career Readiness" session.
- **Budget Rani** (US Consulate Hyderabad + Yugantar + Telangana Domestic Workers Union): 6-month money-management training for 250 women.
- **Teen fintech apps** (FamPay, FYP, Junio, YPay, Good Good Piggy, muvin): parent-funded cards with goals, tracking, rewards, chores → pocket money. → *goal jars; but they need real parent money, which ours must not.*
- **Glific** (Project Tech4Dev): open-source WhatsApp chatbot builder for NGOs (25 NGOs in 2021; SaaS ₹7,500/mo) → *possible nudges between sessions.*
- **Finance4Future / Finance4teens:** student-run classroom initiatives (minor).

**The gap (our pitch):** nothing combines (1) built for Telangana Intermediate students, (2) a digital simulation with consequences, (3) Telugu/Urdu/Hindi/English with voice, (4) Indian scams as gameplay, (5) an NGO dashboard + sponsor report, (6) zero real money. Market map: `05_diagrams/market_map.png`; the "Indian simulations" box holds only a 2019 pilot, a board game and a prototype.

**Feature catalog worth stealing:** month-by-month life with fixed income; random life events; delayed consequences; rewind/replay; 15–20 min rounds; persona assignment; one character in many roles; savings-goal jars; celebrating every save; a financial health meter; decades compressed into minutes with assumption labels; real-or-scam levels; playing the scammer; a guide character; bite-size modules + badges (not gift cards); voice + visuals, offline; comics/stories per language; per-NGO join codes; facilitator unlocks chapters; volunteer session guides; sponsor impact dashboard; before/after checks; WhatsApp nudges.

---

## 9. Testing plan (as promised in M1)
- **Learning gain:** before/after 5-question quiz; per-pillar gain; NCFE-aligned in-game score vs the 27% adult reference.
- **Usability:** unguided play tests (peers now; target-age students in an NGO pilot later); time to finish the first task without help; help requests; drop-off points.
- **Engine correctness:** unit tests for the economy scaler, consequence scheduler, mistake bank, scoring, "what if" replay on seeded game histories; JSON schema validation (difficulty tag, all persona framings, valid effects).
- **Devices & network:** Chrome DevTools throttling (slow 3G, 4× CPU) on a budget-Android profile; full offline play-through; target load <5 s.
- **Language:** automated check that every string key exists per language; screenshot review.
- **Report & privacy:** reports from seeded histories sent to sandbox inboxes; content checklist (no product recommendations; projections labelled); no PII beyond a nickname.

---

## 10. Open questions (as of 21:30)
1. Economy-scaling formula: proportional (₹400, as in M1) vs the team's example (₹100). Value of S.
2. Happiness-bar numeric model (increments, decay, thresholds) and the status-bar thresholds that lock mini-games.
3. Mini-game reward type (side-gig money vs happiness vs other) and which mini-games.
4. The task list for each of the 12 buckets × 3 persona framings.
5. How personas carry into stages 2–3; chapters per stage; total playtime (aim: one NGO session).
6. Real price list (public prices + student estimates).
7. Second language for the demo (Telugu?).
8. Parents in the email CC: consent mechanism (via NGO enrolment?).
9. NGO dashboard: working vs mock; email: real vs generated PDF for the demo.
10. Guide character (nosy aunty) yes/no; hints-after-two-failures rule yes/no.
11. How to produce the abstract animations (Phaser tweens + text is fastest).
12. Team size and roles; GitHub repo set up and all members joined?
13. Rename or hide the IIIT landmark for the demo video (double-blind).

---

## 11. File index (this zip)
| Path | What |
|---|---|
| `CONTEXT.md` | this file |
| `01_problem_statement/Vanguard-ps.pdf` | the official Vanguard problem statement (5 pages) |
| `02_hackathon_rules/Megathon_X_Guidelines.pdf` | terms and conditions (eligibility, submission policy, originality, IP, evaluation) |
| `02_hackathon_rules/Megathon_X_Deliverables.pdf` | exact deliverables per stage |
| `03_submissions/M1/M1.pdf` · `M1.tex` · `battle.png` | **final M1** (LaTeX, Team 97); compile with `xelatex M1.tex` |
| `03_submissions/M1_superseded_html_version/` | the first HTML→PDF M1 draft (has "Paisa Path" branding; don't submit) |
| `04_reference_images/vibe_01_pokemon_style_town.png` | vibe: top-down DS-era pixel city |
| `04_reference_images/vibe_02_druid_story_assets.png` | vibe: pixel RPG asset pack (check licence) |
| `04_reference_images/vibe_03_pixel_hud.png` | vibe: HUD with hearts, levelled skill icons, score |
| `04_reference_images/sketch_chapter_map_node_path.jpg` | team's hand sketch: start → nodes → end; blue = optimal, black = wrong-answer detours |
| `04_reference_images/ref_pokemon_battle_screen.png` | reference: tasks should look like this battle screen |
| `04_reference_images/mock_money_battle_screen.png` | our original money-battle mock (scam call example) |
| `05_diagrams/market_map.png` | 2×2 market map of existing products (the gap is top-right) |
| `05_diagrams/chapter_map_v1_named_missions.png` | clean chapter map with the old 8 named missions **[SUPERSEDED labels]** |
| `05_diagrams/chapter_map_v2_placeholders.png` | clean chapter map, current: Task 1–8 placeholders across 3 stages, detours, restarts, epilogue ~60 |
| `06_claude_docs_exports/research_landscape.md` | full research doc (games, NGOs, feature catalog, everyday situations, analogies, notes answered, sources) |
| `06_claude_docs_exports/game_overview_PARTIALLY_OUTDATED.md` | game design doc: the top "Changes" table and the first sections are current; World/HUD/End report, Tech, 24-hour plan and Open questions sections are outdated. **This CONTEXT.md wins.** |
| `07_misc/New_session_-_Claude.webloc` | just a browser bookmark to claude.ai/new (no content) |

Live doc links (owner's claude.ai account): research landscape https://claude.ai/code/artifact/6c229214-625a-4682-b983-5e2808b159ee · game overview https://claude.ai/code/artifact/60d63ac5-469f-429d-bdc7-523ac4ece544

---

## 12. Decision history (how we got here)

### 12.1 Timeline (10 Oct 2026, IST)
- **17:34** Problem statement shared; explained (CSR/NGO angle, what financial literacy means, guardrail, the 7 success measures, the life-sim recommendation).
- **18:25** Team notes shared; research doc built (games, NGOs, features, analogies, notes answered).
- **19:00** Pixel-sim idea + vibe images; Claude pushed back: no stock-market sim; win = stability, not max money; mistake bank proposed.
- **19:45–19:53** Persona model debated: first "quiz → persona → difficulty bundled", then "persona = difficulty". **Both later SUPERSEDED.**
- **20:20** Answers to the 21 questions + chapter-map sketch + teammate's NCFE spec → first game design doc (6 monthly chapters, 8 NCFE-mapped missions × 3 versions). **Later partly SUPERSEDED.**
- **20:31** Pokémon battle screen chosen as the task look.
- **20:56–20:58** 13 changes (no festival, student names avatar, 3 life stages, epilogue ~55–60, biggest-mistake "what if", emailed report, persona ≠ difficulty, pocket-money scaling, info button, replay library, mini-games, battle screen, own tasks) + rules PDFs → M1 PDF (HTML version).
- **21:16** Switched to a formal LaTeX M1. Fixes: two explicit claims (relatable + abstract animations), happiness-bar explanation, "what if" not emailed, before/after quiz defined.
- **21:21–21:22** Game name removed; Team No. 97; happiness bar redefined (Swiggy/turf); guardrail footer removed.

### 12.2 The 21-question round (answers given at 20:20)
1 Show persona and allow switching → **yes** · 2 Who drafts the quiz → **Claude drafts, team edits** · 3 Real amounts → **later (skeleton first)** · 4 Month vs year → month = chapter (Claude: months inside a bigger arc) → **later became 3 life stages** · 5 Playthrough length → later · 6 Walk vs tap → **tap with walk animation; walk only in small areas** · 7 Pillar order → **the node-path sketch (blue optimal, black detours)** · 8 Side quests → **random from the persona's pool** · 9 Delayed consequences → explained (flags + schedule) · 10 Missions → 8 missions / 24 versions (**SUPERSEDED by own task buckets**) · 11 Mistake bank → explained, integrate · 12 Checkpoint → **restart the mission** · 13 Mistakes return in disguise → **yes** · 14 Investing → **after one mission from each pillar; uses savings** · 15 Final stability report + alternate path → **yes** (now = biggest-mistake "what if") · 16 Leaderboard → **no** · 17 Landmarks → **real: Charminar, IIIT, Gachibowli, Durgam Cheruvu…** · 18 Guide character → the team asked how teaching flows → **teach after the choice** (guide not confirmed) · 19 Browser + Phaser → **yes** · 20 Art → **nobody can draw** · 21 Timing → 24 h; M1 22:00; M2 04:00 (final 11:00 per rules).

### 12.3 Superseded designs (kept as an idea bank)
- **6 monthly chapters over one college year** (June new year → festival month → mid-year → something breaks → easy-money offers → March exams) → replaced by 3 life stages.
- **Old 8 missions (NCFE-mapped), each with 3 persona versions:** M1 First budget (bus pass, recharge, snacks; detour "broke by week 3") · M2 Start a jar (goal: earphones / exam fees / bicycle) · M3 Too good to be true (OTP on mom's phone / fake ePASS officer / fake payment screenshot; restart) · M4 Festival month (split a ₹1,200 gift 4 ways; relatives' gifts; extra shift vs celebrate) · M5 Banyan grove (₹1,000 now or later; cash box vs Banyan Savings; inflation) · M6 Emergency (cracked screen / trip fee / dad's work stops) · M7 Easy money ("no-cost EMI" phone / instant-loan app / Telegram task scam + loan app; restart) · M8 Charminar stall (diversify stall stock / split savings across assets). → Tasks are now the team's own; these remain usable as ideas.
- **Festival pick in onboarding** → removed. **Default persona names** (Priya / Ayesha / Ravi) → removed. **Persona sets difficulty** → removed. **₹1 = ₹1** → replaced by scaling. **"What if" in the emailed report** → in-game only. **Pixel-font HTML M1 with "Paisa Path" branding** → replaced by the LaTeX M1. **"Paisa Path" name** → dropped. **Guardrail footer on M1** → removed (still followed in design).
- Earlier happiness definition ("rises with in-budget spending on things you enjoy; falls with stress") → replaced by the impulse-now / regret-later model (2.9).

---

## 13. Sources (opened during research)
NCFE-FLIS 2019 exec summary https://ncfe.org.in/wp-content/uploads/2023/12/ExecSumm_.pdf · full report https://ncfe.org.in/wp-content/uploads/2023/12/NCFE-2019_Final_Report.pdf · NCFE Innovate4FinLit https://ncfe.org.in/hackathon/ · NFLAT https://ncfe.org.in/nflat/ · Meri Dukaan https://thecsrjournal.in/ubs-and-pratham-roll-out-financial-literacy-app-meri-dukaan/ · FunDhan https://dnte.hbcse.tifr.res.in/fundhan/ · FUN धन https://www.makersasylum.com/project/fun-dhn/ · RBI/SEBI resources https://en.vikaspedia.in/viewcontent/social-welfare/financial-inclusion/financial-literacy/financial-literacy-for-children?lgn=en · Saa₹thi https://inc42.com/buzz/sebi-unveils-saa₹thi-app-to-educate-and-inform-investors/ · Vigil Aunty https://www.business-standard.com/amp/article/companies/hdfc-bank-s-new-campaign-vigil-aunty-to-help-tackle-cyber-frauds-122081900946_1.html · Svatah https://give.do/discover/1CLS/svatah-education-foundation/ and https://svpindia.org/investees/svatah-education-foundation/ · MelJol/Aflatoun https://aflatoun.org/?p=1739956 · AflaTeen https://aflatoun.org/wp-content/uploads/2025/04/AflaTeen-Brochure-Nov-2024-2.pdf · Magic Bus https://www.magicbus.org/donate-for-adolescents · Budget Rani https://telanganatoday.com/tag/budget-rani · teen apps https://educationworld.in/financial-literacy-apps/ and https://www.ibsintelligence.com/ibsi-news/5-fintech-platforms-boosting-financial-confidence-of-children-in-india/ · Glific https://yourstory.com/socialstory/2021/08/glific-open-source-platform-ngo-whatsapp-chatbots/amp · Spent https://www.marketplace.org/2011/02/18/new-game-tests-your-ability-make-it-1000-month · JA Finance Park https://janj.ja.org/dA/9d3c33a500/file/JA_Finance_Park_Virtual_2020_Program_Overview.pdf · Banqer https://www.netwealth.com.au/web/media/308599/banqer-brochure.pdf · EVERFI https://everfi.com/wp-content/uploads/2026/02/Financial-Education-Sponsorship-One-Pager.pdf · NGPF https://dev5.ngpf.org/blog/best-of/best-of-2025-most-played-arcade-games · Boston Fed / Commonwealth https://www.bostonfed.org/-/media/Documents/cb/2017/spring/the-gamification-effect-using-fun-to-build-financial-security.pdf · Farm Blitz https://www.fablevisionstudios.com/farm-blitz · Zogo https://www.cuinsight.com/press-release/eleven-financial-institutions-partner-with-zogo-to-advance-youth-financial-literacy/ · Be Internet Awesome India https://www.afaqs.com/news/digital/google-introduces-be-internet-awesome-programme-for-kids-safety-in-india · Form CSR-1 https://cleartax.in/s/form-csr-1 · Kenya safe-box study https://www.povertyactionlab.org/evaluation/constraints-saving-health-expenditures-kenya · DPDP Rule 12 https://dpdpa.com/dpdparules/rule12.html · TS ePASS https://www.indiascholarships.in/guides/telangana-epass-postmatric-guide · Online Gaming Act 2025 https://www.drishtiias.com/daily-updates/daily-news-analysis/promotion-and-regulation-of-online-gaming-act,-2025/print_manually · Pillalamarri https://mahabubnagar.nic.in/pillala-marri/ · Kenney https://kenney.nl/assets/tiny-town and https://kenney.nl/assets/rpg-urban-pack · Piskel https://www.piskelapp.com/
