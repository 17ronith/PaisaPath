// The living Hyderabad map. Launched once after Preload and never stopped, at the bottom of
// the scene stack, so it keeps animating for as long as the app is open: every screen that
// leaves its camera transparent (Title, Onboarding, Quiz, WorldMap) shows it underneath.
// Built live from Monish's parts (09_hyderabad_map: base + ripples + boat + auto + birds,
// timings from map_data.json) instead of the 5.6 MB GIF — same 18 s loop, ~200 KB.
import Phaser from 'phaser';
import { stepBlip } from '../music';
import { MAP_DATA_KEY, MAP_H, MAP_NODE_IDS, MAP_W } from '../ui/hyd';
import type { Point } from '../logic/journey';
import { RES, VIEW } from '../view';

/** World units per map pixel: 3 → 1440×810, a whole number so map pixels stay square. */
export const MAP_SCALE = 3;
/** Where a focused landmark sits on screen (between the journey strip and the news card). */
const FOCUS_Y = 300;
/** Extra ground below the map so bottom-edge landmarks can still be centred above the card. */
const SKIRT = 260;
/** Where the avatar stands relative to a landmark's pad point (map px): in front, to the right. */
const STAND: Point = [22, 6];
const S = MAP_SCALE;

/** ISSUES #31: how bright the city's lights are at each time of day (0 = off). */
const LIGHT: Record<'day' | 'evening' | 'night', number> = { day: 0, evening: 0.55, night: 1 };
/** Map px between street lamps along a road. */
const LAMP_SPACING = 30;
/**
 * What lights up after dark on each landmark icon, by palette colour: `warm` pixels (arches,
 * doors, windows) glow lamp-yellow, `office` glass gets a scatter of lit panes, `leds` colour-
 * cycle (Durgam Cheruvu's cable bridge, Shilparamam's festoons), `flood` washes a monument white.
 */
const LIT: Record<
  string,
  { warm?: string[]; office?: string[]; leds?: string[]; flood?: boolean }
> = {
  charminar: { warm: ['7a5038', '5a3824', 'c8e6f6'] },
  qutb: { warm: ['7a5038', '5a3824'] },
  durgam: { leds: ['d0dcea', 'e8f0fa'] },
  shilparamam: { warm: ['4a2e1e'], leds: ['ff4a5a', '3a8cf0', 'ffc828', '3ac86a'] },
  hitec: { office: ['8ccaf2', '5aa6e2', 'a8daf6', '74d2c6', '4aaca6', 'a8bce8', '8aa0d4'] },
  birla: { warm: ['7a7e9c', '6a6e90'], flood: true },
  tankbund: { flood: true },
  ramoji: { warm: ['5a2848', '3c1830', '58c0d0', '3a90b0'] },
};

type Dir = 'up' | 'down' | 'left' | 'right';
interface MapNode {
  id: string;
  name: string;
  x: number;
  y: number;
}
interface Flock {
  dir: 'left' | 'right';
  y: number;
  amp: number;
  wave: number;
  speed: number;
  x0: number;
  formation: [number, number][];
}
interface MapData {
  nodes: MapNode[];
  edges: { from: string; to: string; path: Point[] }[];
  boat: { points: [number, number, Dir, 'behind' | 'front'][] };
  auto: { loop: [number, number, Dir][] };
  birds: { flap_order: number[]; wrap: [number, number]; flocks: Flock[] };
  time_of_day: Record<'day' | 'evening' | 'night', string>;
}

export type TimeOfDay = 'day' | 'evening' | 'night';

export class MapBackgroundScene extends Phaser.Scene {
  data_!: MapData;
  private tinted: Phaser.GameObjects.Image[] = [];
  private ripple!: Phaser.GameObjects.Image;
  private boat!: Phaser.GameObjects.Image;
  private auto!: Phaser.GameObjects.Image;
  private birds: Phaser.GameObjects.Image[][] = [];
  private icons = new Map<string, Phaser.GameObjects.Image>();
  private avatar?: Phaser.GameObjects.Image;
  private tint = 0xffffff;
  private tintTween?: Phaser.Tweens.Tween;
  private driftTween?: Phaser.Tweens.Tween;
  private walking = false;
  private skirt?: Phaser.GameObjects.Rectangle;
  /** ISSUES #26: zoomed out to the whole city (WorldMap), vs street level. */
  private overviewOn = false;
  private routeDots?: Phaser.GameObjects.Graphics;
  // ISSUES #31: night lights — current level, lamps, landmark windows, vehicle lights.
  private light = 0;
  private lightsOff = false;
  private lamps: { glow: Phaser.GameObjects.Image; parts: Phaser.GameObjects.GameObject[] }[] = [];
  private windows: Phaser.GameObjects.Image[] = [];
  private leds: Phaser.GameObjects.Image[] = [];
  private pools: Phaser.GameObjects.Image[] = [];
  private headlight?: Phaser.GameObjects.Image;
  private lantern?: Phaser.GameObjects.Image;

