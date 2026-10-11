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

## Status (06:55)
- Engine `src/engine/market.ts` + `marketData.ts`: done, 9 tests. Scoring merges evidence.
- Scene `src/game/scenes/MarketScene.ts`: intro → practice (3 quarters) → real run (deposit 25/50/75/100 % of savings) → results card; decorative candles; HUD 📈 button from chapter 5. Verified in a real run.
- Open: art from the market asset prompt (device frame, company icons, candle sprites, tip/crash GIFs); strings `market.*` / `btn.market` / `btn.exit` / `btn.back_map` in te/hi (English fallbacks in place); Professor walk-in animation.
