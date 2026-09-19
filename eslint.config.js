//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'
import eslintPluginBetterTailwindcss from 'eslint-plugin-better-tailwindcss'
import stylistic from '@stylistic/eslint-plugin'
import simpleImportSort from 'eslint-plugin-simple-import-sort'

export default [
  ...tanstackConfig,
  eslintPluginBetterTailwindcss.configs.recommended,
  stylistic.configs.recommended,
  {
    settings: {
      'better-tailwindcss': {
        // tailwindcss 4: the path to the entry file of the css based tailwind config (eg: `src/global.css`)
        entryPoint: 'src/styles.css',
      },
    },
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'import/no-cycle': 'off',
      'import/order': 'off',
      'sort-imports': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/require-await': 'off',
      'pnpm/json-enforce-catalog': 'off',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: true }],
      '@stylistic/comma-dangle': [
        'error',
        {
          arrays: 'always-multiline',
          objects: 'always-multiline',
          functions: 'never',
        },
      ],
      '@stylistic/jsx-one-expression-per-line': 'off',
    },
  },
  {
    ignores: ['eslint.config.js', 'prettier.config.js'],
  },
]
