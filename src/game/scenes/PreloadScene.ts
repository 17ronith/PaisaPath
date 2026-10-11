// Loads fonts + Kenney art (CC0), marks pixel art as NEAREST so it stays crisp under the
// RES× camera, loads Saharsh's character sprites and fills any gaps (NPCs) from Kenney frames.
// Anything missing falls back to code-drawn placeholders, so a bad path never blocks play.
import Phaser from 'phaser';
import { AVATARS, LEGACY_AVATARS } from '../logic/onboarding';
import { BACKDROP_EXTRA, BACKDROP_FOR } from '../ui/Backdrop';
import { MARKET_IMAGES, MARKET_SHEETS, registerMarketAnims } from '../ui/MarketArt';
import { MONEY_SHEETS, registerMoneyAnims } from '../ui/MoneyArt';
import { PANEL_KEYS } from '../ui/PixelPanel';
import { hydTextureKeys, loadHydAssets } from '../ui/hyd';
import { COLOR, text } from '../ui/theme';
import { VIEW } from '../view';

const K = 'assets/kenney/';
const UI = `${K}pixel-ui-pack/9-Slice/`;

const FONTS: [family: string, file: string, weight: string][] = [
  ['PressStart2P', 'assets/fonts/PressStart2P-latin.woff2', '400'],
  ['PressStart2P', 'assets/fonts/PressStart2P-latin-ext.woff2', '400'],
  ['Jersey10', 'assets/fonts/Jersey10-latin.woff2', '400'],
  ['Jersey10', 'assets/fonts/Jersey10-latin-ext.woff2', '400'],
];

/** 16×16 sheets, packed (no spacing). */
export const SHEETS = {
  urban: `${K}rpg-urban-pack/Tilemap/tilemap_packed.png`,
  town: `${K}tiny-town/Tilemap/tilemap_packed.png`,
  dungeon: `${K}tiny-dungeon/Tilemap/tilemap_packed.png`,
} as const;

const NINE_SLICES: Record<string, string> = {
  [PANEL_KEYS.paper]: `${UI}Ancient/white.png`,
  [PANEL_KEYS.card]: `${UI}Colored/grey.png`,
  [PANEL_KEYS.blue]: `${UI}Outline/blue.png`,
  [PANEL_KEYS.red]: `${UI}Outline/red.png`,
  [PANEL_KEYS.green]: `${UI}Outline/green.png`,
  [PANEL_KEYS.dark]: `${UI}space.png`,
  btn_blue: `${UI}Colored/blue.png`,
  btn_blue_pressed: `${UI}Colored/blue_pressed.png`,
  btn_green: `${UI}Colored/green.png`,
  btn_green_pressed: `${UI}Colored/green_pressed.png`,
  btn_red: `${UI}Colored/red.png`,
  btn_red_pressed: `${UI}Colored/red_pressed.png`,
  btn_yellow: `${UI}Colored/yellow.png`,
  btn_yellow_pressed: `${UI}Colored/yellow_pressed.png`,
  btn_grey: `${UI}Colored/grey.png`,
  btn_grey_pressed: `${UI}Colored/grey_pressed.png`,
};

/**
 * Saharsh's 48×48 characters (08_hyderabad_backgrounds/sprites, copied to assets/sprites):
 * five avatars with a `_back` view for the battle platform, the Professor, and NPC portraits.
 */
const SPRITES = [
  ...AVATARS.flatMap((a) => [a, `${a}_back`]),
  'professor',
  'professor_happy',
  'professor_walk_0',
  'professor_walk_1',
  'npc_shady',
  'npc_uncle',
  'npc_friend',
  'npc_shop',
  'caller_wonky',
];

/** Kenney fallbacks, used only for NPCs with no sprite yet. Urban: 27 cols; dungeon: 12 cols. */
const CHARACTERS: [key: string, sheet: keyof typeof SHEETS, frame: number][] = [
  ['npc_aunty', 'dungeon', 100],
  ['npc_shady', 'dungeon', 112],
  ['npc_shop', 'urban', 267],
  ['npc_parent', 'dungeon', 98],
  ['npc_friend', 'urban', 186],
  ['npc_clerk', 'dungeon', 99],
];

/** Placeholder avatars if the sheet fails to load: [skin, hair, shirt, trousers]. */
const AVATAR_COLOURS: [number, number, number, number][] = [
  [0xf0c8a0, 0x302018, 0xd04848, 0x283860],
  [0xd8a878, 0x181010, 0x48a058, 0x404040],
  [0xc08860, 0x402818, 0x4878c8, 0x605040],
  [0xa87050, 0x100808, 0xe0a030, 0x303858],
  [0xe0b090, 0x281810, 0x9060c0, 0x383848],
];

