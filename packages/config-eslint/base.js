module.exports = {
  env: {
    node: true,
  },
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  plugins: ['@typescript-eslint'],
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2020,
  },
  rules: {
    'comma-dangle': ['warn', 'always-multiline'],
    'semi': ['error', 'always'],
    '@typescript-eslint/no-non-null-assertion': 'off',
    'quotes': [
      'warn',
      'single',
      {
        'avoidEscape': true,
      },
    ],
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_',
      },
    ],
  },
};
