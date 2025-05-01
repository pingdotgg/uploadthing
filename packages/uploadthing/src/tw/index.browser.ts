import type { Config } from "tailwindcss";

import { uploadthingPlugin } from "./plugin";

export { uploadthingPlugin };

export function withUt(twConfig: Config) {
  twConfig.plugins ??= [];
  twConfig.plugins.push(uploadthingPlugin);

  return twConfig;
}
