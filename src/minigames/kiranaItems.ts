// Kirana Rush data + round factory. Plain data, generic product names only (no brands).
// Prices are team estimates for a Hyderabad kirana, in real ₹ (shown as-is, not scaled).
import { SortRound, drawBalanced, type SortItem } from './sortRound';

export type Basket = 'need' | 'want';

export interface KiranaItem extends SortItem<Basket> {
  name: string;
  price: number;
  icon: string;
}

export const KIRANA_TIME_MS = 45_000; // PLAYTEST-01 #15: room to read each card
export const KIRANA_ITEMS = 10;
/** ≥ 70% correct = win. */
export const KIRANA_PASS = Math.ceil(KIRANA_ITEMS * 0.7);
/** First item takes this long to fall to the counter; each next one is a bit faster. */
export const FALL_MS_START = 3400;
export const FALL_MS_END = 2200;

// PLAYTEST-01 #20: only items where need-vs-want is unarguable for a Hyderabad household.
// A deodorant, a phone cover or a snack for a hungry kid can be argued either way — they are out.
export const KIRANA_POOL: readonly KiranaItem[] = [
  {
    name: 'Bus pass (month)',
    price: 300,
    icon: '🚌',
    answer: 'need',
    why: 'Gets you to college every day.',
  },
  {
    name: 'Phone recharge',
    price: 239,
    icon: '📱',
    answer: 'need',
    why: 'No recharge, no calls, no online class.',
  },
  {
    name: 'Game top-up',
    price: 100,
    icon: '🎮',
    answer: 'want',
    why: 'Diamonds in a game buy nothing at home.',
  },
  {
    name: 'Second earphones',
    price: 400,
    icon: '🎧',
    answer: 'want',
    why: 'The first pair still works.',
  },
  {
    name: 'Rice 5kg',
    price: 300,
    icon: '🍚',
    answer: 'need',
    why: 'Rice: the family eats every day.',
  },
  {
    name: 'Dal 1kg',
    price: 140,
    icon: '🫘',
    answer: 'need',
    why: 'Dal: daily food, not a treat.',
  },
  { name: 'Cooking oil 1L', price: 160, icon: '🫗', answer: 'need', why: 'No oil, no cooking.' },
  {
    name: 'Milk packet',
    price: 30,
    icon: '🥛',
    answer: 'need',
    why: 'Milk: everyday need at home.',
  },
  { name: 'Bath soap', price: 40, icon: '🧼', answer: 'need', why: 'Soap keeps everyone healthy.' },
  {
    name: 'Fever tablets',
    price: 35,
    icon: '💊',
    answer: 'need',
    why: 'Medicine is always a need.',
  },
  {
    name: 'College notebook',
    price: 60,
    icon: '📓',
    answer: 'need',
    why: 'You need it for class.',
  },
  { name: 'Onions 1kg', price: 40, icon: '🧅', answer: 'need', why: 'Onions go in every curry.' },
  {
    name: 'Chips packet',
    price: 20,
    icon: '🍟',
    answer: 'want',
    why: 'Chips: nice, but you can skip.',
  },
  {
    name: 'Cold drink',
    price: 40,
    icon: '🥤',
    answer: 'want',
    why: 'Water does the job for free.',
  },
  { name: 'Chocolate bar', price: 50, icon: '🍫', answer: 'want', why: 'A treat, not a need.' },
  {
    name: 'Ice cream cone',
    price: 60,
    icon: '🍦',
    answer: 'want',
    why: 'Fun today, gone in 5 minutes.',
  },
];

/** How long item `i` (0-based) takes to fall: linear from FALL_MS_START to FALL_MS_END. */
export function fallMsFor(i: number, count = KIRANA_ITEMS): number {
  if (count <= 1) return FALL_MS_START;
  const t = Math.min(1, Math.max(0, i / (count - 1)));
  return Math.round(FALL_MS_START + (FALL_MS_END - FALL_MS_START) * t);
}

export function newKiranaRound(random: () => number = Math.random): SortRound<Basket, KiranaItem> {
  return new SortRound(drawBalanced(KIRANA_POOL, KIRANA_ITEMS, random), {
    timeLimitMs: KIRANA_TIME_MS,
    passCount: KIRANA_PASS,
  });
}
