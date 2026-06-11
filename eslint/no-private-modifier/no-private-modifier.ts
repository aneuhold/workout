import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../createRule';
import { buildClassFixes } from './buildClassFixes';
import { classifyMemberAccess, createClassFrame, recordDestructuring } from './classFrame';
import { collectClassReports } from './classReports';
import { type ClassFrame, type ClassNode } from './types';

/**
 * Enforces that class members marked private use the ECMAScript `#private`
 * syntax rather than the TypeScript `private` accessibility modifier, and
 * autofixes the conversion — declaration plus `this.x` / `ClassName.x`
 * references — whenever it can do so safely. Covers instance and static fields,
 * methods (including accessors and getters/setters), and constructors.
 * Constructor parameter properties (`constructor(private foo)`) are
 * intentionally allowed, since the `#` form has no equivalent shorthand.
 *
 * References are gathered as ESLint makes its single pass over the file: a stack
 * tracks the class currently being traversed, and a per-class counter tracks how
 * far `this` has been rebound away from the instance by nested non-arrow
 * functions. See `classFrame.ts` for how each access is classified.
 */
export const noPrivateModifier = createRule({
  name: 'no-private-modifier',
  meta: {
    type: 'suggestion',
    fixable: 'code',
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
    const { sourceCode } = context;
    const classStack: ClassFrame[] = [];

    /** Whether `this`, at the current point in traversal, is the class instance. */
    const thisIsInstance = (): boolean => {
      const frame = classStack.at(-1);
      return frame !== undefined && frame.rebindDepth === 0;
    };

    /**
     * Adjusts the current class's rebind depth when entering or leaving a
     * function. A function that isn't a method of the class rebinds `this`.
     *
     * @param node The function being entered or left
     * @param delta `+1` on enter, `-1` on exit
     */
    const adjustRebindDepth = (
      node: TSESTree.FunctionDeclaration | TSESTree.FunctionExpression,
      delta: number
    ): void => {
      const frame = classStack.at(-1);
      if (frame && node.parent.type !== AST_NODE_TYPES.MethodDefinition) {
        frame.rebindDepth += delta;
      }
    };

    /**
     * Reports every `private` member of the class being left, attaching the
     * single class-wide autofix to the first member that can be converted.
     */
    const reportClass = (): void => {
      const frame = classStack.pop();
      if (!frame) {
        return;
      }

      const { reports, targets } = collectClassReports(frame);
      const fixableMembers = new Set(targets.map((target) => target.member));
      let fixAttached = false;

      for (const { member, messageId } of reports) {
        if (!fixAttached && fixableMembers.has(member)) {
          fixAttached = true;
          context.report({
            node: member,
            messageId,
            fix: (fixer) => buildClassFixes(fixer, sourceCode, targets)
          });
        } else {
          context.report({ node: member, messageId });
        }
      }
    };

    return {
      ClassDeclaration: (node: ClassNode) => classStack.push(createClassFrame(node)),
      ClassExpression: (node: ClassNode) => classStack.push(createClassFrame(node)),
      'ClassDeclaration:exit': () => reportClass(),
      'ClassExpression:exit': () => reportClass(),
      FunctionDeclaration: (node) => adjustRebindDepth(node, 1),
      FunctionExpression: (node) => adjustRebindDepth(node, 1),
      'FunctionDeclaration:exit': (node) => adjustRebindDepth(node, -1),
      'FunctionExpression:exit': (node) => adjustRebindDepth(node, -1),
      MemberExpression(node) {
        const frame = classStack.at(-1);
        if (frame && frame.candidateNames.size > 0) {
          classifyMemberAccess(frame, node, thisIsInstance());
        }
      },
      ObjectPattern(node) {
        const frame = classStack.at(-1);
        if (frame && frame.candidateNames.size > 0) {
          recordDestructuring(frame, node);
        }
      }
    };
  }
});
