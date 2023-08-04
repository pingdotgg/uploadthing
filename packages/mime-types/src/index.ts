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
import { mimeTypes as mimeDB } from './db.ts';
import type { FileExtension, MimeType } from './db';

function extname(path: string) {
  const index = path.lastIndexOf('.');
  return index < 0 ? '' : path.substring(index);
}

export const extensions = {} as Record<MimeType, FileExtension[]>;
export const types = {} as Record<FileExtension, MimeType>;

/**
 * Lookup the MIME type for a file path/extension.
 *
 * @param {string} path
 * @return {boolean|string}
 */
export function lookup(path: string) {
  if (!path || typeof path !== 'string') {
    return false;
  }

  // get the extension ("ext" or ".ext" or full path)
  const extension = extname(`x.${path}`)
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
  extensionsArgument: Record<MimeType, FileExtension[]>,
  typesArgument: Record<FileExtension, MimeType>,
) {
  const extensionsReference = extensionsArgument;
  const typesReference = typesArgument;
  // source preference (least -> most)
  const preference = ['nginx', 'apache', undefined, 'iana'];

  (Object.keys(mimeDB) as MimeType[]).forEach((type) => {
    const mime = mimeDB[type];
    const exts = mime.extensions;

    if (!exts || !exts.length) {
      return;
    }

    // mime -> extensions
    extensionsReference[type] = exts;

    // extension -> mime
    for (let i = 0; i < exts.length; i += 1) {
      const extension = exts[i];

      let shouldContinue = false;
      if (typesArgument[extension]) {
        const from = preference.indexOf(mimeDB[typesArgument[extension]].source);
        const to = preference.indexOf(mime.source);

        if (
          typesArgument[extension] !== 'application/octet-stream'
          && (from > to
            || (from === to
              && typesArgument[extension].substring(0, 12) === 'application/'))
        ) {
          // skip the remapping
          shouldContinue = true;
        }
      }

      // set the extension -> mime
      if (!shouldContinue) {
        typesReference[extension] = type;
      }
    }
  });
}

// Populate the extensions/types maps
populateMaps(extensions, types);
