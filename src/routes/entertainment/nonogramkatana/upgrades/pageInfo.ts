import { goto } from '$app/navigation';
import type { PageInfo } from '$util/navInfo';

export const nonogramKatanaUpgradesPageInfo: PageInfo = {
  shortTitle: 'Nonogram Katana Upgrades',
  title: 'Nonogram Katana Upgrades',
  description: 'Upgrades + buildings and their priority.',
  url: '/entertainment/nonogramkatana/upgrades',
  clickAction: () => {
    goto(nonogramKatanaUpgradesPageInfo.url);
  },
  nestingLevel: 2,
  isInternalLink: true,
  iconName: 'apartment'
};
