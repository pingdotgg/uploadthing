import "./styles.css";

import * as Vue from "vue";

export { generateUploadButton } from "./components/button";
export { generateUploadDropzone } from "./components/dropzone";
export { generateVueHelpers } from "./useUploadThing";

export type * from "./types";

export { useDropzone } from "@uploadthing/dropzone/vue";
export type * from "@uploadthing/dropzone/vue";

/**
 * Set Vue to global scope in order to make jsxFactory `Vue.h` available
 */
(globalThis as typeof globalThis & { Vue: typeof Vue }).Vue = Vue;
