// The world map — the game's base screen. Shown at every chapter start over the living
// Hyderabad map: the month's news (income, things that came back, everyday stress), then the
// avatar walks the road to this month's landmark (fixed life path, no free roaming) and the
// landmark's mission hub opens. Also reachable from a landmark via "◀ Map" to look around.
import Phaser from 'phaser';
import { getSession } from '@/app/session';
import { rupees, t } from '@/shared/i18n';
import type { Stage, Step } from '@/shared/types';
import { proceed } from '../flow/Driver';
import { avatarLandmark, mapBG, setAvatarLandmark } from '../flow/journeyState';
import {
  JOURNEY,
  doneLandmarks,
  landmarkForChapter,
  route,
  timeOfDay,
  type Edge,
  type LandmarkId,
} from '../logic/journey';
import { Button } from '../ui/Button';
import { PixelPanel } from '../ui/PixelPanel';
import { COLOR, text, tr } from '../ui/theme';
import { VIEW } from '../view';

type ChapterStart = Extract<Step, { kind: 'chapter_start' }>;
interface WorldMapData {
  step?: Step;
  /** Browsing from a landmark: show the map, then go back to that landmark's step. */
  returnTo?: Step;
}

export class WorldMapScene extends Phaser.Scene {
  private step?: ChapterStart;
  private returnTo?: Step;
  private busy = false;
  /** Overview-only markers (the bouncing pin over this month's landmark). */
  private pin: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super('WorldMap');
  }

  init(data: WorldMapData): void {
    this.step = data.step?.kind === 'chapter_start' ? data.step : undefined;
    this.returnTo = data.returnTo;
    this.busy = false;
    this.pin = [];
  }

  create(): void {
    const s = getSession();
    const game = s.game;
    if (!game) {
      this.scene.start('Title');
      return;
    }
    const chapter = this.step?.chapter ?? game.state.chapter;
    const stage = (this.step?.stage ?? game.state.stage) as Stage;
    const dest = landmarkForChapter(chapter);
    const from = this.returnTo ? dest.id : avatarLandmark(chapter);
    const bg = mapBG(this);
    const avatar = game.state.profile.avatar;
    bg?.setTimeOfDay(timeOfDay(stage));
    bg?.setDone(doneLandmarks(chapter));
    bg?.showAvatar(avatar, from);

    // Journey progress strip under the HUD: one pip per landmark.
    const { width: W, height: H } = VIEW;
    const strip = this.add.rectangle(0, 40, W, 26, COLOR.bg, 0.72).setOrigin(0, 0);
    strip.setInteractive(); // swallow taps so the map doesn't get them
    JOURNEY.forEach((l, i) => {
      const x = 22 + i * ((W - 44) / (JOURNEY.length - 1));
      const done = Math.max(...l.chapters) < chapter;
      const here = l.id === dest.id;
      if (i)
        this.add
          .rectangle(x - (W - 44) / 7, 53, (W - 44) / 7 - 10, 2, done ? COLOR.good : 0x505870)
          .setOrigin(0, 0.5);
      this.add
        .circle(x, 53, here ? 7 : 5, done ? COLOR.good : here ? COLOR.warn : 0x505870)
        .setStrokeStyle(2, COLOR.white, here ? 1 : 0.4);
    });

    // Bottom card: landmark, life phase, and this month's news.
    const name = bg?.node(dest.id)?.name ?? dest.id;
    const lines: string[] = [];
    if (this.step) {
      const persona = game.state.profile.persona;
      lines.push(
        `+${rupees(this.step.incomeCoins)}  ${tr(stage > 1 ? 'chapter.income.salary' : `chapter.income.${persona}`, 'Money arrived')}`,
      );
      if (this.step.fired.length) {
        lines.push(tr('chapter.fired', 'Things that came back this month'));
        for (const e of this.step.fired) lines.push(`• ${e.label}`);
      }
      if (this.step.happinessDecay)
        lines.push(
          tr('chapter.decay', 'Everyday stress: happiness −{n}', {
            n: Math.abs(this.step.happinessDecay),
          }),
        );
    }
    const body = text(this, 14, 0, lines.join('\n'), 'xs', COLOR.ink, {
      wordWrap: { width: W - 52, useAdvancedWrap: true },
    });
    const cardH = 74 + (lines.length ? body.height + 8 : 0);
    const cardY = H - 74 - cardH;
    const card = new PixelPanel(this, 12, cardY, W - 24, cardH);
    card.add(
      text(
        this,
        14,
        10,
        `${t('hud.month', { n: chapter })} · ${tr(`stage.${stage}`, `Stage ${stage}`)}`,
        'xs',
        COLOR.aunty,
      ),
    );
    card.add(text(this, 14, 28, name, 'md', COLOR.ink));
    card.add(
      text(
        this,
        14,
        50,
        `${tr(`landmark.${dest.id}.phase`, dest.phase)} · ${tr('hud.age', 'Age {n}', { n: dest.age })}`,
        'xs',
        COLOR.muted,
      ),
    );
    body.setY(72);
    card.add(body);

    // ISSUES #26: open on the whole city (between the journey strip and the card), with the
    // road to this month's landmark dotted in and a pin bouncing over it. GO glides down.
    if (bg) {
      bg.overview(70, cardY - 6);
      if (!this.returnTo && from !== dest.id)
        bg.showRoute(route(bg.data_.edges as Edge[], from, dest.id));
      const n = bg.node(dest.id);
      if (n) this.dropPin(bg.toScreen(n.x, n.y - 66), bg.toScreen(n.x, n.y - 2));
      const top = bg.toScreen(0, 0).y;
      text(this, W / 2, top - 8, tr('map.title', 'Your road through Hyderabad'), 'sm', COLOR.white)
        .setOrigin(0.5, 1)
        .setShadow(0, 1, 'rgba(0,0,0,0.8)', 2, false, true);
    }

    const needsWalk = !this.returnTo && from !== dest.id;
    const label = this.returnTo
      ? tr('map.back_to', 'Back to {place} ▸', { place: name })
      : needsWalk
        ? tr('map.walk_to', 'Walk to {place} ▸', { place: name })
        : tr('map.enter', 'Enter {place} ▸', { place: name });
    const go = new Button(
      this,
      W / 2,
      H - 40,
      label,
      () => void this.go(needsWalk, from, dest.id),
      {
        fill: COLOR.good,
        height: 52,
        size: 'sm',
      },
    );
    this.events.once('go-busy', () => go.setEnabled(false));
  }

  /** A bouncing ▼ above this month's landmark and a pulsing ring at its foot (overview only). */
  private dropPin(top: { x: number; y: number }, foot: { x: number; y: number }): void {
    const ring = this.add.circle(foot.x, foot.y, 13).setStrokeStyle(2, COLOR.warn);
    const at = top;
    const arrow = text(this, at.x, at.y, '▼', 'md', COLOR.warn).setOrigin(0.5, 1);
    arrow.setShadow(0, 1, 'rgba(0,0,0,0.8)', 2, false, true);
    this.tweens.add({
      targets: ring,
      scale: 1.35,
      alpha: 0.2,
      yoyo: true,
      repeat: -1,
      duration: 550,
    });
    this.tweens.add({ targets: arrow, y: at.y + 6, yoyo: true, repeat: -1, duration: 400 });
    this.pin = [ring, arrow];
  }

  private async go(walk: boolean, from: string, to: string): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    this.events.emit('go-busy');
    for (const o of this.pin) o.destroy();
    const game = getSession().game!;
    const bg = mapBG(this);
    if (this.returnTo) {
      await bg?.focus(to);
      this.scene.start('Landmark', { step: this.returnTo });
      return;
    }
    if (walk && bg) {
      const pts = route(bg.data_.edges as Edge[], from, to);
      await bg.walk(pts, game.state.profile.avatar);
    }
    setAvatarLandmark(to as LandmarkId);
    await bg?.focus(to);
    this.time.delayedCall(walk ? 350 : 120, () => proceed(this));
  }
}
