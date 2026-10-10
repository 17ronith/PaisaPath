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

export const CONTENT_VERSION = '0.1.0';

export function rawContent(): unknown {
  return {
    version: CONTENT_VERSION,
    personas,
    lifeQuestions: onboarding.lifeQuestions,
    quiz: onboarding.quiz,
    concepts,
    tasks: [...stage1, ...stage2, ...stage3, ...detours],
    events,
    explainers,
    minigames,
    assets,
    places,
  };
}

const overlays: Record<Lang, Record<string, string>> = {
  en: {},
  te: teContent as Record<string, string>,
  hi: {},
};

export function loadContent(): ContentPack {
  registerStrings('en', en as Record<string, string>);
  registerStrings('te', te as Record<string, string>);
  registerStrings('hi', hi as Record<string, string>);
  return parseContentPack(rawContent());
}

/**
 * Apply a content overlay: keys are dotted paths like
 * "safety_medium_s1_01.framings.scholarship.text" or "safety_medium_s1_01.choices.pay.text".
 * The first segment is a task/event id; "choices.<choiceId>" addresses a choice by id.
 * Missing keys leave English in place. Returns a deep copy.
 */
export function localize(pack: ContentPack, lang: Lang): ContentPack {
  const copy: ContentPack = JSON.parse(JSON.stringify(pack));
  const overlay = overlays[lang] ?? {};
  const byId = new Map<string, any>();
  for (const t of copy.tasks) byId.set(t.id, t);
  for (const e of copy.events) byId.set(e.id, e);
  for (const x of copy.explainers) byId.set(x.id, x);
  for (const [key, value] of Object.entries(overlay)) {
    const [id, ...path] = key.split('.');
    let node: any = byId.get(id);
    if (!node) continue;
    for (let i = 0; i < path.length - 1; i++) {
      const seg = path[i];
      if (seg === 'choices' && Array.isArray(node.choices)) {
        node = node.choices.find((c: any) => c.id === path[i + 1]);
        i++;
      } else node = node?.[seg];
      if (!node) break;
    }
    if (node && path.length) node[path[path.length - 1]] = value;
  }
  return copy;
}
