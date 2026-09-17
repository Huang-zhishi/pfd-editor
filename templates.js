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
 *    并把文件名加入下方 TEMPLATE_FILES；组件面板（editor.js buildPalette）
 *    按 category 自动归组，面板内顺序 = 本清单顺序。
 * ============================================================ */
'use strict';

const TEMPLATES = {};

// 设备文件清单（与 templates/ 目录一一对应；顺序即组件面板的展示顺序）
const TEMPLATE_FILES = [
  'silo',
  'reactor',
  'vrm',
  'tubeCooler',
  'desulfTower',
  'valve',
  'pump',
  'motor',
  'instrument',
  'box',
  'circle',
  'hopper',
  'heater',
  'blower',
  'blowerSingle',
  'rotaryKiln',
  'switchValve',
  'dustCollector',
  'screwConveyor',
  'screwConveyorLite',
  'bucketElevator',
  'weighFeeder',
  'coolingPond',
  'text',
  'monitor'
];

(function loadTemplates(){
  const ver = '?v=' + Date.now();
  document.write(TEMPLATE_FILES.map(f =>
    '<scr' + 'ipt src="templates/' + f + '.js' + ver + '"></scr' + 'ipt>'
  ).join(''));
})();
