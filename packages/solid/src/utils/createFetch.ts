import type { Resource } from "solid-js";
import { createResource } from "solid-js";

interface State<T> {
  data?: T;
  error?: Error;
  type: "fetched" | "error";
}

type Cache<T> = Record<string, T>;

export function createFetch<T = unknown>(url?: string, options?: RequestInit) {
  const cache: Cache<T> = {};
  const [res] = createResource(async () => {
    if (!url)
      return {
        type: "error",
        error: new Error("No URL provided"),
      };
    if (cache[url]) {
      return { type: "fetched", data: cache[url] };
    }
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      const data = (await response.json()) as T;
      cache[url] = data;
      return {
        data,
        type: "fetched",
      };
    } catch (error) {
      return {
        error: error as Error,
        type: "error",
      };
    }
  });
  return res as Resource<State<T>>;
}
