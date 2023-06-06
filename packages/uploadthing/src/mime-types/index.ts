/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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
import { mimeDB } from "./db";
import type { MimeObject, MimeType } from "./db";

function extname(path: string) {
  const index = path.lastIndexOf(".");
  return index < 0 ? "" : path.substring(index);
}

export const extensions = Object.create(null);
export const types = Object.create(null);

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

  return types[extension] || false;
}

/**
 * Populate the extensions and types maps.
 * @private
 */

function populateMaps(
  extensions: Record<string, unknown>,
  types: Record<string, string>,
) {
  // source preference (least -> most)
  const preference = ["nginx", "apache", undefined, "iana"];

  Object.keys(mimeDB).forEach(function forEachMimeType(type) {
    const mime = mimeDB[type as MimeType] as unknown as MimeObject;
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
          (mimeDB[types[extension] as MimeType] as unknown as MimeObject)
            .source,
        );
        const to = preference.indexOf(mime.source);

        if (
          types[extension] !== "application/octet-stream" &&
          (from > to ||
            (from === to && types[extension].substr(0, 12) === "application/"))
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
