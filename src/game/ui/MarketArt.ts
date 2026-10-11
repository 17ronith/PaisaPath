// Charminar Market art (original pixel art, team97_vanguard_context/08_hyderabad_backgrounds/
// source/market.py → public/assets/market/). Keys, sheet geometry and the animations built from
// the horizontal strips. Everything degrades: the scene checks textures.exists before use.
import Phaser from 'phaser';

const M = 'assets/market/';

export const MARKET_IMAGES: Record<string, string> = {
  mk_device: `${M}device_frame.png`,
  mk_btn_buy: `${M}btn_buy.png`,
  mk_btn_sell: `${M}btn_sell.png`,
  mk_card_news: `${M}card_news.png`,
  mk_candle_up: `${M}candle_up.png`,
  mk_candle_down: `${M}candle_down.png`,
  mk_candle_doji: `${M}candle_doji.png`,
  mk_chk_pass: `${M}chk_pass.png`,
  mk_chk_fail: `${M}chk_fail.png`,
  mk_chk_info: `${M}chk_info.png`,
  mk_arrow_up: `${M}ticker_arrow_up.png`,
  mk_arrow_down: `${M}ticker_arrow_down.png`,
  mk_badge_1: `${M}badge_risk_1.png`,
  mk_badge_2: `${M}badge_risk_2.png`,
  mk_badge_3: `${M}badge_risk_3.png`,
  co_zipeats: `${M}co_zipeats.png`,
  co_dashkart: `${M}co_dashkart.png`,
  co_autogo: `${M}co_autogo.png`,
  co_chaiwala: `${M}co_chaiwala.png`,
  co_zipeats_16: `${M}co_zipeats_16.png`,
  co_dashkart_16: `${M}co_dashkart_16.png`,
  co_autogo_16: `${M}co_autogo_16.png`,
  co_chaiwala_16: `${M}co_chaiwala_16.png`,
};

/** Horizontal strips: key → [file, frameW, frameH, frames, ms per frame]. */
export const MARKET_SHEETS: Record<string, [string, number, number, number, number]> = {
  mk_prof_walk: [`${M}prof_market_walk.png`, 32, 32, 4, 140],
  mk_tip: [`${M}tip_forward.png`, 48, 48, 6, 80],
  mk_crash: [`${M}crash_flash.png`, 64, 32, 6, 140],
  mk_coins: [`${M}coin_rain.png`, 32, 32, 6, 90],
  mk_led: [`${M}led_blink.png`, 4, 4, 2, 500],
};

/** 9-slice insets from market.json. */
export const MARKET_SLICE = {
  btn: { l: 8, r: 8, t: 8, b: 12 },
  card: { l: 8, r: 8, t: 8, b: 6 },
} as const;

/** Where the device frame's screen cut-out sits in the 360×640 view (market.json). */
export const DEVICE_SCREEN = { x: 20, y: 40, w: 320, h: 520 } as const;
export const DEVICE_LED = { x: 30, y: 18 } as const;

/** Register the looping animations once (anims are global). Safe to call again. */
export function registerMarketAnims(scene: Phaser.Scene): void {
  for (const [key, [, , , frames, ms]] of Object.entries(MARKET_SHEETS)) {
    if (scene.anims.exists(key) || !scene.textures.exists(key)) continue;
    scene.anims.create({
      key,
      frames: scene.anims.generateFrameNumbers(key, { start: 0, end: frames - 1 }),
      frameRate: 1000 / ms,
      repeat: -1,
    });
  }
}

/** A sprite playing one of the market loops, or null if its sheet didn't load. */
export function marketSprite(
  scene: Phaser.Scene,
  key: keyof typeof MARKET_SHEETS,
  x: number,
  y: number,
): Phaser.GameObjects.Sprite | null {
  if (!scene.textures.exists(key)) return null;
  const sp = scene.add.sprite(x, y, key, 0);
  if (scene.anims.exists(key)) sp.play(key);
  return sp;
}
