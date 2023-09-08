import Script from "next/script";

import { eagerSetupUploadThingSSR } from "@uploadthing/shared";
import { FileRouter } from "uploadthing/next";

/**
 * Pass this your router IN A SERVER COMPONENT and it will prefill all the data the UploadThing components need to render
 */
export const UTHead = (props: { router: FileRouter }) => {
  if (typeof window !== "undefined") throw new Error("UTHead is SSR only");
  const utConfig = eagerSetupUploadThingSSR(props.router);

  return (
    <Script strategy="beforeInteractive">{`globalThis.__UPLOADTHING = { parsedConfig: ${JSON.stringify(
      utConfig,
    )}}`}</Script>
  );
};
