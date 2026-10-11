// Character portrait: a framed card with a character sprite (Saharsh's 48×48 set, Kenney for
// the rest) scaled by a whole number (nearest-neighbour, so every art pixel stays square). The sprite is picked from the
// framing's `portrait` key, else from the speaker's role.
import Phaser from 'phaser';
import { COLOR, text } from './theme';

/** Speaker words → NPC texture made in PreloadScene. First match wins. */
const ROLES: [RegExp, string][] = [
  [/professor|sir|teacher|principal|lecturer/i, 'professor'],
  [/aunty|aunt/i, 'npc_aunty'],
  [
    /caller|unknown|officer|agent|admin|scam|recruiter|stranger|app|upi|sms|message|refund|link|lender/i,
    'npc_shady',
  ],
  [/shop|kirana|vendor|customer|owner|boss/i, 'npc_shop'],
  [/uncle|relative|mom.?s friend/i, 'npc_uncle'],
  [/mom|mum|amma|dad|nanna|father|mother|parent|uncle|family/i, 'npc_parent'],
  [/friend|classmate|cousin|brother|sister|co-?worker|senior|manager/i, 'npc_friend'],
  [/bank|clerk|teacher|doctor|college/i, 'npc_clerk'],
];

export function portraitKey(scene: Phaser.Scene, key: string | undefined, speaker: string): string {
  if (key && scene.textures.exists(key)) return key;
  const hit = ROLES.find(([re]) => re.test(speaker));
  const k = hit ? hit[1] : 'npc_friend';
  return scene.textures.exists(k) ? k : '';
}

export class Portrait extends Phaser.GameObjects.Container {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    size: number,
    key: string,
    label = key,
    framed = true,
  ) {
    super(scene, x, y);
    const tex = portraitKey(scene, key, label);
    if (framed) {
      const g = scene.add.graphics();
      g.fillStyle(0x000000, 0.18).fillRoundedRect(-size / 2 + 2, -size / 2 + 3, size, size, 6);
      g.fillStyle(COLOR.panelEdge, 1).fillRoundedRect(-size / 2, -size / 2, size, size, 6);
      g.fillStyle(0xdfe8f0, 1).fillRoundedRect(-size / 2 + 2, -size / 2 + 2, size - 4, size - 4, 5);
      g.fillStyle(0xc8d4e0, 1).fillRect(-size / 2 + 2, size / 6, size - 4, size / 3 - 2);
      this.add(g);
    }
    if (tex) {
      const img = scene.add.image(0, 0, tex);
      // Largest whole-number scale that fits ~80% of the frame.
      const scale = Math.max(1, Math.floor((size * 0.8) / Math.max(img.width, img.height)));
      img.setScale(scale);
      this.add(img);
    } else {
      this.add(
        text(scene, 0, 0, (label || '?').trim().charAt(0).toUpperCase(), 'xl', COLOR.ink).setOrigin(
          0.5,
        ),
      );
    }
    scene.add.existing(this);
  }
}
