import { goto } from '$app/navigation';
import CrosswordIcon from '$lib/svgs/CrosswordIcon.svelte';
import type { PageInfo } from '$util/navInfo';

export const nonogramKatanaPageInfo: PageInfo = {
  shortTitle: 'Nonogram Katana',
  title: 'Nonogram Katana',
  description: 'Tracker + Calculator for Nonogram Katana',
  url: '/entertainment/nonogramkatana',
  clickAction: () => {
    goto(nonogramKatanaPageInfo.url);
  },
  nestingLevel: 1,
  isInternalLink: true,
  icon: CrosswordIcon
};
