/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}", "./node_modules/flowbite/**/*.js"],
  theme: {
    extend: {
      // Palette of the salon website, so the panel and the site look like one product
      colors: {
        gold: {
          DEFAULT: "#C59D5F",
          light: "#D9B98A",
        },
        silver: "#BEBEBE",
        muted: "#ADADAD",
        surface: {
          DEFAULT: "#0D0D0D",
          sunken: "#000000",
          raised: "#161616",
          hover: "#222222",
        },
        line: "rgb(197 157 95 / 0.2)",
      },
      // Bare `border` classes get the gold hairline instead of light grey
      borderColor: {
        DEFAULT: "rgb(197 157 95 / 0.2)",
      },
      fontFamily: {
        sans: ['"Roboto Condensed"', "sans-serif"],
        exo: ["Exo", "sans-serif"],
      },
    },
  },
  plugins: [require("flowbite/plugin")],
};
