import svelteConfig from '@aneuhold/eslint-config/src/svelte-config.js';
import storybook from 'eslint-plugin-storybook';
import { aneuholdPlugin } from './eslint/aneuhold-plugin';

export default [
  ...svelteConfig,
  ...storybook.configs['flat/recommended'],
  {
    rules: {
      // Disabling this because we have a bunch of dynamic routes
      'svelte/no-navigation-without-resolve': 'off',
      // TypeScript without `noUncheckedIndexedAccess` reports `arr[0]` as non-nullable,
      // which makes this rule flag legitimate runtime guards as unnecessary. Disabled to
      // keep those guards in place without forcing loops to also need to be checked every time.
      '@typescript-eslint/no-unnecessary-condition': 'off'
    }
  },
  {
    // The local custom rules live in `eslint/`. Apply them everywhere except
    // that folder, so the rules' own example/fixture code isn't flagged.
    ...aneuholdPlugin,
    ignores: ['eslint/**']
  },
  {
    ignores: ['android/**']
  }
];
