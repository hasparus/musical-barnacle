const { register } = require("esbuild-register/dist/node");

register({
  jsxFactory: "jsx",
  target: "es2020",
});

const extensions = ["ts", "tsx"];

module.exports = {
  require: [
    "tsconfig-paths/register",
    "global-jsdom/register",
    "ignore-styles",
    "./test/mocha-hooks.ts",
  ],
  file: ["./test/setup.ts"],
  extension: extensions,
  watchExtensions: extensions,
  spec: ["src/**/*.test.{ts,tsx}"],
  timeout: 5000,
  exit: true,
};
