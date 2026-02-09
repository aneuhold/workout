<script lang="ts">
  import {
    IconCreditCard,
    IconLogout,
    IconMail,
    IconMessage,
    IconPlus,
    IconSettings,
    IconUser,
    IconUserPlus,
    IconUsers
  } from '@tabler/icons-svelte';
  import Button from '../Button/Button.svelte';
  import DropdownMenu from './DropdownMenu.svelte';
  import DropdownMenuCheckboxItem from './DropdownMenuCheckboxItem.svelte';
  import DropdownMenuContent from './DropdownMenuContent.svelte';
  import DropdownMenuGroup from './DropdownMenuGroup.svelte';
  import DropdownMenuItem from './DropdownMenuItem.svelte';
  import DropdownMenuLabel from './DropdownMenuLabel.svelte';
  import DropdownMenuRadioGroup from './DropdownMenuRadioGroup.svelte';
  import DropdownMenuRadioItem from './DropdownMenuRadioItem.svelte';
  import DropdownMenuSeparator from './DropdownMenuSeparator.svelte';
  import DropdownMenuShortcut from './DropdownMenuShortcut.svelte';
  import DropdownMenuSub from './DropdownMenuSub.svelte';
  import DropdownMenuSubContent from './DropdownMenuSubContent.svelte';
  import DropdownMenuSubTrigger from './DropdownMenuSubTrigger.svelte';
  import DropdownMenuTrigger from './DropdownMenuTrigger.svelte';

  type MenuType = 'simple' | 'with-groups' | 'with-checkboxes' | 'with-radio' | 'with-submenu';

  let {
    menuType = 'simple',
    triggerText = 'Open Menu'
  }: {
    menuType?: MenuType;
    triggerText?: string;
  } = $props();

  let statusBar = $state(true);
  let activityBar = $state(false);
  let panel = $state(false);
  let position = $state('bottom');
</script>

<DropdownMenu>
  <DropdownMenuTrigger>
    <Button variant="outline">{triggerText}</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    {#if menuType === 'simple'}
      <DropdownMenuItem>
        <IconUser />
        Profile
        <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuItem>
        <IconCreditCard />
        Billing
        <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuItem>
        <IconSettings />
        Settings
        <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem variant="destructive">
        <IconLogout />
        Log out
        <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
      </DropdownMenuItem>
    {:else if menuType === 'with-groups'}
      <DropdownMenuLabel>My Account</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem>
          <IconUser />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem>
          <IconCreditCard />
          Billing
        </DropdownMenuItem>
        <DropdownMenuItem>
          <IconSettings />
          Settings
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem>
          <IconUsers />
          Team
        </DropdownMenuItem>
        <DropdownMenuItem>
          <IconUserPlus />
          Invite users
        </DropdownMenuItem>
      </DropdownMenuGroup>
    {:else if menuType === 'with-checkboxes'}
      <DropdownMenuLabel>Appearance</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuCheckboxItem bind:checked={statusBar}>Status Bar</DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem bind:checked={activityBar} disabled>
        Activity Bar
      </DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem bind:checked={panel}>Panel</DropdownMenuCheckboxItem>
    {:else if menuType === 'with-radio'}
      <DropdownMenuLabel>Panel Position</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuRadioGroup bind:value={position}>
        <DropdownMenuRadioItem value="top">Top</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="bottom">Bottom</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="right">Right</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    {:else if menuType === 'with-submenu'}
      <DropdownMenuItem>
        <IconUser />
        Profile
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <IconUserPlus />
          Invite users
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem>
            <IconMail />
            Email
          </DropdownMenuItem>
          <DropdownMenuItem>
            <IconMessage />
            Message
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <IconPlus />
            More...
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    {/if}
  </DropdownMenuContent>
</DropdownMenu>
