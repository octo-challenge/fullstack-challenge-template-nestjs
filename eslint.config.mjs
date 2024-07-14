import hyeonEslintConfig from '@hyeon/eslint-config'

export default [
  ...hyeonEslintConfig.recommended,
  ...hyeonEslintConfig.typescript,
  ...hyeonEslintConfig.prettier,
  {
    rules: {
      camelcase: 'off',
      'lines-around-comment': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          varsIgnorePattern: 'flow',
        },
      ],
    },
  },
]
