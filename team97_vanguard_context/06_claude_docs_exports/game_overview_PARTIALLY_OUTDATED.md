# Paisa Path — Game Overview

Oct 10, 2026 · @Monishram Selvaraj

A pixel life-sim: a Hyderabad Intermediate student lives a compressed life in 3 stages (Intermediate student → first salary → earning more), learns the 4 pillars by making choices, and finishes with an NCFE-aligned literacy score. Phaser, phone browser, built in 24 hours. "Paisa Path" is a working name.

## Changes after team review (10 Oct, 9 pm)

These override anything below that disagrees. The sections below have been updated to match.

| # | Change | What it means |
| --- | --- | --- |
| 1 | No festival choice | Removed from onboarding |
| 2 | Student names the avatar | Persona names are placeholders only |
| 3 | 3 life stages instead of 6 months | Stage 1 Intermediate student → Stage 2 first salary → Stage 3 earning more |
| 4 | Epilogue at \~55–60 | Shows what their savings and investments became |
| 5 | "What if" = biggest mistake | Taken from the student's own decision log, with the outcome of the choice they didn't make |
| 6 | End report emailed | To the NGO facilitator in charge of the student, CC the guardian |
| 7 | Personas ≠ difficulty | Persona changes only how a task is framed (story, analogies). Difficulty comes from a separate quiz → simple / medium / hard buckets |
| 8 | Pocket-money question | Asked indirectly; scales in-game prices. Everyone starts with the same in-game amount |
| 9 | Info button | Shows the player's status at any point |
| 10 | Replay library | Re-watch the short text-driven explainer animation for any past task |
| 11 | Random mini-games | Skippable, give in-game rewards, locked while a status bar is below threshold |
| 12 | Task screen = "money battle" | Pokémon-battle layout in our own pixel art |
| 13 | Tasks are our own | Not derived from the NCFE items; the task list is TBD. NCFE stays only as the scoring lens |

## How a playthrough goes

Every step is a screen the team builds. Total length is TBD; aim for one NGO session.

1. **Language + avatar.** Pick a language, the avatar's look, and **a name the student types**.
2. **Life questions.** 3–4 picture questions, including an indirect pocket-money question, assign one of 3 personas.
3. **Persona card.** "Your story: Scholarship." A **Not me? Switch** button lets the student change it.
4. **Difficulty quiz.** 5 knowledge questions place the student in **simple / medium / hard**.
5. **Three life stages,** each a few monthly chapters:
   1. Intermediate student
   2. First salary
   3. Earning more
6. **Inside a stage:** the chapter map, then a tap on a place in town, then a **money battle** (the task). Random events and mini-games turn up along the way. The **info button** and **replay library** are always available.
7. **Epilogue at \~55–60.** What their savings and investments became, labelled as assumptions.
8. **End report.** Score, before/after quiz, and the **biggest mistake replayed the other way**. Emailed to the NGO facilitator, guardian CC'd.

## Onboarding: persona, difficulty, economy

Onboarding produces two separate results. **Life questions → persona**, which decides how tasks are told. **Difficulty quiz → bucket**, which decides which tasks you get. The questions are drafts; edit freely.

### Life questions → persona

| # | Question | Options | What it does |
| --- | --- | --- | --- |
| L1 | Where does most of your money come from? | My family gives it · A scholarship · I earn it · I don't really get money | **Picks the persona** |
| L2 | In a normal week, how much do you spend on yourself? | Under ₹100 · ₹100–300 · ₹300–700 · More than ₹700 | **Pocket-money band** for price scaling. Asked indirectly and as a range, never an exact amount |
| L3 | Do you have your own bank account? | Yes · No · Not sure | Sets a flag used in task text |
| L4 | Whose phone do you use for UPI? | My own · Family's · I don't use UPI | Sets a flag: e.g. the scam arrives on *your* phone or *mom's* |

### Difficulty quiz → bucket

Five knowledge questions. 0–1 right → **simple**, 2–3 → **medium**, 4–5 → **hard**. The same quiz runs again at the end for the before/after score.

