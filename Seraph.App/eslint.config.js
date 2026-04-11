// @ts-check
const tseslint = require('typescript-eslint');
const reactPlugin = require('eslint-plugin-react');
const reactHooksPlugin = require('eslint-plugin-react-hooks');
const importPlugin = require('eslint-plugin-import');
const prettierConfig = require('eslint-config-prettier');
const prettierPlugin = require('eslint-plugin-prettier');

module.exports = tseslint.config(
  // Base ignores
  {
    ignores: [
      '**/node_modules/**',
      'android/**',
      'ios/**',
      '.expo/**',
      'dist/**',
      'build/**',
      'eslint.config.js',
      'babel.config.js',
      'metro.config.js',
      'plugins/**',
      'drizzle/**',
    ],
  },

  // TypeScript strict
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      import: importPlugin,
      prettier: prettierPlugin,
    },
    settings: {
      react: { version: '19.1.0' },
    },
    rules: {
      // Prettier as an ESLint rule — formatting violations are errors
      'prettier/prettier': 'error',

      // ── React ──────────────────────────────────────────────────────────────
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/display-name': 'error',
      'react/no-unused-prop-types': 'error',
      'react/no-array-index-key': 'warn',
      'react/jsx-no-useless-fragment': 'error',
      'react/self-closing-comp': 'error',
      'react/jsx-boolean-value': ['error', 'never'],
      'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],

      // ── React Hooks ────────────────────────────────────────────────────────
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',

      // ── TypeScript strict ──────────────────────────────────────────────────
      '@typescript-eslint/no-require-imports': [
        'error',
        { allow: ['\\.png$', '\\.jpg$', '\\.gif$', '\\.svg$'] },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',

      // ── Imports ────────────────────────────────────────────────────────────
      'import/no-duplicates': 'error',
      // import/no-cycle omitted — traverses all node_modules (inc. Flow-typed RN) and is too slow
      'import/first': 'error',
      'import/newline-after-import': 'error',

      // ── General quality ────────────────────────────────────────────────────
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-nested-ternary': 'error',
    },
  },

  // Prettier config disables any ESLint rules that conflict with formatting
  prettierConfig,
);
