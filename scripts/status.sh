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

if command -v gh >/dev/null 2>&1; then
  echo; echo "== open PRs =="
  gh pr list --limit 20 --json number,title,author,headRefName,statusCheckRollup \
    --template '{{range .}}  #{{.number}} {{.title}} ({{.author.login}} · {{.headRefName}}){{"\n"}}{{end}}' 2>/dev/null || echo "  (gh not authenticated)"
  echo; echo "== last CI runs on main =="
  gh run list --branch main --limit 3 2>/dev/null || true
fi