  constructor() {
    super('MapBG');
  }

  create(): void {
    this.data_ = this.cache.json.get(MAP_DATA_KEY) as MapData;
    const cam = this.cameras.main;
    cam.setBounds(0, 0, MAP_W * S, MAP_H * S + SKIRT);
    // Ground below the map's frame (only ever seen behind the bottom card).
    this.skirt = this.add
      .rectangle(0, MAP_H * S, MAP_W * S, SKIRT, 0xa8da80)
      .setOrigin(0)
      .setDepth(-3);
    if (!this.data_ || !this.textures.exists('map_base')) return;

    this.tinted = [];
    this.tinted.push(this.add.image(0, 0, 'map_base').setOrigin(0).setScale(S).setDepth(-2));
    this.ripple = this.add.image(0, 0, 'map_ripple_0').setOrigin(0).setScale(S).setDepth(-1);
    this.tinted.push(this.ripple);

    for (const n of this.data_.nodes) {
      const icon = this.add
        .image(n.x * S, n.y * S, `icon_${n.id}`)
        .setOrigin(32 / 64, 66 / 72)
        .setScale(S)
        .setDepth(n.y);
      this.icons.set(n.id, icon);
      this.tinted.push(icon);
    }
    this.boat = this.add
      .image(0, 0, 'boat_down_0')
      .setOrigin(8 / 16, 10 / 13)
      .setScale(S);
    this.auto = this.add
      .image(0, 0, 'auto_right_0')
      .setOrigin(6 / 12, 10 / 11)
      .setScale(S);
    this.tinted.push(this.boat, this.auto);
    this.birds = this.data_.birds.flocks.map((f) =>
      f.formation.map(() => {
        const b = this.add
          .image(0, 0, 'bird_0')
          .setOrigin(4 / 9, 2 / 5)
          .setScale(S)
          .setDepth(1000);
        this.tinted.push(b);
        return b;
      }),
    );
    this.buildLights();
    this.centerOnMap(this.data_.nodes[0]?.x ?? MAP_W / 2, MAP_H / 2);
    this.drift(true);
  }

  update(time: number): void {
    if (!this.data_ || !this.ripple) return;
    const d = this.data_;
    this.ripple.setTexture(`map_ripple_${Math.floor(time / 250) % 3}`);

    const bp = d.boat.points[Math.floor(time / 100) % d.boat.points.length];
    const tank = d.nodes.find((n) => n.id === 'tankbund');
    this.boat
      .setTexture(`boat_${bp[2]}_${Math.floor(time / 300) % 2}`)
      .setPosition(bp[0] * S, bp[1] * S)
      .setDepth(tank ? tank.y + (bp[3] === 'front' ? 0.5 : -0.5) : bp[1]);

    const ap = d.auto.loop[Math.floor(time / 100) % d.auto.loop.length];
    this.auto
      .setTexture(`auto_${ap[2]}_${Math.floor(time / 150) % 2}`)
      .setPosition(ap[0] * S, ap[1] * S)
      .setDepth(ap[1]);

    const step = Math.floor(time / 100);
    const [w0, w1] = d.birds.wrap;
    const span = w1 - w0;
    d.birds.flocks.forEach((f, fi) => {
      const raw = f.x0 - w0 + (f.dir === 'right' ? 1 : -1) * f.speed * step;
      const lx = w0 + (((raw % span) + span) % span);
      const ly = f.y + f.amp * Math.sin((2 * Math.PI * lx) / f.wave);
      f.formation.forEach(([ox, oy], k) => {
        const frame = d.birds.flap_order[(step + k) % d.birds.flap_order.length];
        this.birds[fi][k]
          .setTexture(`bird_${frame}`)
          .setPosition((lx + ox) * S, (ly + oy) * S)
          .setFlipX(f.dir === 'left');
      });
    });
    this.updateLights(time, ap, bp);
  }

