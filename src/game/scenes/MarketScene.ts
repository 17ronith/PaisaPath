// Charminar Market — the stock-simulator "device" (docs/plan/STOCKS.md). Opened from the HUD's
// 📈 button once chapter ≥ 5. Paper round first (₹10,000 virtual, Professor teaches), then real
// runs with savings. Scored on behaviour, never on money made. Candlesticks are decorative.
// Everything is drawn inside the device frame's screen (DEVICE_SCREEN); the action buttons sit on
// the frame's bottom bezel. Art: public/assets/market (see ui/MarketArt.ts); each piece falls back
// to plain shapes if its texture is missing.
import Phaser from 'phaser';
import { getSession } from '@/app/session';
import { rupees, t } from '@/shared/i18n';
import type {
  MarketApi,
  MarketCandle,
  MarketCompany,
  MarketCompanyId,
  MarketNews,
  MarketRun,
} from '@/shared/types';
import { play } from '../audio';
import { save } from '../flow/Driver';
import { BACKDROP_EXTRA, drawBackdrop } from '../ui/Backdrop';
import { Button } from '../ui/Button';
import { DEVICE_LED, DEVICE_SCREEN, MARKET_SLICE, marketSprite } from '../ui/MarketArt';
import { PixelPanel } from '../ui/PixelPanel';
import { COLOR, text, tr } from '../ui/theme';
import { VIEW } from '../view';

const STEP_SHARES = 5;
const FEE = 20;
const { x: SX, y: SY, w: SW, h: SH } = DEVICE_SCREEN;
/** Screen layout (y offsets inside the device screen). */
const L = {
  bar: 22,
  chartY: 42,
  chartH: 82,
  newsY: 128,
  newsH: 98,
  rowsY: 230,
  rowH: 44,
  profY: 408,
  profH: 70,
  footY: 484,
} as const;
const BEZEL_Y = 600;
const DEPTH = { frame: 50, bezel: 60, toast: 40 } as const;
const SCREEN_BG = 0x0b1222;
const ROW_BG = 0x16203a;
const ROW_EDGE = 0x2a3550;
const CANDLE = { up: 0x48b048, upHi: 0x88e088, down: 0xe04848, downHi: 0xf89090, doji: 0xc8c8d8 };
const IDS: MarketCompanyId[] = ['zipeats', 'dashkart', 'autogo', 'chaiwala'];
const noOrders = (): Record<MarketCompanyId, number> => ({
  zipeats: 0,
  dashkart: 0,
  autogo: 0,
  chaiwala: 0,
});

