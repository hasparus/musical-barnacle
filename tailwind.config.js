const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  purge: ["./index.html", "./src/**/*.svelte"],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter var", ...defaultTheme.fontFamily.sans],
      },
    },
    animation: {
      spin: "spin 2s linear infinite",
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
