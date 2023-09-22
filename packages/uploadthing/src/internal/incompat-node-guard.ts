export function incompatibleNodeGuard() {
  if (typeof process === "undefined") return;

  let major: number | undefined;

  const maybeNodeVersion = process.versions?.node?.split(".");
  if (maybeNodeVersion) {
    [major] = maybeNodeVersion.map((v) => parseInt(v, 10));
  }

  const maybeNodePath = process.env?.NODE;
  if (!major && maybeNodePath) {
    const nodeVersion = /v(\d+)\.(\d+)\.(\d+)/.exec(maybeNodePath)?.[0];
    if (nodeVersion) {
      [major] = nodeVersion
        .substring(1)
        .split(".")
        .map((v) => parseInt(v, 10));
    }
  }

  if (major && major < 18) {
    throw new Error(
      `[UT]: YOU ARE USING A LEGACY (${major}) NODE VERSION WHICH ISN'T OFFICIALLY SUPPORTED. PLEASE UPGRADE TO NODE 18+.`,
    );
  }
}
