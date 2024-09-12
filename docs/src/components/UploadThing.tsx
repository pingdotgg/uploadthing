'use client'

import {
  generateUploadButton,
  generateUploadDropzone,
} from '@uploadthing/react'
import type { UploadRouter } from '@/app/(api)/api/uploadthing/route'

export const UploadButton = generateUploadButton<UploadRouter>()
export const UploadDropzone = generateUploadDropzone<UploadRouter>()
