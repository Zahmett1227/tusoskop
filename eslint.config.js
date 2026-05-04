import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    'dist',
    '(dist)',
    'functions',
    '.vite-cache',
    'src/data/questionChunks',
    'playwright-report',
    'test-results',
    'backups',
    'temp-build',
    'temp-build-2',
    'src/data/questions.js',
  ]),
  {
    files: [
      'vite.config.js',
      'playwright.config.js',
      'eslint.config.js',
      'scripts/**/*.{js,mjs}',
    ],
    languageOptions: {
      globals: globals.node,
      ecmaVersion: 2022,
      sourceType: 'module',
    },
  },
  {
    files: ['e2e/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        test: 'readonly',
        expect: 'readonly',
      },
    },
  },
  {
    files: ['**/*.{js,jsx}'],
    ignores: [
      'vite.config.js',
      'playwright.config.js',
      'eslint.config.js',
      'e2e/**/*.js',
      'scripts/**/*.{js,mjs}',
    ],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    files: ['**/*.{test,spec}.{js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.vitest,
      },
    },
  },
])