| # | Concept | Question | Right answer |
| --- | --- | --- | --- |
| K1 | Time value of money | Your uncle offers ₹1,000 today or ₹1,000 a year from now. Which is better? | Today |
| K2 | Interest on a loan | You borrow ₹500 and agree to pay back ₹600. How much interest is that? | ₹100 |
| K3 | Compound interest | ₹1,000 in an account that adds 10% a year, nothing taken out. After 2 years: more than ₹1,200 · exactly ₹1,200 · less | More than ₹1,200 |
| K4 | Inflation | Prices go up 5%; your pocket money stays the same. Next year you can buy: more · the same · less | Less |
| K5 | Diversification | One Charminar vendor sells only umbrellas; another sells umbrellas and water bottles. Who earns more safely across the year? | The one selling both |

### Economy scaling

Everyone starts with the **same in-game amount** (call it S; e.g. ₹5,000 a month, a placeholder). Prices are scaled so each item costs the **same share of money as in that student's real life**:

```latex
\text{in-game price} = \text{real price} \times \frac{S}{\text{student's monthly pocket money}}
```

| Student's pocket money | Real bat price | Share of their money | In-game price (S = ₹5,000) |
| --- | --- | --- | --- |
| ₹5,000 | ₹200 | 4% | ₹200 |
| ₹2,500 | ₹200 | 8% | ₹400 |

**Check this against the team's example.** That example scaled the bat *down* to ₹100 for the ₹2,500 student. ₹100 is 2% of the in-game money, but the bat is 8% of that student's real money. The game would feel 4× easier than their life. The formula above keeps it at 8%.

In-game rupees are therefore scaled rupees; the earlier "₹1 in-game = ₹1 real" rule is dropped.

### The 3 personas (framing only)

The persona **never changes difficulty**. Same task, same difficulty, different story. The student names the avatar, so personas have labels, not names.

|  | Pocket money | Scholarship | Earner |
| --- | --- | --- | --- |
| Money in stage 1 | Parents, monthly, sometimes late | ePASS allowance as a lump into own account + a little from family | Evening job at a shop, weekly, uneven; part goes home |
| Has | No bank account; family phone | Own account; shared phone | Own phone, own UPI |
| Same scam task, framed as | "OTP sent by mistake" on mom's phone | Fake scholarship officer asks for a ₹500 "fee" | Customer "pays" with a fake payment screenshot |
| Stages 2–3 | TBD | TBD | TBD |

Safety net: fail the same task twice and hints turn on.

## Time: three life stages

The game covers a whole life, not one college year. Each stage is a few **monthly chapters**, because money is felt month to month. The jumps between stages and to the epilogue are where compounding becomes visible.

| Stage | Age (approx.) | Money situation | Natural focus |
| --- | --- | --- | --- |
| 1 Intermediate student | 16–17 | Pocket money / scholarship / part-time earnings (by persona) | Budget, saving, everyday scams |
| 2 First salary | \~22–24 | First regular income, first big expenses, family expectations | Budget at a bigger scale, emergency fund, starting to invest |
| 3 Earning more | \~30 | A raise, bigger choices (EMIs, loans, goals) | Debt vs saving, diversification, harder scams |
| Epilogue | \~55–60 | Looks back | What savings and investments became (assumptions labelled) |

Open: the number of chapters per stage, and how each persona's story carries into stages 2–3.

## Chapter map

This is the progress screen, drawn from your sketch. Blue nodes are main tasks across the three stages; names and order are placeholders until the task list is written. A weak choice sends you down a dashed detour (consequence tasks) that rejoins the path. A critical failure (falling for a scam, going broke, happiness at zero) restarts that task.

&#91;embedded content: chapter map · 8 main missions, 6 detours, 2 restarts\]

Side quests aren't on this map. They pop up at random while you walk between places in town, drawn from the persona's pool and weighted by the mistake bank.

## Tasks: buckets and the money-battle screen

The team writes its own tasks; the earlier NCFE-derived mission list is dropped. What's fixed is the **structure** every task follows.

### Task buckets

