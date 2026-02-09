<script lang="ts">
  import { IconHome, IconSettings, IconUser } from '@tabler/icons-svelte';
  import Tabs from './Tabs.svelte';
  import TabsContent from './TabsContent.svelte';
  import TabsList from './TabsList.svelte';
  import TabsTrigger from './TabsTrigger.svelte';

  type TabData = {
    value: string;
    label: string;
    content: string;
  };

  type Orientation = 'horizontal' | 'vertical';
  type Variant = 'default' | 'line';

  let {
    tabs = [
      { value: 'tab1', label: 'Tab 1', content: 'Content for tab 1' },
      { value: 'tab2', label: 'Tab 2', content: 'Content for tab 2' },
      { value: 'tab3', label: 'Tab 3', content: 'Content for tab 3' }
    ],
    orientation = 'horizontal',
    variant = 'default',
    showIcons = false,
    defaultValue
  }: {
    tabs?: TabData[];
    orientation?: Orientation;
    variant?: Variant;
    showIcons?: boolean;
    defaultValue?: string;
  } = $props();

  const icons = [IconHome, IconUser, IconSettings];
</script>

<Tabs value={defaultValue || tabs[0]?.value} {orientation}>
  <TabsList {variant}>
    {#each tabs as tab, index (tab.value)}
      <TabsTrigger value={tab.value}>
        {#if showIcons && icons[index]}
          {@const Icon = icons[index]}
          <Icon />
        {/if}
        {tab.label}
      </TabsTrigger>
    {/each}
  </TabsList>
  {#each tabs as tab (tab.value)}
    <TabsContent value={tab.value}>
      <p>{tab.content}</p>
    </TabsContent>
  {/each}
</Tabs>
