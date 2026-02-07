import { goto } from '$app/navigation';
import type { PageInfo } from '$util/navInfo';

export const devPageInfo: PageInfo = {
  shortTitle: 'Development',
  title: 'Development Links and Info',
  url: '/dev',
  iconName: 'code',
  clickAction: () => {
    goto(devPageInfo.url);
  },
  nestingLevel: 0,
  isInternalLink: true
};