- Tasks are sorted by **pillar × difficulty**: Budget, Save, Invest, Safety × simple, medium, hard. That's 12 buckets.
- Every task has **one framing per persona**: the same decision and lesson, with a different story and analogies.
- The difficulty quiz picks the bucket; the persona picks the framing; the life stage picks the setting.
- The task list is **TBD by the team**. Add rows here as tasks are written.

| Pillar | Simple | Medium | Hard |
| --- | --- | --- | --- |
| Budget | TBD | TBD | TBD |
| Save | TBD | TBD | TBD |
| Invest | TBD | TBD | TBD |
| Safety | TBD | TBD | TBD |

### The money-battle screen (every task)

Use the Pokémon battle layout as a template, drawn in our own pixel art:

| Battle element | Ours |
| --- | --- |
| Opponent panel + name + level | **The situation**: "SCAM CALL · MED", "FESTIVAL SALE · EASY" |
| Opponent HP bar | **Pressure / temptation bar**: drops as the student makes good moves |
| Your panel + HP | **Wallet** and **happiness** bars, current stage |
| Text box | What's happening, in 1–2 lines |
| Move menu (4 options) | **2–4 choices** |
| "It's super effective!" | **Lesson line** after the choice, naming the concept |

A multi-turn task is a battle of 2–3 turns: e.g. the scammer pushes harder after your first reply.

## How teaching works

The game teaches **after** the choice, never before. No lecture first: the student acts, sees what happened, then gets the lesson while it stings. That's the brief's "Make choices. See consequences. Try again."

### The loop (every mission and side quest)

1. **Situation.** A short scene at a place in town, in the persona's version.
2. **Choice.** 2–4 options, each with a picture and audio.
3. **Consequence.** The meters change right away. Some effects are also scheduled for later (see delayed consequences).
4. **Lesson card.** 1–2 lines from the guide aunty that name the concept ("That's called compounding").
   - Good choice: why it worked.
   - Weak choice: what happened, why, and what else you could have done.
5. **Mistake bank.** A weak choice puts that concept in your bank.
6. **Prove it.** The concept comes back later in disguise. Get it right and it leaves the bank with a "learned" badge.

**Money comes from life.** Allowance, scholarship and wages are the income; tasks never pay you, because "do quests, get rich" isn't how money works. The one exception is mini-games (below). Progress shows as pillar levels and "learned" badges.

### Detours vs restarts (your sketch)

- **Weak but survivable choice → detour.** You leave the blue path for 1–2 black consequence nodes, deal with the fallout, then rejoin. Detours cost money, happiness and time, and feed the mistake bank.
- **Critical failure → restart the mission.** Three triggers: falling for a scam, your wallet hitting ₹0 before month-end, happiness hitting 0. The lesson card shows first, then the mission starts over.
- **All good choices = the blue path**, the shortest route. The end report counts your detours.

### Delayed consequences, explained

Some choices don't hit right away; they come back chapters later. Real money works like this: an EMI feels free today and bites every month after. Examples:

- Lend a friend ₹500 in chapter 2 → in chapter 4 he hasn't paid you back and asks again.
- Take the "no-cost EMI" phone in chapter 5 → a payment comes out at the start of every later chapter.
- Skip saving in chapter 1 → in chapter 4 the emergency hits and there's no buffer.

How to build it: a choice can set a **flag** and **schedule** an event. At the start of each chapter, the game checks the schedule and fires anything that's due.

```json
{"label": "Lend him ₹500", "effects": {"wallet": -500},
 "set_flag": "lent_friend",
 "schedule": {"event": "friend_asks_again", "in_chapters": 2}}
```

### The mistake bank, explained

The mistake bank is a list in the player's save data of concepts they got wrong. Each concept is a tag on the task, e.g. "needs vs wants" or "spot fake payments". It does three jobs:

1. **Picks side quests.** Random side quests come from the persona's pool, but banked concepts get extra weight. You keep meeting what you got wrong, each time in a new disguise.
2. **Fills detours.** Detour nodes are drawn from the banked concepts.
3. **Feeds the end report** with "mistakes you fixed."

Lifecycle: wrong → into the bank + lesson card → later meets it in disguise → right: out of the bank + "learned" badge; wrong again: stays in, and hints turn on next time.

