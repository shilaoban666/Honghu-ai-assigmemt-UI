import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import prettier from 'eslint-config-prettier'

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      '.claude/**'
    ]
  },

  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],

  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules: {
      // 单词组件名（Sidebar / Header 等）是本项目约定，关闭 Vue 的强制多词命名。
      'vue/multi-word-component-names': 'off',
      // 未使用变量降级为告警（允许 _ 前缀占位），不阻断 CI。
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }],
      // 允许空 catch（项目里多处用空 catch 做静默降级）。
      'no-empty': ['warn', { allowEmptyCatch: true }]
    }
  },

  {
    // Vitest 单元/组件测试：注入测试运行时全局（部分文件依赖 globals:true）。
    files: ['tests/**/*.js', '**/*.test.js'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        vi: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly'
      }
    }
  },

  // 关闭所有与 Prettier 冲突的格式化规则（必须放在最后）。
  prettier
]
