// Charminar Market — the stock-simulator "device" (docs/plan/STOCKS.md). Opened from the HUD's
// 📈 button once chapter ≥ 5. Paper round first (₹10,000 virtual, Professor teaches), then real
// runs with savings. Scored on behaviour, never on money made. Candlesticks are decorative.
import Phaser from 'phaser';
import { getSession } from '@/app/session';
import { rupees, t } from '@/shared/i18n';
import type { MarketApi, MarketCompany, MarketCompanyId, MarketRun } from '@/shared/types';
import { play } from '../audio';
import { save } from '../flow/Driver';
import { Button } from '../ui/Button';
import { PixelPanel } from '../ui/PixelPanel';
import { COLOR, text, tr } from '../ui/theme';
import { VIEW } from '../view';

const STEP_SHARES = 5;
const ROW_H = 86;
const ROWS_Y = 150;

export class MarketScene extends Phaser.Scene {
  private api!: MarketApi;
  private root!: Phaser.GameObjects.Container;
  private pending: Record<MarketCompanyId, number> = {
    zipeats: 0,
    dashkart: 0,
    autogo: 0,
    chaiwala: 0,
  };

  /** The screen that opened the Market, restarted as it was on exit. */
  private back: { key: string; data?: object } = { key: 'WorldMap' };

  constructor() {
    super('Market');
  }

  init(data: { back?: { key: string; data?: object } }): void {
    this.back = data?.back ?? { key: 'WorldMap' };
  }

  create(): void {
    const game = getSession().game;
    if (!game?.market) {
      this.scene.start(this.back.key, this.back.data);
      return;
    }
    this.api = game.market;
    this.hud(false);
    this.cameras.main.setBackgroundColor(0x101420);
    this.root = this.add.container(0, 0);
    this.render();
  }

  // ---- screens ------------------------------------------------------------------------------

  private render(): void {
    this.root.removeAll(true);
    const run = this.api.current();
    if (!run) return this.intro();
    if (run.finished) return this.results(run);
    this.quarter(run);
  }

  private intro(): void {
    const { width: W } = VIEW;
    const s = getSession();
    const m = this.api.state();
    const paperDone = m.runs.some((r) => r.mode === 'paper');
    this.header('—', null);
    const card = new PixelPanel(this, 16, 70, W - 32, 250, { variant: 'card' });
    card.add(text(this, 14, 12, tr('market.title', 'CHARMINAR MARKET'), 'md', COLOR.ink));
    card.add(
      text(
        this,
        14,
        44,
        tr(
          'market.intro',
          'Four made-up companies. Buy a few shares, watch two years go by one quarter at a time, and learn what moves a price — and what moves you.\n\nFirst: a practice round with ₹10,000 that is not real. Then, if you like, your own savings.',
        ),
        'xs',
        COLOR.ink,
        { wordWrap: { width: W - 60, useAdvancedWrap: true } },
      ),
    );
    card.add(
      text(
        this,
        14,
        200,
        tr(
          'market.disclaimer',
          'Made-up companies. Assumptions, not promises. Scored on what you do, not on what you make.',
        ),
        'xs',
        COLOR.muted,
        {
          wordWrap: { width: W - 60, useAdvancedWrap: true },
        },
      ),
    );
    this.root.add(card);

    this.root.add(
      new Button(
        this,
        W / 2,
        360,
        tr('market.paper', paperDone ? 'PRACTICE AGAIN · ₹10,000' : 'PRACTICE ROUND · ₹10,000'),
        () => {
          this.api.start('paper', 0);
          this.pending = { zipeats: 0, dashkart: 0, autogo: 0, chaiwala: 0 };
          save();
          this.render();
        },
        { fill: COLOR.good, height: 52 },
      ),
    );

    const savings = Math.floor(s.game!.state.bars.savings);
    if (paperDone && savings >= 500) {
      let pct = 50;
      const label = (): string =>
        `${tr('market.real', 'REAL RUN')} · ${rupees(Math.floor((savings * pct) / 100))}`;
      const realBtn = new Button(
        this,
        W / 2,
        430,
        label(),
        () => {
          this.api.start('real', Math.floor((savings * pct) / 100));
          this.pending = { zipeats: 0, dashkart: 0, autogo: 0, chaiwala: 0 };
          save();
          this.render();
        },
        { fill: COLOR.money, height: 52 },
      );
      this.root.add(realBtn);
      this.root.add(
        text(
          this,
          W / 2,
          470,
          tr('market.deposit_hint', 'From your savings of {amount}. How much?', {
            amount: rupees(savings),
          }),
          'xs',
          COLOR.white,
        ).setOrigin(0.5),
      );
      [25, 50, 75, 100].forEach((v, i) => {
        this.root.add(
          new Button(
            this,
            60 + i * 80,
            510,
            `${v}%`,
            () => {
              pct = v;
              realBtn.setCaption(label());
            },
            { width: 68, height: 40, size: 'xs', fill: 0x505878 },
          ),
        );
      });
    } else if (paperDone) {
      this.root.add(
        text(
          this,
          W / 2,
          440,
          tr('market.need_savings', 'Save at least ₹500 to open a real run.'),
          'xs',
          COLOR.muted,
        ).setOrigin(0.5),
      );
    } else {
      this.root.add(
        text(
          this,
          W / 2,
          440,
          tr('market.paper_first', 'The real run unlocks after one practice round.'),
          'xs',
          COLOR.muted,
        ).setOrigin(0.5),
      );
    }
    this.root.add(
      new Button(this, W / 2, 596, tr('btn.back_map', '◀ BACK TO MAP'), () => this.exit(), {
        fill: 0x505878,
        height: 48,
      }),
    );
  }

