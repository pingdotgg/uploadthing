import * as FileSystem from "expo-file-system";

const BASE64_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/**
 * Binary-safe base64 encoder. Reads the buffer as a Uint8Array in 3-byte
 * groups (each byte masked to 0-255) so we never go through `btoa`/`Blob`
 * APIs that are unreliable with binary data in React Native.
 */
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let result = "";

  for (let i = 0; i < bytes.length; i += 3) {
    const remaining = bytes.length - i;
    const byte1 = (bytes[i] ?? 0) & 0xff;
    const byte2 = remaining > 1 ? (bytes[i + 1] ?? 0) & 0xff : 0;
    const byte3 = remaining > 2 ? (bytes[i + 2] ?? 0) & 0xff : 0;

    result += BASE64_ALPHABET.charAt(byte1 >> 2);
    result += BASE64_ALPHABET.charAt(((byte1 & 0x03) << 4) | (byte2 >> 4));
    result +=
      remaining > 1
        ? BASE64_ALPHABET.charAt(((byte2 & 0x0f) << 2) | (byte3 >> 6))
        : "=";
    result += remaining > 2 ? BASE64_ALPHABET.charAt(byte3 & 0x3f) : "=";
  }

  return result;
};

/**
 * According to React Native's FormData implementation:
 * "a "blob", which in React Native just means an object with a uri attribute"
 * @see https://github.com/facebook/react-native/blob/030663bb0634fc76f811cdc63e4d09e7ca32f3d4/packages/react-native/Libraries/Network/FormData.js#L78C1-L82C48
 */
const assignRNFormDataProperties = (
  file: File,
  properties: { uri: string; type: string; name: string },
): File => Object.assign(file, properties);

export const toRNFormDataFile = async (file: File): Promise<File> => {
  const type = file.type || "application/octet-stream";
  const name = file.name || "upload";
  const fileWithUri = file as File & { uri?: unknown };

  if (typeof fileWithUri.uri === "string") {
    return assignRNFormDataProperties(file, {
      uri: fileWithUri.uri,
      type,
      name,
    });
  }

  const cacheDirectory = FileSystem.cacheDirectory;
  if (!cacheDirectory) {
    throw new Error("Expo FileSystem cache directory is unavailable");
  }

  // Empty path segments should fall back, so `||` is intentional over `??`.
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const basename = name.split(/[\\/]/).pop() || "upload";
  const uri = `${cacheDirectory}${Date.now()}-${Math.random()}-${basename}`;
  await FileSystem.writeAsStringAsync(
    uri,
    arrayBufferToBase64(await file.arrayBuffer()),
    { encoding: FileSystem.EncodingType.Base64 },
  );

  return assignRNFormDataProperties(file, { uri, type, name });
};
