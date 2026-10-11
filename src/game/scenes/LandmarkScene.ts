// A landmark's mission hub. The landmark's Hyderabad scene on top; below it, the missions of
// this life phase: finished ones (with how they went), the one that's ready now, and the
// months still locked here. Missions unlock in order — the engine decides what comes next
// (main task, a random side quest, a side gig, the invest decision) — and the player picks
// it from the list. "◀ Map" goes back to the world map without losing the mission.
import Phaser from 'phaser';
import { getSession } from '@/app/session';
import { t } from '@/shared/i18n';
import type { Quality, Step } from '@/shared/types';
import { advance } from '../flow/Driver';
import { mapBG, setAvatarLandmark } from '../flow/journeyState';
import { landmarkForChapter } from '../logic/journey';
import { Button } from '../ui/Button';
import { backdropForPlace } from '../ui/hyd';
import { PixelPanel } from '../ui/PixelPanel';
import { COLOR, text, tr } from '../ui/theme';
import { VIEW } from '../view';

const TOP = 40;
const BACK_H = 202; // 480×270 backdrop at 0.75
const QUALITY_MARK: Record<Quality, [string, number]> = {
  good: ['✓', COLOR.good],
  ok: ['✓', COLOR.warn],
  weak: ['✗', COLOR.bad],
  critical: ['✗', COLOR.bad],
};

interface Mission {
  title: string;
  sub: string;
  place?: string;
  state: 'done' | 'now' | 'locked';
  mark?: [string, number];
}

export class LandmarkScene extends Phaser.Scene {
  private step!: Step;

  constructor() {
    super('Landmark');
  }

  init(data: { step: Step }): void {
    this.step = data.step;
  }

  create(): void {
    const s = getSession();
    const game = s.game;
    if (!game || !this.step) {
      advance(this);
      return;
    }
    const { width: W, height: H } = VIEW;
    const chapter = game.state.chapter;
    const lm = landmarkForChapter(chapter);
    setAvatarLandmark(lm.id);
    this.cameras.main.setBackgroundColor(COLOR.bg);

    // Landmark scene + name plate.
    if (this.textures.exists(lm.backdrop))
      this.add
        .image(0, TOP, lm.backdrop)
        .setOrigin(0)
        .setScale(W / 480);
    const name = mapBG(this)?.node(lm.id)?.name ?? lm.id;
    const plate = this.add.rectangle(0, TOP + BACK_H - 46, W, 46, 0x000000, 0.55).setOrigin(0);
    void plate;
    text(this, 14, TOP + BACK_H - 42, name, name.length > 14 ? 'md' : 'lg', COLOR.white);
    text(
      this,
      14,
      TOP + BACK_H - 20,
      `${tr(`landmark.${lm.id}.phase`, lm.phase)} · ${tr('hud.age', 'Age {n}', { n: lm.age })}`,
      'xs',
      COLOR.accent,
    );

    // Missions.
    text(this, 14, TOP + BACK_H + 10, tr('landmark.missions', 'Missions here'), 'sm', COLOR.accent);
    const missions = this.missions(lm.chapters, chapter);
    const listTop = TOP + BACK_H + 36;
    const rowH = 58;
    const maxRows = Math.floor((H - 84 - listTop) / rowH);
    // Keep the playable mission visible: show the tail of the list if it's long.
    const nowIdx = missions.findIndex((m) => m.state === 'now');
    const start = Math.max(0, Math.min(missions.length - maxRows, nowIdx - (maxRows - 2)));
    missions
      .slice(start, start + maxRows)
      .forEach((m, i) => this.card(m, 12, listTop + i * rowH, W - 24, rowH - 6));

    new Button(
      this,
      66,
      H - 40,
      tr('btn.map', '◀ MAP'),
      () => this.scene.start('WorldMap', { returnTo: this.step }),
      {
        width: 108,
        height: 52,
        size: 'sm',
        fill: 0x56684a,
      },
    );
    new Button(this, W / 2 + 60, H - 40, tr('landmark.play', 'PLAY MISSION ▸'), () => this.play(), {
      width: W - 144,
      height: 52,
      size: 'sm',
      fill: COLOR.good,
    });
  }

