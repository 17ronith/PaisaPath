#!/usr/bin/env bash
# Team status at a glance: who pushed what, open PRs, CI, and checklist progress.
# Usage: ./scripts/status.sh        (needs: git, gh — gh optional)
set -euo pipefail
cd "$(dirname "$0")/.."
git fetch --all --prune --quiet

echo "== main =="
git log origin/main --oneline -5 --format='  %h %<(14)%an %<(60,trunc)%s %cr'

echo; echo "== branches (unmerged into main) =="
for b in $(git branch -r --no-merged origin/main | grep -v HEAD | sed 's|origin/||'); do
  # skip branches already on main by patch-id (rebase-merged → new SHAs), ignoring checklist-tick commits
  unapplied=$(git cherry origin/main origin/$b 2>/dev/null | awk '/^\+/{print $2}')
  real=0
  for c in $unapplied; do
    if git diff-tree --no-commit-id --name-only -r "$c" | grep -qv '^docs/plan/'; then real=1; break; fi
  done
  [ "$real" = "0" ] && continue
  ahead=$(git rev-list --count origin/main..origin/$b)
  last=$(git log -1 --format='%an · %cr · %s' origin/$b)
  printf '  %-28s +%-3s %s\n' "$b" "$ahead" "$last"
done

echo; echo "== checklists (docs/plan/<name>.md on main) =="
for p in monish ronith saharsh aakarsh; do
  f=$(git show origin/main:docs/plan/$p.md 2>/dev/null || true)
  done_n=$(printf '%s' "$f" | grep -c '^- \[x\]' || true)
  todo_n=$(printf '%s' "$f" | grep -c '^- \[ \]' || true)
  next=$(printf '%s' "$f" | grep -m1 '^- \[ \]' | cut -c7-80)
  printf '  %-8s %2s done / %2s open   next: %s\n' "$p" "$done_n" "$todo_n" "$next"
done

echo; echo "== open requests (docs/plan/requests) =="
for p in monish ronith saharsh aakarsh; do
  f=$(git show origin/main:docs/plan/requests/$p.md 2>/dev/null || true)
  o=$(printf '%s' "$f" | grep -c "^- Status: OPEN" || true)
  d=$(printf '%s' "$f" | grep -c "^- Status: DOING" || true)
  p0=$(printf '%s' "$f" | grep -B2 "^- Status: OPEN" | grep -c "Priority: P0" || true)
  printf '  %-8s open %-2s doing %-2s  (P0 open: %s)\n' "$p" "$o" "$d" "$p0"
done

REPO=$(git remote get-url origin | sed -E "s|.*github.com[:/]||; s|\.git$||")
if command -v gh >/dev/null 2>&1; then
  echo; echo "== open PRs =="
  gh api "repos/$REPO/pulls?state=open" -q '.[] | "  #\(.number) \(.title[0:60]) (\(.user.login) · \(.head.ref))"' 2>/dev/null || echo "  (gh not authenticated)"
  echo; echo "== last CI runs on main =="
  gh run list -R "$REPO" --branch main --limit 4 2>/dev/null || true
fi
