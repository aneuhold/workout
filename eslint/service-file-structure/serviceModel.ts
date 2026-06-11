import { AST_NODE_TYPES, type TSESLint, type TSESTree } from '@typescript-eslint/utils';
import type { ServiceMessageId } from './messages';

/**
 * The rule context, narrowed to this rule's message ids and (empty) options, so
 * every validation module gets fully-typed `context.report` calls.
 */
export type ServiceRuleContext = Readonly<TSESLint.RuleContext<ServiceMessageId, []>>;

/**
 * The shared model the orchestrator builds once and hands to every validation:
 * the file's single service class plus the derived names and program body the
 * validations operate on.
 */
export type ServiceModel = {
  body: TSESTree.ProgramStatement[];
  /** The class declaration itself. */
  classNode: TSESTree.ClassDeclaration;
  /** The statement carrying the class — itself, or its `export` wrapper. */
  outer: TSESTree.ProgramStatement;
  className: string;
  /** Conventional singleton instance name: the class name, first letter lowercased. */
  instance: string;
};

/**
 * A validation step: inspects the shared model and reports any violations.
 */
export type ServiceValidation = (context: ServiceRuleContext, model: ServiceModel) => void;

/**
 * A file-level validation step that depends only on the file itself (e.g. its
 * name), so it runs even when there is no resolvable service class.
 */
export type ServiceFileValidation = (context: ServiceRuleContext) => void;

/**
 * Describes a top-level `const x = new SomeClass()` binding: whether it is the
 * exempt singleton for this service, plus the bound name and declarator for
 * follow-up checks.
 */
export type SingletonInfo = {
  isSingleton: boolean;
  name?: string;
  declarator?: TSESTree.LetOrConstOrVarDeclarator;
};

/**
 * Derives the conventional singleton instance name from a class name by
 * lowercasing the first character (e.g. `WakeLockService` -> `wakeLockService`).
 *
 * @param className The service class name
 */
export const instanceNameFor = (className: string): string =>
  `${className.charAt(0).toLowerCase()}${className.slice(1)}`;

/**
 * Inspects a top-level variable declaration and reports whether it is the one
 * exempt singleton binding `const <name> = new <className>()`.
 *
 * @param node The variable declaration statement
 * @param className The file's single service class name
 */
export const singletonInfo = (
  node: TSESTree.VariableDeclaration,
  className: string
): SingletonInfo => {
  if (node.kind !== 'const' || node.declarations.length !== 1) {
    return { isSingleton: false };
  }
  const [declarator] = node.declarations;
  const isSingleton =
    declarator.id.type === AST_NODE_TYPES.Identifier &&
    declarator.init?.type === AST_NODE_TYPES.NewExpression &&
    declarator.init.callee.type === AST_NODE_TYPES.Identifier &&
    declarator.init.callee.name === className;
  if (!isSingleton || declarator.id.type !== AST_NODE_TYPES.Identifier) {
    return { isSingleton: false };
  }
  return { isSingleton: true, name: declarator.id.name, declarator };
};

/**
 * Collects the file's top-level classes (bare or exported) and, if there is
 * exactly one named class, returns the shared model. Otherwise reports the
 * blocking class-shape problem and returns `null` so no further validation runs.
 *
 * @param context The rule context
 * @param program The program node
 */
export const resolveServiceClass = (
  context: ServiceRuleContext,
  program: TSESTree.Program
): ServiceModel | null => {
  const classes: { node: TSESTree.ClassDeclaration; outer: TSESTree.ProgramStatement }[] = [];
  for (const statement of program.body) {
    if (statement.type === AST_NODE_TYPES.ClassDeclaration) {
      classes.push({ node: statement, outer: statement });
    } else if (
      (statement.type === AST_NODE_TYPES.ExportNamedDeclaration ||
        statement.type === AST_NODE_TYPES.ExportDefaultDeclaration) &&
      statement.declaration?.type === AST_NODE_TYPES.ClassDeclaration
    ) {
      classes.push({ node: statement.declaration, outer: statement });
    }
  }

  if (classes.length === 0) {
    context.report({ node: program, messageId: 'classRequired' });
    return null;
  }

  if (classes.length > 1) {
    for (const extra of classes.slice(1)) {
      context.report({ node: extra.node, messageId: 'singleClassOnly' });
    }
    return null;
  }

  const { node: classNode, outer } = classes[0];
  const className = classNode.id?.name;
  if (!className) {
    context.report({ node: classNode, messageId: 'classMustBeNamed' });
    return null;
  }

  return {
    body: program.body,
    classNode,
    outer,
    className,
    instance: instanceNameFor(className)
  };
};
