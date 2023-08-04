/* eslint-disable react/react-in-jsx-scope */
/* eslint-disable react/jsx-filename-extension */
import { UploadButton } from '@uploadthing/react';

import type { OurFileRouter } from '~/server/uploadthing';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <UploadButton<OurFileRouter> endpoint="withMdwr" />
    </main>
  );
}
