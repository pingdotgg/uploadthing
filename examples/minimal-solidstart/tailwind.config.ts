import { withUt } from "uploadthing/tw";

export default withUt({
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./node_modules/@uploadthing/solid/dist/**/*.js", // Remove this once #975 is resolved
  ],
  theme: {
    extend: {},
  },
  plugins: [],
});
