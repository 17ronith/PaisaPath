// Aakarsh owns this folder. loadContent() assembles the JSON files into one ContentPack
// (validated by zod); localize() applies a language overlay. Both are pure.
import type { ContentPack, Lang } from '@/shared/types';
import { parseContentPack } from '@/shared/schema';
import { registerStrings } from '@/shared/i18n';

import personas from './personas.json';
import onboarding from './onboarding.json';
import concepts from './concepts.json';
import places from './places.json';
import assets from './assets.json';
import minigames from './minigames.json';
import explainers from './explainers.json';
import events from './events.json';
import stage1 from './tasks/stage1.json';
import stage2 from './tasks/stage2.json';
import stage3 from './tasks/stage3.json';
import detours from './tasks/detours.json';
import en from './strings/en.json';
import te from './strings/te.json';
import hi from './strings/hi.json';
import teContent from './strings/te.content.json';

export const CONTENT_VERSION = '0.2.0';

/** Collections of a ContentPack that hold id'd entries (and so can be addressed by overlays). */
export const COLLECTIONS = [
  'personas',
  'lifeQuestions',
  'quiz',
  'quizAfter',
  'concepts',
  'tasks',
  'events',
  'explainers',
  'minigames',
  'assets',
  'places',
] as const;
export type Collection = (typeof COLLECTIONS)[number];

/** Which file each collection's entries come from, in pack order (for readable validator errors). */
export const SOURCES: Sources = {
  personas: [{ file: 'personas.json', items: personas }],
  lifeQuestions: [{ file: 'onboarding.json', items: onboarding.lifeQuestions }],
  quiz: [{ file: 'onboarding.json', items: onboarding.quiz }],
  quizAfter: [{ file: 'onboarding.json', items: onboarding.quizAfter ?? [] }],
  concepts: [{ file: 'concepts.json', items: concepts }],
  tasks: [
    { file: 'tasks/stage1.json', items: stage1 },
    { file: 'tasks/stage2.json', items: stage2 },
    { file: 'tasks/stage3.json', items: stage3 },
    { file: 'tasks/detours.json', items: detours },
  ],
  events: [{ file: 'events.json', items: events }],
  explainers: [{ file: 'explainers.json', items: explainers }],
  minigames: [{ file: 'minigames.json', items: minigames }],
  assets: [{ file: 'assets.json', items: assets }],
  places: [{ file: 'places.json', items: places }],
};

export const STRINGS: Record<Lang, Record<string, string>> = { en, te, hi };
export const OVERLAYS: Record<Lang, Record<string, string>> = { en: {}, te: teContent, hi: {} };

export type Sources = Record<Collection, { file: string; items: unknown[] }[]>;

/** The unvalidated pack, assembled from `sources` (default: the JSON files in this folder). */
export function rawContent(sources: Sources = SOURCES): unknown {
  const pack: Record<string, unknown> = { version: CONTENT_VERSION };
  for (const c of COLLECTIONS) pack[c] = sources[c].flatMap((s) => s.items);
  return pack;
}

export function loadContent(): ContentPack {
  registerStrings('en', en);
  registerStrings('te', te);
  registerStrings('hi', hi);
  return parseContentPack(rawContent());
}

/**
 * Apply an overlay of dotted paths → strings to a deep copy of `pack`.
 * The first segment is the id of any entry in any collection ("budget_simple_s1_01", "K1",
 * "pocket_money", …). Later segments walk the object: inside an array, a segment matches an
 * element's `id` ("choices.pay") or is a numeric index ("options.2", "effects.0").
 * Only existing string leaves are replaced; any key that doesn't resolve is returned in
 * `unresolved` and leaves English in place.
 */
export function applyOverlay(
  pack: ContentPack,
  overlay: Record<string, string>,
): { pack: ContentPack; unresolved: string[] } {
  const copy: ContentPack = structuredClone(pack);
  const byId = new Map<string, unknown>();
  for (const c of COLLECTIONS)
    for (const item of copy[c] as { id: string }[]) if (!byId.has(item.id)) byId.set(item.id, item);

  const unresolved: string[] = [];
  for (const [key, value] of Object.entries(overlay)) {
    const [id, ...path] = key.split('.');
    let node: unknown = byId.get(id);
    for (const seg of path.slice(0, -1)) node = step(node, seg);
    const leaf = path[path.length - 1];
    if (path.length && isContainer(node) && typeof get(node, leaf) === 'string')
      set(node, leaf, value);
    else unresolved.push(key);
  }
  return { pack: copy, unresolved };
}

export function localize(pack: ContentPack, lang: Lang): ContentPack {
  return applyOverlay(pack, OVERLAYS[lang] ?? {}).pack;
}

type Container = Record<string, unknown> | unknown[];

function isContainer(node: unknown): node is Container {
  return typeof node === 'object' && node !== null;
}

function step(node: unknown, seg: string): unknown {
  if (!isContainer(node)) return undefined;
  if (Array.isArray(node)) {
    const byId = node.find((el) => isContainer(el) && (el as { id?: unknown }).id === seg);
    return byId ?? (/^\d+$/.test(seg) ? node[Number(seg)] : undefined);
  }
  return node[seg];
}

function get(node: Container, seg: string): unknown {
  return Array.isArray(node) ? (/^\d+$/.test(seg) ? node[Number(seg)] : undefined) : node[seg];
}

function set(node: Container, seg: string, value: string): void {
  if (Array.isArray(node)) node[Number(seg)] = value;
  else node[seg] = value;
}
