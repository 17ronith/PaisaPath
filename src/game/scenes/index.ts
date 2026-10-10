// Ronith owns this file. Scene keys are fixed in docs/plan/CONTRACTS.md §4.4.
// Mini-game scenes come from Saharsh via src/minigames and are registered here once.
import type Phaser from 'phaser';
import { minigameScenes } from '@/minigames';
import { BootScene } from './BootScene';

export const scenes: (typeof Phaser.Scene)[] = [
  BootScene,
  ...(Object.values(minigameScenes) as (typeof Phaser.Scene)[]),
];
