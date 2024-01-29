import { process } from "std-env";

/*
 * Returns a full URL to the dev's uploadthing endpoint
 * Can take either an origin, or a pathname, or a full URL
 * and will return the "closest" url matching the default
 * `<VERCEL_URL || localhost>/api/uploadthing`
 */
export function getFullApiUrl(maybeUrl?: string): URL {
  const base = (() => {
    if (typeof window !== "undefined") return window.location.origin;
    if (process.env?.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return "http://localhost:3000";
  })();

  try {
    const url = new URL(maybeUrl ?? "/api/uploadthing", base);
    if (url.pathname === "/") {
      url.pathname = "/api/uploadthing";
    }
    return url;
  } catch (err) {
    throw new Error(
      `Failed to parse '${maybeUrl}' as a URL. Make sure it's a valid URL or path`,
    );
  }
}

export function resolveMaybeUrlArg(maybeUrl: string | URL | undefined) {
  return maybeUrl instanceof URL ? maybeUrl : getFullApiUrl(maybeUrl);
}
