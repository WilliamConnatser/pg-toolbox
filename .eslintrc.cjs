/** @type {import("eslint").Linter.Config} */
module.exports = {
  // Define environments the code is expected to run in
  env: {
    node: true, // Node.js environment
    es2021: true, // ECMAScript 2021 features
  },
  // Extend configurations from recommended sets
  extends: [
    "eslint:recommended", // Basic recommended ESLint rules
    "plugin:@typescript-eslint/recommended", // TypeScript-specific linting rules
    "plugin:@typescript-eslint/recommended-requiring-type-checking", // TypeScript rules requiring type info
    "plugin:prettier/recommended", // Ensures Prettier rules override ESLint rules
  ],
  // Parser and parser options
  parser: "@typescript-eslint/parser", // Parses TypeScript code
  parserOptions: {
    project: ["./tsconfig.json"], // Points to tsconfig.json for type-checking
    sourceType: "module", // Ensures ES module syntax is supported
    ecmaVersion: 2021, // Specifies the ECMAScript version (2021)
  },
  // Plugins for additional rules and configurations
  plugins: [
    "@typescript-eslint", // Lints TypeScript code
    "prettier", // Ensures code formatting rules are enforced
    "import", // Lints import/export syntax
  ],
  // Custom rules to enforce best practices
  rules: {
    "prettier/prettier": ["error", { endOfLine: "auto" }], // Integrates Prettier for consistent code formatting
    "@typescript-eslint/explicit-module-boundary-types": "warn", // Encourages defining return types for functions
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^ignored" },
    ], // Warns about unused variables, ignoring those prefixed with _ or ignored
    "@typescript-eslint/no-explicit-any": "error", // Disallows usage of the any type
    "@typescript-eslint/consistent-type-definitions": ["error", "interface"], // Enforces consistent usage of interface for type definitions
    "@typescript-eslint/explicit-function-return-type": [
      "error",
      { allowExpressions: true, allowTypedFunctionExpressions: true },
    ], // Enforces explicit return types, with allowances for certain expressions
    "@typescript-eslint/no-floating-promises": "error", // Ensures proper handling of promises
    "@typescript-eslint/no-misused-promises": "error", // Ensures proper handling of promises
    "@typescript-eslint/no-unnecessary-type-assertion": "error", // Disallows unnecessary type assertions
    "@typescript-eslint/no-non-null-assertion": "error", // Disallows using non-null assertions
    "@typescript-eslint/consistent-type-imports": [
      "error",
      { prefer: "type-imports" },
    ], // Enforces consistent usage of type imports
    "@typescript-eslint/array-type": ["error", { default: "array-simple" }], // Enforces the use of array types using the shorthand syntax
    "@typescript-eslint/prefer-optional-chain": "error", // Enforces the use of optional chaining
    "@typescript-eslint/prefer-nullish-coalescing": [
      "error",
      { ignoreConditionalTests: true, ignoreMixedLogicalExpressions: true },
    ], // Enforces the use of nullish coalescing
    "@typescript-eslint/prefer-ts-expect-error": "error", // Enforces the use of ts-expect-error over ts-ignore
    "@typescript-eslint/no-inferrable-types": "error", // Disallows explicit type declarations that can be inferred
    "@typescript-eslint/no-var-requires": "error", // Disallows the use of require statements except in import statements
    "@typescript-eslint/prefer-readonly": "error", // Requires that private members are marked as readonly if they are never modified outside of the constructor
    "@typescript-eslint/no-for-in-array": "error", // Disallows iterating over an array with a for-in loop
    "no-console": "warn", // Warns about the use of console.log
    "no-debugger": "error", // Disallows the use of debugger
    curly: "error", // Enforces consistent brace style for all control statements
    eqeqeq: ["error", "always"], // Enforces the use of === and !==
    "no-implicit-coercion": ["error", { boolean: false }], // Disallows shorthand type conversions, with exceptions for booleans
    "no-throw-literal": "error", // Disallows throwing literals as exceptions
    "prefer-const": "error", // Enforces the use of const for variables that are never reassigned
    "no-var": "error", // Disallows the use of var, encouraging let and const instead
    "prefer-rest-params": "error", // Enforces the use of rest parameters over arguments
    "prefer-spread": "error", // Enforces the use of spread syntax
    "object-shorthand": ["error", "always"], // Enforces the use of shorthand syntax for object properties
    "no-duplicate-imports": "error", // Disallows duplicate imports
    "no-restricted-syntax": [
      "error",
      {
        selector: "TSEnumDeclaration",
        message: "Don't declare enums. Use union types instead.",
      },
    ], // Disallows the use of enums, encouraging union types instead
    "import/order": [
      "error",
      { groups: [["builtin", "external", "internal"]] },
    ], // Enforces a consistent import order
    "import/no-default-export": "error", // Disallows default exports in favor of named exports
    "import/no-extraneous-dependencies": [
      "error",
      { devDependencies: ["**/*.test.ts", "**/*.spec.ts"] },
    ], // Disallows the use of extraneous dependencies
  },
  // Settings for resolving TypeScript imports
  settings: {
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true, // Always try to resolve types
        project: "./tsconfig.json", // Project configuration file
      },
    },
  },
};
