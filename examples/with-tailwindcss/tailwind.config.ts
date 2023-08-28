import { fontFamily } from "tailwindcss/defaultTheme";

import { withUt } from "uploadthing/tw";

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
