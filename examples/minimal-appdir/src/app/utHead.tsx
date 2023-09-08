import Script from "next/script";

import { eagerSetupUploadThingSSR } from "@uploadthing/shared";
import { FileRouter } from "uploadthing/next";

/**
 * Pass this your router IN A SERVER COMPONENT and it will prefill all the data the UploadThing components need to render
 *
 * TODO: Move this to one of the packages. We might need to break out /next
 */
export const UTHead = (props: { router: FileRouter }) => {
  if (typeof window !== "undefined") throw new Error("UTHead is SSR only");

  // Grab full config and set in `globalThis`
  const utConfig = eagerSetupUploadThingSSR(props.router);

  // Add as eager script so same data exists before components hydrate
  return (
    <Script strategy="beforeInteractive">{`globalThis.__UPLOADTHING = { parsedConfig: ${JSON.stringify(
      utConfig,
    )}}`}</Script>
  );
};
