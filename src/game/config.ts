import Phaser from 'phaser';
import { scenes } from './scenes';
import { DESIGN_H, GAME_H, GAME_W, RES } from './view';

export { GAME_H, GAME_W } from './view';

/**
 * Scenes laid out strictly in the 640 design box (device frames, mini-game arenas): on a
 * taller screen they sit centred, with their background colour filling above and below.
 * Every other scene is top-aligned and anchors its bottom UI to VIEW.height.
 */
const CENTRED = new Set(['Market', 'Explainer', 'kirana_rush', 'scam_or_legit']);

/** Zoom every scene's main camera so scenes keep laying out in logical units. */
function fitCameras(game: Phaser.Game): void {
  for (const scene of game.scene.scenes) {
    scene.sys.events.on(Phaser.Scenes.Events.START, () => {
      const key = scene.sys.settings.key;
      scene.cameras.main
        .setZoom(RES)
        .centerOn(GAME_W / 2, CENTRED.has(key) ? DESIGN_H / 2 : GAME_H / 2);
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
  // index.html's flex container centres the canvas; Phaser centring it too (margins) would
  // push it off-centre on wide screens.
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.NO_CENTER },
  dom: { createContainer: true },
  callbacks: { postBoot: fitCameras },
  scene: scenes,
};
