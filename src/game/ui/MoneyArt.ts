// Money-flow sprites for the explainer "coins" step (original pixel art,
// team97_vanguard_context/08_hyderabad_backgrounds/source/money.py → public/assets/explainer/).
// Every strip is horizontal; the scene checks textures.exists before use and falls back to shapes.
import Phaser from 'phaser';

const D = 'assets/explainer/';

/** key → [file, frameW, frameH] */
export const MONEY_SHEETS: Record<string, [string, number, number]> = {
  ex_wallet: [`${D}ex_wallet.png`, 40, 32], // thin, fat, ajar, open
  ex_jar: [`${D}ex_jar.png`, 32, 40], // coin level 0..5
  ex_out_salary: [`${D}ex_out_salary.png`, 40, 32],
  ex_out_lender: [`${D}ex_out_lender.png`, 40, 32],
  ex_out_scam: [`${D}ex_out_scam.png`, 40, 32],
  ex_out_shop: [`${D}ex_out_shop.png`, 40, 32],
  ex_coin: [`${D}ex_coin.png`, 12, 12],
  ex_poof: [`${D}ex_poof.png`, 16, 16],
  ex_moth: [`${D}ex_moth.png`, 10, 8],
};

export const WALLET_FRAME = { thin: 0, fat: 1, ajar: 2, open: 3 } as const;
export const JAR_LEVELS = 5;

export function registerMoneyAnims(scene: Phaser.Scene): void {
  const make = (key: string, end: number, frameRate: number, repeat: number): void => {
    if (scene.anims.exists(key) || !scene.textures.exists(key)) return;
    scene.anims.create({
      key,
      frames: scene.anims.generateFrameNumbers(key, { start: 0, end }),
      frameRate,
      repeat,
    });
  };
  make('ex_coin', 3, 11, -1);
  make('ex_poof', 3, 14, 0);
  make('ex_moth', 1, 8, -1);
  make('ex_out_scam', 1, 3, -1);
}
