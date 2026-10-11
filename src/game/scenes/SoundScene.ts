// ISSUES #25: a sound toggle on every screen. The HUD's ♪ only exists on the map and in battles;
// everywhere else (title, onboarding, quiz, explainers, invest, mini-games, end screens) this small
// corner button takes its place. It keeps itself on top and hides while the HUD is showing.
// Tapping it opens the AudioSettings panel (music, sound effects and voice-over switches).
import Phaser from 'phaser';
import { isMuted, onMuteChange } from '../audio';
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
      () => this.scene.launch('AudioSettings'), // music / sound effects / voice-over switches
      {
        width: 30,
        height: 26,
        size: 'sm',
        fill: 0x56684a,
      },
    ).setAlpha(0.85);
    onMuteChange((m) => btn.setCaption(m ? '×' : '♪'));

    this.time.addEvent({
      delay: 200,
      loop: true,
      callback: () => {
        const mgr = this.scene.manager;
        const hudShowing = mgr.isActive('HUD') && mgr.isVisible('HUD');
        const panelOpen = mgr.isActive('AudioSettings');
        btn.setVisible(!hudShowing && !panelOpen);
        this.input.enabled = !hudShowing && !panelOpen;
        if (!panelOpen) this.scene.bringToTop();
      },
    });
  }
}
