module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    curly: ['error', 'multi-line'],
    semi: ['off'],
    'comma-dangle': ['off'],
    'react/no-unstable-nested-components': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'no-trailing-spaces': 'off',
    'react-hooks/exhaustive-deps': 'off',
    'react-hooks/rules-of-hooks': 'off',
    'react-native/no-inline-styles': 'off',
  }
};
