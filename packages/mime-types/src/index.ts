/**
 * Vendored version of mime-types that can run on the edge due to not using path.extname
 *
 * Also ported it to TypeScript cause it was easier than playing around with custom d.ts file
 *
 * Removed all the stuff we didn't use
 */

/*!
 * mime-types
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */

import { application } from "./application";
import { audio } from "./audio";
import { image } from "./image";
import { misc } from "./misc";
import { text } from "./text";
import { video } from "./video";

const mimes = {
  ...application,
  ...audio,
  ...image,
  ...text,
  ...video,
  ...misc,
};

export type MimeType = keyof typeof mimes;
export type FileExtension = (typeof mimes)[MimeType]["extensions"][number];

export const mimeTypes = mimes as unknown as Record<
  MimeType,
  { source: string; extensions: FileExtension[] }
>;

function extname(path: string) {
  const index = path.lastIndexOf(".");
  return index < 0 ? "" : path.substring(index);
}

const extensions = {} as Record<MimeType, FileExtension[]>;
const types = {} as Record<FileExtension, MimeType>;

// Introduce getters to improve tree-shakeability
export function getTypes(): Record<FileExtension, MimeType> {
  populateMaps(extensions, types);
  return types;
}

export function getExtensions(): Record<MimeType, FileExtension[]> {
  populateMaps(extensions, types);
  return extensions;
}

/**
 * Lookup the MIME type for a file path/extension.
 */
export function lookup(path: string): false | MimeType {
  if (!path || typeof path !== "string") {
    return false;
  }

  // get the extension ("ext" or ".ext" or full path)
  const extension = extname("x." + path)
    .toLowerCase()
    .substring(1) as FileExtension;

  if (!extension) {
    return false;
  }

  return getTypes()[extension] || false;
}

let inittedMaps = false;
/**
 * Populate the extensions and types maps.
 * @private
 */

function populateMaps(
  extensions: Record<MimeType, FileExtension[]>,
  types: Record<FileExtension, MimeType>,
) {
  if (inittedMaps) return;
  inittedMaps = true;
  // source preference (least -> most)
  const preference = ["nginx", "apache", undefined, "iana"];

  (Object.keys(mimeTypes) as MimeType[]).forEach((type) => {
    const mime = mimeTypes[type];
    const exts = mime.extensions;

    if (!exts?.length) {
      return;
    }

    // mime -> extensions
    extensions[type] = exts;

    // extension -> mime

    for (const extension of exts) {
      if (types[extension]) {
        const from = preference.indexOf(mimeTypes[types[extension]].source);
        const to = preference.indexOf(mime.source);

        if (
          types[extension] !== "application/octet-stream" &&
          (from > to ||
            (from === to && types[extension].startsWith("application/")))
        ) {
          // skip the remapping
          continue;
        }
      }

      // set the extension -> mime
      types[extension] = type;
    }
  });
}
