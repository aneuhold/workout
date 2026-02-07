import { goto } from '$app/navigation';
import type { PageInfo } from '$util/navInfo';

export const tasksPageInfo: PageInfo = {
  shortTitle: 'Tasks',
  title: 'Tasks',
  description: 'Overall tasks you want to keep track of',
  url: '/tasks',
  iconName: 'task_alt',
  clickAction: () => {
    goto(tasksPageInfo.url);
  },
  nestingLevel: 0,
  isInternalLink: true
};
