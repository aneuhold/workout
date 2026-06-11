import { createRule } from '../createRule';
import { isServiceFile } from './isServiceFile';
import { messages } from './messages';
import { resolveServiceClass, type ServiceValidation } from './serviceModel';
import { validateDefaultExportIsConstBound } from './validations/validateDefaultExportIsConstBound';
import { validateFileNamingConvention } from './validations/validateFileNamingConvention';
import { validateNoTopLevelFunctions } from './validations/validateNoTopLevelFunctions';
import { validateNoTopLevelVariables } from './validations/validateNoTopLevelVariables';
import { validateSingletonName } from './validations/validateSingletonName';

/**
 * Validations that operate on the resolved single-class model, in order. Each
 * lives in its own `validations/validate<Concern>.ts` module and reports
 * against the shared model. Add a new restriction by writing another module and
 * listing it here.
 */
const validations: ServiceValidation[] = [
  validateNoTopLevelFunctions,
  validateNoTopLevelVariables,
  validateSingletonName,
  validateDefaultExportIsConstBound
];

/**
 * Enforces the singleton-service file shape according to the standards that seem to help the most
 * across multiple code-bases that Aneuhold works with.
 */
export const serviceFileStructure = createRule({
  name: 'service-file-structure',
  meta: {
    type: 'problem',
    fixable: 'code',
    docs: {
      description:
        'A service file must contain exactly one named, JSDoc-documented class with no top-level functions or variables, and must export a fresh instance via a `const`-bound singleton rather than inline.'
    },
    messages,
    schema: []
  },
  defaultOptions: [],
  create(context) {
    if (!isServiceFile(context.filename)) {
      return {};
    }

    // Evaluate when the node is left and all it's children have already been processed.
    return {
      'Program:exit'(program) {
        validateFileNamingConvention(context);

        const model = resolveServiceClass(context, program);
        if (!model) {
          return;
        }
        for (const validate of validations) {
          validate(context, model);
        }
      }
    };
  }
});
