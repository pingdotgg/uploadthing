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
  config: { uploadthingSecret: "sk_foo" },
});
