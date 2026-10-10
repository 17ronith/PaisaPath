// Engine public API (CONTRACTS §1–2). Pure TypeScript: imports only src/shared.
// UI protocol and save semantics: see the header of ./game.ts.
export { createGame, loadGame, EngineGame } from './game';
export {
  ECONOMY,
  scaleToCoins,
  incomeCoins,
  incomeLabel,
  stageOfChapter,
  LAST_CHAPTER,
} from './economy';
export { portfolioTotal, realValue } from './invest';