  private quarter(run: MarketRun): void {
    const { width: W } = VIEW;
    const news = this.api.news();
    this.header(`Q${run.turn + 1}/${run.turns}`, run);

    // news card
    const nc = new PixelPanel(this, 12, 62, W - 24, 80, {
      variant: news?.kind === 'crash' ? 'red' : news?.kind === 'tip' ? 'blue' : 'card',
    });
    nc.add(
      text(this, 10, 8, news?.headline ?? '', 'xs', COLOR.ink, {
        wordWrap: { width: W - 48, useAdvancedWrap: true },
      }),
    );
    nc.add(
      text(this, 10, 46, news?.detail ?? '', 'xs', COLOR.muted, {
        wordWrap: { width: W - 48, useAdvancedWrap: true },
      }),
    );
    this.root.add(nc);

    // company rows
    this.api.companies().forEach((c, i) => this.row(run, c, ROWS_Y + i * ROW_H));

    // professor line
    const pp = new PixelPanel(this, 12, ROWS_Y + 4 * ROW_H + 2, W - 24, 56, { variant: 'card' });
    pp.add(text(this, 10, 6, tr('professor.name', 'Professor'), 'xs', COLOR.aunty));
    pp.add(
      text(this, 10, 22, news?.professor ?? '', 'xs', COLOR.ink, {
        wordWrap: { width: W - 48, useAdvancedWrap: true },
      }),
    );
    this.root.add(pp);

    const fees = Object.values(this.pending).filter((n) => n !== 0).length * 20;
    this.root.add(
      new Button(
        this,
        W / 2 + 40,
        606,
        `${tr('market.next', 'NEXT QUARTER ▶')}${fees ? `  (${tr('market.fees', 'fees')} ${rupees(fees)})` : ''}`,
        () => this.advance(),
        {
          width: 236,
          height: 48,
          size: 'xs',
          fill: COLOR.good,
        },
      ),
    );
    this.root.add(
      new Button(this, 60, 606, tr('btn.exit', 'EXIT'), () => this.exit(), {
        width: 92,
        height: 48,
        size: 'xs',
        fill: 0x505878,
      }),
    );
  }

  private row(run: MarketRun, c: MarketCompany, y: number): void {
    const { width: W } = VIEW;
    const price = this.api.price(c.id);
    const prev = run.prices[c.id][Math.max(0, run.prices[c.id].length - 2)];
    const pct = prev ? ((price - prev) / prev) * 100 : 0;
    const held = run.holdings[c.id];
    const pend = this.pending[c.id];
    const p = new PixelPanel(this, 12, y, W - 24, ROW_H - 6, { variant: 'card' });
    p.add(text(this, 10, 6, `${c.icon} ${c.name}`, 'sm', COLOR.ink));
    p.add(text(this, 10, 28, c.category, 'xs', COLOR.muted));
    p.add(
      text(
        this,
        10,
        44,
        '●'.repeat(c.risk) + '○'.repeat(3 - c.risk),
        'xs',
        c.risk === 3 ? COLOR.bad : c.risk === 2 ? COLOR.warn : COLOR.good,
      ),
    );
    p.add(text(this, 120, 6, rupees(price), 'sm', COLOR.ink));
    p.add(
      text(
        this,
        120,
        26,
        `${pct >= 0 ? '▲' : '▼'} ${Math.abs(pct).toFixed(1)}%`,
        'xs',
        pct >= 0 ? COLOR.good : COLOR.bad,
      ),
    );
    p.add(
      text(
        this,
        120,
        44,
        `${tr('market.held', 'held')} ${held}${pend ? ` ${pend > 0 ? '+' : ''}${pend}` : ''}`,
        'xs',
        pend ? COLOR.money : COLOR.muted,
      ),
    );
    // candles for the last quarter (decorative)
    const g = this.add.graphics();
    const candles = run.candles[c.id][run.candles[c.id].length - 1];
    this.drawCandles(g, candles ?? null, 190, 8, 76, 40, price);
    p.add(g);
    // order buttons
    const canBuy = run.cash >= STEP_SHARES * price + 20 + Math.max(0, pend) * price;
    const canSell = held + pend - STEP_SHARES >= 0;
    const minus = new Button(
      this,
      W - 24 - 62,
      ROW_H / 2 - 3,
      '−',
      () => {
        if (!canSell) return;
        this.pending[c.id] -= STEP_SHARES;
        play('select');
        this.render();
      },
      { width: 36, height: 36, size: 'md', fill: canSell ? COLOR.bad : 0x505878 },
    );
    const plus = new Button(
      this,
      W - 24 - 20,
      ROW_H / 2 - 3,
      '+',
      () => {
        if (!canBuy) return;
        this.pending[c.id] += STEP_SHARES;
        play('select');
        this.render();
      },
      { width: 36, height: 36, size: 'md', fill: canBuy ? COLOR.good : 0x505878 },
    );
    p.add([minus, plus]);
    this.root.add(p);
  }

