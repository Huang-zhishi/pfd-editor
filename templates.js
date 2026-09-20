/* ============================================================
 * PFD Editor · 组件模板库入口（templates.js）
 *    设备模板已按设备拆分到 templates/ 目录（一个设备一个文件），
 *    本文件只做两件事：定义 TEMPLATES 容器、按 TEMPLATE_FILES 顺序加载各设备文件。
 *    加载顺序：templates.js → templates/*.js → editor.js（editor.html / preview.html 均如此）
 *
 *    每个模板: { name, category, icon, defaultSize, ports, render(w,h,p) }
 *      - name/category/icon  面板显示用
 *      - defaultSize         拖入画布时的初始尺寸
 *      - ports: [{id, x, y, dir}]  x,y 为 0-1 相对坐标, dir 为出向
 *      - render(w,h,p)       返回内部 SVG 字符串（不含外层 <g>）
 *    新增组件：在 templates/ 下新增设备文件（TEMPLATES.xxx = {...}），
 *    并把文件名加入下方 TEMPLATE_FILES；category 取值须是 CATEGORY_ORDER 之一。
 *
 *    组件面板（editor.js buildPalette）分组规则：
 *      - 分组顺序 = CATEGORY_ORDER；某分类下无组件时该组不显示
 *      - 组内顺序 = TEMPLATE_FILES 顺序，故同一分类的组件在清单中相邻排列
 *      - 未登记进 CATEGORY_ORDER 的分类按出现顺序补在末尾（兜底，避免新增组件漏登记而丢失）
 * ============================================================ */
'use strict';

const TEMPLATES = {};

/* 组件面板的分类顺序（按工艺功能分段；改这里即可调整侧栏分组次序） */
const CATEGORY_ORDER = [
  '输送与给料',
  '粉磨与分级',
  '储存与反应',
  '干燥煅烧与冷却',
  '风机泵阀',
  '除尘与分离',
  '通用与标注'
];

// 设备文件清单（与 templates/ 目录一一对应；顺序即组件面板各组内的展示顺序）
const TEMPLATE_FILES = [
  // 输送与给料
  'screwConveyor',
  'screwConveyorLite',
  'bucketElevator',
  'weighFeeder',
  // 粉磨与分级
  'vrm',
  'pendulumMill',
  'classifier',
  // 储存与反应
  'silo',
  'storageSilo',
  'hopper',
  'reactor',
  // 干燥煅烧与冷却
  'rotaryKiln',
  'miningDryer',
  'hotAirFurnace',
  'heater',
  'tubeCooler',
  'coolingPond',
  // 风机泵阀
  'blower',
  'blowerSingle',
  'valve',
  'switchValve',
  'pump',
  'motor',
  // 除尘与分离
  'dustCollector',
  'cyclone',
  'desulfTower',
  'filterPress',
  // 通用与标注
  'box',
  'circle',
  'text',
  'instrument',
  'monitor'
];

(function loadTemplates(){
  const ver = '?v=' + Date.now();
  document.write(TEMPLATE_FILES.map(f =>
    '<scr' + 'ipt src="templates/' + f + '.js' + ver + '"></scr' + 'ipt>'
  ).join(''));
})();
