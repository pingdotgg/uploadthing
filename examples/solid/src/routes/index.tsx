/* eslint-disable react/no-unknown-property */
/* eslint-disable react/jsx-filename-extension */
/* eslint-disable react/react-in-jsx-scope */
/* eslint-disable arrow-body-style */
/* eslint-disable react/function-component-definition */
import type { VoidComponent } from 'solid-js';

import '@uploadthing/solid/styles.css';

import { Uploader } from '~/utils/uploadthing.ts';

const Home: VoidComponent = () => {
  return (
    <main class="flex min-h-screen flex-col items-center justify-center gap-16 p-24">
      <Uploader
        endpoint="withoutMdwr"
        multiple
      />
    </main>
  );
};

export default Home;
