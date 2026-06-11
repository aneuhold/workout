import { usesServiceFileNaming } from '../isServiceFile';
import type { ServiceFileValidation } from '../serviceModel';

/**
 * Requires an in-scope service file to follow the `<Name>.service.ts` /
 * `<Name>.service.svelte.ts` naming convention, where `<Name>` is PascalCase
 * (starts with a capital letter). Reported at the top of the file since the
 * violation is the file name itself, not any particular node.
 *
 * @param context The rule context
 */
export const validateFileNamingConvention: ServiceFileValidation = (context) => {
  if (usesServiceFileNaming(context.filename)) {
    return;
  }

  context.report({ loc: { line: 1, column: 0 }, messageId: 'fileNaming' });
};
