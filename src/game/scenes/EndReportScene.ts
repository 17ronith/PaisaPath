// End of the game: the progress summary plus the facilitator flow (R-monish-02).
//  - Download report → build the PDF via session.sendReport and save it locally.
//  - Email facilitator → the FACILITATOR types their email (+ optional guardian CC); shows
//    the sandbox preview link, or "offline" when the report service can't be reached.
//  - Facilitator view → the NGO dashboard mock. The what-if is never part of the report.
import Phaser from 'phaser';
import { downloadBlob, getSession } from '@/app/session';
import { t } from '@/shared/i18n';
import type { Pillar, Summary } from '@/shared/types';
import { Button } from '../ui/Button';
import { PixelPanel } from '../ui/PixelPanel';
import { COLOR, text, tr } from '../ui/theme';
import { disposeInput, htmlInput } from '../ui/HtmlInput';
import { overMap } from '../flow/journeyState';
import { VIEW } from '../view';

const PILLARS: Pillar[] = ['budget', 'save', 'invest', 'safety'];

export class EndReportScene extends Phaser.Scene {
  private summary?: Summary;
  private status?: Phaser.GameObjects.Text;
  private form?: Phaser.GameObjects.Container;
  private inputs: HTMLInputElement[] = [];

  constructor() {
    super('EndReport');
  }

  init(data: { summary?: Summary }): void {
    this.summary = data.summary;
    this.inputs = [];
    this.form = undefined;
  }

  create(): void {
    const s = getSession();
    const sum = this.summary ?? s.game?.summary();
    const { width: W } = VIEW;
    overMap(this, 0.8, true);
    if (this.scene.isActive('HUD')) this.scene.stop('HUD');
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.closeForm());
    text(this, W / 2, 30, t('report.title'), 'lg', COLOR.white).setOrigin(0.5);
    if (!sum) {
      new Button(this, W / 2, 596, t('btn.play_again'), () => this.scene.start('Title'));
      return;
    }

    const p = new PixelPanel(this, 12, 54, W - 24, 380);
    let y = 12;
    const line = (
      str: string,
      size: 'xs' | 'sm' | 'md' = 'sm',
      color: number = COLOR.ink,
    ): void => {
      const tx = text(this, 14, y, str, size, color, {
        wordWrap: { width: W - 52, useAdvancedWrap: true },
      });
      p.add(tx);
      y += tx.height + 4;
    };
    line(t('report.before_after', { before: sum.quizBefore, after: sum.quizAfter ?? '–' }), 'md');
    if (sum.learningGain != null)
      line(
        tr('report.gain', 'Learning gain: {n}', { n: sum.learningGain }),
        'sm',
        sum.learningGain > 0 ? COLOR.good : COLOR.muted,
      );
    y += 4;
    line(t('report.ncfe'), 'sm', COLOR.aunty);
    line(
      [
        tr('report.knowledge', 'Knowledge {n}/8', { n: sum.ncfe.knowledge }),
        tr('report.behaviour', 'Behaviour {n}/9', { n: sum.ncfe.behaviour }),
        tr('report.attitude', 'Attitude {n}/5', { n: sum.ncfe.attitude }),
      ].join(' · '),
      'xs',
    );
    if (sum.ncfe.literate) line(t('report.literate'), 'xs', COLOR.good);
    line(t('report.national'), 'xs', COLOR.muted);
    line(t('report.safety', { spotted: sum.safety.spotted, faced: sum.safety.faced }), 'sm');
    y += 4;
    line(tr('report.pillars', 'Pillar progress'), 'sm', COLOR.aunty);
    for (const k of PILLARS) {
      const { good, total } = sum.perPillar[k];
      p.add(text(this, 14, y, tr(`pillar.${k}`, k), 'xs', COLOR.ink));
      p.add(text(this, W - 52, y, `${good}/${total}`, 'xs', COLOR.ink).setOrigin(1, 0));
      const bw = 110;
      p.add(this.add.rectangle(W - 190, y + 8, bw, 6, 0xd8d4c8).setOrigin(0, 0.5));
      p.add(
        this.add
          .rectangle(W - 190, y + 8, total ? (bw * good) / total : 0, 6, COLOR.good)
          .setOrigin(0, 0.5),
      );
      y += 19;
    }
    y += 2;
    line(
      `${tr('report.fixed', 'Mistakes fixed')}: ${sum.mistakesFixed.length} · ${tr('report.detours', 'Detours taken: {n}', { n: sum.detoursTaken })} · ${tr('report.restarts', 'Restarts: {n}', { n: sum.restarts })}`,
      'xs',
    );
    line(tr('report.disclaimer', 'An in-game score, not a certification.'), 'xs', COLOR.muted);

