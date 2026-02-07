import { goto } from '$app/navigation';
import type { PageInfo } from '$util/navInfo';

export const homePageInfo: PageInfo = {
  shortTitle: 'Home',
  title: 'Personal Dashboard',
  description: 'Home page for the personal dashboard',
  url: '/',
  clickAction: () => {
    goto(homePageInfo.url);
  },
  nestingLevel: 0,
  isInternalLink: true
};
