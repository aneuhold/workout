import type { StorybookConfig } from '@storybook/sveltekit';
import { mergeConfig } from 'vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx|svelte)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-docs',
    '@storybook/addon-svelte-csf',
    '@storybook/addon-themes'
  ],
  framework: {
    name: '@storybook/sveltekit',
    options: {}
  },
  staticDirs: ['../static'],
  viteFinal(config) {
    const updatedConfig = mergeConfig(config, {
      // Paths here seem to be from the root directory
      server: {
        fs: {
          allow: ['./static', './testUtils']
        }
      }
    });
    return updatedConfig;
  }
};
export default config;
