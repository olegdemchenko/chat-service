module.exports = {
  env: {
    node: true,
    es2020: true,
  },
  extends: [
    "airbnb-base",
    "airbnb-typescript/base",
    "plugin:node/recommended",
    "plugin:@typescript-eslint/recommended-type-checked",
    "plugin:@typescript-eslint/stylistic-type-checked",
    "plugin:prettier/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    project: "./tsconfig.json",
  },
  settings: {
    node: {
      tryExtensions: [".js", ".json", ".node", ".ts"],
    },
  },
  plugins: ["@typescript-eslint", "prettier"],
  root: true,
  rules: {
    "node/no-unsupported-features/es-syntax": [
      "error",
      { ignores: ["modules"] },
    ],
    "consistent-return": ["warn"],
    "class-methods-use-this": ["warn"],
    "@typescript-eslint/no-unsafe-call": ["off"],
    "@typescript-eslint/no-misused-promises": ["off"],
    "import/prefer-default-export": ["off"],
    "no-param-reassign": ["warn"],
    "no-underscore-dangle": ["off"]
  },
};
