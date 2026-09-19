<!--
  @component

  Storybook-only gallery that shows every theme color defined in `global.css`.
  Toggle the Storybook theme to compare light and dark values. Add new colors to
  the `groups` array below as they're added to the theme.
-->
<script lang="ts">
  import { cn } from '$util/svelte-shadcn-util.js';

  type ColorGroup = {
    title: string;
    swatches: ColorSwatch[];
  };

  type ColorSwatch = {
    /** CSS custom property that sets the swatch background, without the leading `--`. */
    name: string;
    /** Paired CSS custom property for content drawn on top of `name`, when the theme defines one. */
    foreground?: string;
    /** Full class names, written out so Tailwind detects them. */
    className: string;
  };

  const groups: ColorGroup[] = [
    {
      title: 'Surfaces',
      swatches: [
        {
          name: 'background',
          foreground: 'foreground',
          className: 'bg-background text-foreground'
        },
        { name: 'card', foreground: 'card-foreground', className: 'bg-card text-card-foreground' },
        {
          name: 'popover',
          foreground: 'popover-foreground',
          className: 'bg-popover text-popover-foreground'
        }
      ]
    },
    {
      title: 'Interactive',
      swatches: [
        {
          name: 'primary',
          foreground: 'primary-foreground',
          className: 'bg-primary text-primary-foreground'
        },
        {
          name: 'secondary',
          foreground: 'secondary-foreground',
          className: 'bg-secondary text-secondary-foreground'
        },
        {
          name: 'accent',
          foreground: 'accent-foreground',
          className: 'bg-accent text-accent-foreground'
        },
        {
          name: 'muted',
          foreground: 'muted-foreground',
          className: 'bg-muted text-muted-foreground'
        },
        { name: 'destructive', className: 'bg-destructive' }
      ]
    },
    {
      title: 'Borders and focus',
      swatches: [
        { name: 'border', className: 'bg-border' },
        { name: 'input', className: 'bg-input' },
        { name: 'ring', className: 'bg-ring' }
      ]
    },
    {
      title: 'Sidebar',
      swatches: [
        {
          name: 'sidebar',
          foreground: 'sidebar-foreground',
          className: 'bg-sidebar text-sidebar-foreground'
        },
        {
          name: 'sidebar-primary',
          foreground: 'sidebar-primary-foreground',
          className: 'bg-sidebar-primary text-sidebar-primary-foreground'
        },
        {
          name: 'sidebar-accent',
          foreground: 'sidebar-accent-foreground',
          className: 'bg-sidebar-accent text-sidebar-accent-foreground'
        },
        { name: 'sidebar-border', className: 'bg-sidebar-border' },
        { name: 'sidebar-ring', className: 'bg-sidebar-ring' }
      ]
    },
    {
      title: 'Charts',
      swatches: [
        { name: 'chart-1', className: 'bg-chart-1' },
        { name: 'chart-2', className: 'bg-chart-2' },
        { name: 'chart-3', className: 'bg-chart-3' },
        { name: 'chart-4', className: 'bg-chart-4' },
        { name: 'chart-5', className: 'bg-chart-5' }
      ]
    }
  ];
</script>

<div class="flex flex-col gap-8 p-4">
  {#each groups as { title, swatches } (title)}
    <section class="flex flex-col gap-3">
      <h2 class="text-lg font-semibold">{title}</h2>
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
        {#each swatches as { name, foreground, className } (name)}
          <div class="flex flex-col gap-2">
            <div
              class={cn(
                'flex h-20 items-center justify-center rounded-lg border text-2xl font-semibold',
                className
              )}
            >
              {#if foreground}Aa{/if}
            </div>
            <div class="text-muted-foreground flex flex-col font-mono text-xs">
              <span>--{name}</span>
              {#if foreground}<span>--{foreground}</span>{/if}
            </div>
          </div>
        {/each}
      </div>
    </section>
  {/each}
</div>
