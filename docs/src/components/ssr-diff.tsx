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
    // @ts-expect-error - using non-public props
    <UploadButton
      __internal_button_disabled
      __internal_state={loading ? "readying" : "ready"}
      content={{
        allowedContent: loading ? "" : "Allowed content",
        button: loading ? "Loading..." : "Ready",
      }}
    />
  );
}

export function WithSSR() {
  return (
    // @ts-expect-error - using non-public props
    <UploadButton
      __internal_button_disabled
      __internal_state={"ready"}
      content={{
        allowedContent: "Allowed content",
        button: "Ready",
      }}
    />
  );
}
