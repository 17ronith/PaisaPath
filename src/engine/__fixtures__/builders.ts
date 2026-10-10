// Small builders for engine tests: tweak the fixture pack without repeating whole objects.
import type { Choice, ContentPack, Profile, RandomEvent, Task } from '@/shared/types';
import { fixturePack, fixtureProfile } from './pack';
import { initialState } from '../state';

export const framing = (title = 'T', text = 'text') => ({
  title,
  speaker: 'Someone',
  text,
  place: 'home',
});

export const choice = (id: string, quality: Choice['quality'], extra: Partial<Choice> = {}) =>
  ({
    id,
    text: id.toUpperCase(),
    quality,
    effects: [],
    lesson: `lesson ${id}`,
    ...extra,
  }) as Choice;

export function task(id: string, extra: Partial<Task> = {}): Task {
  return {
    id,
    pillar: 'budget',
    difficulty: 'medium',
    stage: 1,
    concept: 'needs_vs_wants',
    pressure: 50,
    framings: { default: framing(id) },
    choices: [choice('good', 'good'), choice('bad', 'weak')],
    ...extra,
  };
}

export function event(id: string, extra: Partial<RandomEvent> = {}): RandomEvent {
  return {
    id,
    stages: [1, 2, 3],
    weight: 1,
    framings: { default: framing(id) },
    choices: [choice('ok', 'ok')],
    ...extra,
  };
}

export const pack = (extra: Partial<ContentPack> = {}): ContentPack => ({
  ...fixturePack,
  ...extra,
});

export const profile = (extra: Partial<Profile> = {}): Profile => ({
  ...fixtureProfile,
  ...extra,
});

export const state = (extra: Partial<Profile> = {}, seed = 1) => initialState(profile(extra), seed);
