import {
  AST_NODE_TYPES,
  ESLintUtils,
  TSESTree,
} from "@typescript-eslint/utils";
import { getParserServices } from "@typescript-eslint/utils/eslint-utils";

export default ESLintUtils.RuleCreator.withoutDocs({
  create(context) {
    const services = getParserServices(context);
    const checker = services.program.getTypeChecker();

    function checkThrowArgument(node: TSESTree.Node): void {
      if (node.type === AST_NODE_TYPES.AwaitExpression) {
        return;
      }

      const type = services.getTypeAtLocation(node);
      const symbol = type.getSymbol();
      if (symbol?.escapedName === "Promise") {
        context.report({
          node,
          messageId: "no-throwing-promises",
          fix(fixer) {
            return fixer.insertTextBefore(node, "await ");
          },
        });
      }
    }

    return {
      ThrowStatement(node) {
        if (node.argument) {
          return checkThrowArgument(node.argument);
        }
      },
    };
  },
  meta: {
    messages: {
      "no-throwing-promises":
        "Throwing promises is not allowed. Await the promise and throw the result instead.",
    },
    type: "suggestion",
    fixable: "code",
    schema: [],
  },
  defaultOptions: [],
});
