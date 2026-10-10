// `npm run validate:content` — zod parse + cross-reference checks. Exit 1 on any failure.
// Aakarsh extends the checks (docs/plan/CONTRACTS.md §3). Keep failure messages readable.
import { ContentPackSchema } from '@/shared/schema';
import type { ContentPack } from '@/shared/types';
import { rawContent } from './index';
import en from './strings/en.json';
import te from './strings/te.json';

const errors: string[] = [];
const fail = (msg: string) => errors.push(msg);

const parsed = ContentPackSchema.safeParse(rawContent());
if (!parsed.success) {
  for (const issue of parsed.error.issues)
    fail(`schema › ${issue.path.join('.')} › ${issue.message}`);
  report();
}
const pack = parsed.data as ContentPack;

const conceptIds = new Set(pack.concepts.map((c) => c.id));
const explainerIds = new Set(pack.explainers.map((e) => e.id));
const placeIds = new Set(pack.places.map((p) => p.id));
const eventIds = new Set(pack.events.map((e) => e.id));
const taskById = new Map(pack.tasks.map((t) => [t.id, t]));

if (taskById.size !== pack.tasks.length) fail('tasks › duplicate task ids');

for (const c of pack.concepts) {
  if (!explainerIds.has(c.explainerId))
    fail(`concepts#${c.id} › explainerId '${c.explainerId}' not found`);
}
for (const x of pack.explainers) {
  if (!conceptIds.has(x.concept)) fail(`explainers#${x.id} › concept '${x.concept}' not found`);
}

const checkChoices = (
  owner: string,
  choices: ContentPack['tasks'][number]['choices'],
  isTask: boolean,
) => {
  const ids = new Set<string>();
  for (const ch of choices) {
    if (ids.has(ch.id)) fail(`${owner} › duplicate choice id '${ch.id}'`);
    ids.add(ch.id);
    if (ch.explainerId && !explainerIds.has(ch.explainerId))
      fail(`${owner} › choices.${ch.id}.explainerId '${ch.explainerId}' not found`);
    if (ch.detourTaskId) {
      const d = taskById.get(ch.detourTaskId);
      if (!d) fail(`${owner} › choices.${ch.id}.detourTaskId '${ch.detourTaskId}' not found`);
      else if (!d.isDetour)
        fail(`${owner} › choices.${ch.id}.detourTaskId '${ch.detourTaskId}' is not isDetour:true`);
    }
    for (const e of ch.effects) {
      if (e.triggerEvent && !eventIds.has(e.triggerEvent))
        fail(`${owner} › choices.${ch.id} › triggerEvent '${e.triggerEvent}' not found`);
    }
  }
  if (isTask && !choices.some((c) => c.quality === 'good'))
    fail(`${owner} › needs at least one 'good' choice`);
};

const checkFramings = (owner: string, framings: ContentPack['tasks'][number]['framings']) => {
  for (const [persona, f] of Object.entries(framings)) {
    if (f && !placeIds.has(f.place))
      fail(`${owner} › framings.${persona}.place '${f.place}' not found`);
  }
};

for (const t of pack.tasks) {
  const owner = `tasks#${t.id}`;
  if (!conceptIds.has(t.concept)) fail(`${owner} › concept '${t.concept}' not found`);
  checkFramings(owner, t.framings);
  checkChoices(owner, t.choices, !t.isDetour);
}
for (const e of pack.events) {
  const owner = `events#${e.id}`;
  if (e.concept && !conceptIds.has(e.concept)) fail(`${owner} › concept '${e.concept}' not found`);
  checkFramings(owner, e.framings);
  checkChoices(owner, e.choices, false);
}

// Each stage has ≥1 main task per pillar (warn-only until Aakarsh fills stages 2–3).
const pillars = ['budget', 'save', 'invest', 'safety'] as const;
const warnings: string[] = [];
for (const stage of [1, 2, 3] as const) {
  for (const p of pillars) {
    if (!pack.tasks.some((t) => t.stage === stage && t.pillar === p && !t.isDetour))
      warnings.push(`stage ${stage} has no main '${p}' task`);
  }
}

// Strings: te keys ⊆ en keys.
const enKeys = new Set(Object.keys(en));
for (const k of Object.keys(te))
  if (!enKeys.has(k)) fail(`strings/te.json › key '${k}' not in en.json`);

// Double-blind + naming rules.
const blob = JSON.stringify(rawContent()) + JSON.stringify(en) + JSON.stringify(te);
if (/IIIT|Paisa Path/i.test(blob))
  fail('content › contains "IIIT" or "Paisa Path" (double-blind rule)');

report();

function report(): void {
  const framings = pack ? pack.tasks.reduce((n, t) => n + Object.keys(t.framings).length, 0) : 0;
  for (const w of warnings) console.warn(`warn  ${w}`);
  if (errors.length) {
    for (const e of errors) console.error(`FAIL  ${e}`);
    console.error(`\n${errors.length} content error(s)`);
    process.exit(1);
  }
  const main = pack.tasks.filter((t) => !t.isDetour).length;
  const det = pack.tasks.length - main;
  const teCov = enKeys.size ? Math.round((Object.keys(te).length / enKeys.size) * 100) : 0;
  console.log(
    `OK · ${main} tasks · ${det} detours · ${framings} framings · ${pack.events.length} events · ${pack.explainers.length} explainers · ${pack.concepts.length} concepts · en ${enKeys.size} keys · te ${Object.keys(te).length} keys (${teCov}%)`,
  );
  process.exit(0);
}
