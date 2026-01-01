module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: "eslint:recommended",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  rules: {
    // Possible Errors
    "no-console": "off", // Allow console for server logs
    "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],

    // Best Practices
    eqeqeq: ["error", "always"],
    "no-eval": "error",
    "no-implied-eval": "error",
    "no-var": "error",
    "prefer-const": "warn",

    // Style
    indent: ["error", 2],
    quotes: ["error", "double"],
    semi: ["error", "always"],
    "comma-dangle": ["error", "always-multiline"],

    // ES6
    "arrow-spacing": "error",
    "no-duplicate-imports": "error",
  },
};
