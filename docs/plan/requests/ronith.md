# Inbox — Ronith

Owner of: src/game, public/assets.
Others: **append** a request block at the bottom (format in `README.md`).
Ronith: change `Status:` lines only; never delete blocks.

| Status | Meaning |
|---|---|
| OPEN | not started |
| DOING | in progress |
| DONE HH:MM sha | merged to main |
| DECLINED reason | won't do — reason given |

---

### R-monish-01 · Commit author must be your name
- From: monish · To: ronith · At: 00:35 · Priority: P0
- Status: OPEN
- What: your 9 commits on main are authored "Claude". In your clone / session: `git config user.name "Ronith Menneni" && git config user.email "<your github email>"`. Add that line to your session prompt so cloud sessions do it too.
- Why: hackathon rule — incremental history with the team members' names; the organisers may live-question it.
- Accept when: your next commit on main shows your name in `git log`.

### R-monish-02 · Wire the end-report buttons to session
- From: monish · To: ronith · At: 00:35 · Priority: P1
- Status: OPEN
- What: in `EndReportScene`: "Download report" → `const { pdfBlob } = await session.sendReport({ facilitatorEmail: '' })` is NOT the way — call `buildReportPdf` via `session.sendReport` only when emailing. For download-only use `downloadBlob(blob, 'report.pdf')` from `@/app/session` after building the PDF through `session.sendReport` with the facilitator email typed; if the facilitator field is empty, still build and download (sendReport returns `pdfBlob` even when the POST fails). Show `previewUrl` as a tappable link when non-null, and "Saved locally (offline)" when null. "Facilitator view" button → `window.open('./ngo/index.html')`.
- Why: the demo path step 9 (README §8).
- Accept when: with `npm run server` running, tapping "Email facilitator" shows a preview URL (or "Saved locally" when the sandbox blocks Ethereal).