async function loadFonts(): Promise<void> {
  if (typeof FontFace === 'undefined' || !document.fonts) return;
  await Promise.all(
    FONTS.map(async ([family, file, weight]) => {
      const url = new URL(file, document.baseURI).href;
      document.fonts.add(await new FontFace(family, `url(${url})`, { weight }).load());
    }),
  ).catch((e) => console.warn('font load failed, using fallback', e));
}

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload(): void {
    const { width, height } = VIEW;
    const barW = 220;
    this.add
      .rectangle(width / 2, height / 2, barW + 4, 14, COLOR.panelEdge)
      .setStrokeStyle(2, COLOR.accent);
    const fill = this.add
      .rectangle(width / 2 - barW / 2, height / 2, 0, 10, COLOR.accent)
      .setOrigin(0, 0.5);
    this.load.on('progress', (p: number) => (fill.width = barW * p));
    this.load.on('loaderror', (f: Phaser.Loader.File) => console.warn('asset missing:', f.src));

    for (const [key, url] of Object.entries(SHEETS))
      this.load.spritesheet(key, url, { frameWidth: 16, frameHeight: 16 });
    for (const [key, url] of Object.entries(NINE_SLICES)) this.load.image(key, url);
    loadHydAssets(this.load);
    for (const k of SPRITES) this.load.image(k, `assets/sprites/${k}.png`);
    // Old saves keep their avatar key; draw the matching new character for it.
    for (const [old, now] of Object.entries(LEGACY_AVATARS)) {
      this.load.image(old, `assets/sprites/${now}.png`);
      this.load.image(`${old}_back`, `assets/sprites/${now}_back.png`);
    }
    // Hyderabad backdrops (ISSUES #18): 20 × 480×270 PNGs, ~370 KB total, loaded once for every screen.
    for (const f of new Set([...Object.values(BACKDROP_FOR), ...Object.values(BACKDROP_EXTRA)]))
      this.load.image(`bg_${f}`, `assets/backdrops/${f}.png`);
    // Charminar Market device art (~120 KB): icons, 9-slices, animation strips.
    for (const [key, url] of Object.entries(MARKET_IMAGES)) this.load.image(key, url);
    for (const [key, [url, frameWidth, frameHeight]] of Object.entries(MARKET_SHEETS))
      this.load.spritesheet(key, url, { frameWidth, frameHeight });
    // Explainer money flow (~10 KB): wallet, savings jar, outside sprites, coin fx.
    for (const [key, [url, frameWidth, frameHeight]] of Object.entries(MONEY_SHEETS))
      this.load.spritesheet(key, url, { frameWidth, frameHeight });
  }

  async create(): Promise<void> {
    const legacy = Object.keys(LEGACY_AVATARS).flatMap((k) => [k, `${k}_back`]);
    for (const key of [
      ...Object.keys(SHEETS),
      ...Object.keys(NINE_SLICES),
      ...Object.keys(MARKET_IMAGES),
      ...Object.keys(MARKET_SHEETS),
      ...Object.keys(MONEY_SHEETS),
      ...hydTextureKeys(),
      ...SPRITES,
      ...legacy,
    ])
      if (this.textures.exists(key))
        this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    registerMarketAnims(this);
    registerMoneyAnims(this);

    for (const [key, sheet, frame] of CHARACTERS) this.characterFromSheet(key, sheet, frame);
    // A sprite that failed to load gets a code-drawn stand-in, so a bad path never blocks play.
    AVATAR_COLOURS.forEach((c, i) => this.placeholderAvatar(AVATARS[i], c));

    await loadFonts();
    // Warm both faces so the first real text renders in them, not the fallback.
    text(this, -100, -100, '₹0', 'xs').destroy();
    text(this, -100, -100, 'A', 'lg').destroy();
    this.scene.launch('MapBG'); // never stopped: the map animates for the whole session
    this.scene.sendToBack('MapBG');
    this.scene.launch('Sound'); // ISSUES #25: sound toggle on every screen
    this.scene.start('Title');
  }

  private characterFromSheet(key: string, sheet: string, frame: number): void {
    if (this.textures.exists(key) || !this.textures.exists(sheet)) return;
    const ct = this.textures.createCanvas(key, 16, 16);
    if (!ct) return;
    ct.drawFrame(sheet, frame, 0, 0);
    ct.refresh();
    ct.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }

  private placeholderAvatar(
    key: string,
    [skin, hair, shirt, legs]: [number, number, number, number],
  ): void {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(hair).fillRect(5, 1, 6, 3);
    g.fillStyle(skin).fillRect(5, 3, 6, 5);
    g.fillStyle(0x202028).fillRect(6, 5, 1, 1).fillRect(9, 5, 1, 1);
    g.fillStyle(shirt).fillRect(4, 8, 8, 5);
    g.fillStyle(skin).fillRect(3, 9, 1, 3).fillRect(12, 9, 1, 3);
    g.fillStyle(legs).fillRect(5, 13, 2, 3).fillRect(9, 13, 2, 3);
    g.generateTexture(key, 16, 16);
    g.destroy();
    this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
}
