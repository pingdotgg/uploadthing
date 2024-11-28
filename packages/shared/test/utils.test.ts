import { describe, expect, it } from "vitest";

import { contentDisposition } from "../src";

describe("contentDisposition", () => {
  it("handles filenames with special characters", () => {
    const result = contentDisposition("inline", 'my "special" file,name.pdf');
    expect(result).toBe(
      'inline; filename="my \\"special\\" file\\,name.pdf"; filename*=UTF-8\'\'my%20%22special%22%20file%2Cname.pdf',
    );
  });

  it("handles filenames with unicode characters", () => {
    const result = contentDisposition(
      "attachment",
      "3$ Mù FRANçé_33902_Country_5_202105",
    );
    expect(result).toBe(
      "attachment; filename=\"3$ Mù FRANçé_33902_Country_5_202105\"; filename*=UTF-8''3%24%20M%C3%B9%20FRAN%C3%A7%C3%A9_33902_Country_5_202105",
    );
  });

  it("handles simple filenames", () => {
    const result = contentDisposition("attachment", "simple.txt");
    expect(result).toBe(
      "attachment; filename=\"simple.txt\"; filename*=UTF-8''simple.txt",
    );
  });
});
