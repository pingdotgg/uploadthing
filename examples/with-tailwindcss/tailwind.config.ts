import { fontFamily } from "tailwindcss/defaultTheme";

import { withUt } from "uploadthing/tw";

/**
 * @see https://docs.uploadthing.com/theming#with-tailwindcss
 */
export default withUt({
  content: ["src/**/*.tsx"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
      },
    },
  },
});
