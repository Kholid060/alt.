module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    './base',
    'plugin:jsx-a11y/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  plugins: ['react-refresh', 'plugin:react/recommended'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
}
