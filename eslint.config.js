import svelteConfig from '@aneuhold/eslint-config/src/svelte-config.js';
import storybook from 'eslint-plugin-storybook';

export default [
  ...svelteConfig,
  ...storybook.configs['flat/recommended'],
  {
    rules: {
      // Disabling this because we have a bunch of dynamic routes
      'svelte/no-navigation-without-resolve': 'off'
    }
  }
];
