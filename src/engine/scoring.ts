// summary(): per-pillar progress, NCFE-aligned in-game score, safety score, biggest mistake
// (CONTRACTS §2.4).
import type {
  Choice,
  ContentPack,
  GameState,
  LogEntry,
  NcfeBehaviour,
  NcfeItem,
  NcfeKnowledge,
  NcfeScore,
  Pillar,
  Projection,
  Summary,
} from '@/shared/types';
import { afterQuiz } from '@/shared/quiz';

export const NCFE_KNOWLEDGE: NcfeKnowledge[] = [
  'division',
  'time_value',
  'loan_interest',
  'simple_interest',
  'compound_interest',
  'inflation',
  'risk_return',
  'diversification',
];
export const NCFE_BEHAVIOUR: NcfeBehaviour[] = [
  'keeps_budget',
  'takes_responsibility',
  'major_expense_no_borrow',
  'saves_actively',
  'compares_options',
  'long_term_goals',
  'watches_finances',
  'pays_bills_on_time',
  'considers_affordability',
];
/** Attitude with no now/later evidence at all: neutral midpoint. */
export const ATTITUDE_NO_EVIDENCE = 3;

/** The choice a log entry refers to (task, detour or event). */
export function choiceOf(content: ContentPack, e: LogEntry): Choice | undefined {
  const item = e.isEvent
    ? content.events.find((x) => x.id === e.taskId)
    : content.tasks.find((x) => x.id === e.taskId);
  return item?.choices.find((c) => c.id === e.choiceId);
}

/** Share of future-oriented choices → 1..5 (<20% → 1, <40 → 2, <60 → 3, <80 → 4, else 5). */
export function attitudeBand(laterShare: number): number {
  if (laterShare < 0.2) return 1;
  if (laterShare < 0.4) return 2;
  if (laterShare < 0.6) return 3;
  if (laterShare < 0.8) return 4;
  return 5;
}

const isKnowledge = (item: string): item is NcfeKnowledge =>
  (NCFE_KNOWLEDGE as string[]).includes(item);

/** Knowledge items a quiz question tests: its concept's NCFE tags, else the concept id itself. */
function quizItems(content: ContentPack, conceptId: string): NcfeKnowledge[] {
  const tags = content.concepts.find((c) => c.id === conceptId)?.ncfe ?? [conceptId];
  return [...new Set(tags)].filter(isKnowledge);
}

/**
 * After-quiz answers as knowledge evidence (NCFE-FLIS measures knowledge with questions too):
 * each answered question gives 1 (right) or 0 (wrong) to the knowledge items its concept tests.
 * Behaviour items are never evidenced by a quiz.
 */
export function quizEvidence(
  content: ContentPack,
  answers: number[] | undefined,
): { item: NcfeKnowledge; value: 0 | 1 }[] {
  if (!answers) return [];
  return afterQuiz(content).flatMap((q, i) => {
    if (answers[i] === undefined) return [];
    const value: 0 | 1 = answers[i] === q.answer ? 1 : 0;
    return quizItems(content, q.concept).map((item) => ({ item, value }));
  });
}

export function ncfeScore(
  content: ContentPack,
  log: LogEntry[],
  quizAfterAnswers?: number[],
  extra: { item: NcfeItem; value: 0 | 1 }[] = [],
): NcfeScore {
  const evidence = new Map<NcfeItem, number[]>();
  for (const ev of extra) evidence.set(ev.item, [...(evidence.get(ev.item) ?? []), ev.value]);
  for (const ev of quizEvidence(content, quizAfterAnswers)) {
    evidence.set(ev.item, [...(evidence.get(ev.item) ?? []), ev.value]);
  }
  let now = 0;
  let later = 0;
  for (const e of log) {
    const c = choiceOf(content, e);
    if (!c) continue;
    for (const ev of c.ncfe ?? []) {
      const list = evidence.get(ev.item) ?? [];
      list.push(ev.value);
      evidence.set(ev.item, list);
    }
    if (c.attitude === 'now') now += 1;
    if (c.attitude === 'later') later += 1;
  }
  const items = {} as Record<NcfeItem, 0 | 1 | null>;
  for (const item of [...NCFE_KNOWLEDGE, ...NCFE_BEHAVIOUR]) {
    const vals = evidence.get(item);
    items[item] = !vals ? null : vals.reduce((a, b) => a + b, 0) / vals.length >= 0.5 ? 1 : 0;
  }
  const knowledge = NCFE_KNOWLEDGE.filter((i) => items[i] === 1).length;
  const behaviour = NCFE_BEHAVIOUR.filter((i) => items[i] === 1).length;
  const attitude = now + later === 0 ? ATTITUDE_NO_EVIDENCE : attitudeBand(later / (now + later));
  return {
    knowledge,
    behaviour,
    attitude,
    literate: knowledge >= 6 && behaviour >= 6 && attitude >= 3,
    items,
  };
}

/** Damage of a log entry: coins lost + 20 × happiness lost. */
export const mistakeCost = (e: LogEntry): number =>
  e.before.wallet - e.after.wallet + 20 * (e.before.happiness - e.after.happiness);

/** Index of the weak/critical entry with the largest cost (earliest on ties), or −1. */
export function biggestMistakeIndex(log: LogEntry[]): number {
  let best = -1;
  for (let i = 0; i < log.length; i++) {
    const e = log[i];
    if (e.quality !== 'weak' && e.quality !== 'critical') continue;
    if (best === -1 || mistakeCost(e) > mistakeCost(log[best])) best = i;
  }
  return best;
}

export function summarize(
  s: GameState,
  content: ContentPack,
  projection: Projection | null,
): Summary {
  const perPillar: Record<Pillar, { good: number; total: number }> = {
    budget: { good: 0, total: 0 },
    save: { good: 0, total: 0 },
    invest: { good: 0, total: 0 },
    safety: { good: 0, total: 0 },
  };
  const tasks = new Map(content.tasks.map((t) => [t.id, t]));
  for (const e of s.log) {
    const t = e.isEvent ? undefined : tasks.get(e.taskId);
    if (!t) continue;
    perPillar[t.pillar].total += 1;
    if (e.quality === 'good') perPillar[t.pillar].good += 1;
  }

  let faced = s.market?.scamsFaced ?? 0;
  let spotted = s.market?.scamsSpotted ?? 0;
  for (const e of s.log) {
    const c = choiceOf(content, e);
    if (!c?.scam) continue;
    faced += 1;
    if (c.scam === 'spotted') spotted += 1;
  }

  const big = biggestMistakeIndex(s.log);
  const quizAfter = s.quizAfter ?? null;
  return {
    finalBars: { ...s.bars },
    perPillar,
    ncfe: ncfeScore(content, s.log, s.quizAfterAnswers, s.market?.evidence ?? []),
    safety: { spotted, faced },
    mistakesFixed: [...s.learned],
    mistakesOpen: [...s.mistakes],
    detoursTaken: s.detoursTaken,
    restarts: s.restarts,
    quizBefore: s.profile.quizBefore,
    quizAfter,
    learningGain: quizAfter === null ? null : quizAfter - s.profile.quizBefore,
    biggestMistake: big === -1 ? null : s.log[big],
    projection,
  };
}
