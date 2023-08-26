import "dotenv/config";

import cors from "cors";
import express from "express";

import * as utExpress from "uploadthing/express";

import { uploadRouter } from "./uploadthing";

const app = express();

app.use(cors());

app.use(
  "/api/uploadthing",
  utExpress.createExpressRouter({
    router: uploadRouter,
  }),
);

app.listen(3000, () => {
  console.log("listening on port 3000");
});
