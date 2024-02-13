import { lookup } from "@uploadthing/mime-types";

interface UTFilePropertyBag extends BlobPropertyBag {
  lastModified?: number;
  customId?: string;
}

/**
 * Extension of the Blob class that simplifies setting the `name` and `customId` properties,
 * similar to the built-in File class from Node > 20.
 */
export class UTFile extends Blob {
  name: string;
  lastModified: number;
  customId?: string;

  constructor(parts: BlobPart[], name: string, options?: UTFilePropertyBag) {
    const optionsWithDefaults = {
      ...options,
      type: options?.type ?? (lookup(name) || undefined),
      lastModified: options?.lastModified ?? Date.now(),
    };
    super(parts, optionsWithDefaults);
    this.name = name;
    this.customId = optionsWithDefaults.customId;
    this.lastModified = optionsWithDefaults.lastModified;
  }
}
