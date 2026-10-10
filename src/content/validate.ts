// `npm run validate:content` — zod parse + cross-reference + content-quality checks.
// Exit 1 on any error. Every message names the file and entry it is about, e.g.
//   tasks/stage1.json#budget_simple_s1_01 › choices[2].detourTaskId → 'x' not found
// validateContent() is pure so the Vitest suite can run the same checks.
import { pathToFileURL } from 'node:url';
import { ContentPackSchema } from '@/shared/schema';
import type {
  Choice,
  ContentPack,
  Effect,
  Framing,
  Lang,
  NcfeItem,
  Pillar,
  RandomEvent,
  Stage,
  Task,
} from '@/shared/types';
import {
  applyOverlay,
  COLLECTIONS,
  OVERLAYS as DEFAULT_OVERLAYS,
  rawContent,
  SOURCES as DEFAULT_SOURCES,
  STRINGS as DEFAULT_STRINGS,
} from './index';
import type { Collection, Sources } from './index';

export interface ValidationResult {
  errors: string[];
  warnings: string[];
  stats: Record<string, number>;
  summary: string;
}

const PILLARS: Pillar[] = ['budget', 'save', 'invest', 'safety'];
const PERSONAS = ['pocket_money', 'scholarship', 'earner'] as const;
const NCFE_ITEMS: NcfeItem[] = [
  'division',
  'time_value',
  'loan_interest',
  'simple_interest',
  'compound_interest',
  'inflation',
  'risk_return',
  'diversification',
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
/** Stages whose content is final: ≥1 main task per pillar (CONTRACTS §3) and every persona framing. */
const STRICT_STAGES: Stage[] = [1, 2, 3];
/** Engine economy (CONTRACTS §2.1): coins per chapter, and the real ₹ that maps to it. */
const STAGE_INCOME_COINS: Record<Stage, number> = { 1: 5000, 2: 25000, 3: 60000 };
const STAGE_REAL_REF: Record<2 | 3, number> = { 2: 20000, 3: 50000 };
const DOUBLE_BLIND = /IIIT|Paisa Path/i;
/** Real brands, apps, banks and teams never appear in game text (guardrail + no endorsements). */
const BRANDS =
  /\b(swiggy|zomato|phonepe|paytm|g\s?pay|google pay|whatsapp|telegram|instagram|youtube|facebook|free fire|bgmi|pubg|amazon|flipkart|hdfc|icici|sbi|axis bank|kotak|jio|airtel|vodafone|netflix|ipl|srh|sunrisers|lic|zerodha|groww)\b/i;
const HAPPINESS_RANGE = { min: -30, max: 15 };

export interface ValidationInput {
  sources: Sources;
  strings: Record<Lang, Record<string, string>>;
  overlays: Record<Lang, Record<string, string>>;
}

/** Validate the content pack. Tests pass modified `input` to prove each check fires. */
export function validateContent(input: Partial<ValidationInput> = {}): ValidationResult {
  const SOURCES = input.sources ?? DEFAULT_SOURCES;
  const STRINGS = input.strings ?? DEFAULT_STRINGS;
  const OVERLAYS = input.overlays ?? DEFAULT_OVERLAYS;
  const errors: string[] = [];
  const warnings: string[] = [];
  const err = (where: string, msg: string) => errors.push(`${where} › ${msg}`);
  const warn = (where: string, msg: string) => warnings.push(`${where} › ${msg}`);

  // ---- where does entry i of collection c live? ------------------------------------------
  const locate = (c: Collection, index: number): string => {
    let i = index;
    for (const s of SOURCES[c]) {
      if (i < s.items.length) {
        const id = (s.items[i] as { id?: string })?.id;
        return id ? `${s.file}#${id}` : `${s.file}[${i}]`;
      }
      i -= s.items.length;
    }
    return `${c}[${index}]`;
  };
  const fileOf = (c: Collection, id: string): string => {
    for (const s of SOURCES[c])
      if (s.items.some((x) => (x as { id?: string }).id === id)) return `${s.file}#${id}`;
    return `${c}#${id}`;
  };

  // ---- 1. schema ---------------------------------------------------------------------------
  const raw = rawContent(SOURCES);
  const parsed = ContentPackSchema.safeParse(raw);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const [c, idx, ...rest] = issue.path;
      const where =
        typeof c === 'string' &&
        typeof idx === 'number' &&
        (COLLECTIONS as readonly string[]).includes(c)
          ? locate(c as Collection, idx)
          : 'pack';
      const field = formatPath(
        typeof idx === 'number' ? rest : issue.path.slice(typeof c === 'string' ? 1 : 0),
      );
      err(where, `${field || '(root)'} → ${issue.message}`);
    }
    return finish(errors, warnings, {});
  }
  const pack = parsed.data as ContentPack;

  // ---- 2. ids ------------------------------------------------------------------------------
  const globalIds = new Map<string, string>();
  for (const c of COLLECTIONS) {
    const seen = new Set<string>();
    for (const item of pack[c] as { id: string }[]) {
      if (seen.has(item.id)) err(fileOf(c, item.id), `duplicate id in ${c}`);
      seen.add(item.id);
      const other = globalIds.get(item.id);
      if (other && other !== c)
        err(fileOf(c, item.id), `id also used in ${other} (overlay keys need unique ids)`);
      globalIds.set(item.id, c);
    }
  }

  const concepts = new Map(pack.concepts.map((c) => [c.id, c]));
  const explainers = new Map(pack.explainers.map((e) => [e.id, e]));
  const places = new Set(pack.places.map((p) => p.id));
  const events = new Map(pack.events.map((e) => [e.id, e]));
  const tasks = new Map(pack.tasks.map((t) => [t.id, t]));
  const mainTasks = pack.tasks.filter((t) => !t.isDetour);
  const detours = pack.tasks.filter((t) => t.isDetour);

  // Flags that something can set: life questions, persona defaults, effects.
  const settable = new Set<string>();
  for (const q of pack.lifeQuestions)
    for (const o of q.options) if (o.setFlag) settable.add(o.setFlag);
  for (const p of pack.personas) for (const f of p.defaultFlags) settable.add(f);
  for (const owner of [...pack.tasks, ...pack.events])
    for (const ch of owner.choices)
      for (const e of ch.effects) if (e.setFlag) settable.add(e.setFlag);

  // ---- 3. concepts & explainers ------------------------------------------------------------
  for (const c of pack.concepts) {
    const where = fileOf('concepts', c.id);
    const x = explainers.get(c.explainerId);
    if (!x) err(where, `explainerId → '${c.explainerId}' not found`);
    else if (x.concept !== c.id)
      warn(where, `explainer '${x.id}' is about '${x.concept}', not '${c.id}'`);
  }
  const usedConcepts = new Set<string>([
    ...pack.tasks.map((t) => t.concept),
    ...pack.events.flatMap((e) => (e.concept ? [e.concept] : [])),
  ]);
  for (const c of pack.concepts)
    if (!usedConcepts.has(c.id))
      warn(fileOf('concepts', c.id), 'no task or event uses this concept');

  for (const x of pack.explainers) {
    const where = fileOf('explainers', x.id);
    if (!concepts.has(x.concept)) err(where, `concept → '${x.concept}' not found`);
    if (x.durationMs < 10000 || x.durationMs > 20000)
      err(where, `durationMs ${x.durationMs} outside 10–20 s`);
    let last = -1;
    x.steps.forEach((s, i) => {
      if (s.at >= x.durationMs) err(where, `steps[${i}].at ${s.at} ≥ durationMs ${x.durationMs}`);
      if (s.at < last) warn(where, `steps[${i}] is out of time order`);
      last = Math.max(last, s.at);
      if (s.op === 'split') {
        const sum = s.parts.reduce((n, p) => n + p.pct, 0);
        if (sum !== 100) err(where, `steps[${i}] split parts sum to ${sum}%, not 100%`);
      }
      if (s.op === 'bar' && (Math.min(s.from, s.to) < 0 || Math.max(s.from, s.to) > 100))
        err(where, `steps[${i}] bar from/to must be within 0–100`);
    });
    const isInvest =
      concepts.get(x.concept)?.pillar === 'invest' || x.steps.some((s) => s.op === 'grow');
    if (isInvest && !x.steps.some((s) => s.op === 'text' && /assumes\b.*a year/i.test(s.text)))
      err(where, 'invest/projection explainer must show an "Assumes …% a year…" line');
  }

  // ---- 4. tasks, detours, events -----------------------------------------------------------
  const referencedDetours = new Set<string>();
  const checkFraming = (where: string, key: string, f: Framing) => {
    if (!places.has(f.place)) err(where, `framings.${key}.place → '${f.place}' not found`);
  };
  const checkChoices = (where: string, choices: Choice[]) => {
    const ids = new Set<string>();
    choices.forEach((ch, i) => {
      const at = `choices[${i}]`;
      if (ids.has(ch.id)) err(where, `${at} duplicate choice id '${ch.id}'`);
      ids.add(ch.id);
      if (ch.explainerId && !explainers.has(ch.explainerId))
        err(where, `${at}.explainerId → '${ch.explainerId}' not found`);
      if (ch.detourTaskId) {
        referencedDetours.add(ch.detourTaskId);
        const d = tasks.get(ch.detourTaskId);
        if (!d) err(where, `${at}.detourTaskId → '${ch.detourTaskId}' not found`);
        else if (!d.isDetour)
          err(where, `${at}.detourTaskId → '${ch.detourTaskId}' is not isDetour:true`);
        if (ch.quality === 'good') warn(where, `${at} is 'good' but sends the player on a detour`);
      }
      ch.effects.forEach((e, j) => checkEffect(where, `${at}.effects[${j}]`, e));
      const bad = ch.quality === 'weak' || ch.quality === 'critical';
      if (ch.scam && bad !== (ch.scam === 'fell'))
        warn(where, `${at} scam:'${ch.scam}' doesn't match quality '${ch.quality}'`);
    });
  };
  const checkEffect = (where: string, at: string, e: Effect) => {
    if (e.triggerEvent && !events.has(e.triggerEvent))
      err(where, `${at}.triggerEvent → '${e.triggerEvent}' not found`);
    if (e.clearFlag && !settable.has(e.clearFlag))
      warn(where, `${at}.clearFlag '${e.clearFlag}' is never set anywhere`);
    if (
      e.happiness !== undefined &&
      (e.happiness < HAPPINESS_RANGE.min || e.happiness > HAPPINESS_RANGE.max)
    )
      warn(
        where,
        `${at}.happiness ${e.happiness} outside ${HAPPINESS_RANGE.min}…+${HAPPINESS_RANGE.max}`,
      );
  };
  const checkFlags = (where: string, owner: Task | RandomEvent) => {
    for (const f of owner.requiresFlags ?? [])
      if (!settable.has(f))
        err(where, `requiresFlags '${f}' is never set, so this can never appear`);
  };

  for (const t of pack.tasks) {
    const where = fileOf('tasks', t.id);
    if (!concepts.has(t.concept)) err(where, `concept → '${t.concept}' not found`);
    for (const [k, f] of Object.entries(t.framings)) if (f) checkFraming(where, k, f);
    checkChoices(where, t.choices);
    checkFlags(where, t);
    const good = t.choices.filter((c) => c.quality === 'good').length;
    if (good === 0) err(where, `needs at least one 'good' choice`);
    if (!t.isDetour) {
      if (good > 1) warn(where, `${good} 'good' choices; main tasks should have exactly one`);
      if (t.choices.length < 3)
        warn(where, `only ${t.choices.length} choices; main tasks read best with 3–4`);
      for (const p of PERSONAS)
        if (!t.framings[p])
          (STRICT_STAGES.includes(t.stage) ? err : warn)(where, `missing framings.${p}`);
      if (!t.choices.some((c) => c.hint))
        warn(where, `no hint on any trap choice (shown after 2 fails)`);
      if (t.isDetour === undefined && t.id.startsWith('detour_'))
        err(where, `id starts with detour_ but isDetour is not set`);
    }
  }
  for (const d of detours)
    if (!referencedDetours.has(d.id))
      warn(fileOf('tasks', d.id), 'detour is never reached by any choice');

  for (const e of pack.events) {
    const where = fileOf('events', e.id);
    if (e.concept && !concepts.has(e.concept)) err(where, `concept → '${e.concept}' not found`);
    for (const [k, f] of Object.entries(e.framings)) if (f) checkFraming(where, k, f);
    checkChoices(where, e.choices);
    checkFlags(where, e);
  }

  for (const stage of [1, 2, 3] as Stage[]) {
    for (const p of PILLARS) {
      if (!mainTasks.some((t) => t.stage === stage && t.pillar === p)) {
        const msg = `stage ${stage} has no main '${p}' task`;
        if (STRICT_STAGES.includes(stage)) err('tasks', msg);
        else warn('tasks', msg);
      }
    }
    if (!pack.events.some((e) => e.stages.includes(stage)))
      warn('events', `no events for stage ${stage}`);
  }

  // ---- 5. onboarding, quiz, personas, assets, minigames ------------------------------------
  const lq = new Map(pack.lifeQuestions.map((q) => [q.id, q]));
  for (const id of ['L1', 'L2', 'L3', 'L4'] as const)
    if (!lq.has(id)) err('onboarding.json', `missing ${id}`);
  lq.get('L1')?.options.forEach((o, i) => {
    if (!o.persona) err('onboarding.json#L1', `options[${i}] has no persona`);
  });
  lq.get('L2')?.options.forEach((o, i) => {
    if (!o.pocketMoneyMonthly) err('onboarding.json#L2', `options[${i}] has no pocketMoneyMonthly`);
  });
  for (const p of PERSONAS)
    if (!lq.get('L1')?.options.some((o) => o.persona === p))
      err('onboarding.json#L1', `no option leads to persona '${p}'`);
  pack.quiz.forEach((q) => {
    const where = fileOf('quiz', q.id);
    if (q.answer >= q.options.length) err(where, `answer ${q.answer} is not an option index`);
    if (!concepts.has(q.concept)) err(where, `concept → '${q.concept}' not found`);
  });
  for (const a of pack.assets) {
    const where = fileOf('assets', a.id);
    if (!concepts.has(a.teaches)) err(where, `teaches → '${a.teaches}' not found`);
    if (a.meanYearlyPct > 0 && !/real returns vary/i.test(a.blurb))
      err(where, 'blurb of a growing asset must say "real returns vary"');
  }
  for (const id of ['kirana_rush', 'scam_or_legit'])
    if (!pack.minigames.some((m) => m.id === id)) err('minigames.json', `missing '${id}'`);

  // ---- 6. text rules: double-blind, brands, projections ------------------------------------
  const allStrings = [
    ...collectStrings(raw, 'content'),
    ...Object.entries(STRINGS).flatMap(([l, d]) => collectStrings(d, `strings/${l}.json`)),
    ...Object.entries(OVERLAYS).flatMap(([l, d]) => collectStrings(d, `strings/${l}.content.json`)),
  ];
  for (const [where, s] of allStrings) {
    if (DOUBLE_BLIND.test(s)) err(where, `contains "IIIT" or "Paisa Path" (double-blind rule)`);
    const brand = s.match(BRANDS);
    if (brand) err(where, `mentions real brand/product '${brand[0]}'`);
    const isQuiz = where.startsWith('content.quiz'); // maths questions, not projections
    if (!isQuiz && /\d+\s?% a year/i.test(s) && !/assum|vary|varies/i.test(s))
      err(where, `projects "% a year" without saying it's an assumption that varies`);
  }

  // ---- 7. strings + overlays ---------------------------------------------------------------
  const en = STRINGS.en;
  const enKeys = new Set(Object.keys(en));
  for (const lang of ['te', 'hi'] as Lang[]) {
    for (const [k, v] of Object.entries(STRINGS[lang])) {
      const where = `strings/${lang}.json`;
      if (!enKeys.has(k)) err(where, `key '${k}' not in en.json`);
      else if (placeholders(v) !== placeholders(en[k]))
        err(
          where,
          `key '${k}' placeholders ${placeholders(v) || '(none)'} ≠ en ${placeholders(en[k]) || '(none)'}`,
        );
      if (!v.trim()) err(where, `key '${k}' is empty`);
    }
  }
  for (const [k, v] of Object.entries(en))
    if (!v.trim()) err('strings/en.json', `key '${k}' is empty`);
  for (const lang of ['te', 'hi'] as Lang[]) {
    const overlay = OVERLAYS[lang];
    const { unresolved } = applyOverlay(pack, overlay);
    for (const k of unresolved)
      err(`strings/${lang}.content.json`, `key '${k}' doesn't resolve to a string in the pack`);
    for (const [k, v] of Object.entries(overlay)) {
      if (/\.choices\.[^.]+\.text$/.test(k) && graphemes(v) > 28)
        warn(
          `strings/${lang}.content.json`,
          `'${k}' is ${graphemes(v)} characters (button fits 28)`,
        );
      if (/\.framings\.[^.]+\.title$/.test(k) && graphemes(v) > 24)
        warn(
          `strings/${lang}.content.json`,
          `'${k}' is ${graphemes(v)} characters (title fits 24)`,
        );
    }
  }

  // ---- 8. balance: can every main task be survived at every pocket-money band? -------------
  const bands = (lq.get('L2')?.options ?? []).flatMap((o) =>
    o.pocketMoneyMonthly ? [o.pocketMoneyMonthly] : [],
  );
  for (const t of pack.tasks) {
    const where = fileOf('tasks', t.id);
    const refs = t.stage === 1 ? bands : [STAGE_REAL_REF[t.stage]];
    for (const ref of refs) {
      const income = STAGE_INCOME_COINS[t.stage];
      const coins = (c: Choice) => (immediateWallet(c) * income) / ref;
      const safe = t.choices.filter((c) => income + coins(c) >= 0);
      const label = t.stage === 1 ? `pocket money ₹${ref}/month` : `stage ${t.stage}`;
      if (!safe.length)
        err(where, `every choice sends a fresh month's wallet below ₹0 at ${label} (restart loop)`);
      else {
        const good = t.choices.find((c) => c.quality === 'good');
        if (good && income + coins(good) < 0)
          warn(where, `the good choice breaks a fresh month's wallet at ${label}`);
      }
    }
  }

  // ---- stats -------------------------------------------------------------------------------
  const allChoices = [...pack.tasks, ...pack.events].flatMap((o) => o.choices);
  const evidenced = new Set(allChoices.flatMap((c) => (c.ncfe ?? []).map((n) => n.item)));
  for (const item of NCFE_ITEMS)
    if (!evidenced.has(item)) warn('ncfe', `no choice gives evidence for '${item}'`);
  const stats: Record<string, number> = {
    mainTasks: mainTasks.length,
    s1: mainTasks.filter((t) => t.stage === 1).length,
    s2: mainTasks.filter((t) => t.stage === 2).length,
    s3: mainTasks.filter((t) => t.stage === 3).length,
    detours: detours.length,
    personaFramings: mainTasks.reduce(
      (n, t) => n + PERSONAS.filter((p) => t.framings[p]).length,
      0,
    ),
    events: pack.events.length,
    explainers: pack.explainers.length,
    concepts: pack.concepts.length,
    quiz: pack.quiz.length,
    choices: allChoices.length,
    delayed: allChoices
      .flatMap((c) => c.effects)
      .filter((e) => (e.delayChapters ?? 0) > 0 || e.repeat).length,
    scams: allChoices.filter((c) => c.scam).length,
    ncfeEvidenced: NCFE_ITEMS.filter((i) => evidenced.has(i)).length,
    ncfeTotal: NCFE_ITEMS.length,
    enKeys: enKeys.size,
    teKeys: Object.keys(STRINGS.te).length,
    hiKeys: Object.keys(STRINGS.hi).length,
    teContentKeys: Object.keys(OVERLAYS.te).length,
  };
  return finish(errors, warnings, stats);
}

