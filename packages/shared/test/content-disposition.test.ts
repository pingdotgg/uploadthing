import * as Http from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { contentDisposition } from "../src/content-disposition";

describe("contentDisposition", () => {
  let assertFetchable: (cd: string) => Promise<void>;
  let server: Http.Server;

  beforeAll(() => {
    server = Http.createServer((req, res) => res.end("Hello World")).listen(0);
    assertFetchable = async (cd: string) => {
      await expect(
        fetch(`http://localhost:${(server.address() as AddressInfo).port}`, {
          headers: {
            "Content-Disposition": cd,
          },
        }),
      ).resolves.toBeDefined();
    };
  });
  afterAll(() => {
    server.close();
  });

  it("handles filenames with special characters", async () => {
    const result = contentDisposition("inline", 'my "special" file,name.pdf');
    expect(result).toBe(
      'inline; filename="my \\"special\\" file\\,name.pdf"; filename*=UTF-8\'\'my%20%22special%22%20file%2Cname.pdf',
    );
    await assertFetchable(result);
  });

  it("handles filenames with unicode characters", async () => {
    const result = contentDisposition(
      "attachment",
      "3$ Mù FRANçé_33902_Country_5_202105",
    );
    expect(result).toBe(
      "attachment; filename=\"3$ Mu FRANce_33902_Country_5_202105\"; filename*=UTF-8''3%24%20M%C3%B9%20FRAN%C3%A7%C3%A9_33902_Country_5_202105",
    );
    await assertFetchable(result);
  });

  it("handles simple filenames", async () => {
    const result = contentDisposition("attachment", "simple.txt");
    expect(result).toBe(
      "attachment; filename=\"simple.txt\"; filename*=UTF-8''simple.txt",
    );
    await assertFetchable(result);
  });

  // regresssion: https://x.com/PauloMenzs/status/1874075207436296693
  it("handles decomposed unicode characters", async () => {
    // "CartaÌƒo" (decomposed) should be normalized to "Cartão" (composed)
    const result = contentDisposition(
      "attachment",
      "C6 - CartaÌƒo - Novembro.zip.csv",
    );

    expect(result).toBe(
      "attachment; filename=\"C6 - CartaIfo - Novembro.zip.csv\"; filename*=UTF-8''C6%20-%20Carta%C3%8C%C6%92o%20-%20Novembro.zip.csv",
    );
    await assertFetchable(result);
  });
});
