import cors from "cors";

import "dotenv/config";

import express from "express";

import { createRouteHandler } from "uploadthing/express";

import { uploadRouter } from "./router";

const app = express();
app.use(cors());
app.get("/api", (req, res) => res.send("Hello from Express!"));

app.use(
  "/api/uploadthing",
  createRouteHandler({
    router: uploadRouter,
  }),
);

app.listen(3000, () => {
  console.log("listening on port 3000");
});
