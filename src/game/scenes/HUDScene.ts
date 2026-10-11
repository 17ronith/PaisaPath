// Persistent overlay: hearts (happiness/20), wallet ₹, stage/month badge, Info + Replay.
// Reads game.state every frame, so every screen stays in sync without events.
import Phaser from 'phaser';
import { getSession } from '@/app/session';
import { rupees, t } from '@/shared/i18n';
import { heartsFor } from '../logic/display';
import { isMuted, onMuteChange, setMuted } from '../audio';
import { Button } from '../ui/Button';
import { COLOR, text, tr } from '../ui/theme';
import { VIEW } from '../view';

export const HUD_HEIGHT = 40;

const HEART = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];

/** Screens the Market can be opened from (and returns to). */
const MARKET_FROM = ['WorldMap', 'Landmark'];

export class HUDScene extends Phaser.Scene {
  private hearts: Phaser.GameObjects.Image[] = [];
  private happyLabel!: Phaser.GameObjects.Text;
  private marketBtn!: Button;
  private wallet!: Phaser.GameObjects.Text;
  /** ISSUES #29: the wallet figure counts to its new value instead of jumping. */
  private walletShown: number | null = null;
  private walletTween?: Phaser.Tweens.Tween;
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
    // Charminar Market device (docs/plan/STOCKS.md): unlocks from chapter 5; opens from the
    // world map or a landmark hub (whose ◀ MAP covers ISSUES #16), as a chip under the HUD bar so
    // it never sits on their big bottom buttons. The Market returns to the screen it came from.
    this.marketBtn = new Button(
      this,
      VIEW.width - 58,
      88,
      '📈 ' + tr('btn.market', 'MARKET'),
      () => {
        const from = MARKET_FROM.find((k) => this.scene.isActive(k));
        if (!from) return;
        const s = this.scene.get(from);
        s.scene.start('Market', { back: { key: from, data: s.sys.settings.data } });
      },
      { width: 104, height: 32, size: 'xs', fill: COLOR.money },
    );
    this.marketBtn.setVisible(false);
    this.time.addEvent({
      delay: 250,
      loop: true,
      callback: () => {
        const g = getSession().game;
        const onMap = MARKET_FROM.some((k) => this.scene.isActive(k));
        this.marketBtn.setVisible(
          !!g?.market?.eligible() && onMap && !this.scene.isActive('Market'),
        );
      },
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
    onMuteChange((m) => mute.setCaption(m ? '×' : '♪')); // stays in sync with the corner toggle
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
    this.animateWallet(s.bars.wallet);
    this.stage
      .setText(`${t('hud.stage', { n: s.stage })}\n${t('hud.month', { n: s.chapter })}`)
      .setAlign('center');
  }

  /** Count the wallet to `to` over 700 ms (in step with the battle bar), flash green/red and
   *  float the change (+₹500 / −₹300) up from the figure. First paint is instant. */
  private animateWallet(to: number): void {
    const restColor = (v: number): string => (v < 0 ? '#e04848' : '#ffffff');
    const from = this.walletShown;
    this.walletShown = to;
    this.walletTween?.stop();
    if (from === null || from === to) {
      this.wallet.setText(rupees(to)).setColor(restColor(to));
      return;
    }
    const up = to > from;
    this.wallet.setColor(up ? '#7ee07e' : '#ff7a7a');
    this.walletTween = this.tweens.addCounter({
      from,
      to,
      duration: 700,
      ease: 'Cubic.easeOut',
      onUpdate: (tw) => this.wallet.setText(rupees(Math.round(tw.getValue() ?? to))),
      onComplete: () => this.wallet.setText(rupees(to)).setColor(restColor(to)),
    });
    const delta = to - from;
    const float = text(
      this,
      this.wallet.x + this.wallet.width + 6,
      this.wallet.y,
      `${up ? '+' : '−'}${rupees(Math.abs(delta))}`,
      'xs',
      up ? COLOR.good : COLOR.bad,
    )
      .setOrigin(0, 0.5)
      .setDepth(5);
    this.tweens.add({
      targets: float,
      y: float.y + (up ? -14 : 14),
      alpha: 0,
      delay: 350,
      duration: 900,
      onComplete: () => float.destroy(),
    });
  }
}