Traced: Ravi accepts a fake payment screenshot in chapter 2 → "spot fake payments" goes in his bank. In chapter 4, a side quest sends a "refund" collect request to his phone. He declines it, so the concept is cleared and he gets the badge.

### Mini-games

- They pop up **at random** between tasks, are **skippable**, and **reward** the player in-game when played well.
- **Locked** while any status bar is below its threshold, e.g. after a run of bad choices. Getting stable again is the way to unlock them.
- **Open:** what the reward is. Suggestion: frame it as a side gig that pays (a kirana rush hour), or as a happiness boost. That way "money comes from work" still holds.

### Info button

Always on screen. Tapping it shows the status at that moment:

- wallet, savings jars, happiness, current stage
- active commitments (EMIs, money lent out)
- concepts in the mistake bank
- mini-game lock status

### Replay library

Each pillar has short, abstract explainer animations: moving shapes and text, no voice needed. Every completed task unlocks its animation in a library, where the student can re-watch it anytime.

## NCFE scoring (measurement only)

NCFE is the **scoring lens**, not the task list. Tasks are our own. Each task is tagged with the NCFE items it gives evidence for, and the end report adds them up. NCFE's [2019 survey](https://ncfe.org.in/wp-content/uploads/2023/12/ExecSumm_.pdf) found **27% of adults (18–80) financially literate**: at least 6/8 knowledge, 6/9 behaviour and 3/5 attitude.

The 20 items, for tagging tasks:

- **Knowledge (8):** division, time value of money, interest on a loan, simple interest, compound interest, inflation, risk vs return, diversification.
- **Behaviour (9):** keeps a budget, takes responsibility for money, meets a major expense without borrowing, saves actively, compares options before choosing, sets long-term goals, keeps watch on finances, pays bills on time, considers affordability.
- **Attitude (3):** "I live for today", "spending is more satisfying than saving", "money is there to be spent". These are scored from spend-now vs plan-ahead choices.

### How the score is computed

- **Knowledge item** = 1 if answered right in the game (0 otherwise).
- **Behaviour item** = 1 if the student shows the behaviour in most of its situations.
- **Attitude statement** = share of future-minded choices, mapped to 1–5: under 20% → 1, 20–39% → 2, 40–59% → 3, 60–79% → 4, 80%+ → 5. The attitude score is the average of the 3.
- **"Literate by NCFE's yardstick"** = knowledge ≥ 6 AND behaviour ≥ 6 AND attitude ≥ 3.
- The items at 0 are exactly what the mistake bank holds, so this score is also what steers the side quests.

### Where to put the most effort

Your teammate's item-level numbers (from the full NCFE report; only the summary was checked) show where Indian adults do worst. When writing tasks, make sure these are covered well:

| Weak spot | % of adults who get it right / do it |
| --- | --- |
| Compound interest | 6 |
| Compares options before choosing | 9 |
| Meets a major expense without borrowing | 45 |
| Time value of money | 46 |

### Three caveats to say out loud

1. **Scams aren't in NCFE's 20 items.** The Safety pillar gets its own score: scams spotted out of scams faced.
2. **In-game behaviour is a stand-in for real behaviour.** Call it an "NCFE-aligned in-game score," never a certification.
3. **NCFE surveyed adults.** Comparing teens to the 27% is a reference point, not a like-for-like benchmark.

## Investing chapter

Investing unlocks after one task each from Budget, Save and Safety, and grows across stages 2 and 3, once there's a salary to invest. It uses only what the student has saved, and only **made-up assets, never a stock market**: no real company names, no tickers, nothing recommended.

| Made-up asset | Behaves like | Teaches |
| --- | --- | --- |
| Cash box at home | Earns nothing; inflation eats it | Inflation, time value |
| Banyan Savings | Grows slowly and steadily | Compounding (the Pillalamarri banyan) |
| Chai Stall Fund | Medium swings | Risk vs return |
| Mango Orchard Co. | Big swings: great years and bad years | Risk vs return, diversification |

