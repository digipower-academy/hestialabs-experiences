// https://eslint.org/docs/latest/user-guide/configuring/configuration-files#configuration-file-formats
module.exports = {
  env: {
    browser: true,
    es2021: true,
    jest: true
  },
  extends: ['plugin:vue/essential', 'standard'],
  overrides: [
    {
      // Performance tests read values only to force their computation for timing
      files: ['src/__tests__/**/performance/*.test.js'],
      rules: {
        'no-void': 'off',
        'no-unused-vars': 'off'
      }
    },
    {
      // Embedding examples mount the app with `new Vue(...)`
      files: ['deployment-examples/**/*.js'],
      rules: {
        'no-new': 'off'
      }
    }
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: ['vue'],
  rules: {
    'vue/order-in-components': ['error', {}],
    'vue/no-undef-components': [
      'error', {
        ignorePatterns: [
          '^V(\\w+)$',
          'i18n',
          'RouterView',
          'RouterLink',
          'TheDataExperience'
        ]
      }
    ],
    'space-before-function-paren': ['error', 'never'],
    'arrow-parens': ['error', 'as-needed', { requireForBlockBody: true }],
    'no-console': [
      'warn',
      {
        allow: ['info', 'warn', 'error', 'time', 'timeEnd']
      }
    ],
    // https://stackoverflow.com/a/64609434/8238129
    'vue/valid-v-slot': [
      'error',
      {
        allowModifiers: true
      }
    ],
    // Enforce PascalCase component names
    // https://vuejs.org/v2/style-guide/#Component-name-casing-in-templates-strongly-recommended
    'vue/component-name-in-template-casing': [
      'error',
      'PascalCase',
      {
        registeredComponentsOnly: false,
        ignores: ['component', 'client-only', 'keep-alive', 'i18n']
      }
    ]
  }
}
