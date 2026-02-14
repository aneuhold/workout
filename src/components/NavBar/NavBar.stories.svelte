<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import type { ComponentProps } from 'svelte';
  import NavBar from './NavBar.svelte';

  // Shared ref so the hrefs callback can mutate the active story's args
  let state: ComponentProps<typeof NavBar> = {
    currentPath: '/'
  };

  const { Story } = defineMeta({
    title: 'Components/NavBar',
    tags: ['!autodocs'],
    component: NavBar,
    parameters: {
      // cspell:disable-next-line
      sveltekit_experimental: {
        // cspell:disable-next-line
        hrefs: {
          '/.*': {
            callback: (url: string) => {
              state.currentPath = url;
            },
            asRegex: true
          }
        }
      }
    }
  });

  /**
   * Assigns the current story's args to a shared ref at instantiation so the hrefs callback
   * can update them on click.
   *
   * @param args - The current story's args.
   */
  function captureArgs(args: ComponentProps<typeof NavBar>): ComponentProps<typeof NavBar> {
    state = args;
    return args;
  }
</script>

<Story name="Default" args={{ currentPath: '/' }} globals={{ viewport: null }}>
  {#snippet template(args)}
    <NavBar {...captureArgs(args)} />
  {/snippet}
</Story>

<Story name="Mobile" args={{ currentPath: '/' }} globals={{ viewport: { value: 'mobile' } }}>
  {#snippet template(args)}
    <NavBar {...captureArgs(args)} />
  {/snippet}
</Story>
