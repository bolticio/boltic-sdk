module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
    '@typescript-eslint/eslint-plugin',
    'prettier',
  ],
  extends: ['eslint:recommended', 'prettier'],
  env: {
    node: true,
    browser: true,
    es2020: true,
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    'prettier/prettier': 'error',
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    '*.js',
    'examples/',
    'tests/',
    '*.config.ts',
  ],
};
