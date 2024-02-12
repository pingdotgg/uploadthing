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

/**
 * Module dependencies.
 * @private
 */
import { mimeTypes as mimeDB } from "./db";
import type { FileExtension, MimeType } from "./db";

export * from "./db";

function extname(path: string) {
  const index = path.lastIndexOf(".");
  return index < 0 ? "" : path.substring(index);
}

export const extensions = {} as Record<MimeType, FileExtension[]>;
export const types = {} as Record<FileExtension, MimeType>;

// Populate the extensions/types maps
populateMaps(extensions, types);

/**
 * Lookup the MIME type for a file path/extension.
 *
 * @param {string} path
 * @return {boolean|string}
 */
export function lookup(path: string) {
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

  return types[extension] || false;
}

/**
 * Populate the extensions and types maps.
 * @private
 */

function populateMaps(
  extensions: Record<MimeType, FileExtension[]>,
  types: Record<FileExtension, MimeType>,
) {
  // source preference (least -> most)
  const preference = ["nginx", "apache", undefined, "iana"];

  (Object.keys(mimeDB) as MimeType[]).forEach((type) => {
    const mime = mimeDB[type];
    const exts = mime.extensions;

    if (!exts?.length) {
      return;
    }

    // mime -> extensions
    extensions[type] = exts;

    // extension -> mime

    for (const extension of exts) {
      if (types[extension]) {
        const from = preference.indexOf(mimeDB[types[extension]].source);
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
