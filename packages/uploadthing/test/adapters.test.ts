import { createApp, H3Event, toWebHandler } from "h3";
import { describe, expect, expectTypeOf, it } from "vitest";

import {
  baseHeaders,
  createApiUrl,
  fetchMock,
  mockExternalRequests,
  noop,
} from "./__test-helpers";

describe("h3", async () => {
  const { createUploadthing, createRouteHandler } = await import("../src/h3");
  const f = createUploadthing();

  const router = {
    middleware: f({ blob: {} })
      .middleware((opts) => {
        expect(opts.req).toBeUndefined();
        expectTypeOf<undefined>(opts.req);

        expect(opts.event).toBeInstanceOf(H3Event);
        expectTypeOf<H3Event>(opts.event);

        expect(opts.res).toBeUndefined();
        expectTypeOf<undefined>(opts.res);

        //   expect(opts.input).toBeUndefined();
        expectTypeOf<undefined>(opts.input);

        return {};
      })
      .onUploadComplete(noop),
  };

  const eventHandler = createRouteHandler({
    router,
    config: {
      uploadthingSecret: "sk_live_test",
      fetch: mockExternalRequests(),
    },
  });

  it("gets expected arguments in middleware", async () => {
    // FIXME: Didn't know how to declaratively create a H3Event to
    // call the handler with directly, so I used the web-handler converter
    // and sent in a Request and let H3 create one for me 🤷‍♂️
    await toWebHandler(createApp().use(eventHandler))(
      new Request(createApiUrl("middleware", "upload"), {
        method: "POST",
        headers: baseHeaders,
        body: JSON.stringify({
          files: [{ name: "foo.txt", size: 48 }],
        }),
      }),
    );

    // Should proceed to have requested URLs
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://uploadthing.com/api/prepareUpload",
      {
        body: '{"files":[{"name":"foo.txt","size":48}],"routeConfig":{"blob":{"maxFileSize":"8MB","maxFileCount":1,"contentDisposition":"inline"}},"metadata":{},"callbackUrl":"https://not-used.com/","callbackSlug":"middleware"}',
        headers: {
          "Content-Type": "application/json",
          "x-uploadthing-api-key": "sk_live_test",
          "x-uploadthing-be-adapter": "h3",
          "x-uploadthing-fe-package": "vitest",
          "x-uploadthing-version": "6.4.1",
        },
        method: "POST",
      },
    );
  });
});
