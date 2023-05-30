import useFetch from "./useFetch";
import type { ExpandedRouteConfig } from "uploadthing/server";

export type EndpointMetadata = {
  slug: string;
  config: ExpandedRouteConfig;
}[];

export const useEndpointMetadata = (
  endpoint: string,
  url = "/api/uploadthing"
) => {
  const { data } = useFetch<EndpointMetadata>(url);

  // TODO: Log on errors in dev

  return data?.find((x) => x.slug === endpoint);
};
