import { goto } from '$app/navigation';
import type { PageInfo } from '$util/navInfo';

export const settingsPageInfo: PageInfo = {
  shortTitle: 'Settings',
  title: 'Settings',
  description: 'Settings for your account',
  url: '/settings',
  iconName: 'settings',
  clickAction: () => {
    goto(settingsPageInfo.url);
  },
  nestingLevel: 0,
  isInternalLink: true
};
