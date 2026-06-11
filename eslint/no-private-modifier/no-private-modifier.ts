import { type TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../createRule';

/**
 * Enforces that class members marked private use the ECMAScript `#private`
 * syntax rather than the TypeScript `private` accessibility modifier. Covers
 * instance and static fields, methods (including accessors and getters/setters),
 * and constructors. Constructor parameter properties (`constructor(private foo)`)
 * are intentionally allowed, since the `#` form has no equivalent shorthand.
 */
export const noPrivateModifier = createRule({
  name: 'no-private-modifier',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Class members must use the ECMAScript `#private` syntax instead of the TypeScript `private` accessibility modifier.'
    },
    messages: {
      privateField:
        'Use a `#private` field instead of the TypeScript `private` modifier (e.g. `#count` rather than `private count`).',
      privateMethod:
        'Use a `#private` method instead of the TypeScript `private` modifier (e.g. `#helper()` rather than `private helper()`).',
      privateConstructor:
        'A constructor cannot become a `#private` member; drop the `private` modifier (consider a static factory if construction must be restricted).'
    },
    schema: []
  },
  defaultOptions: [],
  create(context) {
    /**
     * Reports a field-like member (instance/static property or `accessor`
     * property) that carries the `private` modifier.
     *
     * @param node The field-like class member
     */
    const reportPrivateField = (
      node: TSESTree.PropertyDefinition | TSESTree.AccessorProperty
    ): void => {
      if (node.accessibility === 'private') {
        context.report({ node, messageId: 'privateField' });
      }
    };

    return {
      PropertyDefinition: reportPrivateField,
      AccessorProperty: reportPrivateField,
      MethodDefinition(node) {
        if (node.accessibility !== 'private') {
          return;
        }
        context.report({
          node,
          messageId: node.kind === 'constructor' ? 'privateConstructor' : 'privateMethod'
        });
      }
    };
  }
});
