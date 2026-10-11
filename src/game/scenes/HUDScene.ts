// Persistent overlay: hearts (happiness/20), wallet ₹, stage/month badge, Info + Replay.
// Reads game.state every frame, so every screen stays in sync without events.
import Phaser from 'phaser';
import { getSession } from '@/app/session';
import { rupees, t } from '@/shared/i18n';
import { heartsFor } from '../logic/display';
import { isMuted, setMuted } from '../audio';
import { Button } from '../ui/Button';
import { COLOR, text, tr } from '../ui/theme';
import { VIEW } from '../view';

export const HUD_HEIGHT = 40;

const HEART = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];

export class HUDScene extends Phaser.Scene {
  private hearts: Phaser.GameObjects.Image[] = [];
  private happyLabel!: Phaser.GameObjects.Text;
  private mapBtn!: Button;
  private wallet!: Phaser.GameObjects.Text;
  private stage!: Phaser.GameObjects.Text;
  private lastKey = '';

  constructor() {
    super('HUD');
  }

  create(): void {
    const W = VIEW.width;
    this.makeHeart('heart_full', 0xe04848);
    this.makeHeart('heart_empty', 0x505870);
    this.add.rectangle(0, 0, W, HUD_HEIGHT, COLOR.bg, 0.92).setOrigin(0, 0);
    this.add.rectangle(0, HUD_HEIGHT - 2, W, 2, COLOR.accent).setOrigin(0, 0);
    this.hearts = [0, 1, 2, 3, 4].map((i) =>
      this.add
        .image(8 + i * 17, 5, 'heart_empty')
        .setOrigin(0, 0)
        .setScale(2),
    );
    // ISSUES #13: say what the hearts are.
    this.happyLabel = text(this, 96, 4, '', 'xs', COLOR.happy);
    this.wallet = text(this, 8, 29, '', 'xs', COLOR.white).setOrigin(0, 0.5);
    // ISSUES #16: a way back to the map from the town (battles are the only screen without an exit).
    this.mapBtn = new Button(
      this,
      44,
      VIEW.height - 28,
      '◀ ' + tr('btn.map', 'MAP'),
      () => {
        const town = this.scene.get('TownMap');
        if (town && this.scene.isActive('TownMap')) town.scene.start('ChapterMap');
      },
      { width: 72, height: 36, size: 'xs', fill: 0x505878 },
    );
    this.mapBtn.setVisible(false);
    this.time.addEvent({
      delay: 250,
      loop: true,
      callback: () => this.mapBtn.setVisible(this.scene.isActive('TownMap')),
    });
    this.stage = text(this, 152, 20, '', 'xs', COLOR.accent).setOrigin(0.5);
    const mute = new Button(
      this,
      193,
      20,
      isMuted() ? '×' : '♪',
      () => {
        setMuted(!isMuted());
        mute.setCaption(isMuted() ? '×' : '♪');
      },
      { width: 34, height: 32, size: 'md', fill: 0x505878 },
    );
    new Button(this, W - 120, 20, t('btn.info'), () => this.openOverlay('InfoPanel'), {
      width: 58,
      height: 32,
      size: 'xs',
    });
    new Button(this, W - 44, 20, t('btn.replay'), () => this.openOverlay('ReplayLibrary'), {
      width: 80,
      height: 32,
      size: 'xs',
    });
    this.lastKey = '';
  }

  private openOverlay(key: string): void {
    if (!this.scene.manager.keys[key]) return; // Phase 2 screens
    if (this.scene.isActive(key)) return;
    this.scene.launch(key);
    this.scene.bringToTop(key);
  }

  private makeHeart(key: string, color: number): void {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(color);
    HEART.forEach((row, y) => [...row].forEach((c, x) => c === 'X' && g.fillRect(x, y, 1, 1)));
    g.generateTexture(key, 7, 6);
    g.destroy();
  }

  update(): void {
    const s = getSession().game?.state;
    if (!s) return;
    const key = `${s.bars.happiness}|${s.bars.wallet}|${s.stage}|${s.chapter}`;
    if (key === this.lastKey) return;
    this.lastKey = key;
    const n = heartsFor(s.bars.happiness);
    this.hearts.forEach((h, i) => h.setTexture(i < n ? 'heart_full' : 'heart_empty'));
    // number beside the hearts; the word HAPPY is on the battle panel and the Info card
    this.happyLabel.setText(String(Math.round(s.bars.happiness)));
    this.wallet.setText(rupees(s.bars.wallet)).setColor(s.bars.wallet < 0 ? '#e04848' : '#ffffff');
    this.stage
      .setText(`${t('hud.stage', { n: s.stage })}\n${t('hud.month', { n: s.chapter })}`)
      .setAlign('center');
  }
}
