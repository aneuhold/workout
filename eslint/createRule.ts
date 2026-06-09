import { ESLintUtils } from '@typescript-eslint/utils';

const REPO_URL = 'https://github.com/aneuhold/workout';

/**
 * Shared `RuleCreator` for this repo's custom ESLint rules. Each rule's
 * documentation URL points at the rule's own markdown file, which lives next to
 * its implementation at `eslint/<rule-name>/<rule-name>.md`.
 */
export const createRule = ESLintUtils.RuleCreator(
  (name) => `${REPO_URL}/blob/main/eslint/${name}/${name}.md`
);