- **Stage jumps show compounding.** Money put into Banyan Savings in stage 2 has visibly grown when stage 3 starts.
- **Diversification task:** spread money across assets, then random events hit (rain, heat, a bad harvest). Putting everything in one place loses in some years.
- **Epilogue at \~55–60:** what each asset became, next to the path where they didn't invest.
- **Every projected number** carries the line: *"Assumes X% a year. Real returns change and can be negative. Simulations are assumptions, not promises."*

## World, HUD and end report

### The town

The town is made-up, with a layout that ignores real geography, but it's built from real Hyderabad landmarks. Tap a place, the avatar walks there, and the student walks freely only inside small areas.

| Place | Role in the game |
| --- | --- |
| Home (different for each persona) | Chapter start: income arrives, plan the month |
| Government junior college + canteen | Friends, peer pressure, scholarship notices |
| Charminar + Laad Bazaar | Festival shopping, the M8 stall |
| Durgam Cheruvu (cable bridge, lake) | Hangouts, birthday plans, spending pressure |
| Gachibowli towers | "Part-time job" scam ads; the age-27 epilogue |
| IIIT Hyderabad | Career fair: a real scholarship desk next to a fake one |
| Bank branch | Opening an account, Banyan Savings |
| Shop / kirana | Ravi's job; groceries |
| Bus stop | Bus pass due dates |
| Clinic | Emergencies |
| Mobile shop | The "no-cost EMI" offer |

### HUD (from your reference image)

| Reference | Ours |
| --- | --- |
| Hearts | **Happiness**: 3–5 hearts. Zero = restart. |
| Small item icons | **Savings jars**: one icon per named goal |
| Skill icons with L1–L3 | **Pillar badges**: Budget, Save, Invest, Safety, each L0–L2 |
| SCORE | **Wallet**: ₹ balance |

The NCFE score is **not** shown during play. A live test score makes it feel like an exam. It appears only in the end report.

### End report

- Knowledge x/8 · Behaviour y/9 · Attitude z/5 → "Literate by NCFE's yardstick: yes/no", next to the national 27%.
- Safety: scams spotted out of scams faced.
- Before vs after on the 5 quiz questions.
- Detours taken; mistakes fixed.
- The age-27 projection plus one alternate path ("if you'd saved ₹200 a month…").
- No leaderboard.

### NGO screen

This is a separate page for facilitators. It covers the "NGO-integrated" success measure.

- **Batch join code.** Students enter it instead of a phone or email.
- **Per-batch numbers.** Students joined, chapters finished, average before/after score, % literate by NCFE's yardstick.
- **Common mistakes.** The concepts most often sitting in the batch's mistake banks.
- **Privacy.** Nicknames only. Vanguard sees totals, never individual students.

For the hackathon, a mock with sample data is enough.

## Tech and art

Build **one generic event screen** and feed it everything else as data. That's the only way 24 versions fit into 24 hours.

### Stack

