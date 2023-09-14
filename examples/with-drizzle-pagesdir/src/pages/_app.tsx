import type { AppProps } from "next/app";
import "@uploadthing/react/styles.css"

function MyApp({ Component, pageProps }: AppProps) {
    return (
        <Component {...pageProps} />
    );
}

// Opt out of prerendering
MyApp.getInitialProps = async () => {
    return {};
}

export default MyApp;