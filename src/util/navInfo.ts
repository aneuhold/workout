import { analyticsPageInfo } from '$routes/(app)/analytics/pageInfo';
import { exercisePageInfo } from '$routes/(app)/exercise/pageInfo';
import { libraryPageInfo } from '$routes/(app)/library/pageInfo';
import { mesocycleNewPageInfo } from '$routes/(app)/mesocycle/new/pageInfo';
import { mesocyclePageInfo } from '$routes/(app)/mesocycle/pageInfo';
import { mesocyclesPageInfo } from '$routes/(app)/mesocycles/pageInfo';
import { homePageInfo } from '$routes/(app)/pageInfo';
import { sessionPageInfo } from '$routes/(app)/session/pageInfo';
import { sessionsPageInfo } from '$routes/(app)/sessions/pageInfo';
import { settingsPageInfo } from '$routes/(app)/settings/pageInfo';
import { timerPageInfo } from '$routes/(app)/timer/pageInfo';
import { privacyPageInfo } from '$routes/(marketing)/privacy/pageInfo';

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
 * Pages that render under the `(marketing)` route group — publicly
 * reachable, no app chrome. Spread into `navInfo` below so they share the
 * same lookup, and exported so consumers (e.g. the Full App Storybook
 * shell) can detect marketing routes without hard-coding URLs.
 */
export const marketingPages = {
  privacy: privacyPageInfo
} satisfies Record<string, PageInfo>;

/**
 * Navigation info. Each key is the relative path to the page.
 */
const navInfo = {
  home: homePageInfo,
  sessions: sessionsPageInfo,
  session: sessionPageInfo,
  library: libraryPageInfo,
  exercise: exercisePageInfo,
  analytics: analyticsPageInfo,
  mesocycles: mesocyclesPageInfo,
  mesocycle: mesocyclePageInfo,
  mesocycleNew: mesocycleNewPageInfo,
  timer: timerPageInfo,
  settings: settingsPageInfo,
  ...marketingPages
} satisfies Record<string, PageInfo>;

export default navInfo;

/**
 * The nav items that should appear in the navigation bar. Excludes nested
 * pages like mesocycle/new.
 */
export const navBarItems = Object.values(navInfo).filter((page) => page.nestingLevel === 0);
