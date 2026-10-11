// Helpers the recorder uses to drive the game inside the studio's phone iframe.
// Everything runs under Playwright's fake clock: nothing moves unless we advance time.

/** Texts (and their logical 360×640 centres) visible in the active scenes, top scene first. */
export const FIND = `(re, flags, minAlpha) => {
  const rx = new RegExp(re, flags || 'i');
  const min = minAlpha ?? 0.05;
  // effective alpha/visibility through every parent container (buttons fade in as a group)
  const shown = (o) => {
    let a = 1;
    for (let p = o; p; p = p.parentContainer) {
      if (!p.visible) return 0;
      a *= p.alpha ?? 1;
    }
    return a;
  };
  const g = globalThis.__lmGame;
  const out = [];
  const scenes = g.scene.getScenes(true).filter((s) => s.sys.settings.visible && s.scene.key !== 'MapBG');
  for (const sc of scenes.reverse()) {
    if (sc.input && sc.input.enabled === false) continue;
    const camA = sc.cameras.main.alpha; // a scene can fade its whole camera in (world map)
    const walk = (list) => {
      for (const o of list) {
        if (!o.visible) continue;
        if (o.list) walk(o.list);
        if (o.type === 'Text' && rx.test(o.text) && shown(o) * camA >= min) {
          const b = o.getBounds();
          out.push({ scene: sc.scene.key, text: o.text, x: b.centerX, y: b.centerY });
        }
      }
    };
    walk(sc.children.list);
  }
  return out;
}`;

/** Images whose texture key matches (avatar picker tiles etc.). */
export const FIND_IMAGES = `(re) => {
  const rx = new RegExp(re);
  const g = globalThis.__lmGame;
  const out = [];
  for (const sc of g.scene.getScenes(true)) {
    if (sc.scene.key === 'MapBG') continue;
    const walk = (list) => {
      for (const o of list) {
        if (!o.visible) continue;
        if (o.list) walk(o.list);
        if (o.type === 'Image' && rx.test(o.texture.key)) {
          const b = o.getBounds();
          out.push({ scene: sc.scene.key, key: o.texture.key, x: b.centerX, y: b.centerY });
        }
      }
    };
    walk(sc.children.list);
  }
  return out;
}`;

/** Active scene keys, without the always-on ones. */
export const SCENES = `() => globalThis.__lmGame.scene.getScenes(true).map((s) => s.scene.key)
  .filter((k) => !['MapBG', 'Sound', 'HUD'].includes(k))`;

/**
 * Build a game that serves exactly the step we want to film, then open its screen.
 * spec: { profile, seed, keep: {taskId?, eventId?}, until: {task?|event?|kind?, chapter?}, policy?, patch? }
 * Earlier stages keep all their tasks (so autoplay can play through them); the target's stage keeps
 * only the target task, and events are limited to the one we want (or none).
 */
export const SETUP = `async (spec) => {
  const s = globalThis.__lmSession();
  const { createGame } = await import('/src/engine/game.ts');
  const { autoplay } = await import('/src/engine/autoplay.ts');
  const c = s.content;
  const target = spec.keep?.taskId ? c.tasks.find((t) => t.id === spec.keep.taskId) : null;
  const tasks = target
    ? c.tasks.filter((t) => t.isDetour || t.stage < target.stage || t.id === target.id)
    : c.tasks;
  const events = spec.keep?.eventId ? c.events.filter((e) => e.id === spec.keep.eventId) : spec.keep?.allEvents ? c.events : [];
  const game = createGame({ ...c, tasks, events }, spec.profile, spec.seed ?? 8);
  const u = spec.until;
  const hit = (step, g) =>
    (u.task && step.kind === 'task' && step.task.id === u.task) ||
    (u.event && step.kind === 'event' && step.event.id === u.event) ||
    (u.kind && step.kind === u.kind && (!u.chapter || g.state.chapter >= u.chapter));
  let found = null;
  try {
    autoplay(game, {
      policy: spec.policy ?? 'good',
      seed: 1,
      maxSteps: 400,
      onStep: (step, g) => {
        if (hit(step, g)) { found = step; throw new Error('__found__'); }
      },
    });
  } catch (e) {
    if (String(e.message) !== '__found__') throw e;
  }
  if (!found) throw new Error('setup: target never served ' + JSON.stringify(u));
  if (spec.patch?.savings !== undefined) game.state.bars.savings = spec.patch.savings;
  s.game = game;
  const g = globalThis.__lmGame;
  const live = g.scene.getScenes(true).find((sc) => !['Sound', 'MapBG', 'HUD'].includes(sc.scene.key));
  globalThis.__lmRoute(live, found);
  return { kind: found.kind, chapter: game.state.chapter, stage: game.state.stage };
}`;

/** Play the current game on (good choices) until a step matches, then open that step's screen. */
export const FORWARD = `async (u) => {
  const s = globalThis.__lmSession();
  const { autoplay } = await import('/src/engine/autoplay.ts');
  const start = s.game.state.chapter;
  const hit = (step, g) => step.kind === u.kind && g.state.chapter > start;
  let found = null;
  try {
    autoplay(s.game, { policy: 'good', seed: 1, maxSteps: 200, onStep: (step, g) => {
      if (hit(step, g)) { found = step; throw new Error('__found__'); }
    } });
  } catch (e) { if (String(e.message) !== '__found__') throw e; }
  if (!found) throw new Error('forward: never reached ' + JSON.stringify(u));
  const g = globalThis.__lmGame;
  const live = g.scene.getScenes(true).find((sc) => !['Sound', 'MapBG', 'HUD'].includes(sc.scene.key));
  globalThis.__lmRoute(live, found);
  return found.kind;
}`;