  // ---- camera --------------------------------------------------------------------------

  private centerOnMap(mx: number, my: number): void {
    this.cameras.main.centerOn(mx * S, my * S);
  }

  /**
   * ISSUES #26: the whole city in one view, fitted between screen rows y0..y1 (logical px),
   * so a chapter opens on the map rather than already zoomed into a landmark. Snaps to whole
   * device pixels per map pixel when that still fills most of the width, so the art stays crisp.
   */
  overview(y0: number, y1: number): void {
    this.drift(false);
    const cam = this.cameras.main;
    cam.stopFollow();
    cam.resetFX(); // a glide still running from the last screen must not land after this
    cam.zoomEffect.reset();
    const fit = Math.min(VIEW.width / (MAP_W * S), (y1 - y0) / (MAP_H * S));
    const snap = Math.floor(fit * S * RES) / (S * RES);
    const f = snap >= fit * 0.85 ? snap : fit;
    cam.removeBounds();
    cam.setZoom(RES * f);
    cam.centerOn((MAP_W * S) / 2, (MAP_H * S) / 2 - ((y0 + y1) / 2 - VIEW.height / 2) / f);
    this.skirt?.setVisible(false); // the map reads as a framed card, no ground slab under it
    this.overviewOn = true;
  }

  /** Where a map point lands on screen (logical px) under the current camera. */
  toScreen(mx: number, my: number): { x: number; y: number } {
    const cam = this.cameras.main;
    const f = cam.zoom / RES;
    return {
      x: VIEW.width / 2 + (mx * S - cam.midPoint.x) * f,
      y: VIEW.height / 2 + (my * S - cam.midPoint.y) * f,
    };
  }

  /** A dotted trail along the road the avatar is about to walk (overview only). */
  showRoute(points: Point[]): void {
    this.routeDots?.destroy();
    if (points.length < 2) return;
    const g = this.add.graphics().setDepth(999);
    const r = 1.6 * S;
    let acc = 0;
    for (let i = 1; i < points.length; i++) {
      const [x0, y0] = points[i - 1];
      const [x1, y1] = points[i];
      const seg = Math.hypot(x1 - x0, y1 - y0);
      for (; acc <= seg; acc += 7) {
        const x = (x0 + ((x1 - x0) * acc) / seg) * S;
        const y = (y0 + ((y1 - y0) * acc) / seg) * S;
        g.fillStyle(0x3a2a1e, 0.9).fillCircle(x, y, r + S);
        g.fillStyle(0xffd84a, 1).fillCircle(x, y, r);
      }
      acc -= seg;
    }
    this.routeDots = g;
    this.tweens.add({ targets: g, alpha: 0.45, yoyo: true, repeat: -1, duration: 600 });
  }

  /** Back to street level, centred on a map point (gliding when duration > 0). */
  private toStreet(mx: number, my: number, duration: number): Promise<void> {
    this.routeDots?.destroy();
    this.routeDots = undefined;
    const cam = this.cameras.main;
    const bw = MAP_W * S;
    const bh = MAP_H * S + SKIRT;
    const hw = VIEW.width / 2;
    const hh = VIEW.height / 2;
    // Land exactly where the bounds would clamp to, so restoring them doesn't jump.
    const x = Phaser.Math.Clamp(mx * S, hw, bw - hw);
    const y = Phaser.Math.Clamp(my * S, hh, bh - hh);
    const done = (): void => {
      cam.setZoom(RES).centerOn(x, y).setBounds(0, 0, bw, bh);
      this.overviewOn = false;
    };
    if (!this.overviewOn || duration <= 0) {
      if (this.overviewOn) done();
      this.skirt?.setVisible(true);
      return Promise.resolve();
    }
    this.skirt?.setVisible(true);
    return new Promise((resolve) => {
      cam.zoomTo(RES, duration, 'Sine.easeInOut', true);
      cam.pan(
        x,
        y,
        duration,
        'Sine.easeInOut',
        true,
        (_c: Phaser.Cameras.Scene2D.Camera, p: number) => {
          if (p < 1) return;
          done();
          resolve();
        },
      );
    });
  }

