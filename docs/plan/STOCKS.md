# Charminar Market — the stock-simulator device

Decided 06:30 (Monish + team). A separate screen the student can open **any time
after chapter 5** from a 📈 MARKET button in the HUD. Fictional companies in
recognisable everyday categories; the "stock" feel (prices move, you buy and sell
shares, decorative candlesticks) with none of the real market: no real companies,
no tickers, nothing recommended, the assumption line everywhere.

| Rule | Decision |
|---|---|
| Money | the student's **in-game savings** only; never the wallet; never real money |
| Warm-up | a **3-turn paper round** with ₹10,000 virtual, taught by the Professor; doesn't count |
| Real runs | **8 turns = 8 quarters = 2 years**; deposit from savings; at the end everything is sold back into savings (no fee on settlement) |
| Prices | seeded quarterly returns per company + three scripted beats every run: **monsoon** (turn 3, hits AutoGo), **"hot tip" forward** (turn 5, DashKart spikes), **crash** (turn 6, everything down, DashKart worst), recovery (7–8). The student's own trades never move prices |
| Fees | **₹20 per trade** (buy or sell), shown on every order |
| Happiness | a quarter where your holdings drop > 10 % costs −3; **selling during the crash quarter costs −8 more** (panic); a quarter up > 10 % gives +2 |
| Broke | impossible: you can only lose what you put in; no restart |
| Score | **behaviour only**, five checks → NCFE evidence + safety score. Money made is shown but never scored |
| Candlesticks | decorative: 8 candles per quarter interpolated from the quarter's move; green up, red down |

## The five checks (and what they feed)

| Check | Passes when | Feeds |
|---|---|---|
| Diversified | held ≥ 2 companies in at least half the quarters you were invested | `diversification` |
| Held through the crash | had holdings in the crash quarter and sold nothing that quarter | `risk_return`, `long_term_goals` |
| Refused the tip | did not net-buy the tipped company in the tip quarter | `risk_return` + safety **scam spotted** (else **fell**) |
| Low churn | ≤ 6 trades in the run (fees shown as the reason) | `considers_affordability` |
| Beat Banyan | final value ≥ deposit × 1.08² — informational, **not** a check that scores | — |

## Companies (fictional; categories everyone knows)

| Id | Name | Category | Icon | Mean/qtr | Vol/qtr |
|---|---|---|---|---|---|
| `zipeats` | ZipEats | food delivery | 🛵 | +3 % | 14 % |
| `dashkart` | DashKart | 10-minute grocery | 🧺 | +4 % | 22 % |
| `autogo` | AutoGo | auto & cab app | 🛺 | +2 % | 10 % |
| `chaiwala` | ChaiWala Co. | chai chain | ☕ | +2 % | 6 % |

## Where it lives
- Engine: `src/engine/market.ts` (pure, seeded, tested), data in `src/engine/marketData.ts`; `game.market` API; `state.market` persisted; scoring merges market evidence.
- Client: `src/game/scenes/MarketScene.ts`; HUD 📈 button on ChapterMap/TownMap when `game.market.eligible()`.
- Contract: additive types in `src/shared/types.ts` (`Market*`), `Game.market?`.

## Status (07:10) — shipped
- Engine `src/engine/market.ts` + `marketData.ts`: done, 9 tests. Scoring merges evidence. The tip card says "Forwarded message" (no real app names, guardrail).
- Scene `src/game/scenes/MarketScene.ts`: everything drawn inside the device frame (`device_frame.png`, screen 20,40 320×520); action buttons on the bottom bezel. Intro with the market-terminal backdrop → practice (3 quarters) → real run (25/50/75/100 % of savings) → results card.
- Art wired (`public/assets/market/`, keys in `src/game/ui/MarketArt.ts`, ~120 KB, precached offline): company icons 32/16 px, risk badges, ticker arrows, buy/sell 9-slices, torn news card 9-slice, candle sprites (row sparklines), big OHLC chart of the selected company (tap a row), tip-forward and crash-flash loops on those news cards, Professor walks in each quarter, coin shower on a good result, blinking LED.
- Strings: 46 keys (`market.*`, `btn.market`, `btn.map`, `btn.exit`, `btn.back_map`, `professor.name`, `professor.hint`, `battle.banked`) in en/te/hi — 205/205 each. Aakarsh to proofread te/hi (R-monish-11).
- HUD 📈 MARKET sits above each map's GO bar (chapter map y 404, town y 536).
- Verified by a Playwright drive in English and Telugu: paper round leaves savings untouched; real run deposits 50 %, settles back, 5 evidence items; no console errors.
- Known: Telugu glyph spacing in the pixel font is the game-wide font issue (ISSUES #3), not market-specific.
