import { lookup } from "@uploadthing/mime-types";

interface UTFilePropertyBag extends BlobPropertyBag {
  lastModified?: number | undefined;
  customId?: string | undefined;
}

/**
 * Extension of the Blob class that simplifies setting the `name` and `customId` properties,
 * similar to the built-in File class from Node > 20.
 */
export class UTFile extends Blob {
  name: string;
  lastModified: number;
  customId: string | undefined;

  constructor(parts: BlobPart[], name: string, options?: UTFilePropertyBag) {
    const optionsWithDefaults = {
      ...options,
      type: options?.type ?? (lookup(name) || "application/octet-stream"),
      lastModified: options?.lastModified ?? Date.now(),
    };
    super(parts, optionsWithDefaults);
    this.name = name;
    this.customId = optionsWithDefaults.customId;
    this.lastModified = optionsWithDefaults.lastModified;
  }
}
