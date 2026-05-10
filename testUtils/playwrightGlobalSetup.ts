import { APIService } from '@aneuhold/core-ts-api-lib';
import { ProjectName } from '@aneuhold/core-ts-db-lib';
import { chromium, type FullConfig } from '@playwright/test';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import { loadEnv } from 'vite';
import LocalData from '$util/LocalData/LocalData';
import perfTestUtils, { PERF_TEST_CONSTANTS } from './perfTestUtils';

/**
 * Authenticates the perf test user and saves a Playwright storageState file
 * containing the userConfig entry so each spec boots already logged in.
 *
 * @param config Playwright config injected by the test runner; only used for
 *   the project's baseURL.
 */
const playwrightGlobalSetup = async (config: FullConfig): Promise<void> => {
  // vite.config.ts loads `.env` for `pnpm dev`/`vitest`, but Playwright runs
  // under tsx and doesn't pick that up. Mirror the load here so `getPerfCreds`
  // below can read PERF_* vars from `process.env`.
  const perfEnv = loadEnv('', process.cwd(), 'PERF_');
  for (const [key, value] of Object.entries(perfEnv)) {
    if (value && !process.env[key]) process.env[key] = value;
  }

  const { username, password } = perfTestUtils.getPerfCreds();
  const auth = await APIService.validateUser({
    project: ProjectName.Workout,
    userName: username,
    password
  });
  if (!auth.success || !auth.data.accessToken || !auth.data.userInfo?.user) {
    throw new Error(`Auth failed in playwrightGlobalSetup: ${JSON.stringify(auth.errors)}`);
  }
  const { user } = auth.data.userInfo;
  const userConfigValue = JSON.stringify({
    userId: user._id,
    username: user.userName,
    accessToken: auth.data.accessToken,
    refreshTokenString: auth.data.refreshTokenString ?? null
  });

  const baseURL = config.projects[0].use.baseURL ?? 'http://localhost:5173';
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(baseURL);
    await page.evaluate(
      ({ key, value }) => {
        window.localStorage.setItem(key, value);
      },
      { key: LocalData.storedKeyNames.userConfig, value: userConfigValue }
    );
    mkdirSync(dirname(PERF_TEST_CONSTANTS.storageStatePath), { recursive: true });
    await context.storageState({ path: PERF_TEST_CONSTANTS.storageStatePath });
  } finally {
    await browser.close();
  }
};

export default playwrightGlobalSetup;
