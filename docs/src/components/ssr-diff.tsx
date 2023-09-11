import { useEffect, useState } from "react";

import { UploadButton } from "@uploadthing/react";

export function WithoutSSR() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="font-semibold">Without SSR</span>
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
      <span className="font-semibold">With SSR</span>
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
