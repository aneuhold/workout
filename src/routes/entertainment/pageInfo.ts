import { goto } from '$app/navigation';
import type { PageInfo } from '$util/navInfo';

export const entertainmentPageInfo: PageInfo = {
  shortTitle: 'Entertainment',
  title: 'Entertainment',
  description: 'Games, and other fun things',
  url: '/entertainment',
  iconName: 'videogame_asset',
  clickAction: () => {
    goto(entertainmentPageInfo.url);
  },
  nestingLevel: 0,
  isInternalLink: true
};
