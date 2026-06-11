import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { ServiceValidation } from '../serviceModel';

/**
 * Forbids functions declared at the top level of a service file, whether bare
 * (`function f() {}`) or exported (`export function f() {}`). Behavior belongs
 * inside the class as a (private) method.
 *
 * @param context The rule context
 * @param model The shared service model
 */
export const validateNoTopLevelFunctions: ServiceValidation = (context, model) => {
  for (const statement of model.body) {
    if (statement.type === AST_NODE_TYPES.FunctionDeclaration) {
      context.report({ node: statement, messageId: 'noTopLevelFunction' });
    } else if (
      statement.type === AST_NODE_TYPES.ExportNamedDeclaration &&
      statement.declaration?.type === AST_NODE_TYPES.FunctionDeclaration
    ) {
      context.report({ node: statement, messageId: 'noTopLevelFunction' });
    }
  }
};
