import { process } from "std-env";

import { logger } from "./logger";

export function incompatibleNodeGuard() {
  if (typeof process === "undefined") return;

  let major: number | undefined;
  let minor: number | undefined;

  const maybeNodeVersion = process.versions?.node?.split(".");
  if (maybeNodeVersion) {
    [major, minor] = maybeNodeVersion.map((v) => parseInt(v, 10));
  }

  const maybeNodePath = process.env?.NODE;
  if (!major && maybeNodePath) {
    const nodeVersion = /v(\d+)\.(\d+)\.(\d+)/.exec(maybeNodePath)?.[0];
    if (nodeVersion) {
      [major, minor] = nodeVersion
        .substring(1)
        .split(".")
        .map((v) => parseInt(v, 10));
    }
  }

  if (!major || !minor) return;

  // Require ^18.13.0
  if (major > 18) return;
  if (major === 18 && minor >= 13) return;

  logger.fatal(
    `YOU ARE USING A LEGACY (${major}.${minor}) NODE VERSION WHICH ISN'T OFFICIALLY SUPPORTED. PLEASE UPGRADE TO NODE ^18.13.`,
  );

  // Kill the process if it isn't going to work correctly anyway
  // If we've gotten this far we know we have a Node.js runtime so exit is defined. Override std-env type.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  (process as any).exit?.(1);
}
