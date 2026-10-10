import Phaser from 'phaser';
import { phaserConfig } from '@/game/config';
import { getSession } from './session';

// Session first (loads + localizes content), then Phaser.
getSession();
new Phaser.Game(phaserConfig);