  private missions(chapters: number[], current: number): Mission[] {
    const s = getSession();
    const game = s.game!;
    const out: Mission[] = [];
    const persona = game.state.profile.persona;
    // Finished missions at this landmark, last attempt per task.
    const seen = new Map<string, Mission>();
    for (const e of game.state.log) {
      if (!chapters.includes(e.chapter)) continue;
      const item =
        s.content.tasks.find((x) => x.id === e.taskId) ??
        s.content.events.find((x) => x.id === e.taskId);
      const f = item ? (item.framings[persona] ?? item.framings.default) : undefined;
      seen.set(e.taskId, {
        title: f?.title ?? e.taskId,
        sub: `${t('hud.month', { n: e.chapter })} · ${e.isEvent ? tr('landmark.side_quest', 'Side quest') : e.isDetour ? tr('battle.detour', 'Detour') : tr('landmark.main', 'Main mission')}`,
        place: f?.place,
        state: 'done',
        mark: QUALITY_MARK[e.quality],
      });
    }
    out.push(...seen.values());
    out.push(this.nowMission(current));
    for (const c of chapters)
      if (c > current)
        out.push({
          title: t('hud.month', { n: c }),
          sub: tr('landmark.locked', 'Unlocks after this month'),
          state: 'locked',
        });
    return out;
  }

  private nowMission(chapter: number): Mission {
    const st = this.step;
    const month = t('hud.month', { n: chapter });
    switch (st.kind) {
      case 'task':
        return {
          title: st.framing.title,
          sub: `${month} · ${st.isDetour ? tr('battle.detour', 'Detour') : tr('landmark.main', 'Main mission')}${st.returning ? ` · ${t('battle.returning')}` : ''}`,
          place: st.framing.place,
          state: 'now',
        };
      case 'event':
        return {
          title: st.framing.title,
          sub: `${month} · ${tr('landmark.side_quest', 'Side quest')}`,
          place: st.framing.place,
          state: 'now',
        };
      case 'minigame_offer':
        return {
          title: st.minigame.title,
          sub: `${month} · ${tr('landmark.side_gig', 'Side gig')}${st.locked ? ` · ${tr('info.minigames_locked', 'locked')}` : ''}`,
          state: 'now',
        };
      case 'invest':
        return {
          title: tr('invest.title', 'Grow your savings?'),
          sub: `${month} · ${tr('landmark.decision', 'Decision')}`,
          state: 'now',
        };
      default:
        return { title: month, sub: '', state: 'now' };
    }
  }

  private card(m: Mission, x: number, y: number, w: number, h: number): void {
    const p = new PixelPanel(this, x, y, w, h, { variant: m.state === 'now' ? 'green' : 'card' });
    if (m.state === 'locked') p.setAlpha(0.55);
    // Place thumbnail (the mission's own Hyderabad scene).
    const thumbKey = m.place
      ? backdropForPlace(m.place)
      : this.step.kind === 'invest'
        ? backdropForPlace('bank')
        : backdropForPlace('bus_stop');
    if (m.state !== 'locked' && this.textures.exists(thumbKey)) {
      const th = this.add
        .image(8, 8, thumbKey)
        .setOrigin(0)
        .setDisplaySize((h - 16) * (16 / 9), h - 16);
      p.add(th);
    } else {
      p.add(this.add.rectangle(8, 8, (h - 16) * (16 / 9), h - 16, 0x2f3a2a).setOrigin(0));
      p.add(
        text(this, 8 + ((h - 16) * (16 / 9)) / 2, h / 2, '🔒', 'md', COLOR.white).setOrigin(0.5),
      );
    }
    const tx = 16 + (h - 16) * (16 / 9);
    p.add(
      text(this, tx, 7, m.title, 'sm', COLOR.ink, {
        wordWrap: { width: w - tx - 34 },
        maxLines: 1,
      }),
    );
    p.add(
      text(this, tx, 27, m.sub, 'xs', COLOR.muted, {
        wordWrap: { width: w - tx - 34 },
        maxLines: 1,
      }),
    );
    if (m.mark) p.add(text(this, w - 14, h / 2, m.mark[0], 'lg', m.mark[1]).setOrigin(1, 0.5));
    if (m.state === 'now') {
      p.add(text(this, w - 14, h / 2, '▶', 'md', COLOR.good).setOrigin(1, 0.5));
      p.setSize(w, h);
      const hit = this.add.zone(x, y, w, h).setOrigin(0).setInteractive({ useHandCursor: true });
      hit.on('pointerup', () => this.play());
      this.tweens.add({
        targets: p,
        alpha: { from: 1, to: 0.85 },
        yoyo: true,
        repeat: -1,
        duration: 650,
      });
    }
  }

  private play(): void {
    const st = this.step;
    switch (st.kind) {
      case 'task':
      case 'event':
        this.scene.start('Battle', { step: st });
        return;
      case 'minigame_offer':
        this.scene.start('MinigameOffer', { step: st });
        return;
      case 'invest':
        this.scene.start(this.scene.manager.keys['Invest'] ? 'Invest' : 'Battle', { step: st });
        return;
      default:
        advance(this);
    }
  }
}
