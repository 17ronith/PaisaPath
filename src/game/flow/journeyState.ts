// Where the avatar stands on the world map between screens, plus a typed handle on the
// persistent map scene. The engine owns the chapter; this only remembers whether the walk to
// the chapter's landmark has happened yet (a reload simply replays the last walk).
import type Phaser from 'phaser';
import { JOURNEY, landmarkForChapter, type LandmarkId } from '../logic/journey';
import type { MapBackgroundScene } from '../scenes/MapBackgroundScene';

let avatarAt: LandmarkId | null = null;

export function mapBG(scene: Phaser.Scene): MapBackgroundScene | undefined {
  const mgr = scene.scene.manager;
  return mgr.keys['MapBG'] ? (mgr.getScene('MapBG') as MapBackgroundScene) : undefined;
}

/** Landmark the avatar is standing at, assuming the walk for `chapter` hasn't happened yet. */
export function avatarLandmark(chapter: number): LandmarkId {
  if (avatarAt) return avatarAt;
  return chapter <= 1 ? JOURNEY[0].id : landmarkForChapter(chapter - 1).id;
}

export function setAvatarLandmark(id: LandmarkId | null): void {
  avatarAt = id;
}

/**
 * Use the living map as this screen's background: leave the camera transparent and lay a
 * dark veil over the map so text stays readable. `drift` pans the map slowly (menus).
 */
export function overMap(scene: Phaser.Scene, veil = 0.7, drift = true): void {
  const bg = mapBG(scene);
  if (!bg) {
    scene.cameras.main.setBackgroundColor(0x1f2a1e);
    return;
  }
  const { width, height } = scene.scale.gameSize;
  // gameSize is RES× the logical view; the camera zoom maps it back, so cover generously.
  scene.add.rectangle(0, 0, width, height, 0x1f2a1e, veil).setOrigin(0).setDepth(-1000);
  if (drift) {
    bg.hideAvatar();
    bg.drift(true);
  }
}