- **Phaser 3** in the phone browser; no install.
- **Save data in the browser** (localStorage, the browser's built-in storage). The NGO screen is a mock for the demo.
- **Data files**, editable by non-coders:
  - `personas.json`: the 3 personas.
  - `missions.json`: 8 missions × 3 versions.
  - `events.json`: the side-quest pool, tagged by persona and concept.
  - `strings/en.json`, `strings/te.json`: one file per language. Adding a language means adding one file.

### Scenes to build

1. Title + language + avatar
2. Quiz
3. Persona card + festival pick
4. Chapter map (the node path)
5. Town map: tap a place, walk there
6. **Event screen**: portrait, text, 2–4 choices, then effects + lesson card. Every mission and side quest runs on this one screen.
7. HUD overlay
8. End report
9. NGO screen (mock)

### One mission choice, as data

```json
{"mission": "M3", "persona": "scholarship", "place": "college",
 "text": "A caller says he's from ePASS. Pay ₹500 now or your allowance is cancelled.",
 "choices": [
  {"label": "Pay ₹500 by UPI", "effects": {"wallet": -500}, "outcome": "restart",
   "ncfe": {"risk_return": 0}, "bank": "spot_fake_officials",
   "lesson": "Real scholarships never ask you to pay to receive money."},
  {"label": "Hang up, check on the official portal", "outcome": "next",
   "safety": "+1", "lesson": "Always verify on the official site yourself."}]}
```

### Game state (one object, saved after every choice)

- **Who:** persona, festival, language
- **Where:** chapter, node on the map
- **Money and mood:** wallet, jars, happiness
- **Memory:** flags, schedule (the delayed consequences), mistake bank
- **Scores:** NCFE values (8 knowledge, 9 behaviour, 3 attitude), safety score, quiz before/after, detours

### Art (nobody draws, so don't)

- **Town + characters:** Kenney's free packs [Tiny Town](https://kenney.nl/assets/tiny-town) (130 tiles) and [RPG Urban Pack](https://kenney.nl/assets/rpg-urban-pack) (480 assets, city + characters). Both are 16×16 pixels and CC0 (free to use, no credit required).
- **The 4 landmarks** (Charminar, cable bridge, a Gachibowli tower, IIIT gate): trace simple silhouettes in [Piskel](https://www.piskelapp.com/), a free pixel editor that runs in the browser. Four shapes at 32×32 is about 30 minutes each.
- **Until 4 am:** coloured boxes with labels. Swap in art afterwards.
- **Don't use** ripped Pokémon sprites. Check the Druid Story pack's license before using any of it.

## 24-hour build plan

The engine first, then content, then polish. This plan assumes 4 people (engine, content, art/UI, pitch + NGO screen) and a final deadline around 24 hours after the start. Adjust once you confirm both.

### By 10 pm (mid-submission 1)

- [ ] Submit this doc + the chapter map as the concept
- [ ] Phaser project runs: title → quiz → persona card → chapter map (placeholder boxes)
- [ ] Event screen v0 plays M1 for one persona
- [ ] Team finalises the 3 persona descriptions

### By 4 am (mid-submission 2)

- [ ] Event screen v1: effects, lesson card, detour and restart routing
- [ ] Game state + saving; HUD (wallet, jars, hearts, pillar badges)
- [ ] Chapters 1–2 (M1–M4) written for all 3 personas = 12 versions
- [ ] Town map with tap-to-walk; Kenney tiles in
- [ ] Mistake bank v1 + 4–6 side quests
- [ ] Delayed consequences (flags + schedule)

### By final submission

- [ ] Chapters 3–6 (M5–M8) = the other 12 versions; investing time-skip
- [ ] End report with the NCFE score + before/after
- [ ] Telugu text for the quiz, persona card and one mission
- [ ] NGO screen mock
- [ ] Landmark sprites
- [ ] Pitch deck + a 2-minute demo video that shows one mission in all 3 versions

**Cut list if behind, in this order:**

1. Walk animation (switch to instant travel)
2. Telugu beyond the quiz
3. M8 (describe it in the pitch instead)
4. NGO screen (make it a slide instead)

## Open questions

- [ ] When did the hackathon start and when is the final submission? What's expected at 10 pm and 4 am: a concept, working code, or a video?
- [ ] How many people, and who codes?
- [ ] Keep "Paisa Path" as the name?
- [ ] Is Telugu the second language for the demo?
- [ ] Real amounts: within 24 hours, use public prices + labelled team estimates, and pitch a 10-student check as the next step. OK?
- [ ] Does the NGO screen need to work in the demo, or is a slide enough?
- [ ] Playthrough length: is \~30 minutes right for an NGO session?

## Sources

- [NCFE-FLIS 2019 executive summary](https://ncfe.org.in/wp-content/uploads/2023/12/ExecSumm_.pdf): 27% literate, pass marks, ages 18–80, component pass rates. Item-level figures come from your teammate's notes on the [full report](https://ncfe.org.in/wp-content/uploads/2023/12/NCFE-2019_Final_Report.pdf) and weren't re-checked.
- [Kenney — Tiny Town](https://kenney.nl/assets/tiny-town) · [Kenney — RPG Urban Pack](https://kenney.nl/assets/rpg-urban-pack)
- [Piskel](https://www.piskelapp.com/)
- Research on existing games, the TS ePASS scholarship, the Pillalamarri banyan and Charminar analogies: [Financial Literacy Games — Landscape & Notes](https://claude.ai/code/artifact/6c229214-625a-4682-b983-5e2808b159ee)
