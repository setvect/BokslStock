module.exports = {
  parserOptions: {
    parser: "@typescript-eslint/parser",
  },
  plugins: ["vue", "@typescript-eslint"],
  extends: [
    "plugin:@typescript-eslint/recommended",
    "plugin:vue/recommended",
    "plugin:prettier/recommended"
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    "vue/max-attributes-per-line": ["error", {
      "singleline": 10,
    }],
    "no-console": "warn",
    "vue/singleline-html-element-content-newline": ["off"],
    "vue/html-self-closing": ["off"],
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto',
      },
    ],
  },
};