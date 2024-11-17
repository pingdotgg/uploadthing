import { onMount } from "svelte";

interface State<T> {
  data?: T;
  error?: Error;
  type: "fetched" | "error" | "loading";
}

class FetchResponse<T> implements State<T> {
  data?: T = $state();
  error?: Error = $state();
  type: "fetched" | "error" | "loading" = $state("loading");
  set({ data, error, type }: State<T>) {
    this.data = data;
    this.error = error;
    this.type = type;
    return this;
  }
}

type Cache<T> = Record<string, T>;

export function createFetch<T = unknown>(url?: string, options?: RequestInit) {
  const cache: Cache<T> = {};
  const state = new FetchResponse<T>();
  const fetchData = async () => {
    if (!url)
      return state.set({
        type: "error",
        error: new Error("No URL provided"),
      });
    if (cache[url]) {
      return state.set({ type: "fetched", data: cache[url] });
    }
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      const data = (await response.json()) as T;
      cache[url] = data;
      return state.set({ data, type: "fetched" });
    } catch (error) {
      return state.set({ error: error as Error, type: "error" });
    }
  };
  onMount(() => {
    void fetchData();
  });
  return state;
}
