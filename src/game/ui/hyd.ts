// Hyderabad art: the animated world map (09_hyderabad_map), all our own pixel art at 1×.
// The 20 scene backdrops load once, through Backdrop.ts (public/assets/backdrops, keys bg_NN_name);
// this module only maps places onto those keys.
import Phaser from 'phaser';
import { BACKDROP_EXTRA, BACKDROP_FOR, backdropKey } from './Backdrop';

const MAP = 'assets/hyd/map/';

export const MAP_DATA_KEY = 'map_data';
export const MAP_W = 480;
export const MAP_H = 270;

export const MAP_NODE_IDS = [
  'charminar',
  'qutb',
  'durgam',
  'shilparamam',
  'hitec',
  'birla',
  'tankbund',
  'ramoji',
] as const;

/** A place's backdrop texture key (home when the place has none). */
export function backdropForPlace(place: string | undefined): string {
  return backdropKey(place) ?? backdropKey('home')!;
}

const DIRS = ['up', 'down', 'left', 'right'];

/** Every texture key this module loads, so Preload can mark them NEAREST. */
export function hydTextureKeys(): string[] {
  return [
    'map_base',
    'map_ripple_0',
    'map_ripple_1',
    'map_ripple_2',
    ...MAP_NODE_IDS.flatMap((id) => [`icon_${id}`, `icon_${id}_done`]),
    ...DIRS.flatMap((d) => [0, 1].flatMap((f) => [`auto_${d}_${f}`, `boat_${d}_${f}`])),
    'bird_0',
    'bird_1',
    'bird_2',
    ...[...Object.values(BACKDROP_FOR), ...Object.values(BACKDROP_EXTRA)].map((f) => `bg_${f}`),
  ];
}

export function loadHydAssets(load: Phaser.Loader.LoaderPlugin): void {
  load.json(MAP_DATA_KEY, `${MAP}map_data.json`);
  load.image('map_base', `${MAP}map_base.png`);
  [0, 1, 2].forEach((i) => load.image(`map_ripple_${i}`, `${MAP}water_ripple_${i}.png`));
  for (const id of MAP_NODE_IDS) {
    load.image(`icon_${id}`, `${MAP}icons/${id}.png`);
    load.image(`icon_${id}_done`, `${MAP}icons/${id}_done.png`);
  }
  for (const d of DIRS)
    for (const f of [0, 1]) {
      load.image(`auto_${d}_${f}`, `${MAP}sprites/auto_${d}_${f}.png`);
      load.image(`boat_${d}_${f}`, `${MAP}sprites/boat_${d}_${f}.png`);
    }
  [0, 1, 2].forEach((i) => load.image(`bird_${i}`, `${MAP}sprites/bird_${i}.png`));
}
