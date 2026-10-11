// Zod mirrors of src/shared/types.ts for CONTENT types only.
// Keep in lock-step with types.ts. Additive changes only (docs/plan/CONTRACTS.md).
import { z } from 'zod';
import type { ContentPack } from './types';

export const PillarSchema = z.enum(['budget', 'save', 'invest', 'safety']);
export const DifficultySchema = z.enum(['simple', 'medium', 'hard']);
export const StageSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);
export const PersonaIdSchema = z.enum(['pocket_money', 'scholarship', 'earner']);
export const QualitySchema = z.enum(['good', 'ok', 'weak', 'critical']);
export const AssetIdSchema = z.enum(['cashbox', 'banyan', 'chai', 'mango']);
export const NcfeItemSchema = z.enum([
  'division',
  'time_value',
  'loan_interest',
  'simple_interest',
  'compound_interest',
  'inflation',
  'risk_return',
  'diversification',
  'keeps_budget',
  'takes_responsibility',
  'major_expense_no_borrow',
  'saves_actively',
  'compares_options',
  'long_term_goals',
  'watches_finances',
  'pays_bills_on_time',
  'considers_affordability',
]);

export const EffectSchema = z.object({
  label: z.string().min(1),
  wallet: z.number().optional(),
  savings: z.number().optional(),
  happiness: z.number().min(-100).max(100).optional(),
  delayChapters: z.number().int().min(0).optional(),
  repeat: z
    .object({ everyChapters: z.number().int().min(1), times: z.number().int().min(1) })
    .optional(),
  setFlag: z.string().optional(),
  clearFlag: z.string().optional(),
  triggerEvent: z.string().optional(),
});

export const FramingSchema = z.object({
  title: z.string().min(1).max(24),
  speaker: z.string().min(1),
  text: z.string().min(1),
  place: z.string().min(1),
  portrait: z.string().optional(),
  intro: z.string().optional(),
  call: z.enum(['voice', 'video']).optional(),
});

const FramingsSchema = z.object({
  default: FramingSchema,
  pocket_money: FramingSchema.optional(),
  scholarship: FramingSchema.optional(),
  earner: FramingSchema.optional(),
});

export const ChoiceSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1).max(28),
  icon: z.string().optional(),
  quality: QualitySchema,
  effects: z.array(EffectSchema),
  lesson: z.string().min(1),
  explainerId: z.string().optional(),
  detourTaskId: z.string().optional(),
  ncfe: z
    .array(z.object({ item: NcfeItemSchema, value: z.union([z.literal(0), z.literal(1)]) }))
    .optional(),
  attitude: z.enum(['now', 'later']).optional(),
  scam: z.enum(['spotted', 'fell']).optional(),
  hint: z.string().optional(),
  cutscene: z.enum(['turf_cricket']).optional(),
});

export const TaskSchema = z.object({
  id: z.string().min(1),
  pillar: PillarSchema,
  difficulty: DifficultySchema,
  stage: StageSchema,
  concept: z.string().min(1),
  pressure: z.number().min(0).max(100),
  framings: FramingsSchema,
  choices: z.array(ChoiceSchema).min(2).max(4),
  isDetour: z.boolean().optional(),
  requiresFlags: z.array(z.string()).optional(),
  excludesFlags: z.array(z.string()).optional(),
  source: z.string().optional(),
});

export const ConceptSchema = z.object({
  id: z.string().min(1),
  pillar: PillarSchema,
  name: z.string().min(1),
  explainerId: z.string().min(1),
  ncfe: z.array(NcfeItemSchema).optional(),
});

export const RandomEventSchema = z.object({
  id: z.string().min(1),
  stages: z.array(StageSchema).min(1),
  weight: z.number().positive(),
  concept: z.string().optional(),
  framings: FramingsSchema,
  choices: z.array(ChoiceSchema).min(1).max(3),
  requiresFlags: z.array(z.string()).optional(),
  excludesFlags: z.array(z.string()).optional(),
});

