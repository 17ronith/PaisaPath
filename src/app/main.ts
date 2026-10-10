import Phaser from 'phaser';
import { phaserConfig } from '@/game/config';
import { getSession } from './session';

import { saveState } from './storage';
import type { GameState } from '@/shared/types';

// `?demo=1` loads public/demo-save.json (a seeded late-game state) into storage so Title offers
// "Continue" straight into Stage 3 → epilogue → report. Used for the demo video (README §8).
async function maybeLoadDemoSave(): Promise<void> {
  if (!new URLSearchParams(location.search).has('demo')) return;
  try {
    const res = await fetch('./demo-save.json');
    if (res.ok) await saveState((await res.json()) as GameState);
  } catch {
    /* no demo save available; play from the start */
  }
}

// Session first (loads + localizes content), then Phaser.
void maybeLoadDemoSave().then(() => {
  getSession();
  new Phaser.Game(phaserConfig);
});
