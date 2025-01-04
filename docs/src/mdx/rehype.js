// @ts-nocheck
import { transformerNotationDiff } from "@shikijs/transformers";
import { slugifyWithCounter } from "@sindresorhus/slugify";
import * as acorn from "acorn";
import { toString } from "mdast-util-to-string";
import { mdxAnnotations } from "mdx-annotations";
import { getSingletonHighlighter } from "shiki";
import { visit } from "unist-util-visit";

function rehypeParseCodeBlocks() {
  return (tree) => {
    visit(tree, "element", (node, _nodeIndex, parentNode) => {
      if (node.tagName === "code") {
        if (node.properties.className) {
          parentNode.properties.language =
            node.properties.className[0]?.replace(/^language-/, "");
        }
      }
    });
  };
}

/** @type {import('shiki').Highlighter} */
let highlighter;

function rehypeShiki() {
  return async (tree) => {
    highlighter ??= await getSingletonHighlighter({
      themes: ["github-light", "github-dark"],
      langs: [
        "bash",
        "typescript",
        "javascript",
        "astro",
        "vue",
        "svelte",
        "css",
        "python",
        "diff",
        "go",
        "php",
        "rust",
      ],
    });

    visit(tree, "element", (node) => {
      if (node.tagName === "pre" && node.children[0]?.tagName === "code") {
        let codeNode = node.children[0];
        let textNode = codeNode.children[0];

        node.properties.code = textNode.value;

        if (node.properties.language) {
          textNode.value = highlighter.codeToHtml(textNode.value, {
            lang: node.properties.language,
            themes: {
              light: "github-light",
              dark: "github-dark",
            },
            defaultColor: false,
            transformers: [transformerNotationDiff()],
          });
        }
      }
    });
  };
}

function rehypeSlugify() {
  return (tree) => {
    let slugify = slugifyWithCounter();
    visit(tree, "element", (node) => {
      if (["h2", "h3"].includes(node.tagName) && !node.properties.id) {
        node.properties.id = slugify(toString(node));
      }
    });
  };
}

function rehypeAddMDXExports(getExports) {
  return (tree) => {
    let exports = Object.entries(getExports(tree));

    for (let [name, value] of exports) {
      for (let node of tree.children) {
        if (
          node.type === "mdxjsEsm" &&
          new RegExp(`export\\s+const\\s+${name}\\s*=`).test(node.value)
        ) {
          return;
        }
      }

      let exportStr = `export const ${name} = ${value}`;

      tree.children.push({
        type: "mdxjsEsm",
        value: exportStr,
        data: {
          estree: acorn.parse(exportStr, {
            sourceType: "module",
            ecmaVersion: "latest",
          }),
        },
      });
    }
  };
}

function getSections(node) {
  let sections = [];

  for (let child of node.children ?? []) {
    if (child.type === "element" && child.tagName === "h2") {
      sections.push(`{
        title: ${JSON.stringify(toString(child))},
        id: ${JSON.stringify(child.properties.id)},
        ...${child.properties.annotation}
      }`);
    } else if (child.children) {
      sections.push(...getSections(child));
    }
  }

  return sections;
}

export const rehypePlugins = [
  mdxAnnotations.rehype,
  rehypeParseCodeBlocks,
  rehypeShiki,
  rehypeSlugify,
  [
    rehypeAddMDXExports,
    (tree) => ({
      sections: `[${getSections(tree).join()}]`,
    }),
  ],
];