function finish(errors: string[], warnings: string[], s: Record<string, number>): ValidationResult {
  const pct = (n: number) => (s.enKeys ? Math.round((n / s.enKeys) * 100) : 0);
  const summary = errors.length
    ? `${errors.length} content error(s)`
    : `OK · ${s.mainTasks} tasks (S1 ${s.s1} · S2 ${s.s2} · S3 ${s.s3}) · ${s.personaFramings} persona framings · ` +
      `${s.detours} detours · ${s.events} events · ${s.explainers} explainers · ${s.concepts} concepts · ` +
      `${s.delayed} delayed/repeat effects · NCFE ${s.ncfeEvidenced}/${s.ncfeTotal} items evidenced · ` +
      `en ${s.enKeys} keys · te ${s.teKeys} keys (${pct(s.teKeys)}%) + ${s.teContentKeys} content · hi ${s.hiKeys} keys (${pct(s.hiKeys)}%)`;
  return { errors, warnings, stats: s, summary };
}

/** Wallet change (real ₹) a choice makes right now, ignoring delayed effects. */
function immediateWallet(c: Choice): number {
  return c.effects.filter((e) => !(e.delayChapters ?? 0)).reduce((n, e) => n + (e.wallet ?? 0), 0);
}

function placeholders(s: string): string {
  return [...s.matchAll(/\{(\w+)\}/g)]
    .map((m) => m[1])
    .sort()
    .join(',');
}

