import { createRouteHandler, createUploadthing } from "uploadthing/next-legacy";

const f = createUploadthing();
const router = {
  mockRoute: f(["image"])
    .middleware(() => {
      throw new Error("This is just a mock route, you cant use it");
      return {};
    })
    .onUploadComplete(() => {}),
};

export default createRouteHandler({
  router,
  config: {
    uploadthingToken:
      "eyJhcHBJZCI6ImFwcC0xIiwiYXBpS2V5Ijoic2tfZm9vIiwicmVnaW9ucyI6WyJmcmExIl19",
  },
});
