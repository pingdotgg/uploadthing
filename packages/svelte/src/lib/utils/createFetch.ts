import { onMount } from "svelte";
import { readonly, writable } from "svelte/store";

import type { FetchEsque } from "@uploadthing/shared";

interface State<T> {
  data?: T;
  error?: Error;
  type: "fetched" | "error" | "loading";
}

type Cache<T> = Record<string, T>;

export function createFetch<T = unknown>(
  fetchFn: FetchEsque,
  url?: string,
  options?: RequestInit,
) {
  const cache: Cache<T> = {};
  const initialState: State<T> = {
    type: "loading",
    error: undefined,
    data: undefined,
  };
  const store = writable(initialState);
  const fetchData = async () => {
    if (!url)
      return store.set({
        type: "error",
        error: new Error("No URL provided"),
      });
    if (cache[url]) {
      return store.set({ type: "fetched", data: cache[url] });
    }
    try {
      const response = await fetchFn(url, options);
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      const data = (await response.json()) as T;
      cache[url] = data;
      return store.set({ data, type: "fetched" });
    } catch (error) {
      return store.set({ error: error as Error, type: "error" });
    }
  };
  onMount(() => {
    void fetchData();
  });
  return readonly(store);
}
