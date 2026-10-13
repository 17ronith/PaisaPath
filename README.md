<div align="center">

<img src="public/icons/icon-512.png" alt="PaisaPath — the Professor" width="128" />

# ₹ PaisaPath

**Learn money by living it.**<br/>
A pixel-art life-sim where every money decision is a battle — and every mistake comes back for a rematch.

<p>
  <a href="https://paisapath.r17.workers.dev/"><img alt="Play now" src="https://img.shields.io/badge/▶_Play_now-paisapath.r17.workers.dev-f2a541?style=for-the-badge&labelColor=1f2a1e" /></a>
</p>

<p>
  <img alt="Phaser 3" src="https://img.shields.io/badge/Phaser-3.90-8a5cf6?style=flat-square" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript&logoColor=white" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8-646cff?style=flat-square&logo=vite&logoColor=white" />
  <img alt="PWA" src="https://img.shields.io/badge/PWA-works_offline-5cc87a?style=flat-square&logo=pwa&logoColor=white" />
  <img alt="Languages" src="https://img.shields.io/badge/languages-English_·_తెలుగు_·_हिन्दी-9fd3c7?style=flat-square" />
  <img alt="Tests" src="https://img.shields.io/badge/tests-154_passing-48b048?style=flat-square&logo=vitest&logoColor=white" />
  <a href="LICENSE"><img alt="MIT License" src="https://img.shields.io/badge/license-MIT-f2a541?style=flat-square" /></a>
</p>

<p>
  <a href="#-screenshots">Screenshots</a> •
  <a href="#-features">Features</a> •
  <a href="#-how-it-plays">How it plays</a> •
  <a href="#-quick-start">Quick start</a> •
  <a href="#️-tech-stack">Tech stack</a> •
  <a href="#-team">Team</a>
</p>

<sub>Built at <b>Megathon X</b> (E-Cell, IIIT Hyderabad) · Team 97 · Problem statement by Vanguard</sub>

</div>

---

## 📸 Screenshots

<div align="center">
<table>
  <tr>
    <td align="center"><img src="deliverables/src/shots/battle.png" width="160" alt="Money battle" /><br/><sub><b>Money battles</b></sub></td>
    <td align="center"><img src="deliverables/src/shots/scamcall.png" width="160" alt="Scam call" /><br/><sub><b>Scam calls</b></sub></td>
    <td align="center"><img src="deliverables/src/shots/market.png" width="160" alt="Charminar market" /><br/><sub><b>Charminar Market</b></sub></td>
    <td align="center"><img src="deliverables/src/shots/turf.png" width="160" alt="Turf cricket" /><br/><sub><b>Turf cricket</b></sub></td>
    <td align="center"><img src="deliverables/src/shots/report.png" width="160" alt="Progress report" /><br/><sub><b>Progress report</b></sub></td>
  </tr>
</table>
</div>

## ✨ Features

PaisaPath teaches financial literacy to Grade 11–12 students in Hyderabad. You live a compressed life, from Intermediate student to first salary to earning more, and every money task is a turn-based battle on a living map of the city.

