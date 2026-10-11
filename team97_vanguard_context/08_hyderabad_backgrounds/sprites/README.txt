Character sprites - built by source/sprites.py (same pxlib pipeline as the backgrounds)

    cd source && python sprites.py          # rebuilds everything below

1x/<key>.png       game-ready originals (transparent PNG)
4x/<key>@4x.png    nearest-neighbour x4 copies for slides / docs
sprite_sheet.png   every sprite at x4 with its key
battle_preview_sprites.png   12_college + platforms + avatar back (x3) + npc_shady (x2), saved at x2

Scale only by whole numbers with nearest-neighbour filtering (no smoothing).

Avatars (48x48)            front = picker, _back = player on the battle platform
  avatar_boy_1             dark hair, green tee, jeans, sneakers
  avatar_boy_2             headband, kurta-shirt, pyjama, chappals
  avatar_girl_1            long plait, salwar-kameez, dupatta
  avatar_girl_2            short bob, hoodie over a kurti, backpack
  avatar_neutral           tousled hair, oversized tee, college ID lanyard

Professor
  professor, professor_happy   48x48 portraits (lessons / praise)
  professor_walk_0, _1         32x32 side-view walk frames (facing right)

Opponent portraits (48x48, front, waist-up) - keys match src/game/ui/Portrait.ts
  npc_shady      caller / unknown number / 'officer' / group admin
  caller_wonky   npc_shady in a phone-call frame, for the call overlay
  npc_uncle      uncle / relative / mom's friend
  npc_friend     friend / classmate / cousin / co-worker
  npc_shop       shopkeeper / shop owner / customer (behind the counter)

Not in this pass: avatar side-walk frames, the other 7 NPCs, icons, HUD bits.
