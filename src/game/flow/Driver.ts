// The router. Asks the engine for the next Step and opens the screen for it.
// Every screen ends by calling advance(this) (answerable steps) or proceed(this)
// (informational steps: chapter_start, stage_end, epilogue).
import type Phaser from 'phaser';
import { getSession } from '@/app/session';
import type { Game, Step } from '@/shared/types';

// Dev builds only: lets a Playwright script read the current step (never shipped).
if (import.meta.env?.DEV) (globalThis as Record<string, unknown>).__lmSession = getSession;

/** Scene keys that show the HUD overlay on top. */
const WITH_HUD = new Set(['ChapterMap', 'Battle', 'MinigameOffer']);

/**
 * Informational steps have no answer method in the Game API. If the engine exposes
 * `ack()` (requested via CONTRACT:), call it so next() moves on; otherwise rely on the
 * engine advancing by itself.
 */
function acknowledge(game: Game): void {
  (game as Game & { ack?: () => void }).ack?.();
}

export function save(): void {
  void getSession()
    .save()
    .catch((e) => console.warn('save failed', e));
}

export function advance(from: Phaser.Scene): void {
  const game = getSession().game;
  if (!game) {
    from.scene.start('Title');
    return;
  }
  route(from, game.next());
}

/** Acknowledge an informational step, persist, then advance. */
export function proceed(from: Phaser.Scene): void {
  const game = getSession().game;
  if (game) {
    acknowledge(game);
    save();
  }
  advance(from);
}

export function route(from: Phaser.Scene, step: Step): void {
  const game = getSession().game;
  let key: string;
  let data: object = { step };
  switch (step.kind) {
    case 'chapter_start':
      key = 'ChapterMap';
      break;
    case 'task':
    case 'event':
      key = 'Battle';
      break;
    case 'minigame_offer':
      key = 'MinigameOffer';
      break;
    case 'invest':
      // Phase 1: no invest screen yet — keep everything in savings.
      if (!from.scene.manager.keys['Invest']) {
        game?.allocate({});
        save();
        advance(from);
        return;
      }
      key = 'Invest';
      break;
    case 'stage_end':
      key = 'StageEnd';
      break;
    case 'epilogue':
      key = 'Epilogue';
      break;
    case 'quiz_after':
      key = 'Quiz';
      data = { mode: 'after' };
      break;
    case 'done':
      key = 'EndReport';
      data = { summary: step.summary };
      break;
  }
  setHud(from, WITH_HUD.has(key));
  from.scene.start(key, data);
}

function setHud(from: Phaser.Scene, on: boolean): void {
  const mgr = from.scene.manager;
  if (!mgr.keys['HUD']) return;
  if (on) {
    if (!mgr.isActive('HUD')) from.scene.launch('HUD');
    else mgr.getScene('HUD').scene.setVisible(true);
  } else if (mgr.isActive('HUD')) {
    mgr.getScene('HUD').scene.setVisible(false);
  }
}
