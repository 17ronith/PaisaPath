# Learning Money by Living It

Megathon X — Team 97

## Prerequisites

- Node.js 20+ and npm
- A modern browser (Chrome recommended). The layout adapts to phones, tablets and desktop.

## Setup

```bash
npm install
cd server && npm install && cd ..
```

## Run

```bash
npm run dev          # game client at http://localhost:5173 (also on your LAN IP for phones)
npm run server       # report service at http://localhost:8787
```

## Build and test

```bash
npm run build        # production build → dist/ (PWA, offline-capable)
npm run preview      # serve the production build
npm test             # engine unit tests (Vitest)
npm run validate:content
npm run check        # typecheck + lint + tests + content validation
```

## External resources

_None. All content and assets are in this repository._

## Third-party assets and libraries

- [Phaser 3](https://phaser.io/) — MIT
- Client libraries: [zod](https://zod.dev/) (MIT), [jsPDF](https://github.com/parallax/jsPDF) (MIT), [idb-keyval](https://github.com/jakearchibald/idb-keyval) (Apache-2.0); report service: [Express](https://expressjs.com/) (MIT), [cors](https://github.com/expressjs/cors) (MIT), [Nodemailer](https://nodemailer.com/) (MIT-0); tooling: Vite, vite-plugin-pwa, Vitest, TypeScript, ESLint, Prettier, tsx (MIT / Apache-2.0)
- [Kenney Tiny Town](https://kenney.nl/assets/tiny-town), [RPG Urban Pack](https://kenney.nl/assets/rpg-urban-pack), [Tiny Dungeon](https://kenney.nl/assets/tiny-dungeon) and [Pixel UI Pack](https://kenney.nl/assets/pixel-ui-pack) — CC0, under `public/assets/kenney/` with their licence files
- Fonts under `public/assets/fonts/` (Press Start 2P, Jersey 10) — SIL Open Font License, licence files alongside
- Voice-over clips (`public/assets/voice/`) — generated offline with [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) (Apache-2.0); see `src/content/voice/README.md`
- Map in the report and slides (`deliverables/src/shots/real_map.jpg`) — © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors (ODbL)
- Hyderabad battle backdrops (`public/assets/backdrops/`) and Charminar Market art (`public/assets/market/`) — original pixel art by the team, generated with the scripts in `team97_vanguard_context/08_hyderabad_backgrounds/source/`

## License

[MIT](LICENSE)
