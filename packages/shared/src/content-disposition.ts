const letterToDiacritics = [
  // lowercase letters
  ["b", "ɓƃƅ"],
  ["c", "ƈ"],
  ["d", "đɗƌ"],
  ["f", "ƒ"],
  ["g", "ǥ"],
  ["h", "ħ"],
  ["i", "ı"],
  ["j", "ɉ"],
  ["l", "ł"],
  ["o", "ø"],
  ["p", "ƥ"],

  // uppercase letters
  ["B", "ƁƂƄ"],
  ["C", "Ƈ"],
  ["D", "ĐƊƋ"],
  ["F", "Ƒ"],
  ["G", "Ǥ"],
  ["H", "Ħ"],
  ["J", "Ɉ"],
  ["L", "Ł"],
  ["O", "Ø"],
  ["P", "Ƥ"],

  // special character combinations
  ["AE", "Æ"],
  ["OE", "Œ"],
  ["ae", "æ"],
  ["oe", "œ"],
] as const;

const diacritToLetter = new Map(
  letterToDiacritics.flatMap(([letter, diacritics]) => {
    return diacritics.split("").map((diacrit) => [diacrit, letter]);
  }),
);

function isInRange(char: string, start: number, end: number) {
  const code = char.codePointAt(0);
  return code != null && code >= start && code <= end;
}

function removeDiacritics(char: string) {
  // Basic Latin letters (no diacritics)
  if (isInRange(char, 65, 90) || isInRange(char, 97, 122)) {
    return char;
  }

  // Composed character base form
  const normalized = char.normalize("NFKD").charAt(0);
  if (normalized.match(/[A-Za-z]/)) {
    return normalized;
  }

  // Special case for diacritics
  if (diacritToLetter.has(normalized)) {
    return diacritToLetter.get(normalized);
  }

  // Fallback to original character
  return char;
}

export const ValidContentDispositions = ["inline", "attachment"] as const;
export type ContentDisposition = (typeof ValidContentDispositions)[number];

/**
 * Construct content-disposition header according to RFC 6266 section 4.1
 * https://www.rfc-editor.org/rfc/rfc6266#section-4.1
 *
 * @example
 * contentDisposition("inline", 'my "special" file,name.pdf');
 * // => "inline; filename="my \"special\" file\,name.pdf"; filename*=UTF-8''my%20%22special%22%20file%2Cname.pdf"
 *
 * @example
 * contentDisposition("inline", "CartaÌƒo");
 * // => "inline; filename="CartaIfo"; filename*=UTF-8''Carta%C3%AC%C3%B2o"
 */
export function contentDisposition(
  contentDisposition: ContentDisposition,
  fileName: string,
) {
  // Normalize the filename to composed form (NFC)
  const normalizedFileName = fileName; // .normalize("NFC");

  // Encode the filename for the legacy parameter. MUST use US-ASCII characters only
  const legacyFileName = normalizedFileName
    .split("")
    .map(removeDiacritics)
    .join("")
    .replace(/[",\\']/g, "\\$&");

  // UTF-8 encode for the extended parameter (RFC 5987)
  const utf8FileName = encodeURIComponent(normalizedFileName)
    .replace(/[')(]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/\*/g, "%2A");

  return [
    contentDisposition,
    `filename="${legacyFileName}"`,
    `filename*=UTF-8''${utf8FileName}`,
  ].join("; ");
}
