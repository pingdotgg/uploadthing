import { ClerkProvider } from "@clerk/nextjs";
import type { AppProps } from "next/app";
import '@uploadthing/react/styles.css'

function MyApp({ Component, pageProps }: AppProps) {
    return (
        <ClerkProvider {...pageProps}>
            <Component {...pageProps} />
        </ClerkProvider>
    );
}

export default MyApp;