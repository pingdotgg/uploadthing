import { defineConfig } from 'tsup';

import { config } from '@uploadthing/tsup-config';

export default defineConfig((opts) => ({
  ...config,
  entry: ['./src/index.ts', './src/hooks.ts'],
  clean: !opts.watch,
  esbuildOptions: (option) => {
    const myOption = option;
    myOption.banner = {
      js: '"use client";',
    };
  },
}));
