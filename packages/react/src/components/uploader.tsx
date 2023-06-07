import type { FileRouter } from "uploadthing/server";

import type { EndpointHelper } from "./component-helpers";
import { UploadButton } from "./upload-button";
import { UploadDropzone } from "./upload-dropzone";

export const Uploader = <TRouter extends void | FileRouter = void>(props: {
  endpoint: EndpointHelper<TRouter>;
  onClientUploadComplete?: () => void;
  url?: string;
}) => {
  return (
    <>
      <div className="flex flex-col items-center justify-center gap-4">
        <span className="text-center text-4xl font-bold">
          {`Upload a file using a button:`}
        </span>
        <UploadButton<TRouter> {...props} />
      </div>
      <div className="flex flex-col items-center justify-center gap-4">
        <span className="text-center text-4xl font-bold">
          {`...or using a dropzone:`}
        </span>
        <UploadDropzone<TRouter> {...props} />
      </div>
    </>
  );
};
