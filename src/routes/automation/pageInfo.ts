import { goto } from '$app/navigation';
import type { PageInfo } from '$util/navInfo';

export const automationPageInfo: PageInfo = {
  shortTitle: 'Automation',
  title: 'Automation',
  description: 'Automation actions and tools',
  url: '/automation',
  iconName: 'precision_manufacturing',
  clickAction: () => {
    goto(automationPageInfo.url);
  },
  nestingLevel: 0,
  isInternalLink: true
};
