// @ts-nocheck
import { mdxAnnotations } from "mdx-annotations";
import remarkGfm from "remark-gfm";
import remarkUnwrapImages from "remark-unwrap-images";

import { remarkNpm2Yarn } from "./npm2yarn.js";

export const remarkPlugins = [
  mdxAnnotations.remark,
  remarkGfm,
  remarkUnwrapImages,
  remarkNpm2Yarn,
];
