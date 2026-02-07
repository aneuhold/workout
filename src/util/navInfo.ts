import type { LinkInfo } from '$components/LinkListItem.svelte';
import { automationPageInfo } from '$routes/automation/pageInfo';
import { archPageInfo } from '$routes/dev/arch/pageInfo';
import { devPageInfo } from '$routes/dev/pageInfo';
import { nonogramKatanaPageInfo } from '$routes/entertainment/nonogramkatana/pageInfo';
import { entertainmentPageInfo } from '$routes/entertainment/pageInfo';
import { financePageInfo } from '$routes/finance/pageInfo';
import { homePageInfo } from '$routes/pageInfo';
import { settingsPageInfo } from '$routes/settings/pageInfo';
import { tasksPageInfo } from '$routes/tasks/pageInfo';

export interface PageInfo extends LinkInfo {
  /**
   * The title but short and without any emojis. Preferrably one or two words.
   */
  shortTitle: string;
  /**
   * The page title which should be shown at the top of the page and
   * other places that require the title.
   */
  title: string;
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
  dev: devPageInfo,
  devArch: archPageInfo,
  finance: financePageInfo,
  automation: automationPageInfo,
  tasks: tasksPageInfo,
  entertainment: entertainmentPageInfo,
  nonogramKatana: nonogramKatanaPageInfo,
  settings: settingsPageInfo
} satisfies Record<string, PageInfo>;

export default navInfo;
