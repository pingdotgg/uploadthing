// @ts-nocheck
import convert from 'npm-to-yarn'
import { visit } from 'unist-util-visit'

const PACKAGE_MANAGERS = /** @type {const} */ (['npm', 'pnpm', 'yarn', 'bun'])

/**
 * Small little plugin to convert installation commands
 * to different package managers.
 * This will look for code blocks with the `npm2yarn` meta
 * and replace the node with a `CodeGroup` with all different
 * commands.
 *
 * @type {import('unified').Plugin<[], import('mdast').Root>} [plugin]
 */
export const remarkNpm2Yarn = () => {
  return (ast, _file, done) => {
    visit(ast, 'code', (node, index, parent) => {
      if (!node.meta?.includes('npm2yarn')) return
      if (!parent || typeof index !== 'number') return

      parent.children[index] = {
        type: 'mdxJsxFlowElement',
        name: 'CodeGroup',
        attributes: [
          {
            type: 'mdxJsxAttribute',
            name: 'storageKey',
            value: 'preferedPkgMgr',
          },
        ],
        children: PACKAGE_MANAGERS.map((value) => ({
          type: node.type,
          lang: node.lang,
          meta: node.meta,
          value: convert(node.value, value),
          data: { hProperties: { annotation: `{ title: '${value}' }` } },
        })),
      }
    })

    done()
  }
}
