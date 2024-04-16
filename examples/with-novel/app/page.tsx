import { Menu } from "@/app/menu";
import { AdvancedEditor } from "@/editor";
import { buttonVariants } from "@/ui/button";
import { Github } from "lucide-react";
import { twMerge } from "tailwind-merge";

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col items-center gap-4 py-4 sm:px-5">
      <div className="flex w-full max-w-screen-lg items-center gap-2 px-4 sm:mb-16">
        <a
          href="https://github.com/pingdotgg/uploadthing/examples/with-novel"
          target="_blank"
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <Github />
        </a>

        <a
          href="https://novel.sh/docs"
          className={twMerge(buttonVariants({ variant: "ghost" }), "ml-auto")}
        >
          Novel Docs
        </a>
        <a
          href="https://docs.uploadthing.com"
          className={twMerge(buttonVariants({ variant: "ghost" }))}
        >
          UploadThing Docs
        </a>
        <Menu />
      </div>

      <AdvancedEditor />
    </div>
  );
}
