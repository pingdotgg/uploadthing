"use client";

import * as React from "react";

import { UploadButton } from "@uploadthing/react";

export function WithoutSSR() {
  // False for 3 seconds, true for 1 second, repeating
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const intervalId = setInterval(
      () => {
        setLoading((prevIsActive) => !prevIsActive);
      },
      loading ? 5000 : 2000,
    );

    return () => {
      clearInterval(intervalId);
    };
  }, [loading]);

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="font-semibold">Without SSR Plugin</span>
      {/* @ts-expect-error - using non-public props */}
      <UploadButton
        __internal_button_disabled
        __internal_state={loading ? "readying" : "ready"}
        content={{
          allowedContent: loading ? "" : "Allowed content",
          button: loading ? "Loading..." : "Ready",
        }}
      />
    </div>
  );
}

export function WithSSR() {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="font-semibold">With SSR Plugin</span>
      {/* @ts-expect-error - using non-public props */}
      <UploadButton
        __internal_button_disabled
        __internal_state={"ready"}
        content={{
          allowedContent: "Allowed content",
          button: "Ready",
        }}
      />
    </div>
  );
}
