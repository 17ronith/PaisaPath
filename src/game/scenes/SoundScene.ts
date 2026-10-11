// ISSUES #25: a sound toggle on every screen. The HUD's ♪ only exists on the map and in battles;
// everywhere else (title, onboarding, quiz, explainers, invest, mini-games, end screens) this small
// corner button takes its place. It keeps itself on top and hides while the HUD is showing.
import Phaser from 'phaser';
import { isMuted, onMuteChange, setMuted } from '../audio';
import { Button } from '../ui/Button';
import { VIEW } from '../view';

export class SoundScene extends Phaser.Scene {
  constructor() {
    super('Sound');
  }

  create(): void {
    const btn = new Button(
      this,
      VIEW.width - 20,
      17,
      isMuted() ? '×' : '♪',
      () => setMuted(!isMuted()),
      {
        width: 30,
        height: 26,
        size: 'sm',
        fill: 0x505878,
      },
    ).setAlpha(0.85);
    onMuteChange((m) => btn.setCaption(m ? '×' : '♪'));

    this.time.addEvent({
      delay: 200,
      loop: true,
      callback: () => {
        const mgr = this.scene.manager;
        const hudShowing = mgr.isActive('HUD') && mgr.isVisible('HUD');
        btn.setVisible(!hudShowing);
        this.input.enabled = !hudShowing;
        this.scene.bringToTop();
      },
    });
  }
}
