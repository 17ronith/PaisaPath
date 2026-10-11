// Ronith owns this file. Scene keys are fixed in docs/plan/CONTRACTS.md §4.4.
// Mini-game scenes come from Saharsh via src/minigames and are registered here once.
// Order = draw order (MapBG is sent to the back at launch): HUD sits above game screens, Explainer above the HUD, mini-games on top.
import type Phaser from 'phaser';
import { minigameScenes } from '@/minigames';
import { BootScene } from './BootScene';
import { PreloadScene } from './PreloadScene';
import { TitleScene } from './TitleScene';
import { OnboardingScene } from './OnboardingScene';
import { QuizScene } from './QuizScene';
import { MapBackgroundScene } from './MapBackgroundScene';
import { WorldMapScene } from './WorldMapScene';
import { LandmarkScene } from './LandmarkScene';
import { BattleScene } from './BattleScene';
import { MarketScene } from './MarketScene';
import { MinigameOfferScene } from './MinigameOfferScene';
import { InvestScene } from './InvestScene';
import { StageEndScene } from './StageEndScene';
import { EpilogueScene } from './EpilogueScene';
import { WhatIfScene } from './WhatIfScene';
import { EndReportScene } from './EndReportScene';
import { HUDScene } from './HUDScene';
import { InfoPanelScene } from './InfoPanelScene';
import { ReplayLibraryScene } from './ReplayLibraryScene';
import { ExplainerScene } from './ExplainerScene';
import { SoundScene } from './SoundScene';
import { AudioSettingsScene } from './AudioSettingsScene';
import { IncomingCallScene } from './IncomingCallScene';

export const scenes: (typeof Phaser.Scene)[] = [
  BootScene, // first = auto-started
  // The always-animating Hyderabad map; Preload launches it and sends it to the back.
  MapBackgroundScene,
  PreloadScene,
  TitleScene,
  OnboardingScene,
  QuizScene,
  WorldMapScene,
  LandmarkScene,
  BattleScene,
  MinigameOfferScene,
  MarketScene,
  InvestScene,
  StageEndScene,
  EpilogueScene,
  WhatIfScene,
  EndReportScene,
  HUDScene,
  InfoPanelScene,
  ReplayLibraryScene,
  ExplainerScene,
  ...(Object.values(minigameScenes) as (typeof Phaser.Scene)[]),
  SoundScene, // ISSUES #25: always on top
  AudioSettingsScene, // the ♪ panel: music / sound effects / voice-over
  IncomingCallScene, // ISSUES #19: the scam call rings before its choices (launched by Battle)
];
