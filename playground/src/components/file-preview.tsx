"use client";

import React from "react";
import Image from "next/image";
import { ImageIcon } from "@radix-ui/react-icons";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

import { Card, CardDescription, CardTitle } from "./ui/card";

interface EmptyCardProps extends React.ComponentPropsWithoutRef<typeof Card> {
  title: string;
  description?: string;
  Icon?: React.ComponentType<{ className?: string }>;
}

export const EmptyCard = ({
  title,
  description,
  Icon = ImageIcon,
  className,
  ...props
}: EmptyCardProps) => {
  return (
    <Card
      className={twMerge(
        "flex w-full flex-col items-center justify-center space-y-6 bg-transparent p-16",
        className,
      )}
      {...props}
    >
      <div className="mr-4 shrink-0 rounded-full border border-dashed p-4">
        <Icon className="text-muted-foreground size-8" aria-hidden="true" />
      </div>
      <div className="flex flex-col items-center gap-1.5 text-center">
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </div>
    </Card>
  );
};

export const FilePreview = ({
  file,
}: {
  file: { key: string; name: string };
}) => {
  const [errored, setErrored] = React.useState(false);

  const ext = file.name.split(".")!.pop()!;
  if (errored || !["png", "jpg", "jpeg", "gif"].includes(ext)) {
    const Icon = ImageIcon; // TODO: Dynamic icon

    return (
      <div
        key={file.key}
        className={twMerge(
          "relative flex aspect-video w-full flex-col items-center justify-center gap-4 rounded-md border-2 border-dashed p-4",
          errored && "border-red-500",
        )}
      >
        <Icon className="text-muted-foreground size-8" aria-hidden="true" />
        <CardTitle>{file.name}</CardTitle>
        {errored && <CardDescription>Failed to load file</CardDescription>}
      </div>
    );
  }

  return (
    <div key={file.key} className="relative aspect-video w-full">
      <Image
        src={`https://utfs.io/f/${file.key}`}
        alt={file.name}
        fill
        sizes="(min-width: 640px) 640px, 100vw"
        loading="lazy"
        className="rounded-md object-cover"
        onError={() => {
          setErrored(true);
          toast.error(`Failed to load file ${file.name}`);
        }}
      />
    </div>
  );
};
