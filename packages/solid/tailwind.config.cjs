const colors = require("tailwindcss/colors");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  prefix: "ut-",
  theme: {
    fontFamily: {
      display: ["Inter"],
    },
    boxShadow: {
      sm: "0 1px 2px 0 rgb(0 0 0 / 0.15)",
      DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)",
      md: "0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)",
      lg: "0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.3)",
      xl: "0 20px 25px -5px rgb(0 0 0 / 0.3), 0 8px 10px -6px rgb(0 0 0 / 0.3)",
      "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.75)",
      inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.15)",
    },
    extend: {
      colors: {
        truegray: colors.neutral,
        red: colors.rose,
        gray: {
          ...colors.zinc,
          750: "#333338",
          850: "#202023",
          950: "#0C0C0E",
        },
        pink: {
          50: "#FEE6F0",
          100: "#FDCDE1",
          200: "#F1A5C6",
          300: "#ED8AB5",
          400: "#E96EA4",
          500: "#E24A8D",
          600: "#DB1D70",
          700: "#C01A62",
          800: "#A41654",
          900: "#6E0F38",
        },
      },
      fontSize: {
        xxs: ".6rem",
      },
      keyframes: {
        "fade-in-down": {
          "0%": {
            opacity: "0",
            transform: "translateY(-10px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "fade-in-left": {
          "0%": {
            opacity: "0",
            transform: "translateX(10px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateX(0)",
          },
        },
        "fade-in": {
          "0%": {
            opacity: "0",
          },
          "100%": {
            opacity: "1",
          },
        },
      },
      brightness: {
        25: ".25",
      },
      plugins: [require("@tailwindcss/forms")],
    },
  },
};
