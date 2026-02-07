import { goto } from '$app/navigation';
import type { PageInfo } from '$util/navInfo';

export const financePageInfo: PageInfo = {
  shortTitle: 'Finance',
  title: 'Financial Info and Links',
  description: 'General financial information and links',
  url: '/finance',
  iconName: 'attach_money',
  clickAction: () => {
    goto(financePageInfo.url);
  },
  nestingLevel: 0,
  isInternalLink: true
};
