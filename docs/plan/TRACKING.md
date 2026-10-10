# Keeping track of each other (without meetings)

Four people, four sessions, one repo. You never need to ask "what are you
on?" — the repo answers.

## 1. The 10-second check: `./scripts/status.sh`

Run it from any clone. It prints: last commits on `main`, every unmerged
branch with how far ahead it is and its last commit, each person's checklist
progress (`done / open` + their *next* unchecked box), open PRs and CI status
(if `gh auth login` is done).

```bash
./scripts/status.sh
```

Run it before every integration call and whenever you feel out of the loop.

## 2. Checklists are the status board

Each `docs/plan/<name>.md` is the owner's live task list. **Tick boxes as
you finish** (`- [ ]` → `- [x]`) and commit them with your work. The
Claude Code prompt in README §5 tells each session to do exactly this. A
checklist with no ticks for 90 minutes = someone's blocked; ask.

## 3. Branches tell you what's in flight

```bash
git fetch --all
git branch -r                              # who has a branch open
git log origin/main..origin/ronith/scenes --oneline   # what's on it, not yet merged
git diff --stat origin/main...origin/saharsh/engine   # which files it touches
```

If a branch touches a directory it shouldn't, say so *before* the PR.

## 4. GitHub, in the browser

- **Pull requests** tab: what's waiting to merge, CI green or red.
- **Actions** tab: `main` must be green. Red = stop-the-line.
- **Commits on `main`**: the organisers see this exact list. Incremental, every
  hour, four names.
- Subscribe to the repo's notifications (Watch → All activity) tonight only.

## 5. Chat protocol (skimmable)

Prefix every message: `MERGED:` `BLOCKED:` `DEP:` `CONTRACT:` `CUT:` `CALL:`.
Post `MERGED: <area> — <what it does now>` every time you merge; that is the
only "standup". No prefix = social, can be ignored.

## 6. Two sync points, no more

02:45 and 07:30, 20 minutes, one laptop, playing `main`. Everything else is
async through the four channels above.

## 7. Watching a PR from a Claude Code session

In your session: "watch PR #12 and tell me when CI finishes or someone
comments" — the cloud session subscribes to the PR and wakes you. Useful for
Monish while writing M2.
