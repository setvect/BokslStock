module.exports = {
  root: true,
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: ["eslint:recommended", "plugin:vue/essential", "plugin:@typescript-eslint/eslint-recommended"],
  globals: {
    __static: true,
    Swal: true,
    $: true,
    moment: true,
    CommonUtil: true,
    VueUtil: true,
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module",
    parser: "babel-eslint",
  },
  plugins: ["standard", "vue"],
  rules: {
    indent: ["error", 2],
    "comma-dangle": [
      "error",
      {
        arrays: "never",
        objects: "always",
        imports: "never",
        exports: "never",
        functions: "never",
      },
    ],
    "no-unused-vars": "warn", // off, error
    "space-before-function-paren": ["error", "never"],
    semi: ["error", "always"],
    "comma-spacing": [
      "error",
      {
        before: false,
        after: true,
      },
    ],
    "space-in-parens": ["error", "never"],
    "no-multi-spaces": "error",
    "no-trailing-spaces": "error",
    "no-whitespace-before-property": "error",
    "space-before-blocks": "error",
    "space-infix-ops": [
      "error",
      {
        int32Hint: false,
      },
    ],
    "spaced-comment": [
      "error",
      "always",
      {
        exceptions: ["-", "+"],
      },
    ],
    "block-spacing": "error",
    "object-curly-spacing": ["error", "always"],
    "no-console": "warn",
    quotes: ["error", "double"],
    "arrow-parens": ["error", "always"]

    // 'no-whitespace-before-property': "error",
  },
};