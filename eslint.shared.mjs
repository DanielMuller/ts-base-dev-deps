import js from '@eslint/js';
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import eslintConfigPrettier from 'eslint-config-prettier';
import unicorn from 'eslint-plugin-unicorn';
import globals from 'globals';

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'packages/*/dist/**',
      'packages/*/coverage/**',
      'packages/*/node_modules/**',
      'types/*/dist/**',
      'types/*/coverage/**',
      'types/*/node_modules/**',
    ],
  },
  eslintConfigPrettier,
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    ...js.configs.recommended,
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2024,
      },
      ecmaVersion: 2024,
      sourceType: 'module',
    },
    rules: {
      'no-console': 'error',
      'no-warning-comments': [
        'warn',
        {
          terms: ['eslint-disable', 'eslint-disable-next-line', 'eslint-disable-line'],
          location: 'anywhere',
        },
      ],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        warnOnUnsupportedTypeScriptVersion: false,
      },
      globals: {
        ...globals.node,
        ...globals.es2024,
      },
    },
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@typescript-eslint': ts,
    },
    rules: {
      'linebreak-style': ['error', 'unix'],
      'no-console': 'error',
      'no-warning-comments': [
        'warn',
        {
          terms: ['eslint-disable', 'eslint-disable-next-line', 'eslint-disable-line'],
          location: 'anywhere',
        },
      ],
      'no-case-declarations': 'off',
      '@typescript-eslint/no-require-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'interface',
          format: ['PascalCase'],
        },
        {
          selector: 'function',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
      ],
      '@typescript-eslint/no-inferrable-types': [
        'warn',
        {
          ignoreParameters: true,
        },
      ],
      '@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],
    },
  },
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs', '**/*.ts', '**/*.tsx'],
    plugins: {
      unicorn,
    },
    rules: {
      'unicorn/filename-case': [
        'error',
        {
          cases: { camelCase: true },
          ignore: [
            /^__.*__$/, // Jest __tests__, __mocks__, etc.
          ],
        },
      ],
    },
  },
  {
    ignores: ['coverage/**/*', 'examples/**/*', 'lib/**/*'],
  },
];
