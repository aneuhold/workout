import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: vitePreprocess({
    script: true
  }),

  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'app.html',
      precompress: false
    }),
    alias: {
      // this will match a directory and its contents
      // (`my-directory/x` resolves to `path/to/my-directory/x`)
      // Prefix all of these with $ to avoid conflicts with built-in packages.
      // Use a slash at the end if it doesn't automatically treat it like a
      // directory (the built tsconfig doesn't have a dir/* alias)
      $routes: 'src/routes',
      $components: 'src/components',
      $ui: 'src/components/ui',
      $util: 'src/util',
      $actions: 'src/actions',
      $stores: 'src/stores',
      $services: 'src/services',
      $pages: 'src/pages',
      $storybook: '.storybook/',
      $testUtils: 'testUtils/'
    }
  }
};

export default config;
