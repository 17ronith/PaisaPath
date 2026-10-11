// Charminar Market content (docs/plan/STOCKS.md). Fictional companies in everyday categories;
// no real brand, ticker or product anywhere. Lives in the engine for now so the market is
// self-contained; Aakarsh may lift it into src/content later.
import type { MarketCompany, MarketCompanyId, MarketNews } from '@/shared/types';

export const MARKET_TURNS = 8;
export const PAPER_TURNS = 3;
export const PAPER_CASH = 10_000;
export const TRADE_FEE = 20;
export const CRASH_TURN = 6;
export const TIP_TURN = 5;
export const MONSOON_TURN = 3;
export const TIP_COMPANY: MarketCompanyId = 'dashkart';
export const MONSOON_COMPANY: MarketCompanyId = 'autogo';
export const BANYAN_YEARLY_PCT = 8;
export const CANDLES_PER_TURN = 8;

export const COMPANIES: MarketCompany[] = [
  {
    id: 'zipeats',
    name: 'ZipEats',
    category: 'Food delivery',
    icon: '🛵',
    blurb: 'Biryani at your door in 20 minutes. Grows fast, burns cash.',
    movedBy: 'New cities, festival weekends, rider costs.',
    meanQuarterPct: 3,
    volQuarterPct: 14,
    risk: 2,
  },
  {
    id: 'dashkart',
    name: 'DashKart',
    category: '10-minute grocery',
    icon: '🧺',
    blurb: 'Groceries in 10 minutes. Everyone loves it; nobody knows if it makes money.',
    movedBy: 'Investor mood more than groceries.',
    meanQuarterPct: 4,
    volQuarterPct: 22,
    risk: 3,
  },
  {
    id: 'autogo',
    name: 'AutoGo',
    category: 'Auto & cab app',
    icon: '🛺',
    blurb: 'Autos and cabs on tap. Steady rides, thin margins.',
    movedBy: 'Fuel prices, rain, strikes.',
    meanQuarterPct: 2,
    volQuarterPct: 10,
    risk: 2,
  },
  {
    id: 'chaiwala',
    name: 'ChaiWala Co.',
    category: 'Chai chain',
    icon: '☕',
    blurb: 'Forty stalls and counting. Boring, profitable, slow.',
    movedBy: 'New stalls, milk prices. Not much else.',
    meanQuarterPct: 2,
    volQuarterPct: 6,
    risk: 1,
  },
];

export const START_PRICE: Record<MarketCompanyId, number> = {
  zipeats: 240,
  dashkart: 180,
  autogo: 150,
  chaiwala: 120,
};

/** Scripted beats layered on the seeded quarterly returns (added to the % move). */
export const BEATS: Partial<Record<number, Partial<Record<MarketCompanyId, number>>>> = {
  2: { zipeats: 8 },
  [MONSOON_TURN]: { autogo: -22, zipeats: 5 },
  4: { chaiwala: 6 },
  [TIP_TURN]: { dashkart: 14 },
  [CRASH_TURN]: { zipeats: -18, dashkart: -38, autogo: -16, chaiwala: -8 },
  7: { zipeats: 12, dashkart: 10, autogo: 11, chaiwala: 6 },
  8: { zipeats: 8, dashkart: 6, autogo: 7, chaiwala: 5 },
};

export const NEWS: MarketNews[] = [
  {
    turn: 1,
    kind: 'info',
    headline: 'Welcome to the Charminar Market',
    detail:
      'Four made-up companies. A share is a small piece of one. Its price is what people expect the company to be worth — it moves every quarter whether you like it or not.',
    professor:
      'Prices move on expectations, not on what you wish. Buy a little of what you understand.',
  },
  {
    turn: 2,
    kind: 'info',
    about: 'zipeats',
    headline: 'ZipEats launches in three new cities',
    detail: 'Riders in Warangal, Nizamabad and Karimnagar from Monday.',
    professor: 'Good news usually pushes a price up a bit. Usually. Notice the word.',
  },
  {
    turn: MONSOON_TURN,
    kind: 'monsoon',
    about: 'autogo',
    headline: 'Monsoon floods Hyderabad roads for two weeks',
    detail: 'Autos off the road; deliveries up as people stay home.',
    professor:
      'Rain hits one business and helps another. That is why you do not put everything in one stall.',
  },
  {
    turn: 4,
    kind: 'info',
    about: 'chaiwala',
    headline: 'ChaiWala Co. opens its 40th stall',
    detail: 'Slow and steady. Profits up 6%.',
    professor: 'Boring companies rarely make headlines. They also rarely make you panic.',
  },
  {
    turn: TIP_TURN,
    kind: 'tip',
    about: 'dashkart',
    headline: 'Forwarded message: "DashKart will DOUBLE by Diwali — buy now, insider info!"',
    detail: 'Forwarded many times. No source. The price is already jumping.',
    professor:
      'A guaranteed double is a guaranteed lie. If the tip were real, the person would not need you.',
  },
  {
    turn: CRASH_TURN,
    kind: 'crash',
    about: 'dashkart',
    headline: 'Funding winter: investors pull out, DashKart loses a third of its value',
    detail: 'Every company is down this quarter. Phones are buzzing with "SELL".',
    professor:
      'This is the quarter that decides who you are. Selling now turns a paper loss into a real one.',
  },
  {
    turn: 7,
    kind: 'recovery',
    headline: 'Recovery: steady businesses bounce back first',
    detail: 'Chai and autos recover; DashKart crawls.',
    professor: 'Markets fall fast and climb slowly. People who held are still here.',
  },
  {
    turn: 8,
    kind: 'results',
    headline: 'Two years later',
    detail:
      'The quarter closes. Everything you hold is sold back into your savings — no fee on the final settlement.',
    professor:
      'Now let us look at what you DID, not what you made. Luck decides the second. You decide the first.',
  },
];