const at = z.number().int().min(0);
export const ExplainerStepSchema = z.discriminatedUnion('op', [
  z.object({
    at,
    op: z.literal('text'),
    text: z.string(),
    slot: z.enum(['top', 'mid', 'bottom']).optional(),
    size: z.enum(['sm', 'md', 'lg']).optional(),
  }),
  z.object({
    at,
    op: z.literal('bar'),
    id: z.string(),
    label: z.string(),
    from: z.number(),
    to: z.number(),
    color: z.string().optional(),
    slot: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]).optional(),
  }),
  z.object({
    at,
    op: z.literal('coins'),
    count: z.number().int().positive(),
    from: z.enum(['wallet', 'savings', 'outside']),
    to: z.enum(['wallet', 'savings', 'outside']),
  }),
  z.object({
    at,
    op: z.literal('grow'),
    id: z.string(),
    label: z.string(),
    ratePct: z.number(),
    years: z.number().int().positive(),
    principal: z.number().positive(),
  }),
  z.object({
    at,
    op: z.literal('split'),
    parts: z
      .array(
        z.object({
          label: z.string(),
          pct: z.number().min(0).max(100),
          color: z.string().optional(),
        }),
      )
      .min(1),
  }),
  z.object({ at, op: z.literal('clear') }),
]);

export const ExplainerSchema = z.object({
  id: z.string().min(1),
  concept: z.string().min(1),
  title: z.string().min(1),
  durationMs: z.number().int().min(3000).max(30000),
  steps: z.array(ExplainerStepSchema).min(1),
});

export const LifeQuestionSchema = z.object({
  id: z.enum(['L1', 'L2', 'L3', 'L4']),
  text: z.string().min(1),
  options: z
    .array(
      z.object({
        text: z.string().min(1),
        icon: z.string().optional(),
        persona: PersonaIdSchema.optional(),
        pocketMoneyMonthly: z.number().positive().optional(),
        setFlag: z.string().optional(),
      }),
    )
    .min(2),
});

export const QuizQuestionSchema = z.object({
  id: z.string().min(1),
  concept: z.string().min(1),
  pillar: PillarSchema,
  text: z.string().min(1),
  options: z.array(z.string().min(1)).min(2),
  answer: z.number().int().min(0),
});

export const PersonaSchema = z.object({
  id: PersonaIdSchema,
  label: z.string().min(1),
  blurb: z.string().min(1),
  stageIntro: z.object({ 1: z.string(), 2: z.string(), 3: z.string() }),
  defaultFlags: z.array(z.string()),
});

export const PlaceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  icon: z.string().optional(),
});

export const MiniGameDefSchema = z.object({
  id: z.enum(['kirana_rush', 'scam_or_legit']),
  title: z.string().min(1),
  blurb: z.string().min(1),
  rewardWalletPct: z.number().min(0),
  rewardHappiness: z.number().min(0),
});

export const AssetDefSchema = z.object({
  id: AssetIdSchema,
  name: z.string().min(1),
  blurb: z.string().min(1),
  meanYearlyPct: z.number(),
  volatilityPct: z.number().min(0),
  teaches: z.string().min(1),
});

export const ContentPackSchema = z.object({
  version: z.string(),
  personas: z.array(PersonaSchema).length(3),
  lifeQuestions: z.array(LifeQuestionSchema).length(4),
  quiz: z.array(QuizQuestionSchema).length(5),
  quizAfter: z.array(QuizQuestionSchema).max(5).optional(),
  concepts: z.array(ConceptSchema).min(1),
  tasks: z.array(TaskSchema).min(1),
  events: z.array(RandomEventSchema),
  explainers: z.array(ExplainerSchema).min(1),
  minigames: z.array(MiniGameDefSchema),
  assets: z.array(AssetDefSchema).length(4),
  places: z.array(PlaceSchema).min(1),
});

/** Throws a ZodError with readable paths if invalid. */
export function parseContentPack(json: unknown): ContentPack {
  return ContentPackSchema.parse(json) as ContentPack;
}
