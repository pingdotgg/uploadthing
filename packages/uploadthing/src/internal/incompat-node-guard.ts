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
  if (!(major >= 18 && minor >= 13)) {
    console.error(
      `[UT]: YOU ARE USING A LEGACY (${major}.${minor}) NODE VERSION WHICH ISN'T OFFICIALLY SUPPORTED. PLEASE UPGRADE TO NODE ^18.13.`,
    );
    process.exit(1); // Kill the process if it isn't going to work correctly anyway
  }
}
