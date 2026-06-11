import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { type ServiceValidation, singletonInfo } from '../serviceModel';

/**
 * Forbids variables declared at the top level of a service file — both exported
 * named declarations (`export const x = ...`) and bare ones. Constants belong
 * inside the class as private instance or static fields. The sole exception is
 * the singleton binding `const xService = new XService();`, whose name is
 * validated separately.
 *
 * @param context The rule context
 * @param model The shared service model
 */
export const validateNoTopLevelVariables: ServiceValidation = (context, model) => {
  const data = { instance: model.instance, className: model.className };

  for (const statement of model.body) {
    if (
      statement.type === AST_NODE_TYPES.ExportNamedDeclaration &&
      statement.declaration?.type === AST_NODE_TYPES.VariableDeclaration
    ) {
      context.report({ node: statement, messageId: 'noTopLevelVariable', data });
      continue;
    }

    if (
      statement.type === AST_NODE_TYPES.VariableDeclaration &&
      !singletonInfo(statement, model.className).isSingleton
    ) {
      context.report({ node: statement, messageId: 'noTopLevelVariable', data });
    }
  }
};
