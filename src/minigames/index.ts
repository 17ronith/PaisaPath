// Saharsh fills this in Phase 2. Each scene is started with data { onDone: (won: boolean) => void }
// and must call onDone exactly once, then this.scene.stop(). Keys = MiniGameDef['id'].
import type Phaser from 'phaser';
import type { MiniGameDef } from '@/shared/types';

export const minigameScenes: Partial<Record<MiniGameDef['id'], typeof Phaser.Scene>> = {};