  /** Slow side-to-side drift behind menus (title, onboarding, quiz). */
  drift(on: boolean): void {
    this.driftTween?.stop();
    this.driftTween = undefined;
    if (on) void this.toStreet(MAP_W / 2, MAP_H / 2, 0);
    if (!on || this.walking) return;
    const cam = this.cameras.main;
    const start = cam.midPoint.x / S;
    const counter = { x: start };
    this.driftTween = this.tweens.add({
      targets: counter,
      x: { from: 72, to: MAP_W - 72 },
      duration: 26000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: () => this.centerOnMap(counter.x, MAP_H / 2),
    });
  }

  /** Pan to a landmark (or map point); from the overview this glides down to street level. */
  focus(target: string | Point, duration = 700): Promise<void> {
    this.drift(false);
    const p = typeof target === 'string' ? this.node(target) : { x: target[0], y: target[1] };
    if (!p) return Promise.resolve();
    const cam = this.cameras.main;
    cam.stopFollow();
    const cy = p.y + (320 - FOCUS_Y - 20) / S;
    if (this.overviewOn) return this.toStreet(p.x, cy, Math.max(duration, 900));
    if (duration <= 0) cam.centerOn(p.x * S, cy * S);
    else cam.pan(p.x * S, cy * S, duration, 'Sine.easeInOut', true);
    return Promise.resolve();
  }

  node(id: string): MapNode | undefined {
    return this.data_?.nodes.find((n) => n.id === id);
  }

  // ---- landmarks + time of day ---------------------------------------------------------

  setDone(ids: string[]): void {
    for (const id of MAP_NODE_IDS) {
      const icon = this.icons.get(id);
      icon?.setTexture(ids.includes(id) ? `icon_${id}_done` : `icon_${id}`);
    }
  }

  setTimeOfDay(tod: TimeOfDay, duration = 1000): void {
    const hex = this.data_?.time_of_day?.[tod] ?? '#ffffff';
    const to = Phaser.Display.Color.HexStringToColor(hex);
    const from = Phaser.Display.Color.IntegerToColor(this.tint);
    const light0 = this.light;
    const light1 = LIGHT[tod];
    this.tintTween?.stop();
    const apply = (c: number): void => {
      this.tint = c;
      for (const img of this.tinted) img.setTint(c);
      if (this.skirt) {
        const g = Phaser.Display.Color.IntegerToColor(c);
        this.skirt.fillColor = Phaser.Display.Color.GetColor(
          (168 * g.red) / 255,
          (218 * g.green) / 255,
          (128 * g.blue) / 255,
        );
      }
      this.avatar?.setTint(c);
    };
    if (duration <= 0) {
      this.light = light1;
      return apply(to.color);
    }
    this.tintTween = this.tweens.addCounter({
      from: 0,
      to: 100,
      duration,
      onUpdate: (tw) => {
        const v = tw.getValue() ?? 100;
        const c = Phaser.Display.Color.Interpolate.ColorWithColor(from, to, 100, v);
        this.light = light0 + ((light1 - light0) * v) / 100;
        apply(Phaser.Display.Color.GetColor(c.r, c.g, c.b));
      },
    });
  }

  // ---- night lights (ISSUES #31) -------------------------------------------------------
  // Light sources are never tinted (they make light, they don't receive it) and draw with
  // ADD blending, so they read as glows over the multiply-tinted evening and night map.

  private buildLights(): void {
    this.glowTexture();
    const nodes = this.data_.nodes;
    for (const n of nodes) {
      // A warm pool of light on the forecourt of every landmark.
      this.pools.push(this.glow(n.x, n.y - 6, 70, 0xffc070, n.y - 0.5));
      const spec = LIT[n.id];
      if (!spec) continue;
      const lit = this.iconOverlay(n.id, spec, 'lit');
      const led = this.iconOverlay(n.id, spec, 'led');
      for (const [key, list] of [
        [lit, this.windows],
        [led, this.leds],
      ] as const)
        if (key)
          list.push(
            this.add
              .image(n.x * S, n.y * S, key)
              .setOrigin(32 / 64, 66 / 72)
              .setScale(S)
              .setDepth(n.y + 0.01)
              .setBlendMode(Phaser.BlendModes.ADD)
              .setAlpha(0),
          );
    }
    this.placeLamps();
    this.headlight = this.glow(0, 0, 16, 0xfff0b0, 1001);
    this.lantern = this.glow(0, 0, 14, 0xffb050, 1001);
  }

