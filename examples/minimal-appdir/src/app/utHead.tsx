import Script from "next/script";

import { eagerSetupUploadThingSSR } from "@uploadthing/shared";
import { FileRouter } from "uploadthing/next";

export const UTHead = (props: { router: FileRouter }) => {
  const utConfig = eagerSetupUploadThingSSR(props.router);

  return (
    <Script strategy="beforeInteractive">{`globalThis.__UPLOADTHING = { parsedConfig: ${JSON.stringify(
      utConfig,
    )}};
    console.log("did this even run?");`}</Script>
  );
};
