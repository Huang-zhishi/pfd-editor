/* 模板自检：不启浏览器，直接把 PFD Editor 的组件模板全部加载并渲染一遍。
 *
 * 用法：
 *   node render-check.js [项目根目录]        # 默认当前目录
 *
 * 做四件事：
 *   1) 按 templates.js 的 TEMPLATE_FILES 逐个加载模板文件（stub 掉 document.write），
 *      比对「文件数 = 注册数」，列出未注册 / 多注册项
 *   2) 每个模板按 defaultSize 渲染一次，检查输出里是否含 NaN / undefined
 *   3) 把指定模板在多个尺寸下渲染成 <svg> 片段，写到 <root>/.render-check-out.json，
 *      交给 Python 的 xml.etree.ElementTree 做 XML 合法性校验
 *   4) 打印几何工具函数的返回值（便于核对比例）
 *
 * 注意：TEMPLATES 是 const 声明，不会挂到全局对象上，必须用 vm.runInContext 取；
 *       text 模板依赖 editor.js 的 esc()，在沙箱里报 "esc is not defined" 属正常。
 */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const TARGET = process.env.TARGET || 'productTank';   // 需要多尺寸渲染的模板 key
const GEOM = process.env.GEOM || 'productTankGeom';   // 需要打印的几何函数名（可留空）

const sandbox = { document: { write() {} }, Math, Number, isFinite, console };
sandbox.window = sandbox;
vm.createContext(sandbox);

const entry = fs.readFileSync(path.join(root, 'templates.js'), 'utf8');
const names = entry.match(/TEMPLATE_FILES = \[([\s\S]*?)\]/)[1].replace(/\/\/[^\n]*/g, '')
  .split(',').map(s => s.trim()).filter(s => s.startsWith("'")).map(s => s.replace(/'/g, ''));

for (const f of ['templates.js', ...names.map(n => 'templates/' + n + '.js')]) {
  try { vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), sandbox, { filename: f }); }
  catch (e) { console.log('✗ 加载失败:', f, e.message); }
}

const keys = vm.runInContext('Object.keys(TEMPLATES)', sandbox);
console.log(`文件数=${names.length} 注册数=${keys.length}`);
const miss = names.filter(n => !keys.includes(n)), extra = keys.filter(k => !names.includes(k));
if (miss.length) console.log('✗ 未注册（文件在清单里但没进 TEMPLATES）:', miss);
if (extra.length) console.log('! 多注册（在 TEMPLATES 但清单里没有）:', extra);
if (!miss.length && !extra.length) console.log('✓ 清单与注册一一对应');

const bad = [];
for (const k of keys) {
  try {
    const s = vm.runInContext(`TEMPLATES['${k}'].render(TEMPLATES['${k}'].defaultSize.w, TEMPLATES['${k}'].defaultSize.h, {color:'#9C99FF',tag:'?'})`, sandbox);
    if (/NaN|undefined/.test(s)) bad.push(k + '(输出含 NaN/undefined)');
  } catch (e) { bad.push(k + ': ' + e.message); }
}
// 说明：历史上 text.js 依赖宿主全局 esc()，隔离渲染时会报 "text: esc is not defined"，
// 因此这里曾标注为"属正常"。2026-09-22 已把 text.js / instrument.js 改为模板内局部转义，
// 该报错不复存在 —— 现在任何渲染异常都应当被当作真问题排查。
console.log('渲染异常:', bad.length ? bad : '无');

if (TARGET && keys.includes(TARGET)) {
  const t = vm.runInContext(`JSON.stringify({w:TEMPLATES['${TARGET}'].defaultSize.w,h:TEMPLATES['${TARGET}'].defaultSize.h,cat:TEMPLATES['${TARGET}'].category,name:TEMPLATES['${TARGET}'].name})`, sandbox);
  console.log('目标模板:', t);
  const sizes = [[110, 124], [90, 100], [140, 160], [60, 66]];
  const out = sizes.map(([w, h]) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${vm.runInContext(`TEMPLATES['${TARGET}'].render(${w},${h},{color:'#9C99FF',tag:'?'})`, sandbox)}</svg>`);
  fs.writeFileSync(path.join(root, '.render-check-out.json'), JSON.stringify(out));
  console.log('已写出', path.join(root, '.render-check-out.json'), '（用 Python xml.etree 校验 XML）');
}
if (GEOM && vm.runInContext(`typeof ${GEOM} === 'function'`, sandbox)) {
  console.log('几何:', vm.runInContext(`JSON.stringify(${GEOM}(110,124))`, sandbox));
}
