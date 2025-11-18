import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'node_modules']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
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
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
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
      '@typescript-eslint/no-unused-vars': ['error', { 
        varsIgnorePattern: '^[A-Z_]',
        argsIgnorePattern: '^_'
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
// NOTE: @axel please review and determine if this is neccessary and sufficent: 
    // Restricted imports for selection safety
      // This rule set is intentionally targeted via overrides below to prevent
      // UI/agent code from importing action-only or plugin-internal helpers that
      // should only be used from the plugin endpoints. Keep these guarded to
      // reduce risk of selection-related crashes.
    },
  },
  // Apply targeted import restrictions to enforce read-only vs action-only imports
  {
    files: ['src/assets/**', 'src/components/**', 'src/stores/**', 'src/assets/**/index.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: '@/plugin/actionSelection', message: 'actionSelection is action-only. Use plugin endpoints (GET_SELECTION_INFO / RESIZE) from UI/agents instead.' },
            { name: 'src/plugin/actionSelection', message: 'actionSelection is action-only. Use plugin endpoints (GET_SELECTION_INFO / RESIZE) from UI/agents instead.' },
            { name: '../plugin/actionSelection', message: 'actionSelection is action-only. Use plugin endpoints (GET_SELECTION_INFO / RESIZE) from UI/agents instead.' },
          ],
        },
      ],
    },
  },
  {
    files: ['src/plugin/actionSelection.ts'],
    // Prevent action-selection code from accidentally importing read-only helpers
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: '@/plugin/selectionHelpers', message: 'Do not import readSelectionInfo inside actionSelection. It is read-only and should not be used to perform mutations.' },
            { name: 'src/plugin/selectionHelpers', message: 'Do not import readSelectionInfo inside actionSelection. Use mainHandlers GET_SELECTION_INFO instead.' },
            { name: '../plugin/selectionHelpers', message: 'Do not import readSelectionInfo inside actionSelection. Use mainHandlers GET_SELECTION_INFO instead.' },
          ],
        },
      ],
    },
  },
])
