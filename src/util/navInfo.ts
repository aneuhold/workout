import { analyticsPageInfo } from '$routes/analytics/pageInfo';
import { exercisesPageInfo } from '$routes/exercises/pageInfo';
import { homePageInfo } from '$routes/pageInfo';
import { planPageInfo } from '$routes/plan/pageInfo';
import { sessionPageInfo } from '$routes/session/[id]/pageInfo';

export interface PageInfo {
  /**
   * The page title which should be shown at the top of the page and
   * other places that require the title.
   */
  title: string;
  /**
   * The title but short and without any emojis. Preferrably one or two words.
   */
  shortTitle: string;
  description: string;
  /**
   * The relative path to the page. For example: `/dev/arch`
   */
  url: string;
  /**
   * An optional icon name for the page. This is used for the NavDrawer if needed.
   */
  iconName?: string;
  /**
   * The nesting level of the page. For example, the home page is at level 0,
   * and any pages immediatly under the home page are also 0. But it increments
   * by 1 after that.
   */
  nestingLevel: number;
}

/**
 * Navigation info. Each key is the relative path to the page.
 */
const navInfo = {
  home: homePageInfo,
  session: sessionPageInfo,
  exercises: exercisesPageInfo,
  analytics: analyticsPageInfo,
  plan: planPageInfo
} satisfies Record<string, PageInfo>;

export default navInfo;
