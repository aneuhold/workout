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

<Story name="Home Active" args={{ currentPath: '/' }}>
  {#snippet template(args)}
    <NavBar {...captureArgs(args)} />
  {/snippet}
</Story>

<Story name="Session Active" args={{ currentPath: '/session' }}>
  {#snippet template(args)}
    <NavBar {...captureArgs(args)} />
  {/snippet}
</Story>

<Story name="Exercises Active" args={{ currentPath: '/exercises' }}>
  {#snippet template(args)}
    <NavBar {...captureArgs(args)} />
  {/snippet}
</Story>
