module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    './base',
    'plugin:react/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  rules: {
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    "react/no-unknown-property": ["error", { "ignore": ["css", "cmdk-input-wrapper"] }],
  },
}