  private drawCandles(
    g: Phaser.GameObjects.Graphics,
    candles: { o: number; h: number; l: number; c: number }[] | null,
    x: number,
    y: number,
    w: number,
    h: number,
    price: number,
  ): void {
    g.fillStyle(0x1b1b2f, 1).fillRect(x, y, w, h);
    if (!candles || candles.length === 0) {
      g.lineStyle(2, 0x505878, 1).lineBetween(x + 4, y + h / 2, x + w - 4, y + h / 2);
      return;
    }
    const lo = Math.min(...candles.map((k) => k.l));
    const hi = Math.max(...candles.map((k) => k.h));
    const span = Math.max(1e-6, hi - lo);
    const cw = w / candles.length;
    candles.forEach((k, i) => {
      const cx = x + i * cw + cw / 2;
      const yy = (v: number): number => y + h - ((v - lo) / span) * (h - 4) - 2;
      const up = k.c >= k.o;
      const col = up ? 0x48b048 : 0xe04848;
      g.lineStyle(1, col, 1).lineBetween(cx, yy(k.h), cx, yy(k.l));
      const top = yy(Math.max(k.o, k.c));
      const bot = yy(Math.min(k.o, k.c));
      g.fillStyle(col, 1).fillRect(cx - cw * 0.3, top, cw * 0.6, Math.max(1, bot - top));
    });
    void price;
  }

  private advance(): void {
    const orders = (Object.keys(this.pending) as MarketCompanyId[])
      .filter((id) => this.pending[id] !== 0)
      .map((id) => ({ company: id, shares: this.pending[id] }));
    try {
      if (orders.length) this.api.trade(orders);
    } catch (e) {
      console.warn(e);
    }
    this.pending = { zipeats: 0, dashkart: 0, autogo: 0, chaiwala: 0 };
    const r = this.api.nextTurn();
    save();
    if (r.happinessDelta < 0) {
      this.cameras.main.shake(180, 0.006);
      play('bad');
    } else if (r.happinessDelta > 0) play('coin');
    this.render();
    if (r.panicSold)
      this.toast(tr('market.panic', 'You sold into the crash. The Professor noticed.'), COLOR.bad);
    else if (r.happinessDelta)
      this.toast(
        `${t('hud.happiness')} ${r.happinessDelta > 0 ? '+' : ''}${r.happinessDelta}`,
        r.happinessDelta > 0 ? COLOR.good : COLOR.bad,
      );
  }

