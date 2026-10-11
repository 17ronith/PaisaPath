import { describe, expect, it } from 'vitest';
import type { ContentPack } from '@/shared/types';
import { applyOverlay, loadContent, localize, OVERLAYS, SOURCES, STRINGS } from '../index';
import type { Sources } from '../index';
import { validateContent } from '../validate';

/** A deep copy of the real sources, so a test can break one thing and see the validator catch it. */
function sources(): Sources {
  return structuredClone(SOURCES);
}
function stage1(s: Sources): any[] {
  return s.tasks.find((f) => f.file === 'tasks/stage1.json')!.items as any[];
}
function errorsFor(mutate: (s: Sources) => void): string[] {
  const s = sources();
  mutate(s);
  return validateContent({ sources: s }).errors;
}

describe('content pack', () => {
  it('passes every validator check', () => {
    const r = validateContent();
    expect(r.errors).toEqual([]);
    expect(r.summary.startsWith('OK')).toBe(true);
  });

  it('loads through the shared zod schema', () => {
    const pack = loadContent();
    expect(pack.quiz).toHaveLength(5);
    expect(pack.personas.map((p) => p.id).sort()).toEqual([
      'earner',
      'pocket_money',
      'scholarship',
    ]);
  });

  it('covers every pillar × difficulty in Stage 1, each task framed for all 3 personas', () => {
    const pack = loadContent();
    const s1 = pack.tasks.filter((t) => t.stage === 1 && !t.isDetour);
    expect(s1.length).toBeGreaterThanOrEqual(12); // extras (save_hard_s1_02) rotate in by pillar
    const cells = new Set(s1.map((t) => `${t.pillar}/${t.difficulty}`));
    expect(cells.size).toBe(12);
    for (const t of s1) {
      expect(t.framings.pocket_money && t.framings.scholarship && t.framings.earner).toBeTruthy();
      expect(t.choices.filter((c) => c.quality === 'good')).toHaveLength(1);
    }
  });

  it('every concept has its own explainer, and every invest explainer states its assumption', () => {
    const pack = loadContent();
    for (const c of pack.concepts) {
      const x = pack.explainers.find((e) => e.id === c.explainerId);
      expect(x?.concept, c.id).toBe(c.id);
    }
    const invest = new Set(pack.concepts.filter((c) => c.pillar === 'invest').map((c) => c.id));
    for (const x of pack.explainers.filter((e) => invest.has(e.concept))) {
      const texts = x.steps.flatMap((s) => (s.op === 'text' ? [s.text] : []));
      expect(
        texts.some((t) => /Assumes .*a year/.test(t)),
        x.id,
      ).toBe(true);
    }
  });

  it('has at least 4 Stage-1 tasks with delayed or repeating effects', () => {
    const pack = loadContent();
    const delayed = pack.tasks.filter(
      (t) =>
        t.stage === 1 &&
        !t.isDetour &&
        t.choices.some((c) => c.effects.some((e) => (e.delayChapters ?? 0) > 0 || e.repeat)),
    );
    expect(delayed.length).toBeGreaterThanOrEqual(4);
  });

  it('never names the university or a real brand', () => {
    const blob = JSON.stringify(loadContent()) + JSON.stringify(STRINGS) + JSON.stringify(OVERLAYS);
    expect(blob).not.toMatch(/IIIT|Paisa Path/i);
    expect(blob).not.toMatch(/\b(swiggy|zomato|phonepe|paytm|whatsapp|telegram)\b/i);
  });
});

