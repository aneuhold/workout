import { goto } from '$app/navigation';
import type { PageInfo } from '$util/navInfo';

export const archPageInfo: PageInfo = {
  shortTitle: 'Architecture',
  title: 'Architecture Contexts',
  description: 'Project types and the architecture used to build them.',
  url: '/dev/arch',
  iconName: 'domain',
  clickAction: () => {
    goto(archPageInfo.url);
  },
  nestingLevel: 1,
  isInternalLink: true
};
