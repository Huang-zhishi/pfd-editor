/* ESLint 扁平配置（ESLint 9+）
 *
 * 策略说明（面向遗留代码库，见工程化审计 §2.2）：
 *   1) 只启用"高价值且低误报"的规则，且全部设为 warn —— 现有代码有大量历史遗留
 *      （见架构审计 §2.x/§5.x/§7.x），一次性设为 error 会让 CI 直接不可用。
 *   2) CI 用 --max-warnings 设"警告预算"：预算只允许下调，**新增违规会立刻失败**，
 *      从而在不冻结开发的前提下阻止债务增长。
 *   3) 刻意不启用 no-undef / no-unused-vars：本项目是"全局脚本"形态（无 ESM），
 *      跨文件全局符号（TEMPLATES / doc / $ / 各渲染函数）无法静态解析，启用只会
 *      产生大量假阳性，反而淹没真问题。待架构审计 §2.1/§9.4（模块化）落地后再开。
 */
const globals = require('globals');

const PROJECT_GLOBALS = {
  TEMPLATES: 'writable',
  TEMPLATE_FILES: 'writable',
  doc: 'writable',
  $: 'readonly',
  createSVG: 'readonly',
  esc: 'readonly',
  clamp: 'readonly',
  F: 'readonly',
  uid: 'readonly',
  getComp: 'readonly',
  portPos: 'readonly',
  routePipe: 'readonly',
  running: 'writable',
  sensorValueMap: 'writable',

};

const RULES = {
  // —— 明显缺陷类（高价值、低误报）——
  'no-var': 'warn',                       // 架构 §2.3/§7.2：统一 const/let
  'no-empty': ['warn', { allowEmptyCatch: false }],   // 架构 §5.3/§5.5：禁止空 catch 吞异常
  'no-dupe-keys': 'error',
  'no-dupe-args': 'error',
  'no-unreachable': 'warn',
  'no-cond-assign': 'warn',
  'no-self-assign': 'warn',
  'no-constant-condition': ['warn', { checkLoops: false }],
  'no-eval': 'error',
  'no-implied-eval': 'error',
  'no-new-func': 'error',
  'no-script-url': 'error',
  'no-debugger': 'error',
  // —— 废弃 API（架构 §4.12/§8.6）——
  'no-restricted-properties': ['warn',
    { object: 'String', property: 'substr', message: 'substr 已废弃，请用 slice/substring' },
    { object: 'document', property: 'write', message: 'document.write 会阻塞解析，见架构审计 §2.4' },
  ],
  // —— 一致性（架构 §7.1/§7.3）——
  camelcase: ['warn', { properties: 'never', ignoreDestructuring: true, allow: ['^_'] }],
  eqeqeq: ['warn', 'smart'],
};

module.exports = [
  {
    ignores: [
      'node_modules/**',
      '.git/**',
      'templates/**',          // 模板是超长 SVG 字符串拼接，单独评估后再纳入
      '**/*.min.js',
    ],
  },
  {
    files: ['server.js', 'templates.js', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node, ...PROJECT_GLOBALS },
    },
    rules: RULES,
  },
  {
    files: ['editor.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: { ...globals.browser, ...PROJECT_GLOBALS },
    },
    rules: RULES,
  },
];
