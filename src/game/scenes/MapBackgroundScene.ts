// The living Hyderabad map. Launched once after Preload and never stopped, at the bottom of
// the scene stack, so it keeps animating for as long as the app is open: every screen that
// leaves its camera transparent (Title, Onboarding, Quiz, WorldMap) shows it underneath.
// Built live from Monish's parts (09_hyderabad_map: base + ripples + boat + auto + birds,
// timings from map_data.json) instead of the 5.6 MB GIF — same 18 s loop, ~200 KB.
import Phaser from 'phaser';
import { stepBlip } from '../music';
import { MAP_DATA_KEY, MAP_H, MAP_NODE_IDS, MAP_W } from '../ui/hyd';
import type { Point } from '../logic/journey';

/** World units per map pixel: 3 → 1440×810, a whole number so map pixels stay square. */
export const MAP_SCALE = 3;
/** Where a focused landmark sits on screen (between the journey strip and the news card). */
const FOCUS_Y = 300;
/** Extra ground below the map so bottom-edge landmarks can still be centred above the card. */
const SKIRT = 260;
/** Where the avatar stands relative to a landmark's pad point (map px): in front, to the right. */
const STAND: Point = [22, 6];
const S = MAP_SCALE;

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
  }

  // ---- camera --------------------------------------------------------------------------

  private centerOnMap(mx: number, my: number): void {
    this.cameras.main.centerOn(mx * S, my * S);
  }

  /** Slow side-to-side drift behind menus (title, onboarding, quiz). */
  drift(on: boolean): void {
    this.driftTween?.stop();
    this.driftTween = undefined;
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

  /** Pan to a landmark (or map point). */
  focus(target: string | Point, duration = 700): void {
    this.drift(false);
    const p = typeof target === 'string' ? this.node(target) : { x: target[0], y: target[1] };
    if (!p) return;
    const cam = this.cameras.main;
    cam.stopFollow();
    const cy = p.y * S - 20 + (320 - FOCUS_Y);
    if (duration <= 0) cam.centerOn(p.x * S, cy);
    else cam.pan(p.x * S, cy, duration, 'Sine.easeInOut', true);
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
    if (duration <= 0) return apply(to.color);
    this.tintTween = this.tweens.addCounter({
      from: 0,
      to: 100,
      duration,
      onUpdate: (tw) => {
        const c = Phaser.Display.Color.Interpolate.ColorWithColor(
          from,
          to,
          100,
          tw.getValue() ?? 100,
        );
        apply(Phaser.Display.Color.GetColor(c.r, c.g, c.b));
      },
    });
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
  walk(points: Point[], texture: string): Promise<void> {
    if (!points.length) return Promise.resolve();
    // Step off the road onto the landmark's forecourt at the end.
    const [lx, ly] = points[points.length - 1];
    points = [...points, [lx + STAND[0] / 2, ly + STAND[1] / 2], [lx + STAND[0], ly + STAND[1]]];
    this.drift(false);
    this.showAvatar(texture, points[0]);
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
