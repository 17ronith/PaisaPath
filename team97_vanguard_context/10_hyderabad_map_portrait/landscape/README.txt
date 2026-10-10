HYDERABAD MAP - asset guide
===========================
All coordinates are at 1x (480x270). The 4x folder is the same art scaled x4 with
nearest-neighbour; multiply every coordinate/anchor by 4 when you use it.

DRAW ORDER (every frame)
  1. map_base.png
  2. water_ripple_0/1/2.png      cycle 0 -> 1 -> 2 -> 0 ..., 250 ms per frame
  3. icons + boat + auto         y-sorted together (smaller y drawn first):
                                   icon sort-y = node y, sprite sort-y = its point y
  4. birds                       always on top (they're in the sky)
  5. time-of-day tint            multiply the whole map by the tint colour
                                   (Godot: CanvasModulate / Phaser: setTint / Unity: color)

ICONS (64x72)
  icons/<id>.png        normal
  icons/<id>_done.png   greyed out - use once the player has finished that landmark
  Draw at (node.x - 32, node.y - 66) so the pad point lands on the node.

WATER RIPPLES
  water_ripple_0.png, water_ripple_1.png, water_ripple_2.png
  Transparent overlays; each frame shifts the ripple dashes 4 px so the water drifts.

BOAT (circles the Buddha on Hussain Sagar) - sprites/boat_<dir>_<0|1>.png, 16x13
  dir = right | left | up | down (pick from the boat point's "dir")
  Frames 0/1 = bob + wake, swap every 300 ms.
  Anchor (8, 10): draw at (x - 8, y - 10).
  Path: map_data.json -> boat.points (90 points), advance one point every 100 ms (loop).

AUTO RICKSHAW (drives the road loop) - sprites/auto_<dir>_<0|1>.png, 12x11
  Frames 0/1 = engine bounce, swap every 150 ms.
  Anchor (6, 10): draw at (x - 6, y - 10).
  Path: map_data.json -> auto.loop (180 points), advance one point every 100 ms (loop).

BIRDS - sprites/bird_0.png (wings up), bird_1.png (level), bird_2.png (down), 9x5
  Flap order 0 -> 1 -> 2 -> 1, 100 ms per frame; anchor (4, 2).
  Two flocks (5 birds heading east, 3 heading west) drift across in a gentle wave.
  Their motion rule + formation offsets are in map_data.json -> birds.

TIME OF DAY (multiply colours, also in map_data.json -> time_of_day)
  day     #ffffff   (no change)
  evening #ffd8bc
  night   #7a86c8
  Fade between them over ~1 s when the time changes.

PREVIEWS
  previews/map_animated_day.gif, _evening.gif, _night.gif - 18 s seamless loops
  previews/map_day|evening|night.png, map_done_example.png - stills

AVATAR HOPS
  map_data.json -> edges[].path: points every ~4 px along each road, from -> to.
  Tank Bund: the road ends at the jetty; the last few path points cross the water
  to the island (a good spot to show the avatar riding the boat).
