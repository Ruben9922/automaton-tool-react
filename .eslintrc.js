module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    "airbnb",
    "airbnb/hooks",
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 13,
    sourceType: "module",
  },
  overrides: [
    {
      extends: [
        "airbnb-typescript",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
      ],
      files: ["*.ts", "*.tsx"], // Your TypeScript files extension
      parserOptions: {
        project: ["./tsconfig.json"], // Specify it only for TypeScript files
      },
      rules: {
        quotes: "off",
        "@typescript-eslint/quotes": ["error", "double"],
        "lines-between-class-members": "off",
        "@typescript-eslint/lines-between-class-members": ["error", "always", { exceptAfterSingleLine: true }],

        // Ignore trailing comma in generics, as it is required to avoid syntax errors in some
        // contexts in .tsx files
        // TODO: Only apply this to .tsx files (not .ts files)
        "comma-dangle": "off",
        "@typescript-eslint/comma-dangle": ["error", {
          arrays: "always-multiline",
          objects: "always-multiline",
          imports: "always-multiline",
          exports: "always-multiline",
          functions: "always-multiline",
          enums: "always-multiline",
          generics: "ignore",
          tuples: "always-multiline",
        }],
      },
    },
  ],
  parser: "@typescript-eslint/parser",
  plugins: [
    "react",
    "@typescript-eslint",
    "only-warn",
  ],
  rules: {
    // Fixing TypeScript stuff
    "import/extensions": [
      "error",
      "ignorePackages",
      {
        js: "never",
        jsx: "never",
        ts: "never",
        tsx: "never",
      },
    ],

    // Custom stuff
    quotes: ["error", "double"],
    "lines-between-class-members": ["error", "always", { exceptAfterSingleLine: true }],
    "react/jsx-one-expression-per-line": "off",
    "max-len": ["error", {
      code: 100,
      ignoreTrailingComments: true,
      ignoreUrls: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true,
      ignoreRegExpLiterals: true,
    }],
    "react/no-array-index-key": "off",
    "no-underscore-dangle": ["error", { allow: ["__"] }],
    "no-param-reassign": "off",
  },
  settings: {
    "import/resolver": {
      node: {
        extensions: [".js", ".jsx", ".ts", ".tsx"],
      },
    },
  },
};
