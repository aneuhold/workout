import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { type ServiceValidation, singletonInfo } from '../serviceModel';

/**
 * Requires the singleton binding `const <name> = new <ClassName>()` to use the
 * conventional instance name — the class name with a lowercased first letter.
 *
 * @param context The rule context
 * @param model The shared service model
 */
export const validateSingletonName: ServiceValidation = (context, model) => {
  for (const statement of model.body) {
    if (statement.type !== AST_NODE_TYPES.VariableDeclaration) {
      continue;
    }

    const info = singletonInfo(statement, model.className);
    if (info.isSingleton && info.name !== model.instance) {
      context.report({
        node: info.declarator ?? statement,
        messageId: 'instanceName',
        data: { expected: model.instance, className: model.className, actual: info.name ?? '' }
      });
    }
  }
};
