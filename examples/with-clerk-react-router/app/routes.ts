import { route, type RouteConfig } from "@react-router/dev/routes";

export default [
  route("/", "./routes/_index.tsx"),
  route("/api/uploadthing", "./routes/api.uploadthing.ts"),
] satisfies RouteConfig;
