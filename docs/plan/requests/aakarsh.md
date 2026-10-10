# Inbox — Aakarsh

Owner of: src/content.
Others: **append** a request block at the bottom (format in `README.md`).
Aakarsh: change `Status:` lines only; never delete blocks.

| Status | Meaning |
|---|---|
| OPEN | not started |
| DOING | in progress |
| DONE HH:MM sha | merged to main |
| DECLINED reason | won't do — reason given |

---

### R-monish-03 · Balance pass with Saharsh (sim numbers attached)
- From: monish · To: aakarsh · At: 00:35 · Priority: P2
- Status: DONE 01:00 68e654a (PR #16)
- What: see `saharsh.md` R-monish-01/02. Run `npm run sim -- --content --trace` and read the per-chapter trace for `worst medium`: happiness bottoms at 14 — confirm that feels right, and make at least one Stage 2–3 trap expensive enough that a careless player can go broke once.
- Why: the sim is our M2 "experiment"; numbers should match the story we tell.
- Accept when: you and Saharsh both mark DONE with the new `npm run sim -- --content` table pasted in your `Done:` note.
- Done: (00:49) Happiness: `worst medium` bottoming at ~14 (9 after this change) feels right: a careless player ends miserable but the game stays finishable, and only scams / critical choices restart. Broke: the engine only restarts when a choice *spends* into < 0, so going broke has to come from a delayed bill. `save_medium_s3_01` › `self_insure` ("MY BUFFER IS ENOUGH") now brings the ₹2 lakh hospital stay its framing already warns about, one chapter later (−₹2,00,000, happiness −15). Careful players never hit it; careless ones go broke for about one chapter and recover. `npm run sim -- --content` after the change:
  ```
  policy  difficulty   wallet  savings    happy  minHappy  portfolio  detours restarts  broke  literate%  done%
  good    simple    234852.1 48645.5    98.4    66.9  197072.4       0       0       0      30     100
  good    medium    251095.1 39556.9    98.1    66.5    176934       0       0       0      80     100
  good    hard      242283.9 43880.6    97.9    65.7  126209.9       0       0       0      20     100
  random  simple    191458.9 35521.7    64.1    50.7  131120.3       1     0.7     0.1       0     100
  random  medium    162813.8 31378.5      45    35.9  123360.9     1.3     1.2     0.3       0     100
  random  hard      203236.8 28780.9    34.1    25.2   90354.2     1.6       1     0.1       0     100
  worst   simple    154295.7   14700    34.7    32.3         0     2.4     2.2     0.2       0     100
  worst   medium     75146.7   19185    12.8     9.1         0     3.9     2.9     0.7       0     100
  worst   hard       27744.2   17575     6.8     3.8         0       3       4     0.9       0     100
  ```
  `good` is unchanged and `broke` is now > 0 for `random` and `worst`. Saharsh: see R-aakarsh-01 in your inbox.

### R-monish-04 · Delete your 14 stale branches
- From: monish · To: aakarsh · At: 01:20 · Priority: P2
- Status: DONE 01:47 (all 15 stale branches deleted on the web; this session can't delete branches, so the merged `aakarsh/*` PR branches are deleted from each PR page after merging)
- What: `aakarsh/content-s1`, `aakarsh/content-s23` and `aakarsh/b1-…b12-…` are all on `main` already (rebase-merged; GitHub shows them "unmerged" because the SHAs changed). Delete them: `git push origin --delete aakarsh/content-s1 aakarsh/content-s23 aakarsh/b1-validator … aakarsh/b12-te-content` (or the trash icon on the Branches page). Keep only the branch you are actively working on.
- Why: `./scripts/status.sh` and the Branches page are unreadable with 16 dead branches; at 10:15 I need to see at a glance what is unmerged.
- Accept when: `git branch -r | grep aakarsh` shows ≤ 1 branch.

### R-saharsh-01 · More weak choices should lead to a detour
- From: saharsh · To: aakarsh · At: 01:05 · Priority: P2
- Status: DONE 01:47 60ca4ec (PRs #20 + #21, approved by all 3)
- What: add `detourTaskId` to more `weak` choices in `tasks/stage1-3.json` (and new short detours if a stage runs out). Right now 11 of 31 weak choices on main tasks have one, so a random player detours ~0.13× per task.
- Why: balance target "random player detours 2–4 times"; `npm run sim -- --content` shows 1.0 / 1.3 / 1.6 detours (simple/medium/hard) and is the only FAIL left in the targets block.
- Accept when: `npm run sim -- --content` prints PASS for the three `random` rows (≈ 20+ of the 31 weak choices linked should do it).
- Done: (01:26) 30 of 31 weak main-task choices now lead to a detour. The one left is `save_medium_s3_01` › `self_insure`, which already brings the delayed ₹2 lakh hospital bill. Added 13 short detours that continue each mistake's story (8 for Stage 1, 5 for Stages 2–3) and reused `detour_broke_by_week3`. Random players now detour 3.5 / 2.8 / 3.4 times; `good` is unchanged; all 9 balance targets PASS. `npm run sim -- --content`:
  ```
  policy  difficulty   wallet  savings    happy  minHappy  portfolio  detours restarts  broke  literate%  done%
  good    simple    234852.1 48645.5    98.4    66.9  197072.4       0       0       0     100     100
  good    medium    251095.1 39556.9    98.1    66.5    176934       0       0       0     100     100
  good    hard      242283.9 43880.6    97.9    65.7  126209.9       0       0       0     100     100
  random  simple    180694.2 38817.2    57.8    45.9  169694.5     3.5     0.6     0.1       5     100
  random  medium    155341.3 34508.7    44.6      37  110006.2     2.8     1.1     0.2       5     100
  random  hard      179242.6 34696.3    32.6    24.5  105135.6     3.4     0.8     0.2       5     100
  worst   simple    143058.1   14580    39.2      37         0     7.6     2.2     0.2       0     100
  worst   medium     13598.1   19040    12.3     7.7         0     6.7     3.6     1.2       0     100
  worst   hard         23438   17695     6.7     3.5         0     6.1     4.4     0.9       0     100
  ```
