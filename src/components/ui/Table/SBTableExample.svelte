<script lang="ts" module>
  export enum SBTableExampleDemoType {
    Invoices = 'Invoices',
    Items = 'Items',
    Users = 'Users'
  }
</script>

<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import Table from './Table.svelte';
  import TableBody from './TableBody.svelte';
  import TableCaption from './TableCaption.svelte';
  import TableCell from './TableCell.svelte';
  import TableFooter from './TableFooter.svelte';
  import TableHead from './TableHead.svelte';
  import TableHeader from './TableHeader.svelte';
  import TableRow from './TableRow.svelte';

  let {
    demo = SBTableExampleDemoType.Invoices,
    showCaption = true,
    showFooter = false,
    compact = false,
    ...rest
  }: {
    demo?: SBTableExampleDemoType;
    showCaption?: boolean;
    showFooter?: boolean;
    compact?: boolean;
  } & ComponentProps<typeof Table> = $props();

  const invoices = [
    { id: 'INV001', status: 'Paid', method: 'Credit Card', amount: '$250.00' },
    { id: 'INV002', status: 'Pending', method: 'PayPal', amount: '$150.00' },
    { id: 'INV003', status: 'Unpaid', method: 'Bank Transfer', amount: '$350.00' },
    { id: 'INV004', status: 'Paid', method: 'Credit Card', amount: '$450.00' },
    { id: 'INV005', status: 'Paid', method: 'PayPal', amount: '$550.00' }
  ];

  const items = [
    { name: 'Product A', quantity: 5, price: '$100.00' },
    { name: 'Product B', quantity: 3, price: '$75.00' },
    { name: 'Product C', quantity: 2, price: '$50.00' }
  ];

  const users = [
    { name: 'John Doe', email: 'john@example.com', role: 'Admin' },
    { name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
    { name: 'Bob Johnson', email: 'bob@example.com', role: 'Editor' }
  ];
</script>

<Table class={compact ? 'text-xs' : ''} {...rest}>
  {#if showCaption}
    {#if demo === SBTableExampleDemoType.Invoices}
      <TableCaption>A list of your recent invoices.</TableCaption>
    {:else if demo === SBTableExampleDemoType.Items}
      <TableCaption>Product inventory.</TableCaption>
    {:else if demo === SBTableExampleDemoType.Users}
      <TableCaption>Team members.</TableCaption>
    {/if}
  {/if}

  <TableHeader>
    <TableRow>
      {#if demo === SBTableExampleDemoType.Invoices}
        <TableHead class={compact ? 'h-8 w-25' : 'w-25'}>Invoice</TableHead>
        <TableHead class={compact ? 'h-8' : ''}>Status</TableHead>
        <TableHead class={compact ? 'h-8' : ''}>Method</TableHead>
        <TableHead class={compact ? 'h-8 text-right' : 'text-right'}>Amount</TableHead>
      {:else if demo === SBTableExampleDemoType.Items}
        <TableHead class={compact ? 'h-8' : ''}>Item</TableHead>
        <TableHead class={compact ? 'h-8' : ''}>Quantity</TableHead>
        <TableHead class={compact ? 'h-8 text-right' : 'text-right'}>Price</TableHead>
      {:else if demo === SBTableExampleDemoType.Users}}
        <TableHead class={compact ? 'h-8' : ''}>Name</TableHead>
        <TableHead class={compact ? 'h-8' : ''}>Email</TableHead>
        <TableHead class={compact ? 'h-8' : ''}>Role</TableHead>
      {/if}
    </TableRow>
  </TableHeader>

  <TableBody>
    {#if demo === SBTableExampleDemoType.Invoices}
      {#each invoices as invoice (invoice.id)}
        <TableRow>
          <TableCell class={compact ? 'py-1 font-medium' : 'font-medium'}>{invoice.id}</TableCell>
          <TableCell class={compact ? 'py-1' : ''}>{invoice.status}</TableCell>
          <TableCell class={compact ? 'py-1' : ''}>{invoice.method}</TableCell>
          <TableCell class={compact ? 'py-1 text-right' : 'text-right'}>{invoice.amount}</TableCell>
        </TableRow>
      {/each}
    {:else if demo === SBTableExampleDemoType.Items}
      {#each items as item (item.name)}
        <TableRow>
          <TableCell class={compact ? 'py-1' : ''}>{item.name}</TableCell>
          <TableCell class={compact ? 'py-1' : ''}>{item.quantity}</TableCell>
          <TableCell class={compact ? 'py-1 text-right' : 'text-right'}>{item.price}</TableCell>
        </TableRow>
      {/each}
    {:else if demo === SBTableExampleDemoType.Users}}
      {#each users as user (user.email)}
        <TableRow>
          <TableCell class={compact ? 'py-1' : ''}>{user.name}</TableCell>
          <TableCell class={compact ? 'py-1' : ''}>{user.email}</TableCell>
          <TableCell class={compact ? 'py-1' : ''}>{user.role}</TableCell>
        </TableRow>
      {/each}
    {/if}
  </TableBody>

  {#if showFooter && demo === SBTableExampleDemoType.Items}}
    <TableFooter>
      <TableRow>
        <TableCell colspan={2}>Total</TableCell>
        <TableCell class="text-right">$225.00</TableCell>
      </TableRow>
    </TableFooter>
  {/if}
</Table>
