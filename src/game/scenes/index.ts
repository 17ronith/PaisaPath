// Ronith owns this file. Scene keys are fixed in docs/plan/CONTRACTS.md §4.4.
// Mini-game scenes come from Saharsh via src/minigames and are registered here once.
// Order = draw order: HUD sits above game screens, Explainer above the HUD, mini-games on top.
import type Phaser from 'phaser';
import { minigameScenes } from '@/minigames';
import { BootScene } from './BootScene';
import { PreloadScene } from './PreloadScene';
import { TitleScene } from './TitleScene';
import { OnboardingScene } from './OnboardingScene';
import { QuizScene } from './QuizScene';
import { ChapterMapScene } from './ChapterMapScene';
import { BattleScene } from './BattleScene';
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

export const scenes: (typeof Phaser.Scene)[] = [
  BootScene,
  PreloadScene,
  TitleScene,
  OnboardingScene,
  QuizScene,
  ChapterMapScene,
  BattleScene,
  MinigameOfferScene,
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
];
