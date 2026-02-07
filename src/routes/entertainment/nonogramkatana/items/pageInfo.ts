import { goto } from '$app/navigation';
import type { PageInfo } from '$util/navInfo';

export const nonogramKatanaItemsPageInfo: PageInfo = {
  shortTitle: 'Nonogram Katana Items',
  title: 'Nonogram Katana Items',
  description: 'Items and their current amounts.',
  url: '/entertainment/nonogramkatana/items',
  clickAction: () => {
    goto(nonogramKatanaItemsPageInfo.url);
  },
  nestingLevel: 2,
  isInternalLink: true,
  iconName: 'inventory_2'
};
