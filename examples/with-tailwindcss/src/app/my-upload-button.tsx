import { useUploadThing } from "~/utils/uploadthing";

export const MyUploadButton = (props: {}) => {
  const { getInputProps, files, isUploading, progresses } =
    useUploadThing("videoAndImage");

  return (
    <label className="cursor-pointer rounded bg-blue-500 px-8 py-2 text-white hover:bg-blue-600">
      {files.length ? "Upload files" : "Select files to upload"}
      <input {...getInputProps({ mode: "manual" })} className="sr-only" />
    </label>
  );
};