function graphemes(s: string): number {
  return [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(s)].length;
}

function formatPath(path: PropertyKey[]): string {
  return path
    .map((p, i) => (typeof p === 'number' ? `[${p}]` : `${i ? '.' : ''}${String(p)}`))
    .join('');
}

/** Every string value in a JSON tree, tagged with where it lives (ids/keys are skipped). */
function collectStrings(node: unknown, where: string): [string, string][] {
  if (typeof node === 'string') return [[where, node]];
  if (Array.isArray(node)) return node.flatMap((n, i) => collectStrings(n, `${where}[${i}]`));
  if (node && typeof node === 'object') {
    const id = (node as { id?: unknown }).id;
    const base = typeof id === 'string' ? `${where}#${id}` : where;
    return Object.entries(node).flatMap(([k, v]) =>
      k === 'id' || k === 'icon' || k === 'portrait' ? [] : collectStrings(v, `${base}.${k}`),
    );
  }
  return [];
}

// ---- CLI ---------------------------------------------------------------------------------
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { errors, warnings, summary } = validateContent();
  for (const w of warnings) console.warn(`warn  ${w}`);
  for (const e of errors) console.error(`FAIL  ${e}`);
  if (errors.length) {
    console.error(`\n${summary}`);
    process.exit(1);
  }
  console.log(summary);
}