  private results(run: MarketRun): void {
    const { width: W } = VIEW;
    const ch = this.api.finish();
    save();
    this.header(tr('market.results', 'RESULTS'), null);
    const card = new PixelPanel(this, 12, 62, W - 24, 400, { variant: 'card' });
    card.add(
      text(
        this,
        12,
        10,
        run.mode === 'paper'
          ? tr('market.paper_done', 'Practice round over')
          : tr('market.real_done', 'Two years later'),
        'md',
        COLOR.ink,
      ),
    );
    const gain = ch.finalValue - ch.deposit;
    card.add(
      text(
        this,
        12,
        40,
        `${rupees(ch.deposit)} → ${rupees(ch.finalValue)}  (${gain >= 0 ? '+' : ''}${rupees(gain)})`,
        'sm',
        gain >= 0 ? COLOR.good : COLOR.bad,
      ),
    );
    card.add(
      text(
        this,
        12,
        62,
        tr('market.banyan', 'Banyan Savings would have given {amount}. Fees paid: {fees}.', {
          amount: rupees(ch.banyanValue),
          fees: rupees(ch.fees),
        }),
        'xs',
        COLOR.muted,
        { wordWrap: { width: W - 48 } },
      ),
    );
    card.add(
      text(
        this,
        12,
        96,
        tr('market.what_you_did', 'What you did (this is what counts):'),
        'xs',
        COLOR.aunty,
      ),
    );
    const rows: [boolean, string][] = [
      [ch.diversified, tr('market.chk.div', 'Spread across 2+ companies')],
      [ch.heldThroughCrash, tr('market.chk.hold', 'Held through the crash')],
      [ch.refusedTip, tr('market.chk.tip', 'Refused the WhatsApp tip')],
      [ch.lowChurn, tr('market.chk.churn', 'Traded calmly (≤ 6 trades)')],
    ];
    rows.forEach(([ok, label], i) => {
      card.add(
        text(
          this,
          16,
          120 + i * 24,
          `${ok ? '✓' : '✗'}  ${label}`,
          'sm',
          ok ? COLOR.good : COLOR.bad,
        ),
      );
    });
    const passed = rows.filter(([ok]) => ok).length;
    const verdict =
      passed === 4
        ? tr('market.verdict4', 'Textbook. You behaved like an investor, not a gambler.')
        : passed >= 2
          ? tr(
              'market.verdict2',
              'Decent. Look at the crosses — that is where the market gets people.',
            )
          : tr(
              'market.verdict0',
              'The market taught you something expensive today. That is what practice is for.',
            );
    card.add(
      text(this, 12, 230, `${tr('professor.name', 'Professor')}: ${verdict}`, 'xs', COLOR.ink, {
        wordWrap: { width: W - 48, useAdvancedWrap: true },
      }),
    );
    if (run.mode === 'real')
      card.add(
        text(
          this,
          12,
          300,
          tr(
            'market.settled',
            'Everything is sold back into your savings. No fee on the final sale.',
          ),
          'xs',
          COLOR.muted,
          { wordWrap: { width: W - 48 } },
        ),
      );
    card.add(
      text(
        this,
        12,
        350,
        tr(
          'market.disclaimer',
          'Made-up companies. Assumptions, not promises. Scored on what you do, not on what you make.',
        ),
        'xs',
        COLOR.muted,
        { wordWrap: { width: W - 48, useAdvancedWrap: true } },
      ),
    );
    this.root.add(card);
    this.root.add(
      new Button(this, W / 2, 500, tr('market.again', 'MARKET HOME'), () => this.render(), {
        fill: COLOR.money,
        height: 48,
      }),
    );
    this.root.add(
      new Button(this, W / 2, 560, tr('btn.back_map', '◀ BACK TO MAP'), () => this.exit(), {
        fill: 0x505878,
        height: 48,
      }),
    );
  }

  // ---- bits ---------------------------------------------------------------------------------

  private header(right: string, run: MarketRun | null): void {
    const { width: W } = VIEW;
    this.root.add(this.add.rectangle(0, 0, W, 56, 0x1b1b2f, 1).setOrigin(0));
    this.root.add(this.add.rectangle(0, 54, W, 2, COLOR.accent).setOrigin(0));
    this.root.add(
      text(this, 10, 8, `📈 ${tr('market.title', 'CHARMINAR MARKET')}`, 'sm', COLOR.white),
    );
    // leave room for the global ♪ button (SoundScene) at the top-right
    this.root.add(text(this, W - 52, 8, right, 'sm', COLOR.accent).setOrigin(1, 0));
    if (run) {
      const total = this.api.value();
      const d = total - run.deposit;
      this.root.add(
        text(
          this,
          10,
          32,
          `${run.mode === 'paper' ? tr('market.paper_tag', 'PRACTICE') : tr('market.real_tag', 'REAL')} · ${tr('market.cash', 'cash')} ${rupees(run.cash)} · ${tr('market.total', 'total')} ${rupees(total)} (${d >= 0 ? '+' : ''}${rupees(d)})`,
          'xs',
          d >= 0 ? COLOR.good : COLOR.bad,
        ),
      );
    }
  }

  private toast(msg: string, color: number): void {
    const { width: W } = VIEW;
    const tt = text(this, W / 2, 580, msg, 'xs', color)
      .setOrigin(0.5)
      .setDepth(10);
    this.tweens.add({
      targets: tt,
      alpha: 0,
      delay: 1400,
      duration: 400,
      onComplete: () => tt.destroy(),
    });
  }

  private hud(on: boolean): void {
    const mgr = this.scene.manager;
    if (!mgr.keys['HUD'] || !mgr.isActive('HUD')) return;
    const hud = mgr.getScene('HUD');
    hud.scene.setVisible(on);
    hud.input.enabled = on;
  }

  private exit(): void {
    this.api.close();
    this.hud(true);
    this.scene.start(this.back.key, this.back.data);
  }
}
