import type { AppProps } from "next/app";
import { ClerkProvider } from "@clerk/nextjs";

import "@uploadthing/react/styles.css";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider {...pageProps}>
      <Component {...pageProps} />
    </ClerkProvider>
  );
}

export default MyApp;
