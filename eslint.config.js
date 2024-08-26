/// <reference types="./types/eslint.config.d.ts" />

import cSpellPlugin from '@cspell/eslint-plugin';
import { fixupPluginRules } from '@eslint/compat';
import eslintJs from '@eslint/js';
import prettierConfigs from 'eslint-config-prettier';
import { defineFlatConfig } from 'eslint-define-config';
import prettierPlugin from 'eslint-plugin-prettier';
import globals from 'globals';
import { dirname, resolve } from 'path';
import tsEslint from 'typescript-eslint';
import { fileURLToPath } from 'url';

export default defineFlatConfig([
  { ignores: ['**/node_modules/**', '**/dist/**'] },
  {
    files: ['**/*.{,c,m}{j,t}s{,x}'],
    plugins: {
      prettier: fixupPluginRules(prettierPlugin),
      '@cspell': fixupPluginRules(cSpellPlugin),
      '@typescript-eslint': tsEslint.plugin,
    },
    languageOptions: {
      parser: tsEslint.parser,
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.node.json'],
      },
      globals: { ...globals.node },
    },
    rules: {
      ...eslintJs.configs.recommended.rules,
      ...tsEslint.configs.strictTypeChecked.reduce(
        (rules, config) => ({ ...rules, ...config.rules }),
        /** @type {import('eslint').Linter.RulesRecord} */ ({})
      ),
      ...tsEslint.configs.stylisticTypeChecked.reduce(
        (rules, config) => ({ ...rules, ...config.rules }),
        /** @type {import('eslint').Linter.RulesRecord} */ ({})
      ),
      ...prettierConfigs.rules,
      ...prettierPlugin.configs.recommended.rules,
      ...cSpellPlugin.configs.recommended.rules,
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true, allowBoolean: true }],
      '@cspell/spellchecker': [
        'warn',
        {
          checkComments: true,
          numSuggestions: 3,
          customWordListFile: resolve(dirname(fileURLToPath(import.meta.url)), 'cspell.config.yaml'),
        },
      ],
    },
  },
]);