  /** A soft round glow, `size` map px across, centred on a map point. */
  private glow(mx: number, my: number, size: number, color: number, depth: number) {
    return this.add
      .image(mx * S, my * S, 'map_glow')
      .setScale((size * S) / 64)
      .setTint(color)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(depth)
      .setAlpha(0);
  }

  private glowTexture(): void {
    if (this.textures.exists('map_glow')) return;
    const tex = this.textures.createCanvas('map_glow', 64, 64);
    if (!tex) return;
    const ctx = tex.getContext();
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,255,255,0.55)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    tex.refresh();
  }

  /** Build a landmark's light overlay from its icon: the pixels that light up, nothing else. */
  private iconOverlay(id: string, spec: (typeof LIT)[string], kind: 'lit' | 'led'): string | null {
    const key = `icon_${id}_${kind}`;
    if (this.textures.exists(key)) return key;
    if (kind === 'led' && !spec.leds) return null;
    const src = this.textures.get(`icon_${id}`).getSourceImage() as HTMLImageElement;
    const { width: w, height: h } = src;
    const tex = this.textures.createCanvas(key, w, h);
    if (!tex) return null;
    const ctx = tex.getContext();
    ctx.drawImage(src, 0, 0);
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    const hex = (i: number): string =>
      ((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]).toString(16).padStart(6, '0');
    for (let i = 0; i < d.length; i += 4) {
      const px = i / 4;
      const x = px % w;
      const y = Math.floor(px / w);
      const c = hex(i);
      let rgba: [number, number, number, number] = [0, 0, 0, 0];
      if (d[i + 3] === 255) {
        if (kind === 'led') {
          if (spec.leds?.includes(c)) rgba = [255, 255, 255, 255];
        } else if (spec.warm?.includes(c)) rgba = [255, 196, 92, 255];
        else if (spec.office?.includes(c) && ((x * 7 + (y >> 1) * 13) * 2654435761) % 100 < 38)
          rgba = [255, 226, 150, 255];
        else if (spec.flood && d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11 > 170)
          rgba = [255, 240, 210, 110];
      }
      [d[i], d[i + 1], d[i + 2], d[i + 3]] = rgba;
    }
    ctx.putImageData(img, 0, 0);
    tex.refresh();
    tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
    return key;
  }

  /** Street lamps beside every road, alternating sides, never on top of a landmark. */
  private placeLamps(): void {
    const nodes = this.data_.nodes;
    const placed: Point[] = [];
    let side = 1;
    for (const e of this.data_.edges) {
      let at = LAMP_SPACING / 2;
      for (let i = 1; i < e.path.length; i++) {
        const [x0, y0] = e.path[i - 1];
        const [x1, y1] = e.path[i];
        const seg = Math.hypot(x1 - x0, y1 - y0);
        if (!seg) continue;
        for (; at <= seg; at += LAMP_SPACING) {
          side = -side;
          const lx = Math.round(x0 + ((x1 - x0) * at) / seg - ((y1 - y0) / seg) * 5 * side);
          const ly = Math.round(y0 + ((y1 - y0) * at) / seg + ((x1 - x0) / seg) * 5 * side);
          if (nodes.some((n) => Math.hypot(n.x - lx, n.y - ly) < 26)) continue;
          if (placed.some(([px, py]) => Math.hypot(px - lx, py - ly) < LAMP_SPACING * 0.6))
            continue;
          placed.push([lx, ly]);
          const post = this.add
            .rectangle(lx * S, ly * S, S, 4 * S, 0x2a2a38)
            .setOrigin(0.5, 1)
            .setDepth(ly)
            .setAlpha(0);
          const head = this.add
            .rectangle(lx * S, (ly - 4) * S, 2 * S, S, 0xfff2b0)
            .setOrigin(0.5, 1)
            .setDepth(ly + 0.01)
            .setAlpha(0);
          const glow = this.glow(lx, ly - 3, 22, 0xffc870, ly + 0.02);
          this.lamps.push({ glow, parts: [post, head] });
        }
        at -= seg;
      }
    }
  }

  private updateLights(
    time: number,
    ap: [number, number, Dir],
    bp: [number, number, Dir, 'behind' | 'front'],
  ): void {
    const L = this.light;
    if (L === 0 && this.lightsOff) return; // daytime: everything already hidden
    this.lightsOff = L === 0;
    this.lamps.forEach((l, i) => {
      // Gentle shimmer, and now and then one lamp stutters.
      const stutter = (Math.floor(time / 90) + i * 37) % 173 === 0 ? 0.35 : 1;
      l.glow.setAlpha(L * (0.8 + 0.2 * Math.sin(time / (300 + (i % 7) * 40) + i)) * stutter);
      for (const p of l.parts) (p as Phaser.GameObjects.Rectangle).setAlpha(Math.min(1, L * 1.6));
    });
    for (const p of this.pools) p.setAlpha(L * 0.32);
    for (const w of this.windows) w.setAlpha(L * 0.92);
    this.leds.forEach((led, i) => {
      const hue = (time / 5000 + i * 0.3) % 1;
      led.setTint(Phaser.Display.Color.HSVToRGB(hue, 0.55, 1).color);
      led.setAlpha(L * (0.75 + 0.25 * Math.sin(time / 250 + i)));
    });
    // The auto's headlights point where it's going; the boat carries a lantern.
    const ahead: Record<Dir, Point> = { right: [7, -3], left: [-7, -3], up: [0, -9], down: [0, 2] };
    this.headlight
      ?.setPosition((ap[0] + ahead[ap[2]][0]) * S, (ap[1] + ahead[ap[2]][1]) * S)
      .setAlpha(L);
    this.lantern?.setPosition(bp[0] * S, (bp[1] - 6) * S).setAlpha(L * 0.9);
  }

  // ---- the player's avatar ---------------------------------------------------------------

  showAvatar(texture: string, at: string | Point): void {
    const n = typeof at === 'string' ? this.node(at) : undefined;
    const p = n
      ? { x: n.x + STAND[0], y: n.y + STAND[1] }
      : typeof at === 'string'
        ? undefined
        : { x: at[0], y: at[1] };
    if (!p) return;
    if (!this.avatar) this.avatar = this.add.image(0, 0, texture).setOrigin(0.5, 1).setScale(S);
    this.avatar
      .setTexture(texture)
      .setVisible(true)
      .setPosition(p.x * S, p.y * S)
      .setDepth(p.y + 1)
      .setTint(this.tint);
  }

  hideAvatar(): void {
    this.avatar?.setVisible(false);
  }

  /**
   * Walk the avatar along road points (map px), camera following, a step blip per stride.
   * Speed adapts so even the longest leg takes ≤ 3 s. Resolves on arrival.
   */
  async walk(points: Point[], texture: string): Promise<void> {
    if (!points.length) return;
    // Step off the road onto the landmark's forecourt at the end.
    const [lx, ly] = points[points.length - 1];
    points = [...points, [lx + STAND[0] / 2, ly + STAND[1] / 2], [lx + STAND[0], ly + STAND[1]]];
    this.drift(false);
    this.showAvatar(texture, points[0]);
    // From the whole-city view, glide down to the avatar first, then follow the walk.
    if (this.overviewOn)
      await this.toStreet(points[0][0], points[0][1] + (320 - FOCUS_Y - 20) / S, 900);
    const av = this.avatar!;
    const cam = this.cameras.main;
    // followOffset is subtracted from the target: negative y keeps the walker above centre.
    cam.startFollow(av, true, 0.12, 0.12, 0, -(320 - FOCUS_Y) + 20);
    this.walking = true;
    const stepMs = Math.max(22, Math.min(45, 3000 / points.length));
    let i = 0;
    return new Promise((resolve) => {
      const tick = (): void => {
        i++;
        if (i >= points.length) {
          this.walking = false;
          av.setAngle(0).setScale(S);
          resolve();
          return;
        }
        const [x, y] = points[i];
        av.setFlipX(x < points[i - 1][0]);
        av.setPosition(x * S, y * S).setDepth(y + 1);
        // Stride: bob + slight tilt every 3 points, with a step sound.
        if (i % 3 === 0) {
          const stride = (i / 3) % 2 === 0;
          av.setAngle(stride ? -4 : 4).setScale(S, S * (stride ? 1 : 0.94));
          stepBlip(stride);
        }
        this.time.delayedCall(stepMs, tick);
      };
      tick();
    });
  }
}
