import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { createRule } from '../createRule';

/**
 * Enforces that any `const` declaration named `foo` is assigned the string
 * literal `"bar"`. Anything else (a different value, a non-string, or no
 * initializer) is reported.
 */
export const fooMustBeBar = createRule({
  name: 'foo-must-be-bar',
  meta: {
    type: 'problem',
    docs: {
      description: 'A `const` named `foo` must be assigned the string `"bar"`.'
    },
    messages: {
      fooMustBeBar: 'A `const` named `foo` must be assigned the string "bar".'
    },
    schema: []
  },
  defaultOptions: [],
  create(context) {
    return {
      VariableDeclaration(node) {
        if (node.kind !== 'const') {
          return;
        }

        for (const declarator of node.declarations) {
          if (declarator.id.type !== AST_NODE_TYPES.Identifier || declarator.id.name !== 'foo') {
            continue;
          }

          const { init } = declarator;
          const isBar = init?.type === AST_NODE_TYPES.Literal && init.value === 'bar';

          if (!isBar) {
            context.report({
              node: declarator,
              messageId: 'fooMustBeBar'
            });
          }
        }
      }
    };
  }
});
