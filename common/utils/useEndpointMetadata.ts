import useFetch from "./useFetch";

export type EndpointMetadata = {
  slug: string;
  maxSize: string;
  fileTypes: string[];
}[];

export const useEndpointMetadata = (
  endpoint: string,
  url: string = "/api/uploadthing"
) => {
  const { data } = useFetch<EndpointMetadata>(url);

  // TODO: Log on errors in dev

  return data?.find((x) => x.slug === endpoint);
};
