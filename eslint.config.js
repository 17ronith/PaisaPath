// One-way import rule (docs/plan/README.md §2):
//   shared ← engine ← game ← app ;  shared ← content ← game ;  shared ← engine ← minigames ← game
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

const forbid = (patterns, message) => ({
  'no-restricted-imports': [
    'error',
    { patterns: patterns.map((group) => ({ group: [group], message })) },
  ],
});

export default tseslint.config(
  { ignores: ['dist', 'dev-dist', 'node_modules', 'server', 'team97_vanguard_context'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['src/engine/**/*.ts'],
    rules: forbid(
      ['phaser', '**/game/**', '**/app/**', '**/content/**', '**/minigames/**'],
      'engine may import only from src/shared',
    ),
  },
  {
    files: ['src/content/**/*.ts'],
    rules: forbid(
      ['phaser', '**/game/**', '**/app/**', '**/engine/**', '**/minigames/**'],
      'content may import only from src/shared',
    ),
  },
  {
    files: ['src/shared/**/*.ts'],
    rules: forbid(
      ['phaser', '**/game/**', '**/app/**', '**/engine/**', '**/content/**', '**/minigames/**'],
      'shared imports nothing from the app',
    ),
  },
  {
    files: ['src/game/**/*.ts', 'src/minigames/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/app/**', '!**/app/session', '!**/app/tts'],
              message: 'game/minigames may import only @/app/session and @/app/tts from app',
            },
          ],
        },
      ],
    },
  },
);
