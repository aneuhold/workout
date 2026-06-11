import { type TSESTree } from '@typescript-eslint/utils';

/** A class declaration or expression. */
export type ClassNode = TSESTree.ClassDeclaration | TSESTree.ClassExpression;

/** A class member that can carry the `private` modifier and be converted to `#`. */
export type FixableMember =
  | TSESTree.PropertyDefinition
  | TSESTree.AccessorProperty
  | TSESTree.MethodDefinition;

/** A message this rule can report. */
export type MessageId = 'privateField' | 'privateMethod' | 'privateConstructor';

/** A member to convert, paired with the references that convert alongside it. */
export type FixTarget = { member: FixableMember; refs: TSESTree.MemberExpression[] };

/**
 * Everything learned about one class while ESLint traverses it: which private
 * members are candidates for conversion, which `#names` already exist, and the
 * references discovered so far (safely rewritable vs. blocked).
 */
export type ClassFrame = {
  classNode: ClassNode;
  className: string | null;
  /** Private member names eligible for conversion. */
  candidateNames: Set<string>;
  /** `#name` identifiers already present; renaming onto one would collide. */
  existingPrivateNames: Set<string>;
  /** `this.name` accesses that an autofix would rewrite. */
  thisRefs: Map<string, TSESTree.MemberExpression[]>;
  /** `ClassName.name` accesses (statics) that an autofix would rewrite. */
  staticRefs: Map<string, TSESTree.MemberExpression[]>;
  /** Names with a reference the fix can't safely rewrite, so won't be touched. */
  blocked: Set<string>;
  /**
   * How many non-arrow functions are currently open inside this class without
   * being one of its methods — i.e. how deeply `this` has been rebound away
   * from the instance. Zero means `this` refers to the instance.
   */
  rebindDepth: number;
};
