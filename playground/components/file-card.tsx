"use client";

import { useTransition } from "react";
import { cx } from "class-variance-authority";

import { deleteFile, getFileUrl } from "../lib/actions";
import { ListedFileInfo } from "../lib/data";
import { Button } from "./button";

export function FileCard({ file }: { file: ListedFileInfo }) {
  const [isOpening, startOpenTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  const failed = file.status === "Failed";

  return (
    <div className="flex items-center justify-between gap-4 rounded-md border p-2 shadow">
      <span className="truncate text-sm/6">{file.name}</span>

      <div className="flex gap-2">
        <Button
          onClick={() => {
            startOpenTransition(async () => {
              const response = await getFileUrl(file.key);
              if (response.success) {
                window.open(response.url, "_blank");
              } else {
                window.alert(response.error);
              }
            });
          }}
          color={failed ? "lightgray" : "blue"}
          className={cx(
            "min-w-16",
            isOpening && "animate-pulse",
            failed && "font-bold text-red-600",
          )}
          disabled={file.status !== "Uploaded" || isOpening}
        >
          {isOpening ? "⏳" : file.status === "Uploaded" ? "Open" : file.status}
        </Button>
        <Button
          size="icon"
          onClick={() => {
            startDeleteTransition(async () => {
              await deleteFile(file.key);
            });
          }}
          className={cx(
            "bg-red-600 text-red-50 hover:bg-red-700",
            isDeleting && "animate-pulse border-red-600",
          )}
          disabled={isDeleting}
        >
          {isDeleting ? "⏳" : "❌"}
        </Button>
      </div>
    </div>
  );
}
