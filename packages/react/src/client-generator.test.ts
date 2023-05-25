import { createUploadthing } from "uploadthing/server";
import { it } from "vitest";

import { generateReactHelpers } from "./useUploadThing";

const badReqMock = {
  headers: {
    get(key: string) {
      if (key === "header1") return "woohoo";
      return null;
    },
  },
} as unknown as Request;

it("typeerrors for invalid input", async () => {
  const f = createUploadthing();

  const exampleRoute = f(["image"])
    .middleware(() => ({ foo: "bar" }))
    .onUploadComplete(({ metadata }) => {
      console.log(metadata);
    });

  const router = { exampleRoute };

  const { useUploadThing } = generateReactHelpers<typeof router>();

  try {
    // @ts-expect-error - Argument of type '"bad route"' is not assignable to parameter of type '"exampleRoute"'.ts(2345)
    useUploadThing({ endpoint: "bad route" });

    // Type should be good here since this is the route name
    useUploadThing({ endpoint: "exampleRoute" });
  } catch (e) {
    // Hooks errors
  }
});
