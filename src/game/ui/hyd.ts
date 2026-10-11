// Hyderabad art: the animated world map (09_hyderabad_map) and the 20 scene backdrops
// (08_hyderabad_backgrounds), all our own pixel art at 1×. Keys + loader + place mapping.
import Phaser from 'phaser';

const MAP = 'assets/hyd/map/';
const BG = 'assets/hyd/bg/';

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

/** Backdrop texture key → file. */
const BACKDROPS: Record<string, string> = {
  bg_charminar: '01_charminar.png',
  bg_durgam: '02_durgam_cheruvu.png',
  bg_tankbund: '03_tank_bund_buddha.png',
  bg_ramoji: '04_film_city.png',
  bg_shilparamam: '05_shilparamam.png',
  bg_birla: '06_birla_mandir.png',
  bg_qutb: '07_qutb_shahi_tombs.png',
  bg_bus_stop: '08_bus_stop.png',
  bg_hitec: '09_hitec_city.png',
  bg_home: '10_home.png',
  bg_kirana: '11_kirana.png',
  bg_college: '12_college.png',
  bg_bank: '13_bank.png',
  bg_mobile_shop: '14_mobile_shop.png',
  bg_clinic: '15_clinic.png',
  bg_canteen: '16_canteen.png',
  bg_turf: '17_turf.png',
  bg_campus: '18_campus.png',
  bg_home60: '19_home_age60.png',
  bg_office: '20_office_lobby.png',
};

/** places.json id → backdrop key (every place has its own scene). */
const PLACE_BACKDROP: Record<string, string> = {
  durgam_cheruvu: 'bg_durgam',
  gachibowli: 'bg_hitec',
};

export function backdropForPlace(place: string | undefined): string {
  if (!place) return 'bg_home';
  return PLACE_BACKDROP[place] ?? `bg_${place}`;
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
    ...Object.keys(BACKDROPS),
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
  for (const [key, file] of Object.entries(BACKDROPS)) load.image(key, `${BG}${file}`);
}
