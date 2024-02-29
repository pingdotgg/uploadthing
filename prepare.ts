import { $ } from "bun";

/**
 * tsup doesn't seem to resolve very nicely when the tsup folder is in root
 * monorepo node_modules, so we copy it to the local node_modules folder
 */

try {
  $`rm -rf ./packages/solid/node_modules/tsup`;
  $`cp -r ./node_modules/tsup ./packages/solid/node_modules/tsup`;
} catch (e) {
  console.error(e);
  process.exit(1);
}