export class MarketScene extends Phaser.Scene {
  private api!: MarketApi;
  private root!: Phaser.GameObjects.Container;
  /** Layer above the device frame: the bezel buttons. */
  private top!: Phaser.GameObjects.Container;
  private pending = noOrders();
  private selected: MarketCompanyId = 'zipeats';
  /** Turn on which the Professor last walked in (he walks once per quarter, not per tap). */
  private walkedTurn = -1;
  private settled: ReturnType<MarketApi['finish']> | null = null;
  private toastObj: Phaser.GameObjects.Container | null = null;
  /** The footer line; hidden while a toast takes its place. */
  private footText: Phaser.GameObjects.Text | null = null;

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
    this.pending = noOrders();
    this.walkedTurn = -1;
    this.settled = null;
    this.hud(false);
    this.cameras.main.setBackgroundColor(0x101420);
    this.root = this.add.container(0, 0);
    this.top = this.add.container(0, 0).setDepth(DEPTH.bezel);
    this.frame();
    this.render();
  }

  // ---- device ---------------------------------------------------------------------------------

  /** The phone-like frame over everything, with its blinking LED. Drawn once per visit. */
  private frame(): void {
    const { width: W, height: H } = VIEW;
    if (this.textures.exists('mk_device')) {
      this.add.image(0, 0, 'mk_device').setOrigin(0).setDepth(DEPTH.frame);
    } else {
      const g = this.add.graphics().setDepth(DEPTH.frame);
      g.fillStyle(0x2a2c3c, 1);
      g.fillRect(0, 0, W, SY);
      g.fillRect(0, SY + SH, W, H - SY - SH);
      g.fillRect(0, SY, SX, SH);
      g.fillRect(SX + SW, SY, W - SX - SW, SH);
    }
    marketSprite(this, 'mk_led', DEVICE_LED.x, DEVICE_LED.y)
      ?.setOrigin(0)
      .setDepth(DEPTH.frame + 1);
  }

  // ---- screens --------------------------------------------------------------------------------

  private render(): void {
    this.root.removeAll(true);
    this.top.removeAll(true);
    this.toastObj?.destroy();
    this.toastObj = null;
    this.footText = null;
    this.root.add(this.add.rectangle(SX, SY, SW, SH, SCREEN_BG).setOrigin(0));
    const run = this.api.current();
    if (!run) return this.intro();
    if (run.finished) return this.results(run);
    this.quarter(run);
  }

  private intro(): void {
    const s = getSession();
    const m = this.api.state();
    const paperDone = m.runs.some((r) => r.mode === 'paper');
    this.statusBar('', null);
    const before = new Set(this.children.list);
    if (drawBackdrop(this, `bg_${BACKDROP_EXTRA.market}`, SX, SY + L.bar, SW, 140))
      this.root.add(this.children.list.filter((o) => !before.has(o) && o !== this.root));
    else this.root.add(this.add.rectangle(SX, SY + L.bar, SW, 140, 0x2a2c50).setOrigin(0));

    const card = new PixelPanel(this, SX + 4, SY + 166, SW - 8, 150, { variant: 'card' });
    card.add(text(this, 12, 8, tr('market.title', 'CHARMINAR MARKET'), 'md', COLOR.ink));
    card.add(
      text(
        this,
        12,
        34,
        tr(
          'market.intro',
          'Four made-up companies. Buy a few shares, watch two years go by one quarter at a time, and learn what moves a price — and what moves you.\n\nFirst: a practice round with ₹10,000 that is not real. Then, if you like, your own savings.',
        ),
        'xs',
        COLOR.ink,
        { wordWrap: { width: SW - 32, useAdvancedWrap: true } },
      ),
    );
    this.root.add(card);
    this.root.add(
      text(
        this,
        SX + 8,
        SY + 320,
        tr(
          'market.disclaimer',
          'Made-up companies. Assumptions, not promises. Scored on what you do, not on what you make.',
        ),
        'xs',
        COLOR.accent,
        { wordWrap: { width: SW - 16, useAdvancedWrap: true } },
      ),
    );

    this.root.add(
      new Button(
        this,
        SX + SW / 2,
        SY + 384,
        paperDone
          ? tr('market.paper_again', 'PRACTICE AGAIN · ₹10,000')
          : tr('market.paper', 'PRACTICE ROUND · ₹10,000'),
        () => this.begin('paper', 0),
        { fill: COLOR.good, height: 44, width: SW - 24 },
      ),
    );

    const savings = Math.floor(s.game!.state.bars.savings);
    if (paperDone && savings >= 500) {
      let pct = 50;
      const amount = (): number => Math.floor((savings * pct) / 100);
      const label = (): string => `${tr('market.real', 'REAL RUN')} · ${rupees(amount())}`;
      const realBtn = new Button(
        this,
        SX + SW / 2,
        SY + 432,
        label(),
        () => this.begin('real', amount()),
        {
          fill: COLOR.money,
          height: 44,
          width: SW - 24,
        },
      );
      this.root.add(realBtn);
      this.root.add(
        text(
          this,
          SX + SW / 2,
          SY + 458,
          tr('market.deposit_hint', 'From your savings of {amount}. How much?', {
            amount: rupees(savings),
          }),
          'xs',
          COLOR.white,
        ).setOrigin(0.5, 0),
      );
      const chips: Button[] = [];
      [25, 50, 75, 100].forEach((v, i) => {
        const chip = new Button(
          this,
          SX + 40 + i * 80,
          SY + 494,
          `${v}%`,
          () => {
            pct = v;
            realBtn.setCaption(label());
            chips.forEach((c, j) => c.setFill([25, 50, 75, 100][j] === v ? COLOR.warn : 0x505878));
          },
          { width: 68, height: 32, size: 'xs', fill: v === pct ? COLOR.warn : 0x505878 },
        );
        chips.push(chip);
        this.root.add(chip);
      });
    } else {
      const msg = paperDone
        ? tr('market.need_savings', 'Save at least ₹500 to open a real run.')
        : tr('market.paper_first', 'The real run unlocks after one practice round.');
      this.root.add(
        text(this, SX + SW / 2, SY + 430, msg, 'xs', COLOR.muted, {
          align: 'center',
          wordWrap: { width: SW - 24, useAdvancedWrap: true },
        }).setOrigin(0.5, 0),
      );
    }
    this.bezel([[tr('btn.back_map', '◀ BACK TO MAP'), () => this.exit(), 0x505878, 280]]);
  }

  private begin(mode: 'paper' | 'real', deposit: number): void {
    this.api.start(mode, deposit);
    this.pending = noOrders();
    this.walkedTurn = -1;
    this.settled = null;
    save();
    this.render();
  }

  private quarter(run: MarketRun): void {
    const news = this.api.news();
    const freshTurn = this.walkedTurn !== run.turn;
    if (freshTurn && news?.about) this.selected = news.about;
    this.statusBar(`Q${run.turn + 1}/${run.turns}`, run);
    this.chart(run);
    this.newsCard(news);
    this.api.companies().forEach((c, i) => this.row(run, c, SY + L.rowsY + i * L.rowH));
    this.professor(news?.professor ?? '', freshTurn);
    this.walkedTurn = run.turn;
    this.footer(run);

    const fees = IDS.filter((id) => this.pending[id] !== 0).length * FEE;
    this.bezel([
      [tr('btn.exit', 'EXIT'), () => this.exit(), 0x505878, 96],
      [
        `${tr('market.next', 'NEXT QUARTER ▶')}${fees ? ` · ${rupees(fees)}` : ''}`,
        () => this.advance(),
        COLOR.good,
        200,
      ],
    ]);
  }

  // ---- quarter pieces -------------------------------------------------------------------------

  /** Big decorative candlestick chart of the selected company (last 40 candles). */
  private chart(run: MarketRun): void {
    const x = SX + 4;
    const y = SY + L.chartY;
    const w = SW - 8;
    const h = L.chartH;
    const g = this.add.graphics();
    g.fillStyle(0x0e1830, 1).fillRect(x, y, w, h);
    g.lineStyle(1, ROW_EDGE, 1).strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    for (let i = 1; i < 4; i++) {
      g.lineStyle(1, 0x18233e, 1).lineBetween(x + 1, y + (h * i) / 4, x + w - 1, y + (h * i) / 4);
    }
    this.root.add(g);

    const c = this.api.companies().find((k) => k.id === this.selected)!;
    this.icon16(c.id, x + 6, y + 5);
    this.root.add(text(this, x + 26, y + 2, c.name, 'xs', COLOR.white));
    const price = this.api.price(c.id);
    this.root.add(text(this, x + w - 6, y + 2, rupees(price), 'xs', COLOR.warn).setOrigin(1, 0));

    const all = run.candles[c.id].flat().slice(-40);
    const top = y + 22;
    const ch = h - 28;
    if (all.length === 0) {
      g.lineStyle(1, 0x505878, 1).lineBetween(x + 6, top + ch / 2, x + w - 6, top + ch / 2);
      this.root.add(
        text(
          this,
          x + w / 2,
          top + ch / 2 + 6,
          tr('market.chart_empty', 'Prices move when you press NEXT QUARTER'),
          'xs',
          COLOR.muted,
        ).setOrigin(0.5, 0),
      );
      return;
    }
    const lo = Math.min(...all.map((k) => k.l));
    const hi = Math.max(...all.map((k) => k.h));
    const span = Math.max(1e-6, hi - lo);
    const yy = (v: number): number => Math.round(top + ch - ((v - lo) / span) * ch);
    const cw = (w - 12) / all.length;
    const bw = Math.max(2, Math.floor(cw * 0.6));
    all.forEach((k, i) => {
      const cx = Math.round(x + 6 + i * cw + cw / 2);
      const kind = this.kind(k);
      const col = kind === 'up' ? CANDLE.up : kind === 'down' ? CANDLE.down : CANDLE.doji;
      g.lineStyle(1, col, 1).lineBetween(cx + 0.5, yy(k.h), cx + 0.5, yy(k.l));
      const t0 = yy(Math.max(k.o, k.c));
      const b0 = yy(Math.min(k.o, k.c));
      g.fillStyle(col, 1).fillRect(cx - Math.floor(bw / 2), t0, bw, Math.max(1, b0 - t0));
      if (b0 - t0 > 2) {
        g.fillStyle(kind === 'up' ? CANDLE.upHi : CANDLE.downHi, 1).fillRect(
          cx - Math.floor(bw / 2),
          t0,
          1,
          b0 - t0,
        );
      }
      // quarter separators every 8 candles
      if (i > 0 && (run.candles[c.id].flat().length - all.length + i) % 8 === 0) {
        g.lineStyle(1, 0x22304e, 1).lineBetween(cx - cw / 2, top, cx - cw / 2, top + ch);
      }
    });
  }

  private newsCard(news: MarketNews | null): void {
    const x = SX + 4;
    const y = SY + L.newsY;
    const w = SW - 8;
    const h = L.newsH;
    this.root.add(this.cardBg(x, y, w, h));
    let textX = x + 10;
    if (news?.kind === 'tip') {
      const sp = marketSprite(this, 'mk_tip', x + 30, y + 30);
      if (sp) {
        this.root.add(sp);
        textX = x + 58;
      }
    } else if (news?.kind === 'crash') {
      const sp = marketSprite(this, 'mk_crash', x + 6, y + 8);
      if (sp) {
        this.root.add(sp.setOrigin(0));
        textX = x + 74;
      }
    }
    const tag =
      news?.kind === 'tip'
        ? tr('market.tag_tip', 'FORWARDED')
        : news?.kind === 'crash'
          ? tr('market.tag_crash', 'BREAKING')
          : tr('market.tag_news', 'NEWS');
    this.root.add(
      text(
        this,
        textX,
        y + 6,
        tag,
        'xs',
        news?.kind === 'crash' || news?.kind === 'tip' ? COLOR.bad : COLOR.money,
      ),
    );
    const head = text(this, textX, y + 20, news?.headline ?? '', 'xs', COLOR.ink, {
      wordWrap: { width: x + w - textX - 8, useAdvancedWrap: true },
    });
    this.root.add(head);
    const dy = head.y + head.height + 4;
    const lines = Math.max(1, Math.floor((y + h - 4 - dy) / 17));
    this.root.add(
      text(this, x + 10, dy, news?.detail ?? '', 'xs', COLOR.muted, {
        wordWrap: { width: w - 20, useAdvancedWrap: true },
        maxLines: lines,
      }),
    );
  }

  private row(run: MarketRun, c: MarketCompany, y: number): void {
    const x = SX + 4;
    const w = SW - 8;
    const h = L.rowH - 2;
    const price = this.api.price(c.id);
    const prices = run.prices[c.id];
    const prev = prices[Math.max(0, prices.length - 2)];
    const pct = prev ? ((price - prev) / prev) * 100 : 0;
    const held = run.holdings[c.id];
    const pend = this.pending[c.id];
    const sel = this.selected === c.id;

    const bg = this.add
      .rectangle(x, y, w, h, ROW_BG)
      .setOrigin(0)
      .setStrokeStyle(1, sel ? COLOR.accent : ROW_EDGE)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        if (this.selected === c.id) return;
        this.selected = c.id;
        play('select');
        this.render();
      });
    this.root.add(bg);

    if (this.textures.exists(`co_${c.id}`))
      this.root.add(this.add.image(x + 4, y + 5, `co_${c.id}`).setOrigin(0));
    else this.root.add(text(this, x + 6, y + 8, c.icon, 'md', COLOR.white));
    this.root.add(text(this, x + 40, y + 1, c.name, 'xs', COLOR.white));
    const badge = `mk_badge_${c.risk}`;
    if (this.textures.exists(badge))
      this.root.add(this.add.image(x + 40, y + 19, badge).setOrigin(0));
    else
      this.root.add(
        text(this, x + 40, y + 15, '●'.repeat(c.risk) + '○'.repeat(3 - c.risk), 'xs', COLOR.warn),
      );
    this.root.add(
      text(
        this,
        x + 40,
        y + 26,
        `${tr('market.held', 'held')} ${held}${pend ? ` ${pend > 0 ? '+' : ''}${pend}` : ''}`,
        'xs',
        pend ? COLOR.warn : COLOR.accent,
      ),
    );

    this.root.add(text(this, x + 124, y + 2, rupees(price), 'sm', COLOR.white));
    const up = pct >= 0;
    const arrow = up ? 'mk_arrow_up' : 'mk_arrow_down';
    let px = x + 124;
    if (this.textures.exists(arrow)) {
      this.root.add(this.add.image(px, y + 28, arrow).setOrigin(0));
      px += 10;
    }
    this.root.add(
      text(this, px, y + 23, `${Math.abs(pct).toFixed(1)}%`, 'xs', up ? COLOR.good : COLOR.bad),
    );

    this.miniCandles(
      run.candles[c.id][run.candles[c.id].length - 1] ?? null,
      x + 188,
      y + 4,
      60,
      h - 8,
    );

    const projected = (extra: number): number => {
      const after = { ...this.pending, [c.id]: this.pending[c.id] + extra };
      return IDS.reduce(
        (cash, id) => (after[id] ? cash - after[id] * this.api.price(id) - FEE : cash),
        run.cash,
      );
    };
    const canBuy = projected(STEP_SHARES) >= 0;
    const canSell = held + pend - STEP_SHARES >= 0;
    this.orderButton(x + w - 50, y + h / 2, 'sell', canSell, () => {
      this.pending[c.id] -= STEP_SHARES;
      this.selected = c.id;
      this.render();
    });
    this.orderButton(x + w - 18, y + h / 2, 'buy', canBuy, () => {
      this.pending[c.id] += STEP_SHARES;
      this.selected = c.id;
      this.render();
    });
  }

  /** The last quarter's 8 candles as the art's candle sprites, stretched to their high–low span. */
  private miniCandles(
    candles: MarketCandle[] | null,
    x: number,
    y: number,
    w: number,
    h: number,
  ): void {
    if (!candles || candles.length === 0 || !this.textures.exists('mk_candle_up')) {
      const g = this.add.graphics();
      g.lineStyle(1, 0x505878, 1).lineBetween(x, y + h / 2, x + w, y + h / 2);
      this.root.add(g);
      if (!candles || candles.length === 0) return;
    }
    const lo = Math.min(...candles.map((k) => k.l));
    const hi = Math.max(...candles.map((k) => k.h));
    const span = Math.max(1e-6, hi - lo);
    const step = w / candles.length;
    candles.forEach((k, i) => {
      const key = `mk_candle_${this.kind(k)}`;
      if (!this.textures.exists(key)) return;
      const top = y + h - ((k.h - lo) / span) * h;
      const len = Math.max(8, ((k.h - k.l) / span) * h);
      this.root.add(
        this.add
          .image(Math.round(x + i * step), Math.round(Math.min(top, y + h - len)), key)
          .setOrigin(0)
          .setDisplaySize(6, Math.round(len)),
      );
    });
  }

  private orderButton(
    cx: number,
    cy: number,
    side: 'buy' | 'sell',
    enabled: boolean,
    onTap: () => void,
  ): void {
    const w = 28;
    const h = 30;
    const key = side === 'buy' ? 'mk_btn_buy' : 'mk_btn_sell';
    const s = MARKET_SLICE.btn;
    const bg = this.textures.exists(key)
      ? this.add.nineslice(cx, cy, key, undefined, w, h, s.l, s.r, s.t, s.b)
      : this.add.rectangle(cx, cy, w, h, side === 'buy' ? COLOR.good : COLOR.bad);
    const label = text(this, cx, cy - 2, side === 'buy' ? '+' : '−', 'md', COLOR.white).setOrigin(
      0.5,
    );
    bg.setAlpha(enabled ? 1 : 0.3);
    label.setAlpha(enabled ? 1 : 0.4);
    if (enabled) {
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => label.setY(cy));
      bg.on('pointerout', () => label.setY(cy - 2));
      bg.on('pointerup', () => {
        play('select');
        onTap();
      });
    }
    this.root.add([bg, label]);
  }

  private professor(line: string, walkIn: boolean): void {
    const x = SX + 4;
    const y = SY + L.profY;
    this.root.add(this.cardBg(x, y, SW - 8, L.profH));
    const restX = x + 34;
    const footY = y + L.profH - 4;
    const sp = marketSprite(this, 'mk_prof_walk', walkIn ? x - 40 : restX, footY);
    if (sp) {
      sp.setOrigin(0.5, 1).setScale(2);
      this.root.add(sp);
      if (walkIn) {
        this.tweens.add({
          targets: sp,
          x: restX,
          duration: 700,
          ease: 'Sine.easeOut',
          onComplete: () => {
            sp.anims.stop();
            sp.setFrame(0);
          },
        });
      } else {
        sp.anims.stop();
        sp.setFrame(0);
      }
    }
    const tx = sp ? x + 70 : x + 10;
    this.root.add(text(this, tx, y + 4, tr('professor.name', 'Professor'), 'xs', COLOR.aunty));
    this.root.add(
      text(this, tx, y + 20, line, 'xs', COLOR.ink, {
        wordWrap: { width: SW - 8 - (tx - x) - 8, useAdvancedWrap: true },
        maxLines: 3,
      }),
    );
  }

  private footer(run: MarketRun): void {
    const orders = IDS.filter((id) => this.pending[id] !== 0);
    const names = Object.fromEntries(this.api.companies().map((c) => [c.id, c.name]));
    const msg = orders.length
      ? `${tr('market.orders', 'Orders')}: ${orders
          .map((id) => `${this.pending[id] > 0 ? '+' : ''}${this.pending[id]} ${names[id]}`)
          .join(' · ')}`
      : run.turn === 0
        ? tr('market.how', 'Tap + to buy 5 shares, − to sell 5. Each trade costs ₹20.')
        : tr('market.hold', 'No orders: you hold what you have.');
    this.footText = text(
      this,
      SX + 8,
      SY + L.footY,
      msg,
      'xs',
      orders.length ? COLOR.warn : COLOR.accent,
      { wordWrap: { width: SW - 16, useAdvancedWrap: true }, maxLines: 2 },
    );
    this.root.add(this.footText);
  }

  private advance(): void {
    // sells first so their cash pays for the buys
    const orders = IDS.filter((id) => this.pending[id] !== 0)
      .map((id) => ({ company: id, shares: this.pending[id] }))
      .sort((a, b) => a.shares - b.shares);
    try {
      if (orders.length) this.api.trade(orders);
    } catch (e) {
      console.warn(e);
    }
    this.pending = noOrders();
    const r = this.api.nextTurn();
    save();
    if (r.happinessDelta < 0) {
      this.cameras.main.shake(180, 0.006);
      play('bad');
    } else if (r.happinessDelta > 0) play('coin');
    this.render();
    if (r.run.finished) return; // the results card says it all
    if (r.panicSold)
      this.toast(tr('market.panic', 'You sold into the crash. The Professor noticed.'), COLOR.bad);
    else if (r.happinessDelta)
      this.toast(
        `${t('hud.happiness')} ${r.happinessDelta > 0 ? '+' : ''}${r.happinessDelta}`,
        r.happinessDelta > 0 ? COLOR.good : COLOR.bad,
      );
    else {
      const d = r.valueAfter - r.valueBefore;
      this.toast(
        `${tr('market.quarter_moved', 'This quarter')}: ${d >= 0 ? '+' : ''}${rupees(Math.round(d))}`,
        d >= 0 ? COLOR.good : COLOR.bad,
      );
    }
  }

  // ---- results --------------------------------------------------------------------------------

  private results(run: MarketRun): void {
    const ch = (this.settled ??= this.api.finish());
    save();
    this.statusBar(tr('market.results', 'RESULTS'), null);
    const x = SX + 4;
    const w = SW - 8;
    const card = new PixelPanel(this, x, SY + 26, w, 486, { variant: 'card' });
    this.root.add(card);
    const add = (o: Phaser.GameObjects.GameObject): void => void card.add(o);
    add(
      text(
        this,
        12,
        8,
        run.mode === 'paper'
          ? tr('market.paper_done', 'Practice round over')
          : tr('market.real_done', 'Two years later'),
        'md',
        COLOR.ink,
      ),
    );
    const gain = ch.finalValue - ch.deposit;
    add(
      text(
        this,
        12,
        36,
        `${rupees(ch.deposit)} → ${rupees(ch.finalValue)}  (${gain >= 0 ? '+' : ''}${rupees(gain)})`,
        'sm',
        gain >= 0 ? COLOR.good : COLOR.bad,
      ),
    );
    add(
      text(
        this,
        12,
        58,
        tr('market.banyan', 'Banyan Savings would have given {amount}. Fees paid: {fees}.', {
          amount: rupees(ch.banyanValue),
          fees: rupees(ch.fees),
        }),
        'xs',
        COLOR.muted,
        { wordWrap: { width: w - 24, useAdvancedWrap: true } },
      ),
    );
    add(
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
      [ch.refusedTip, tr('market.chk.tip', 'Refused the forwarded tip')],
      [ch.lowChurn, tr('market.chk.churn', 'Traded calmly (≤ 6 trades)')],
    ];
    rows.forEach(([ok, label], i) => {
      const yy = 118 + i * 30;
      const key = ok ? 'mk_chk_pass' : 'mk_chk_fail';
      if (this.textures.exists(key)) add(this.add.image(14, yy, key).setOrigin(0));
      else add(text(this, 16, yy + 2, ok ? '✓' : '✗', 'sm', ok ? COLOR.good : COLOR.bad));
      // long labels (Telugu) drop to the small face and wrap instead of running off the card
      let lab = text(this, 46, yy + 3, label, 'sm', ok ? COLOR.ink : COLOR.bad);
      if (lab.width > w - 60) {
        lab.destroy();
        lab = text(this, 46, yy, label, 'xs', ok ? COLOR.ink : COLOR.bad, {
          wordWrap: { width: w - 60, useAdvancedWrap: true },
          maxLines: 2,
        });
      }
      add(lab);
    });
    if (run.mode === 'paper' && run.turns < 6) {
      const yy = 118 + rows.length * 30;
      if (this.textures.exists('mk_chk_info'))
        add(this.add.image(14, yy, 'mk_chk_info').setOrigin(0));
      add(
        text(
          this,
          46,
          yy + 1,
          tr('market.paper_note', 'The tip and the crash come in the real two-year run.'),
          'xs',
          COLOR.muted,
          { wordWrap: { width: w - 60, useAdvancedWrap: true } },
        ),
      );
    }
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
    const vy = 290;
    const prof = marketSprite(this, 'mk_prof_walk', 36, vy + 66);
    if (prof) {
      prof.anims.stop();
      prof.setFrame(0).setOrigin(0.5, 1).setScale(2);
      add(prof);
    }
    add(text(this, 76, vy, tr('professor.name', 'Professor'), 'xs', COLOR.aunty));
    add(
      text(this, 76, vy + 16, verdict, 'xs', COLOR.ink, {
        wordWrap: { width: w - 88, useAdvancedWrap: true },
      }),
    );
    if (run.mode === 'real')
      add(
        text(
          this,
          12,
          vy + 84,
          tr(
            'market.settled',
            'Everything is sold back into your savings. No fee on the final sale.',
          ),
          'xs',
          COLOR.muted,
          { wordWrap: { width: w - 24, useAdvancedWrap: true } },
        ),
      );
    add(
      text(
        this,
        12,
        vy + 130,
        tr(
          'market.disclaimer',
          'Made-up companies. Assumptions, not promises. Scored on what you do, not on what you make.',
        ),
        'xs',
        COLOR.muted,
        { wordWrap: { width: w - 24, useAdvancedWrap: true } },
      ),
    );
    if (passed >= 3 || gain > 0) this.coinShower();
    this.bezel([
      [
        tr('market.again', 'MARKET HOME'),
        () => ((this.settled = null), this.render()),
        COLOR.money,
        156,
      ],
      [tr('btn.back_map', '◀ BACK TO MAP'), () => this.exit(), 0x505878, 156],
    ]);
  }

  /** A short shower of coins over the screen, then gone (results worth celebrating). */
  private coinShower(): void {
    play('coin');
    [0.15, 0.4, 0.65, 0.9, 0.28, 0.78].forEach((f, i) => {
      const c = marketSprite(this, 'mk_coins', SX + SW * f, SY - 20);
      if (!c) return;
      c.setScale(2).setDepth(DEPTH.toast);
      this.tweens.add({
        targets: c,
        y: SY + SH - 40,
        alpha: { from: 1, to: 0 },
        delay: i * 140,
        duration: 1500,
        ease: 'Quad.easeIn',
        onComplete: () => c.destroy(),
      });
    });
  }

  // ---- bits -----------------------------------------------------------------------------------

  private statusBar(right: string, run: MarketRun | null): void {
    this.root.add(this.add.rectangle(SX, SY, SW, L.bar, 0x0e1626).setOrigin(0));
    this.root.add(this.add.rectangle(SX, SY + L.bar - 1, SW, 1, COLOR.accent).setOrigin(0));
    this.root.add(
      text(this, SX + 6, SY + 2, `📈 ${tr('market.title', 'CHARMINAR MARKET')}`, 'xs', COLOR.white),
    );
    this.root.add(text(this, SX + SW - 6, SY + 2, right, 'xs', COLOR.warn).setOrigin(1, 0));
    if (!run) return;
    const total = this.api.value();
    const d = total - run.deposit;
    this.root.add(
      text(
        this,
        SX + 6,
        SY + L.bar + 1,
        `${run.mode === 'paper' ? tr('market.paper_tag', 'PRACTICE') : tr('market.real_tag', 'REAL')} · ${tr('market.cash', 'cash')} ${rupees(Math.floor(run.cash))} · ${tr('market.total', 'total')} ${rupees(Math.round(total))} (${d >= 0 ? '+' : ''}${rupees(Math.round(d))})`,
        'xs',
        d >= 0 ? COLOR.good : COLOR.bad,
      ),
    );
  }

  /** Torn-paper news card 9-slice (width kept at 16 + a multiple of 4 so the edge tiles cleanly). */
  private cardBg(x: number, y: number, w: number, h: number): Phaser.GameObjects.GameObject {
    const s = MARKET_SLICE.card;
    const ww = 16 + Math.floor((w - 16) / 4) * 4;
    if (this.textures.exists('mk_card_news'))
      return this.add
        .nineslice(x, y, 'mk_card_news', undefined, ww, h, s.l, s.r, s.t, s.b)
        .setOrigin(0);
    return this.add.rectangle(x, y, ww, h, 0xf8f0dc).setOrigin(0);
  }

  private icon16(id: MarketCompanyId, x: number, y: number): void {
    if (this.textures.exists(`co_${id}_16`))
      this.root.add(this.add.image(x, y, `co_${id}_16`).setOrigin(0));
  }

  private kind(k: MarketCandle): 'up' | 'down' | 'doji' {
    const body = Math.abs(k.c - k.o);
    if (body <= Math.max(1e-6, (k.h - k.l) * 0.08)) return 'doji';
    return k.c > k.o ? 'up' : 'down';
  }

  /** Buttons on the device's bottom bezel, laid out left to right: [caption, onTap, fill, width]. */
  private bezel(btns: [string, () => void, number, number][]): void {
    const { width: W } = VIEW;
    const gap = 8;
    const total = btns.reduce((a, [, , , w]) => a + w, 0) + gap * (btns.length - 1);
    let x = (W - total) / 2;
    for (const [caption, onTap, fill, w] of btns) {
      this.top.add(
        new Button(this, x + w / 2, BEZEL_Y, caption, onTap, {
          width: w,
          height: 44,
          size: 'xs',
          fill,
        }),
      );
      x += w + gap;
    }
  }

  private toast(msg: string, color: number): void {
    const y = SY + L.footY - 2;
    const h = SY + SH - y;
    const c = this.add.container(0, 0).setDepth(DEPTH.toast);
    c.add(this.add.rectangle(SX, y, SW, h, SCREEN_BG).setOrigin(0));
    c.add(this.add.rectangle(SX, y, SW, 1, color).setOrigin(0));
    c.add(text(this, SX + SW / 2, y + h / 2, msg, 'sm', color).setOrigin(0.5));
    this.toastObj = c;
    const foot = this.footText;
    foot?.setVisible(false);
    this.tweens.add({
      targets: c,
      alpha: 0,
      delay: 1600,
      duration: 400,
      onComplete: () => {
        c.destroy();
        if (this.toastObj === c) this.toastObj = null;
        if (foot?.active) foot.setVisible(true);
      },
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
