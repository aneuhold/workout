import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';
import type { ServiceValidation } from '../serviceModel';

/**
 * Flags an inline `export default new XService();` and rewrites it to the
 * `const`-bound singleton form. Exporting the class itself as the default
 * (`export default class XService {}` or `export default XService`) is left
 * alone, since such a class may be intended for extension.
 *
 * @param context The rule context
 * @param model The shared service model
 */
export const validateDefaultExportIsConstBound: ServiceValidation = (context, model) => {
  const defaultExport = model.body.find(
    (statement): statement is TSESTree.ExportDefaultDeclaration =>
      statement.type === AST_NODE_TYPES.ExportDefaultDeclaration
  );

  const decl = defaultExport?.declaration;
  const isInlineInstance =
    decl?.type === AST_NODE_TYPES.NewExpression &&
    decl.callee.type === AST_NODE_TYPES.Identifier &&
    decl.callee.name === model.className;

  if (!defaultExport || !isInlineInstance) {
    return;
  }

  const { instance, className } = model;
  context.report({
    node: defaultExport,
    messageId: 'trailingInstanceExport',
    data: { instance, className },
    fix: (fixer) =>
      fixer.replaceText(
        defaultExport,
        `const ${instance} = ${context.sourceCode.getText(decl)};\nexport default ${instance};`
      )
  });
};
