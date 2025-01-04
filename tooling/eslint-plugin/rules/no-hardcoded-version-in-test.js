// @ts-check
import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";
import { getParserServices } from "@typescript-eslint/utils/eslint-utils";

/**
 * @typedef {import("@typescript-eslint/utils").TSESTree.Node} TSESTree.Node
 */

/**
 * Walks up the AST to find the first node that matches the predicate
 *
 * @param {TSESTree.Node} node
 * @param {(node: TSESTree.Node) => boolean} predicate
 * @returns {TSESTree.Node | undefined}
 */
function findUp(node, predicate) {
  /** @type {TSESTree.Node | undefined} */
  let currentNode = node;
  while (currentNode) {
    if (predicate(currentNode)) {
      return currentNode;
    }
    currentNode = currentNode.parent;
  }
  return undefined;
}

export default ESLintUtils.RuleCreator.withoutDocs({
  create(context) {
    const services = getParserServices(context);

    return {
      Property(node) {
        if (
          node.key.type === AST_NODE_TYPES.Literal &&
          node.key.value === "x-uploadthing-version"
        ) {
          const isInAssertion = findUp(
            node,
            (node) =>
              !!(
                node.type === AST_NODE_TYPES.CallExpression &&
                node.callee.type === AST_NODE_TYPES.MemberExpression &&
                node.callee.property.type === AST_NODE_TYPES.Identifier &&
                node.callee.property.name.match(/^to[a-zA-Z].*/)?.length
              ),
          );

          if (isInAssertion && node.value.type === AST_NODE_TYPES.Literal) {
            context.report({
              node,
              messageId: "no-hardcoded-version-in-test",
              fix(fixer) {
                return fixer.replaceText(
                  node.value,
                  `expect.stringMatching(/\\d+\\.\\d+\\.\\d+/)`,
                );
              },
            });
          }
        }
      },
    };
  },
  meta: {
    messages: {
      "no-hardcoded-version-in-test":
        "Don't hardcode the version since it'll change on next release. Instead use `expect.stringMatching()`",
    },
    type: "suggestion",
    fixable: "code",
    schema: [],
  },
  defaultOptions: [],
});
