module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    "@alt-dot/eslint-config/react.js"
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
}
