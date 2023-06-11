import { it } from "vitest";

import { createUploadthing } from "uploadthing/server";

import { generateReactHelpers } from "./useUploadThing";

it("typeerrors for invalid input", () => {
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
