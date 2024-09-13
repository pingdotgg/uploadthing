"use client";

import type { UploadRouter } from "@/app/(api)/api/uploadthing/route";

import {
  generateUploadButton,
  generateUploadDropzone,
} from "@uploadthing/react";

export const UploadButton = generateUploadButton<UploadRouter>();
export const UploadDropzone = generateUploadDropzone<UploadRouter>();
