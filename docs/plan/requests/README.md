# Requests — the cross-owner inbox

**Problem:** you own `src/engine/`; Ronith needs a field added to `Step`.
He can't edit your folder, and chat messages get lost at 3 am.

**Solution:** every person has an inbox file here. Anyone can drop a request
into anyone's inbox. **Your Claude Code session reads your inbox before every
edit** and works the open items first. Nothing crosses the ownership line;
the request does.

```
docs/plan/requests/
  README.md     ← this
  monish.md     ← requests FOR Monish  (shared types, configs, deps, server, app, deliverables)
  ronith.md     ← requests FOR Ronith  (scenes, UI, assets)
  saharsh.md    ← requests FOR Saharsh (engine, mini-games)
  aakarsh.md    ← requests FOR Aakarsh (content, strings)
```

## The two rules that keep this conflict-free

1. **Writing to someone else's inbox: append only.** Add your block at the
   very bottom. Never edit or reorder existing blocks.
2. **Your own inbox: you change status lines and add a `Done:` note.** You
   never delete blocks (history is evidence for the reports).

If git ever conflicts inside `requests/*.md`, **keep both sides** — it's just
two people appending at once.

## Request format (copy this block)

```
### R-<yourname>-<nn> · <one-line title>
- From: <you> · To: <owner> · At: <HH:MM> · Priority: P0 | P1 | P2
- Status: OPEN
- What: <exactly what to change, with file + identifier if you know it>
- Why: <the thing you are blocked on or the bug you saw>
- Accept when: <how the requester will know it's done>
```

Numbering: your name + a counter you keep (`R-ronith-01`, `R-ronith-02` …).
Priorities: **P0** = blocks the demo path or `main` is red · **P1** = blocks
my current task · **P2** = nice to have before freeze.

Owner updates `- Status:` to `DOING` → `DONE <HH:MM> <commit>` or
`DECLINED <reason>`, and may add `- Done: <note>` under the block.

## What goes where

| You need… | Put it in |
|---|---|
| a new/optional field on a shared type, a new dep, a change to root config or CI, a `session.ts` method, server behaviour, something in a PDF | `monish.md` |
| a scene to show something, a UI string key used, a layout fix, an asset | `ronith.md` |
| engine behaviour (selector, scheduler, scoring, what-if), a `Step`/`Outcome` field populated differently, a mini-game change, balance tuning | `saharsh.md` |
| a task/event/explainer added or reworded, a string key, a Telugu line, a price changed | `aakarsh.md` |

A request that needs a **contract change** (`src/shared/types.ts`) goes to
Monish; he makes the additive change and then drops a request into the
implementing owner's inbox.

## How your Claude session uses this (it's in the README §5 prompt)

1. Before starting any edit: `git pull --rebase origin main`, then read
   `docs/plan/requests/<me>.md`.
2. Any **P0 OPEN** → do it first. Then P1. P2 after your current checklist box.
3. Set `Status: DOING` when you start, `DONE <time> <short sha>` when merged.
4. When you finish and the request changed how something works, also tick or
   add a line in your own `docs/plan/<me>.md` so the checklist stays true.
5. Need something from someone else? Append a block to **their** inbox, commit
   it with prefix `req:`, push, and post `REQ: <id> → <owner>` in chat so they
   pull.

## Chat still exists

`REQ: R-ronith-03 → saharsh (P0)` in the group chat is the ping; the inbox is
the record. `MERGED:` and `BLOCKED:` stay in chat as before.
