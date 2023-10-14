/* eslint-disable @typescript-eslint/consistent-type-imports */

type RuleModules = Record<string, import('eslint').Rule.RuleModule>;
interface RuleRecords {
  readonly rules: Readonly<import('eslint').Linter.RulesRecord>;
}
type Plugin = import('eslint').ESLint.Plugin;
type ParserModule = import('eslint').Linter.ParserModule;
type FlatConfig = import('eslint').Linter.FlatConfig;

declare module 'eslint-plugin-prettier' {
  const plugin: {
    rules: RuleModules;
    configs: {
      recommended: RuleRecords;
    };
  };
  export default plugin;
}

declare module 'typescript-eslint' {
  const package: {
    plugin: Plugin;
    parser: ParserModule;
    configs: {
      all: FlatConfig[];
      base: FlatConfig;
      disableTypeChecked: FlatConfig;
      eslintRecommended: FlatConfig;
      recommended: FlatConfig[];
      recommendedTypeChecked: FlatConfig[];
      recommendedTypeCheckedOnly: FlatConfig[];
      strict: FlatConfig[];
      strictTypeChecked: FlatConfig[];
      strictTypeCheckedOnly: FlatConfig[];
      stylistic: FlatConfig[];
      stylisticTypeChecked: FlatConfig[];
      stylisticTypeCheckedOnly: FlatConfig[];
    };
  };
  export default package;
}

declare module '@cspell/eslint-plugin' {
  const plugin: {
    rules: RuleModules;
    configs: {
      recommended: RuleRecords;
      debug: RuleRecords;
    };
  };
  export default plugin;
}
