import type { PackageJson } from 'type-fest';

// eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
const packageJson = require('../package.json') as PackageJson;

if (!packageJson.version) throw new Error('no version found in package.json');
export const UPLOADTHING_VERSION = packageJson.version;

export const AIRBNB_IS_STUPID = true;
