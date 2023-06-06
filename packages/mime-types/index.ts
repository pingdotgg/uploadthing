/* eslint-disable @typescript-eslint/no-unsafe-argument */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */

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
import { mimeDB, mimeTypes } from "./db";
import type { FileExtension, MimeType } from "./db";

export type * from "./db";

function extname(path: string) {
  const index = path.lastIndexOf(".");
  return index < 0 ? "" : path.substring(index);
}

export const extensions = Object.create(null);
export const types: Record<FileExtension, string> = Object.create(null);

// Populate the extensions/types maps
populateMaps(extensions, types);

/**
 * Lookup the MIME type for a file path/extension.
 *
 * @param {string} path
 * @return {boolean|string}
 */
export function lookup(path: string): string | false {
  if (!path || typeof path !== "string") {
    return false;
  }

  // get the extension ("ext" or ".ext" or full path)
  const extension = extname("x." + path)
    .toLowerCase()
    .substring(1);

  if (!extension) {
    return false;
  }

  return types[extension as FileExtension] || false;
}

/**
 * Populate the extensions and types maps.
 * @private
 */

function populateMaps(
  extensions: Record<string, unknown>,
  types: Record<FileExtension, string>,
) {
  // source preference (least -> most)
  const preference = ["nginx", "apache", undefined, "iana"];

  mimeTypes.forEach(function forEachMimeType(type) {
    const mime = mimeDB[type];
    const exts = mime.extensions;

    if (!exts || !exts.length) {
      return;
    }

    // mime -> extensions
    extensions[type] = exts;

    // extension -> mime
    for (let i = 0; i < exts.length; i++) {
      const extension = exts[i];

      if (types[extension]) {
        const from = preference.indexOf(
          // @ts-expect-error - whatever
          mimeDB[types[extension] as MimeType].source,
        );
        const to = preference.indexOf(
          // @ts-expect-error - whatever
          mime.source,
        );

        if (
          types[extension] !== "application/octet-stream" &&
          (from > to ||
            (from === to &&
              types[extension].substring(0, 12) === "application/"))
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
