import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';
import { type ClassFrame, type ClassNode } from './types';

/**
 * Creates a fresh frame for a class, scanning its members up-front for the
 * private names eligible to convert and the `#names` already in use.
 *
 * @param classNode The class declaration or expression
 */
export const createClassFrame = (classNode: ClassNode): ClassFrame => {
  const candidateNames = new Set<string>();
  const existingPrivateNames = new Set<string>();

  for (const member of classNode.body.body) {
    if (
      member.type !== AST_NODE_TYPES.PropertyDefinition &&
      member.type !== AST_NODE_TYPES.MethodDefinition &&
      member.type !== AST_NODE_TYPES.AccessorProperty
    ) {
      continue;
    }
    if (member.key.type === AST_NODE_TYPES.PrivateIdentifier) {
      existingPrivateNames.add(member.key.name);
    } else if (
      !member.computed &&
      member.key.type === AST_NODE_TYPES.Identifier &&
      member.accessibility === 'private'
    ) {
      candidateNames.add(member.key.name);
    }
  }

  return {
    classNode,
    className: classNode.id?.name ?? null,
    candidateNames,
    existingPrivateNames,
    thisRefs: new Map(),
    staticRefs: new Map(),
    blocked: new Set(),
    rebindDepth: 0
  };
};

/**
 * Records a member access against the frame, bucketing it as a rewritable
 * `this.name` / `ClassName.name` reference or blocking the name when the access
 * has no safe `#` equivalent.
 *
 * @param frame The enclosing class's frame
 * @param node The member-access expression
 * @param thisIsInstance Whether `this` here refers to the class instance/itself
 */
export const classifyMemberAccess = (
  frame: ClassFrame,
  node: TSESTree.MemberExpression,
  thisIsInstance: boolean
): void => {
  const { property, object } = node;

  if (node.computed) {
    if (
      property.type === AST_NODE_TYPES.Literal &&
      typeof property.value === 'string' &&
      frame.candidateNames.has(property.value)
    ) {
      frame.blocked.add(property.value);
    }
    return;
  }

  if (property.type !== AST_NODE_TYPES.Identifier || !frame.candidateNames.has(property.name)) {
    return;
  }
  const name = property.name;

  if (node.optional) {
    frame.blocked.add(name);
    return;
  }

  if (object.type === AST_NODE_TYPES.ThisExpression) {
    // A `this` that has rebound (inside a nested non-arrow function) isn't our
    // member, so it's neither rewritten nor a problem — just ignored.
    if (thisIsInstance) {
      addReference(frame.thisRefs, name, node);
    }
    return;
  }

  if (
    object.type === AST_NODE_TYPES.Identifier &&
    frame.className !== null &&
    object.name === frame.className
  ) {
    addReference(frame.staticRefs, name, node);
    return;
  }

  // Access on some other object: without type information this could be a
  // same-class instance (which `#` allows) or an unrelated property. Can't
  // tell, so refuse to autofix this name.
  frame.blocked.add(name);
};

/**
 * Blocks any candidate name destructured off an object (`const { name } = …`),
 * since destructuring has no `#name` form.
 *
 * @param frame The enclosing class's frame
 * @param node The object pattern
 */
export const recordDestructuring = (frame: ClassFrame, node: TSESTree.ObjectPattern): void => {
  for (const property of node.properties) {
    if (
      property.type === AST_NODE_TYPES.Property &&
      property.key.type === AST_NODE_TYPES.Identifier &&
      frame.candidateNames.has(property.key.name)
    ) {
      frame.blocked.add(property.key.name);
    }
  }
};

/**
 * Appends a reference to the per-name list in `map`.
 *
 * @param map The reference map to add to
 * @param name The member name
 * @param node The member-access expression
 */
const addReference = (
  map: Map<string, TSESTree.MemberExpression[]>,
  name: string,
  node: TSESTree.MemberExpression
): void => {
  const existing = map.get(name);
  if (existing) {
    existing.push(node);
  } else {
    map.set(name, [node]);
  }
};
