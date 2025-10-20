/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}", "./node_modules/flowbite/**/*.js"],
  theme: {
    extend: {
      colors: {
        primary: "#1D4ED8",
        secondary: "#64748B",
        lighter: "#fffaf5",
        darker: "#fde0bd",
        normal: "#ea5d0f"
      },
    },
  },
  plugins: [require("flowbite/plugin")],
};
