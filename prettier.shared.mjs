export default {
  trailingComma: 'es5',
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  printWidth: 160,
  bracketSameLine: true,
  htmlWhitespaceSensitivity: 'ignore',
  bracketSpacing: true,
  arrowParens: 'always',
  overrides: [
    {
      files: '*.yml',
      options: {
        useTabs: false,
        tabWidth: 4,
        singleQuote: false,
      },
    },
  ],
};