<table>
  <tr>
    <td width="50%" valign="top">
      <h4>⚔️ Money battles</h4>
      Every decision (budgeting, saving, borrowing, investing) plays out as a Pokémon-style battle. The lesson comes <i>after</i> the choice, as a short animation.
    </td>
    <td width="50%" valign="top">
      <h4>🔁 Mistake bank</h4>
      Wrong answers are remembered and come back later in disguise, so a concept is learned rather than guessed.
    </td>
  </tr>
  <tr>
    <td valign="top">
      <h4>📞 Real-feeling scam calls</h4>
      KYC, lottery and scholarship scams ring like a real phone call, and you decide whether to pick up.
    </td>
    <td valign="top">
      <h4>📈 Charminar Market</h4>
      A stock-market minigame with four made-up companies: a practice round first, then your own savings.
    </td>
  </tr>
  <tr>
    <td valign="top">
      <h4>🗣️ Three languages, fully voiced</h4>
      English, Telugu and Hindi, switchable on the title screen, with 400+ voice-over clips.
    </td>
    <td valign="top">
      <h4>🔮 “What if?” replay</h4>
      At the end, your biggest mistake is replayed with the other choice, so you see what it would have changed.
    </td>
  </tr>
  <tr>
    <td valign="top">
      <h4>📄 Facilitator report</h4>
      A PDF progress report with before/after quiz scores, sent to the NGO facilitator (guardian CC'd) or downloaded offline.
    </td>
    <td valign="top">
      <h4>📱 Works offline</h4>
      An installable PWA for phones, tablets and desktops that keeps working with no signal.
    </td>
  </tr>
</table>

### The four pillars

| | Pillar | In the game |
|:-:|---|---|
| 🧾 | **Plan & budget** | Pocket money, first salary, rent and EMIs |
| 🏦 | **Save & manage** | An emergency buffer, impulse buys vs. happiness |
| 🌱 | **Understand investing** | Compounding, SIPs, risk, and the Charminar Market |
| 🛡️ | **Stay financially safe** | Scam calls, UPI fraud, loan apps, and when to say no |

## 🎮 How it plays

```mermaid
flowchart LR
    A([Onboarding<br/>life questions + quiz]) --> B[Stage 1<br/>Intermediate student]
    B --> C[Stage 2<br/>First salary]
    C --> D[Stage 3<br/>Earning more]
    D --> E([Epilogue<br/>age 55–60])
    E --> F[What-if replay]
    F --> G([Quiz again +<br/>progress report])
    B & C & D -. mistakes .-> M[(Mistake bank)]
    M -. come back in disguise .-> B & C & D
```

Two bars follow you all game: **wallet** and **happiness**. An impulse buy makes you happy now, and being too broke for plans with friends later makes you unhappy.

## 🚀 Quick start

> **Prerequisites:** Node.js 20+ and npm, plus a modern browser (Chrome recommended). The layout adapts to phones, tablets and desktop.

```bash
# 1. Install
npm install
cd server && npm install && cd ..

# 2. Run
npm run dev          # game at http://localhost:5173 (also on your LAN IP, for phones)
npm run server       # optional: report e-mail service at http://localhost:8787
```

<details>
<summary><b>All scripts</b></summary>
<br/>

| Command | What it does |
|---|---|
| `npm run dev` | Start the game with hot reload |
| `npm run build` | Production build → `dist/` (PWA, offline-capable) |
| `npm run preview` | Serve the production build |
| `npm test` | Engine unit tests (Vitest) |
| `npm run validate:content` | Check every task, string and asset reference |
| `npm run check` | Type check + lint + tests + content validation |
| `npm run server` | Report e-mail service (needs `SMTP_*` env vars to send) |

</details>

<details>
<summary><b>Deploying</b></summary>
<br/>

The game is a static site, so any static host works. The live build runs on Cloudflare Workers:

- **Build command:** `npm run build`
- **Deploy command:** `npx wrangler deploy --assets=./dist --name paisapath --compatibility-date 2026-10-01`

Without the report server, the end-of-game report falls back to a PDF download. To e-mail it instead, host `server/` on any Node host and build with `VITE_REPORT_SERVICE_URL` pointing at it.

</details>

## 🛠️ Tech stack

<p>
  <img alt="Phaser" src="https://img.shields.io/badge/Phaser_3-game_engine-8a5cf6?style=for-the-badge" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178c6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-646cff?style=for-the-badge&logo=vite&logoColor=white" />
  <img alt="Vitest" src="https://img.shields.io/badge/Vitest-6e9f18?style=for-the-badge&logo=vitest&logoColor=white" />
  <img alt="Zod" src="https://img.shields.io/badge/Zod-3e67b1?style=for-the-badge&logo=zod&logoColor=white" />
  <img alt="Express" src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img alt="Cloudflare" src="https://img.shields.io/badge/Cloudflare-f38020?style=for-the-badge&logo=cloudflare&logoColor=white" />
</p>

```
src/
├── engine/      # game rules: wallet, happiness, scoring (unit-tested)
├── game/        # Phaser scenes, UI, music and voice
├── content/     # tasks, explainers and strings in EN / TE / HI, validated with Zod
├── minigames/   # turf cricket and other side games
├── app/         # boot, session, save data, PDF report
└── shared/      # types and i18n
server/          # optional Express service that e-mails the report
public/          # sprites, Hyderabad backdrops, fonts, music, voice-over
```

## 👥 Team

<div align="center">
<table>
  <tr>
    <td align="center"><a href="https://github.com/17ronith"><img src="https://github.com/17ronith.png?size=120" width="80" alt="Ronith Menneni" /><br/><sub><b>Ronith Menneni</b></sub></a></td>
    <td align="center"><a href="https://github.com/Aakarsh1402"><img src="https://github.com/Aakarsh1402.png?size=120" width="80" alt="Aakarsh Mishra" /><br/><sub><b>Aakarsh Mishra</b></sub></a></td>
    <td align="center"><a href="https://github.com/monishram2508"><img src="https://github.com/monishram2508.png?size=120" width="80" alt="Monishram Selvaraj" /><br/><sub><b>Monishram Selvaraj</b></sub></a></td>
    <td align="center"><a href="https://github.com/Saha264"><img src="https://github.com/Saha264.png?size=120" width="80" alt="Kallu Saharsh Reddy" /><br/><sub><b>Kallu Saharsh Reddy</b></sub></a></td>
  </tr>
</table>

<sub>Original repository: <a href="https://github.com/IIIT-ECell/megathon26-mars">IIIT-ECell/megathon26-mars</a></sub>
</div>

## 🙏 Credits

<details>
<summary><b>Third-party assets and libraries</b></summary>
<br/>

- [Phaser 3](https://phaser.io/): MIT
- **Client libraries:** [zod](https://zod.dev/) (MIT), [jsPDF](https://github.com/parallax/jsPDF) (MIT), [idb-keyval](https://github.com/jakearchibald/idb-keyval) (Apache-2.0). **Report service:** [Express](https://expressjs.com/) (MIT), [cors](https://github.com/expressjs/cors) (MIT), [Nodemailer](https://nodemailer.com/) (MIT-0). **Tooling:** Vite, vite-plugin-pwa, Vitest, TypeScript, ESLint, Prettier, tsx (MIT / Apache-2.0)
- [Kenney Tiny Town](https://kenney.nl/assets/tiny-town), [RPG Urban Pack](https://kenney.nl/assets/rpg-urban-pack), [Tiny Dungeon](https://kenney.nl/assets/tiny-dungeon) and [Pixel UI Pack](https://kenney.nl/assets/pixel-ui-pack): CC0, under `public/assets/kenney/` with their licence files
- Fonts under `public/assets/fonts/` (Press Start 2P, Jersey 10): SIL Open Font License, licence files alongside
- Voice-over clips (`public/assets/voice/`): generated offline with [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) (Apache-2.0); see `src/content/voice/README.md`
- Map in the report and slides (`deliverables/src/shots/real_map.jpg`): © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors (ODbL)
- Hyderabad battle backdrops (`public/assets/backdrops/`) and Charminar Market art (`public/assets/market/`): original pixel art by the team, generated with the scripts in `team97_vanguard_context/08_hyderabad_backgrounds/source/`

</details>

**External resources:** none. All content and assets are in this repository.

## 📜 License

Released under the [MIT License](LICENSE).

<div align="center">
<br/>
<sub>Made with ❤️ and a lot of chai in Hyderabad</sub>
</div>
