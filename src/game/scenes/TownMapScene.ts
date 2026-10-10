// The town between the chapter map and a main task: every place from content at its
// normalised position, the task's place blinking. Tap it → the avatar hops there (instant
// travel, 300 ms) → Battle. Other places just say their name. Detours, restarts and random
// events skip the town (the Driver decides).
import Phaser from 'phaser';
import { getSession } from '@/app/session';
import type { Place, Step } from '@/shared/types';
import { Button } from '../ui/Button';
import { grassField, house, prop, TOWN } from '../ui/Backdrop';
import { COLOR, text, tr } from '../ui/theme';
import { VIEW } from '../view';

type TaskStep = Extract<Step, { kind: 'task' }>;

const TOP = 92;
const BOTTOM = 556;
/** Places drawn as trees / open ground instead of a house. */
const OPEN_PLACES = new Set(['durgam_cheruvu', 'turf', 'charminar', 'bus_stop']);

export class TownMapScene extends Phaser.Scene {
  private step!: TaskStep;
  private toast?: Phaser.GameObjects.Text;
  private moving = false;

  constructor() {
    super('TownMap');
  }

  init(data: { step: Step }): void {
    this.step = data.step as TaskStep;
    this.moving = false;
  }

  private pos(p: Place): { x: number; y: number } {
    const { width: W } = VIEW;
    return { x: 30 + p.x * (W - 60), y: TOP + 20 + p.y * (BOTTOM - TOP - 60) };
  }

  create(): void {
    const s = getSession();
    const game = s.game;
    if (!game || this.step?.kind !== 'task') {
      this.scene.start('Battle', { step: this.step });
      return;
    }
    const { width: W } = VIEW;
    this.cameras.main.setBackgroundColor(COLOR.bg);
    grassField(this, 0, 40, W, BOTTOM - 40, 2, 21);

    const targetId = this.step.framing.place;
    const places = s.content.places;
    const target = places.find((p) => p.id === targetId);

    places.forEach((p, i) => {
      const { x, y } = this.pos(p);
      const isTarget = p.id === targetId;
      const hit = this.add.zone(x, y - 14, 64, 64).setInteractive({ useHandCursor: true });
      if (OPEN_PLACES.has(p.id)) {
        prop(this, x - 10, y + 6, i % 2 ? TOWN.tree : TOWN.treeRound, 2);
        prop(this, x + 12, y + 6, TOWN.bush, 2);
      } else {
        house(this, x - 24, y - 40, i % 2 ? 'blue' : 'red', 1);
      }
      const label = text(this, x, y + 10, p.name, 'xs', COLOR.white).setOrigin(0.5, 0);
      label.setShadow(0, 1, 'rgba(0,0,0,0.8)', 2, false, true);
      label.setDepth(2); // names always above neighbouring houses
      if (isTarget) {
        const ring = this.add.circle(x, y - 14, 34).setStrokeStyle(3, COLOR.warn);
        this.tweens.add({
          targets: ring,
          alpha: 0.2,
          scale: 1.15,
          yoyo: true,
          repeat: -1,
          duration: 500,
        });
        const arrow = text(this, x, y - 62, '▼', 'md', COLOR.warn).setOrigin(0.5);
        this.tweens.add({ targets: arrow, y: y - 56, yoyo: true, repeat: -1, duration: 400 });
        hit.on('pointerup', () => this.travel(x, y));
      } else {
        hit.on('pointerup', () => this.say(p.name));
      }
    });

    const home = places.find((p) => p.id === 'home') ?? places[0];
    const start = home ? this.pos(home) : { x: W / 2, y: BOTTOM - 40 };
    this.avatar = this.add
      .image(start.x + 22, start.y + 4, game.state.profile.avatar)
      .setOrigin(0.5, 1)
      .setScale(2);

    const hintText = target
      ? `${tr('town.tap', 'Tap the blinking place')} · ${target.name}`
      : tr('town.tap', 'Tap the blinking place');
    this.toast = text(this, W / 2, BOTTOM + 4, hintText, 'sm', COLOR.white, {
      align: 'center',
      wordWrap: { width: W - 40, useAdvancedWrap: true },
    }).setOrigin(0.5, 0);
    // Fallback for places missing from content, and a big target for small fingers.
    new Button(
      this,
      W / 2,
      610,
      tr('map.go', 'GO ▸'),
      () => this.travel(target ? this.pos(target).x : W / 2, target ? this.pos(target).y : 300),
      {
        fill: COLOR.good,
        height: 44,
      },
    );
  }

  private avatar!: Phaser.GameObjects.Image;

  private say(name: string): void {
    this.toast?.setText(name);
  }

  private travel(x: number, y: number): void {
    if (this.moving) return;
    this.moving = true;
    const place = getSession().content.places.find((p) => p.id === this.step.framing.place);
    this.toast?.setText(tr('town.travel', 'Heading to {place}…', { place: place?.name ?? '' }));
    this.tweens.add({
      targets: this.avatar,
      x: x + 22,
      y: y + 4,
      duration: 300,
      ease: 'Quad.easeInOut',
      onComplete: () =>
        this.time.delayedCall(250, () => this.scene.start('Battle', { step: this.step })),
    });
  }
}
