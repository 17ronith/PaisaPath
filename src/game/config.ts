import Phaser from 'phaser';
import { scenes } from './scenes';
import { GAME_H, GAME_W, RES } from './view';

export { GAME_H, GAME_W } from './view';

/** Zoom every scene's main camera so scenes keep laying out in 360×640 logical units. */
function fitCameras(game: Phaser.Game): void {
  for (const scene of game.scene.scenes) {
    scene.sys.events.on(Phaser.Scenes.Events.START, () => {
      scene.cameras.main.setZoom(RES).centerOn(GAME_W / 2, GAME_H / 2);
    });
  }
}

export const phaserConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_W * RES,
  height: GAME_H * RES,
  backgroundColor: '#1b1b2f',
  // Smooth text and shapes; pixel-art textures opt into NEAREST in PreloadScene.
  antialias: true,
  pixelArt: false,
  roundPixels: true,
  // Overrides index.html's `image-rendering: pixelated` — the canvas is already
  // near device resolution, so smooth downscaling looks cleaner than blocky.
  canvasStyle: 'image-rendering: auto;',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  dom: { createContainer: true },
  callbacks: { postBoot: fitCameras },
  scene: scenes,
};