    this.status = text(this, W / 2, 446, '', 'xs', COLOR.accent, {
      align: 'center',
      wordWrap: { width: W - 30, useAdvancedWrap: true },
    }).setOrigin(0.5, 0);

    const bw = (W - 36) / 2;
    new Button(this, 12 + bw / 2, 512, t('btn.download'), () => void this.download(), {
      width: bw,
      height: 50,
      size: 'sm',
    });
    new Button(this, W - 12 - bw / 2, 512, t('btn.email'), () => this.openForm(), {
      width: bw,
      height: 50,
      size: 'sm',
      fill: COLOR.good,
    });
    new Button(
      this,
      12 + bw / 2,
      574,
      tr('btn.facilitator', 'FACILITATOR VIEW'),
      () => window.open('./ngo/index.html', '_blank'),
      {
        width: bw,
        height: 50,
        size: 'sm',
        fill: 0x505878,
      },
    );
    new Button(
      this,
      W - 12 - bw / 2,
      574,
      t('btn.play_again'),
      () => {
        void s.reset().then(() => this.scene.start('Title'));
      },
      { width: bw, height: 50, size: 'sm', fill: COLOR.warn },
    );
  }

  private async download(): Promise<void> {
    this.status?.setText('…');
    const { pdfBlob } = await getSession().sendReport({ facilitatorEmail: '' });
    downloadBlob(pdfBlob, 'progress-report.pdf');
    this.status?.setText(tr('saved', 'Saved'));
  }

  private openForm(): void {
    if (this.form) return;
    const { width: W, height: H } = VIEW;
    const c = this.add.container(0, 0).setDepth(10);
    c.add(this.add.rectangle(0, 0, W, H, 0x000000, 0.6).setOrigin(0).setInteractive());
    const p = new PixelPanel(this, 16, 150, W - 32, 320);
    c.add(p);
    p.add(text(this, 14, 12, t('btn.email'), 'md', COLOR.ink));
    p.add(
      text(this, 14, 44, tr('report.facilitator_email', "Facilitator's email"), 'xs', COLOR.muted),
    );
    p.add(
      text(
        this,
        14,
        110,
        tr('report.guardian_email', "Guardian's email (optional CC)"),
        'xs',
        COLOR.muted,
      ),
    );
    p.add(
      text(
        this,
        14,
        176,
        tr('report.consent', 'Consent collected at NGO enrolment.'),
        'xs',
        COLOR.muted,
        {
          wordWrap: { width: W - 60, useAdvancedWrap: true },
        },
      ),
    );
    const fac = htmlInput(this, W / 2, 150 + 82, {
      type: 'email',
      width: 290,
      placeholder: 'facilitator@ngo.org',
    });
    const guard = htmlInput(this, W / 2, 150 + 148, { type: 'email', width: 290 });
    this.inputs = [fac, guard];
    const send = new Button(
      this,
      W / 2 + 70,
      150 + 270,
      tr('btn.send', 'SEND'),
      async () => {
        const email = fac.value.trim();
        if (!/^\S+@\S+\.\S+$/.test(email)) {
          fac.focus();
          fac.style.borderColor = '#e04848';
          return;
        }
        send.setEnabled(false);
        const { previewUrl } = await getSession().sendReport({
          facilitatorEmail: email,
          guardianEmail: guard.value.trim() || undefined,
        });
        this.closeForm();
        this.showSent(previewUrl);
      },
      { width: 130, height: 48, size: 'sm', fill: COLOR.good },
    );
    const close = new Button(
      this,
      W / 2 - 70,
      150 + 270,
      tr('btn.close', 'CLOSE'),
      () => this.closeForm(),
      {
        width: 130,
        height: 48,
        size: 'sm',
        fill: 0x505878,
      },
    );
    c.add([send, close]);
    this.form = c;
  }

  private closeForm(): void {
    this.inputs.forEach((el) => disposeInput(el));
    this.inputs = [];
    this.form?.destroy();
    this.form = undefined;
  }

  private showSent(previewUrl: string | null): void {
    if (!this.status) return;
    if (!previewUrl) {
      this.status.setText(tr('report.offline', 'Offline right now. Download the PDF instead.'));
      return;
    }
    this.status
      .setText(`${tr('report.sent', 'Report emailed. Preview:')}\n${previewUrl}`)
      .setColor('#9fd3c7')
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => window.open(previewUrl, '_blank'));
  }
}
