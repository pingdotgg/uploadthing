import type { Config } from 'tailwindcss';

export const withUt = (twConfig: Config) => {
    // content can be an object. should add logic for that as well
    if (Array.isArray(twConfig.content)) {
        twConfig.content.push(
            './node_modules/@uploadthing/react/src/**',
        );
    }

    return twConfig;
}