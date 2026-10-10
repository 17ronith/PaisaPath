import Phaser from 'phaser';
import { getSession } from '@/app/session';
import { t } from '@/shared/i18n';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    const s = getSession();
    const { width, height } = this.scale;
    this.add
      .text(width / 2, height / 2 - 20, t('title'), {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: width - 32 },
      })
      .setOrigin(0.5);
    this.add
      .text(
        width / 2,
        height / 2 + 30,
        `SKELETON OK · ${s.content.tasks.length} tasks · lang ${s.lang}`,
        { fontFamily: 'monospace', fontSize: '10px', color: '#9fd3c7' },
      )
      .setOrigin(0.5);
  }
}
