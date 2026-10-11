# Learning Money by Living It

Megathon X — Team 97

## Prerequisites

- Node.js 20+ and npm
- A modern browser (Chrome recommended; use device mode at 360×640 for the phone layout)

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
- [Kenney Tiny Town](https://kenney.nl/assets/tiny-town) and [Kenney RPG Urban Pack](https://kenney.nl/assets/rpg-urban-pack) — CC0 (when used, under `public/assets/kenney/`)
- Fonts under `public/assets/fonts/` carry their own licence files
- Hyderabad battle backdrops (`public/assets/backdrops/`) and Charminar Market art (`public/assets/market/`) — original pixel art by the team, generated with the scripts in `team97_vanguard_context/08_hyderabad_backgrounds/source/`

## License

[MIT](LICENSE)
