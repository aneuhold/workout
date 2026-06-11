import { type TSESLint } from '@typescript-eslint/utils';
import { type FixTarget } from './types';

/**
 * Builds every edit needed to convert a class's fixable members in one go:
 * dropping each `private` modifier, prefixing each name with `#`, and prefixing
 * each rewritable reference with `#`. Bundling the whole class into one fix lets
 * it convert in a single pass even when a member's references sit past another
 * member being converted.
 *
 * @param fixer The ESLint fixer
 * @param sourceCode The source code object
 * @param targets The members to convert, with their references
 */
export const buildClassFixes = (
  fixer: TSESLint.RuleFixer,
  sourceCode: Readonly<TSESLint.SourceCode>,
  targets: FixTarget[]
): TSESLint.RuleFix[] => {
  const fixes: TSESLint.RuleFix[] = [];

  for (const { member, refs } of targets) {
    const privateToken = sourceCode.getTokens(member).find((token) => token.value === 'private');
    const afterPrivate = privateToken && sourceCode.getTokenAfter(privateToken);
    if (privateToken && afterPrivate) {
      fixes.push(fixer.removeRange([privateToken.range[0], afterPrivate.range[0]]));
    }

    fixes.push(fixer.insertTextBefore(member.key, '#'));
    for (const ref of refs) {
      fixes.push(fixer.insertTextBefore(ref.property, '#'));
    }
  }

  // ESLint merges a report's edits by range and requires them ordered and
  // non-overlapping.
  fixes.sort((a, b) => a.range[0] - b.range[0]);
  return fixes;
};
