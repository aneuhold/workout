import { analyticsPageInfo } from '$routes/analytics/pageInfo';
import { exercisePageInfo } from '$routes/exercise/pageInfo';
import { libraryPageInfo } from '$routes/library/pageInfo';
import { mesocycleNewPageInfo } from '$routes/mesocycle/new/pageInfo';
import { mesocyclesPageInfo } from '$routes/mesocycles/pageInfo';
import { homePageInfo } from '$routes/pageInfo';
import { sessionPageInfo } from '$routes/session/pageInfo';
import { settingsPageInfo } from '$routes/settings/pageInfo';
import { timerPageInfo } from '$routes/timer/pageInfo';

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
   * and any pages immediately under the home page are also 0. But it increments
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
  library: libraryPageInfo,
  exercise: exercisePageInfo,
  analytics: analyticsPageInfo,
  mesocycles: mesocyclesPageInfo,
  mesocycleNew: mesocycleNewPageInfo,
  timer: timerPageInfo,
  settings: settingsPageInfo
} satisfies Record<string, PageInfo>;

export default navInfo;

/**
 * The nav items that should appear in the navigation bar. Excludes nested
 * pages like mesocycle/new.
 */
export const navBarItems = Object.values(navInfo).filter((page) => page.nestingLevel === 0);
