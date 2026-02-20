<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { createInvisibleArgTypes } from '$storybook/storybookUtil';
  import SBPaginationExample from './SBPaginationExample.svelte';

  const { Story } = defineMeta({
    title: 'UI Components/Pagination',
    component: SBPaginationExample,
    argTypes: {
      ...createInvisibleArgTypes('children'),
      totalPages: {
        control: { type: 'number' }
      },
      siblingCount: {
        control: { type: 'number' }
      },
      showEllipsis: {
        control: { type: 'boolean' }
      }
    },
    args: {
      totalPages: 10,
      siblingCount: 1,
      showEllipsis: true
    }
  });
</script>

<!-- Default Pagination -->
<Story name="Default" />

<!-- Few Pages -->
<Story name="Few Pages" args={{ totalPages: 3 }} />

<!-- Many Pages -->
<Story name="Many Pages" args={{ totalPages: 20 }} />

<!-- No Ellipsis -->
<Story name="Without Ellipsis" args={{ showEllipsis: false }} />

<!-- Wide Sibling Count -->
<Story name="Wide Sibling Count" args={{ siblingCount: 2, totalPages: 15 }} />
