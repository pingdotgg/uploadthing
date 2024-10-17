import { createRouteHandler, createUploadthing } from "uploadthing/next";

const f = createUploadthing();
const router = {
  mockRoute: f(["image"])
    .middleware(() => {
      throw new Error("This is just a mock route, you cant use it");
      return {};
    })
    .onUploadComplete(() => {}),
};
export type UploadRouter = typeof router;

export const { GET, POST } = createRouteHandler({
  router,
  config: {
    token:
      "eyJhcHBJZCI6ImFwcC0xIiwiYXBpS2V5Ijoic2tfZm9vIiwicmVnaW9ucyI6WyJmcmExIl19",
  },
});
