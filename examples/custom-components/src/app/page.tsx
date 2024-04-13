import { EmptyCard, FilePreview } from "~/components/file-preview";
import { LoadMore } from "~/components/load-more";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { utapi } from "~/uploadthing/server";
import { ReactHookFormDemo } from "./react-hook-form-demo";

const PAGE_SIZE = 20;

const UploadFilesList = (props: {
  uploadedFiles: { key: string; name: string }[];
}) => {
  if (props.uploadedFiles.length === 0)
    return (
      <EmptyCard
        title="No files uploaded"
        description="Upload some files to see them here"
        className="w-full"
      />
    );
  return props.uploadedFiles.map((file) => <FilePreview file={file} />);
};

const loadUploadedFiles = async (offset = 0) => {
  "use server";

  const files = await utapi.listFiles({ offset, limit: PAGE_SIZE });
  const nextOffset = files.length >= PAGE_SIZE ? offset + PAGE_SIZE : null;

  return [<UploadFilesList uploadedFiles={files} />, nextOffset] as const;
};

export default async function HomePage() {
  const uploadedFiles = await utapi.listFiles({ offset: 0, limit: PAGE_SIZE });

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-8 py-8 lg:px-0">
      <ReactHookFormDemo />
      <Card>
        <CardHeader>
          <CardTitle>Uploaded files</CardTitle>
          <CardDescription>View the uploaded files here</CardDescription>
        </CardHeader>
        <CardContent>
          <LoadMore
            initialOffset={PAGE_SIZE}
            loadMoreAction={loadUploadedFiles}
          >
            <UploadFilesList uploadedFiles={uploadedFiles} />
          </LoadMore>
        </CardContent>
      </Card>
    </div>
  );
}
