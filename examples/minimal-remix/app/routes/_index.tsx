import type {
  MetaFunction,
} from "@remix-run/node";
import  { UploadButton } from "~/utils/uploadthing";

export const meta: MetaFunction = () => {
  return [
    { title: "Uploadthing x Remix" },
    {
      name: "description",
      content: "An example of using Uploadthing with Remix.",
    },
  ];
};

export default function Index() {
  return (
    <main className="max-w-screen-xl mx-auto p-8 text-center">
      <h1 className="text-3xl mb-4">Uploadthing x Remix</h1>
      <UploadButton endpoint="videoAndImage" onClientUploadComplete={(r) => console.log("Upload complete", r)}/>
    </main>
  );
}
