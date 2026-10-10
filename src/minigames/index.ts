// Mini-game scenes, keyed by MiniGameDef['id'] (also each scene's Phaser key).
// Start one with data { onDone: (won: boolean) => void }: it calls onDone exactly once (quit and
// external shutdown report won = false), then this.scene.stop(). See docs/plan/CONTRACTS.md §4.3.
import type Phaser from 'phaser';
import type { MiniGameDef } from '@/shared/types';
import { KiranaRushScene } from './KiranaRush';
import { ScamOrLegitScene } from './ScamOrLegit';

export type { MiniGameData } from './SortGameScene';

export const minigameScenes: Record<MiniGameDef['id'], typeof Phaser.Scene> = {
  kirana_rush: KiranaRushScene,
  scam_or_legit: ScamOrLegitScene,
};
