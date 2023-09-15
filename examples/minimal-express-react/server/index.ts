import cors from "cors";

import "dotenv/config";

import express from "express";

import {
  createUploadthing,
  createUploadthingExpressHandler,
  type FileRouter,
} from "uploadthing/express";

const f = createUploadthing();

const uploadRouter = {
  videoAndImage: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 4,
    },
    video: {
      maxFileSize: "16MB",
    },
  }).onUploadComplete((data) => {
    console.log("upload completed", data);
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;

const app = express();

app.use(cors());

app.use(
  "/api/uploadthing",
  createUploadthingExpressHandler({
    router: uploadRouter,
  }),
);

app.listen(3000, () => {
  console.log("listening on port 3000");
});
