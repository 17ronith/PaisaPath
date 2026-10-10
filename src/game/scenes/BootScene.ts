import Phaser from 'phaser';
import { COLOR } from '../ui/theme';

/** Sets up the canvas and hands over to Preload. Nothing to load here. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLOR.bg);
    this.input.addPointer(1);
    this.scene.start('Preload');
  }
}