describe('validator catches broken content', () => {
  it('a detour that does not exist', () => {
    const errs = errorsFor((s) => {
      stage1(s)[0].choices[0].detourTaskId = 'detour_nope';
    });
    expect(errs.some((e) => e.includes("detourTaskId → 'detour_nope' not found"))).toBe(true);
    expect(errs.some((e) => e.startsWith('tasks/stage1.json#'))).toBe(true);
  });

  it('a detour target that is a main task', () => {
    const errs = errorsFor((s) => {
      stage1(s)[0].choices[0].detourTaskId = stage1(s)[1].id;
    });
    expect(errs.some((e) => e.includes('is not isDetour:true'))).toBe(true);
  });

  it('an unknown place, concept and trigger event', () => {
    const errs = errorsFor((s) => {
      const t = stage1(s)[0];
      t.framings.default.place = 'nowhere';
      t.concept = 'not_a_concept';
      t.choices[0].effects.push({ label: 'x', triggerEvent: 'no_such_event' });
    });
    expect(errs.some((e) => e.includes("place → 'nowhere' not found"))).toBe(true);
    expect(errs.some((e) => e.includes("concept → 'not_a_concept' not found"))).toBe(true);
    expect(errs.some((e) => e.includes("triggerEvent → 'no_such_event' not found"))).toBe(true);
  });

  it('a task with no good choice, or a missing persona framing', () => {
    const errs = errorsFor((s) => {
      const t = stage1(s)[0];
      for (const c of t.choices) c.quality = 'ok';
      delete t.framings.earner;
    });
    expect(errs.some((e) => e.includes("needs at least one 'good' choice"))).toBe(true);
    expect(errs.some((e) => e.includes('missing framings.earner'))).toBe(true);
  });

  it('schema errors point at the file and entry', () => {
    const errs = errorsFor((s) => {
      stage1(s)[2].choices[1].text = 'THIS BUTTON TEXT IS FAR TOO LONG TO FIT';
    });
    expect(errs.some((e) => /^tasks\/stage1\.json#\w+ › choices\[1\]\.text/.test(e))).toBe(true);
  });

  it('the double-blind rule and real brands', () => {
    const errs = errorsFor((s) => {
      stage1(s)[0].framings.default.text = 'Meet me at the IIIT gate, I ordered on Swiggy.';
    });
    expect(errs.some((e) => e.includes('double-blind'))).toBe(true);
    expect(errs.some((e) => e.includes("real brand/product 'Swiggy'"))).toBe(true);
  });

  it('a projection without its assumption line', () => {
    const errs = errorsFor((s) => {
      const x = (s.explainers[0].items as any[]).find((e) => e.id === 'exp_compounding');
      x.steps = x.steps.filter((st: any) => !(st.op === 'text' && /Assumes/.test(st.text)));
    });
    expect(errs.some((e) => e.includes('exp_compounding') && e.includes('Assumes'))).toBe(true);
  });

  it('a task whose every choice breaks the poorest wallet (restart loop)', () => {
    const errs = errorsFor((s) => {
      for (const c of stage1(s)[0].choices) c.effects = [{ label: 'huge', wallet: -5000 }];
    });
    expect(errs.some((e) => e.includes('restart loop'))).toBe(true);
  });

  it('a Telugu key missing from English, or with different placeholders', () => {
    const r = validateContent({
      strings: { ...STRINGS, te: { 'no.such.key': 'x', 'hud.stage': 'దశ' } },
    });
    expect(r.errors.some((e) => e.includes("key 'no.such.key' not in en.json"))).toBe(true);
    expect(r.errors.some((e) => e.includes("key 'hud.stage' placeholders"))).toBe(true);
  });

  it('an overlay key that does not resolve', () => {
    const r = validateContent({
      overlays: { ...OVERLAYS, te: { 'budget_simple_s1_01.nope': 'x' } },
    });
    expect(r.errors.some((e) => e.includes("'budget_simple_s1_01.nope' doesn't resolve"))).toBe(
      true,
    );
  });
});

describe('localize / applyOverlay', () => {
  const pack: ContentPack = loadContent();

  it('replaces framings, choices (by id), effects and options (by index), and never mutates', () => {
    const before = JSON.stringify(pack);
    const { pack: out, unresolved } = applyOverlay(pack, {
      'budget_simple_s1_01.framings.scholarship.text': 'TE framing',
      'budget_simple_s1_01.choices.chips.text': 'TE chips',
      'budget_simple_s1_01.choices.chips.effects.0.label': 'TE label',
      'K1.options.1': 'TE option',
      'L1.options.0.text': 'TE life option',
      'pocket_money.blurb': 'TE blurb',
    });
    expect(unresolved).toEqual([]);
    const t = out.tasks.find((x) => x.id === 'budget_simple_s1_01')!;
    expect(t.framings.scholarship!.text).toBe('TE framing');
    const chips = t.choices.find((c) => c.id === 'chips')!;
    expect(chips.text).toBe('TE chips');
    expect(chips.effects[0].label).toBe('TE label');
    expect(out.quiz.find((q) => q.id === 'K1')!.options[1]).toBe('TE option');
    expect(out.lifeQuestions[0].options[0].text).toBe('TE life option');
    expect(out.personas.find((p) => p.id === 'pocket_money')!.blurb).toBe('TE blurb');
    expect(JSON.stringify(pack)).toBe(before);
  });

  it('reports keys that do not resolve and never invents new fields', () => {
    const { pack: out, unresolved } = applyOverlay(pack, {
      'nope.text': 'x',
      'budget_simple_s1_01.choices.nope.text': 'x',
      'budget_simple_s1_01.newField': 'x',
      'budget_simple_s1_01.pressure': 'x',
    });
    expect(unresolved).toHaveLength(4);
    expect(JSON.stringify(out)).toBe(JSON.stringify(pack));
  });

  it('English is untouched and Telugu falls back to English for anything not translated', () => {
    expect(JSON.stringify(localize(pack, 'en'))).toBe(JSON.stringify(pack));
    const te = localize(pack, 'te');
    expect(te.tasks).toHaveLength(pack.tasks.length);
    const untouched = (id: string) =>
      JSON.stringify(te.tasks.find((t) => t.id === id)) ===
      JSON.stringify(pack.tasks.find((t) => t.id === id));
    expect(untouched('budget_hard_s3_01')).toBe(true);
    expect(untouched('safety_medium_s1_01')).toBe(false);
  });

  it('Telugu fully covers the two demo tasks (every persona framing, choice and lesson) and onboarding', () => {
    const te = localize(pack, 'te');
    const telugu = /[ఀ-౿]/;
    for (const id of ['budget_simple_s1_01', 'safety_medium_s1_01']) {
      const t = te.tasks.find((x) => x.id === id)!;
      for (const f of Object.values(t.framings)) expect(f!.text).toMatch(telugu);
      for (const c of t.choices) {
        expect(c.text, `${id}.${c.id}`).toMatch(telugu);
        expect(c.lesson).toMatch(telugu);
      }
    }
    for (const q of te.lifeQuestions) for (const o of q.options) expect(o.text).toMatch(/[ఀ-౿]|₹/);
    for (const q of te.quiz) expect(q.text).toMatch(telugu);
    for (const p of te.personas) expect(p.label).toMatch(telugu);
  });
});

describe('strings', () => {
  it('Telugu and Hindi cover (almost) all UI strings; every key exists in English', () => {
    const en = Object.keys(STRINGS.en);
    expect(Object.keys(STRINGS.te).length / en.length).toBeGreaterThan(0.9);
    expect(Object.keys(STRINGS.hi).length / en.length).toBeGreaterThan(0.9);
    for (const lang of ['te', 'hi'] as const) {
      for (const k of Object.keys(STRINGS[lang])) expect(en).toContain(k);
    }
  });

  it('Hindi content overlay covers the same keys as the Telugu overlay', () => {
    expect(Object.keys(OVERLAYS.hi).sort()).toEqual(Object.keys(OVERLAYS.te).sort());
  });
});

describe('stages 2 and 3', () => {
  const pack: ContentPack = loadContent();

  it.each([2, 3] as const)(
    'stage %i has 6 main tasks covering every pillar, all persona-framed',
    (stage) => {
      const tasks = pack.tasks.filter((t) => t.stage === stage && !t.isDetour);
      expect(tasks).toHaveLength(6);
      expect(new Set(tasks.map((t) => t.pillar)).size).toBe(4);
      for (const t of tasks)
        expect(Object.keys(t.framings).sort()).toEqual([
          'default',
          'earner',
          'pocket_money',
          'scholarship',
        ]);
    },
  );

  it('at least 6 delayed or repeating effects across the pack, and every concept returns in a later disguise', () => {
    const choices = [...pack.tasks, ...pack.events].flatMap((o) => o.choices);
    const delayed = choices
      .flatMap((c) => c.effects)
      .filter((e) => (e.delayChapters ?? 0) > 0 || e.repeat);
    expect(delayed.length).toBeGreaterThanOrEqual(6);
    // A Stage-1 mistake can only come back "in disguise" if a later task or an event shares its concept.
    const later = new Set([
      ...pack.tasks.filter((t) => t.stage > 1 || t.isDetour).map((t) => t.concept),
      ...pack.events.flatMap((e) => (e.concept ? [e.concept] : [])),
    ]);
    const s1 = pack.tasks.filter((t) => t.stage === 1 && !t.isDetour).map((t) => t.concept);
    const missing = s1.filter((c) => !later.has(c));
    expect(missing).toEqual([]);
  });
});
