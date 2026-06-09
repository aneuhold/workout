import { fooMustBeBar } from './foo-must-be-bar/foo-must-be-bar';

/**
 * Flat-config fragment that registers the local `aneuhold` ESLint plugin and
 * turns its rules on. Spread this into the root `eslint.config.ts`.
 *
 * Kept separate from the root config so this wiring can move into
 * `@aneuhold/eslint-config` later with minimal churn — only the import path
 * would change.
 */
export const aneuholdPlugin = {
  plugins: {
    aneuhold: {
      rules: {
        'foo-must-be-bar': fooMustBeBar
      }
    }
  },
  rules: {
    'aneuhold/foo-must-be-bar': 'error'
  }
};
