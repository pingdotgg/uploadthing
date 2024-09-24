import { withUt } from "uploadthing/tw";

/** @type {import('tailwindcss').Config} */
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
