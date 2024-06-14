module.exports = {
  env: {
    es6: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended-type-checked',
    'plugin:@typescript-eslint/stylistic-type-checked',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['tsconfig.json', 'tsconfig.dev.json'],
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', '@stylistic', 'jest'],
  ignorePatterns: ['/lib/**/*', '/src/generated/proto/**/*'],
  rules: {
    'no-console': ['error'],
    'arrow-parens': ['error', 'as-needed'],
    '@typescript-eslint/no-misused-promises': [
      'error',
      { checksVoidReturn: { attributes: false } },
    ],
  },
};
