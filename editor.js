/* ============================================================
 * PFD Editor · 工艺流程组态编辑器 · 应用逻辑（editor.js）
 * 全可编辑 · 拖拽搭建 · 端口连线 · 运行动画
 *
 * 运行环境：
 *   - 本文件与模板库配套：templates.js（入口，定义 TEMPLATES 容器）
 *     与 templates/*.js（按设备拆分，一个设备一个文件），
 *     加载顺序固定为 templates.js → templates/*.js → editor.js
 *     （editor.html / preview.html 均如此）；
 *   - 同时服务于两个页面：editor.html（编辑器）与 preview.html（只读预览，
 *     预览页另有本地 IIFE 覆盖部分行为，如 applySMILState）；
 *   - 由页面底部的 document.write 以 ?v= 时间戳加载以绕过缓存。
 *
 * 目录（对应下文 "N." 注释块）：
 *   0  后端传感器 API            15 实时数据：回转窑温度渐变
 *   1  状态管理                  16 操作：删除/复制/对齐/历史
 *   2  渲染：全量渲染            17 模式
 *   3  渲染：监控器组件          18 状态栏
 *   4  渲染：增量更新            19 工具栏（仅编辑页）
 *   5  渲染：覆盖层              20 键盘快捷键
 *   6  坐标转换                  21 项目保存/加载
 *   7  组件库面板                22 模态框
 *   8  拖拽：从组件库到画布      23 轻提示（flash）
 *   9  画布交互                  24 运行模式：粒子流动
 *   10 管道                      25 导出：PNG
 *   11 属性面板                  26 导出：自包含单文件 HTML
 *   12 属性面板：运行参数(Tag)   27 默认模板：还原工艺
 *   13 实时数据：基础设施        28 初始化（仅编辑页）
 *   14 实时数据：监控器面板
 * ============================================================ */
'use strict';

const SVG_NS = 'http://www.w3.org/2000/svg';
const $ = id => document.getElementById(id);
// DOM references - null on preview page
const svg = $('canvas');
const layerPipes = $('layerPipes');
const layerEquip = $('layerEquip');
const layerTop = $('layerTop');
const layerFlow = $('layerFlow');
const layerOverlay = $('layerOverlay');
const _isEditor = !!$('btnSave'); // true when running on editor page (has toolbar buttons)

/* ============================================================
 * 设计令牌（审计 6.2 / 6.5）
 *   原来行高 / 内边距 / 字符宽等布局数值与视口缩放范围以字面量散落在各渲染函数里，
 *   字体或字号一变就静默错位，两页参数也会各自漂移。集中为命名常量，单位见注释。
 *   ⚠️ preview.html 内语义等价的副本（monitorAutoHeightPreview / 管道标签底板）
 *      消费同一组常量；本块是唯一来源，改这里即可。
 * ============================================================ */
// 监控器面板：单行高度 + 上下留白合计（空态占位 1 行，无标题行/时间行）
//   必须与 templates/monitor.js 的 ROW 保持一致（面板总高由本函数算，行位置由模板排）
const MONITOR_ROW_H = 17;
const MONITOR_PAD_V = 4;
// 管道标签底板：字符平均宽度 + 左右内边距合计 + 底板高度 + 相对标签中心的两个偏移
//   字宽按 10px 中文/数字混排实测均值取整；更换字体族/字号需同步复核
const LABEL_CHAR_W = 7;
const LABEL_PAD_X = 8;
const LABEL_BOX_H = 16;
const LABEL_BOX_DY = -9;    // 底板顶边 = 标签中心 y + 该值
const LABEL_TEXT_DY = 3;    // 文字基线 = 标签中心 y + 该值
const LABEL_FONT_SIZE = 10;
/* 视口缩放范围（审计 6.5）：编辑器与预览页共用同一份视口语义。
   原来编辑器 0.3~3、预览 0.2~4 两套参数，同一画布在两页的可缩放区间不一致。 */
const VIEW_ZOOM_MIN = 0.3;
const VIEW_ZOOM_MAX = 3;

/* 交互与性能策略参数（审计 6.3 / 6.4）
   吸附半径、撤销历史上限、FPS 徽章节流与分级阈值、预览页历史缓存 TTL 原来都是
   散落在函数体里的字面量，调参数要全文搜数字。集中为命名常量，单位与依据见注释。 */
/* 连接线端点吸附半径（6.3）：三级优先级 端口 > 设备中心 > 管道 > 自由点。
   ⚠️ 与 zoom 的联动：距离比较全发生在换算后的 SVG 用户坐标系里，单位是用户坐标，
   屏幕上的实际吸附范围 = 半径 × zoom（放大时更易吸附、缩小时更难）。
   若要求"屏幕恒定吸附手感"，需按 1/zoom 缩放半径再比较；本次只做命名化，不改行为。 */
const SNAP_R_PORT = 12;    // 端口吸附半径（优先级最高）
const SNAP_R_COMP = 20;    // 设备中心吸附半径
const SNAP_R_PIPE = 15;    // 管道折线吸附半径
/* 撤销历史上限（6.4）：单位"步"，超出丢弃最旧快照。
   依据：快照是全文档 JSON 字符串，50 步在常规文档规模下内存可控，够一般编辑回溯。 */
const HIST_MAX = 50;
/* FPS 徽章（6.4）：
   FPS_DT_MAX  异常帧间隔上限（ms），超过视为切后台/长任务，不计入统计；
   FPS_PAINT_MS  DOM 写入节流间隔（ms）——每帧写 DOM 会让测量工具本身成为性能问题；
   FPS_WARN / FPS_BAD  分级阈值（FPS）：≥WARN 绿 / BAD~WARN 黄 / <BAD 红。 */
const FPS_DT_MAX = 500;
const FPS_PAINT_MS = 250;
const FPS_WARN = 50;
const FPS_BAD = 30;
/* 预览页真实历史数据缓存 TTL（6.4，ms）：同参查询 10s 内直接命中缓存，
   避免趋势曲线高频重复打后端。preview.html 消费同一常量（该页加载 editor.js）。 */
const HISTORY_CACHE_TTL_MS = 10000;

// 管道标签底板宽度（渲染 / 增量移动 / 增量拖动三处共用，避免字面量各写一份）
function pipeLabelWidth(text){ return String(text == null ? '' : text).length * LABEL_CHAR_W + LABEL_PAD_X; }

/* 后端传感器连接状态：用于把"拉取失败"从静默变成可观测（审计 §5.3）
   原来两处 catch 都是空实现，无法区分"后端没配"与"网络坏了"。 */
let sensorApiState = { ok: null, error: '', at: 0 };
function setSensorApiState(ok, err){
  sensorApiState = { ok: ok, error: err || '', at: Date.now() };
  const el = (typeof $ === 'function') ? $('stSensor') : null;
  if(el){
    el.textContent = ok ? '正常' : ('离线' + (err ? '（' + err + '）' : ''));
    el.style.color = ok ? 'var(--green)' : 'var(--red)';
    el.title = ok ? ('最近一次成功：' + new Date(sensorApiState.at).toLocaleTimeString())
                  : ('最近一次失败：' + new Date(sensorApiState.at).toLocaleTimeString() + '\n' + sensorApiState.error);
  }
}
function logSensorFailure(where, e){
  const msg = (e && e.message) || String(e);
  console.warn('[SENSOR] ' + where + ' 失败：' + msg);
  setSensorApiState(false, msg);
}

/* ============================================================
 * 0. 后端传感器 API（编辑器与预览页共用）
 *    - 通过 http(s):// 访问时使用相对路径 /api/*，由当前服务器代理转发（避免CORS问题）；
 *    - file:// 协议下直连远端地址（需后端支持CORS，否则会失败）；
 *    - 可通过 URL 参数 ?api= 覆盖（如 editor.html?api=https://xx.xx），便于切换环境。
 * ============================================================ */
/* URL 参数 ?api= 可覆盖后端地址（便于切换环境）。
   审计 5.6：必须校验 —— 原实现把参数直接拼进 fetch 的基地址，
   非 http(s) 协议（javascript:/data: 等）或指向第三方主机都会静默生效。 */
const _apiParamRaw = new URLSearchParams(location.search).get('api');
const _isFileProtocol = location.protocol === 'file:';
const _apiParam = (function(){
  if(!_apiParamRaw) return '';
  try{
    const u = new URL(_apiParamRaw, location.href);
    if(u.protocol !== 'http:' && u.protocol !== 'https:'){
      console.warn('[API] ?api= 协议不被允许（仅支持 http/https），已忽略：' + _apiParamRaw);
      return '';
    }
    if(u.origin === location.origin) return '';   // 同源等同于不覆盖
    // 跨源覆盖必须显式登记在 PFD_API_ALLOW（由 server.js 注入）中，
    // 否则一个构造链接就能把传感器请求导向任意主机（数据源伪造）。
    const allow = (Array.isArray(window.__PFD_API_ALLOW)) ? window.__PFD_API_ALLOW : [];
    if(allow.indexOf(u.origin) < 0){
      console.warn('[API] ?api= 指向未登记的跨源地址，已忽略：' + u.origin
        + '（如需允许，请在服务端设置 PFD_API_ALLOW）');
      return '';
    }
    console.warn('[API] 后端地址被 URL 参数覆盖为：' + u.origin + '（已在 PFD_API_ALLOW 白名单内）');
    return u.origin;
  }catch(e){
    console.warn('[API] ?api= 不是合法 URL，已忽略：' + _apiParamRaw);
    return '';
  }
})();
/* 审计 7.1：file:// 兜底原来硬编码内网地址；改为留空并给出明确提示，
   需要直连后端时用 ?api= 显式指定（且需登记在 PFD_API_ALLOW 白名单）。 */
const SENSOR_API_BASE = _apiParam || '';
if(_isFileProtocol && !SENSOR_API_BASE){
  console.warn('[API] 以 file:// 打开且未指定 ?api=，传感器功能不可用。'
    + '建议通过 node server.js 启动后访问，或用 editor.html?api=http://<后端地址> 指定。');
}
const SENSOR_API = {
  async _get(path){
    const ctrl = typeof AbortController!=='undefined' ? new AbortController() : null;
    const timer = ctrl ? setTimeout(()=>ctrl.abort(), 5000) : null;
    try{
      const r = await fetch(SENSOR_API_BASE + path, ctrl?{signal:ctrl.signal}:{});
      if(!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json().catch(()=>null);
      return j && j.success ? j : null;
    }finally{
      if(timer) clearTimeout(timer);
    }
  },
  // 传感器目录: [{sensor_tag, type, kiln_id}]
  list(){ return this._get('/api/sensors/list'); },
  // 实时数值: 可按 sensor_tag / type / kiln_id / limit 过滤
  values(q={}){
    const p = new URLSearchParams();
    if(q.sensor_tag) p.set('sensor_tag', q.sensor_tag);
    if(q.type) p.set('type', q.type);
    if(q.kiln_id) p.set('kiln_id', q.kiln_id);
    if(q.limit) p.set('limit', q.limit);
    const qs = p.toString();
    return this._get('/api/sensors/values' + (qs?'?'+qs:''));
  },
  // 历史数据: 按 sensor_tag 查询，支持 time_range(10m/30m/1h/6h/12h/24h) 或 start/end
  history(q={}){
    const p = new URLSearchParams();
    if(q.sensor_tag) p.set('sensor_tag', q.sensor_tag);
    if(q.time_range) p.set('time_range', q.time_range);
    if(q.start) p.set('start', q.start);
    if(q.end) p.set('end', q.end);
    if(q.limit) p.set('limit', q.limit);
    const qs = p.toString();
    return this._get('/api/sensors/history' + (qs?'?'+qs:''));
  }
};

/* 管道类型 */
const PIPE_TYPES = {
  solid:  { name:'固体/粉料', color:'#C4B5A0', dash:'none',  speed:0.5 },
  gas:    { name:'气体',     color:'#00E5FF', dash:'none',  speed:0.9 },
  hot:    { name:'高温介质', color:'#FF6B3D', dash:'6 4',   speed:0.85 },
  cool:   { name:'冷却介质', color:'#5B9DFF', dash:'none',  speed:0.7 },
  steam:  { name:'蒸汽',     color:'#FFFFFF', dash:'3 3',   speed:0.45 },
  signal: { name:'信号',     color:'#96CC60', dash:'2 2',   speed:1.2 },
};

/* ============================================================
 * 1. 状态管理
 * ============================================================ */
let doc = { version: 1, components: [], pipes: [], meta: { title:'未命名流程', bg:'#070612' } };
const compMap = new Map();  // id -> component，O(1)查找缓存
const pipeMap = new Map();  // id -> pipe，O(1)查找缓存
let selection = []; // 数组，支持多选: [{kind:'component'|'pipe', id}]
let mode = 'select';  // 'select' | 'connect' | 'pan'
let zoom = 1, panX = 0, panY = 0;
let snap = true;
const snapGrid = 20;
let running = false;
let histStack = [], histIdx = -1;
let dirty = false;
const STUB = 18; // 端口引出短线长度

/* 索引缓存：O(1)查找代替O(n)线性查找 */
const compPipeIndex = new Map(); // compId -> [pipe,...] 反向索引
function rebuildIndex(){
  compMap.clear();
  pipeMap.clear();
  compPipeIndex.clear();
  for(let i=0;i<doc.components.length;i++){
    const c = doc.components[i];
    compMap.set(c.id, c);
    compPipeIndex.set(c.id, []);
  }
  for(let i=0;i<doc.pipes.length;i++){
    const p = doc.pipes[i];
    pipeMap.set(p.id, p);
    if(p.from && p.from.cid){ const arr = compPipeIndex.get(p.from.cid); if(arr) arr.push(p); }
    if(p.to && p.to.cid){ const arr = compPipeIndex.get(p.to.cid); if(arr) arr.push(p); }
  }
}
function getComp(id){ return compMap.get(id); }
function getPipe(id){ return pipeMap.get(id); }
function getPipesForComp(cid){ return compPipeIndex.get(cid) || []; }

/* 选择辅助 */
function selHas(kind, id){ return selection.some(s=>s.kind===kind && s.id===id); }
function selSingle(){ return selection.length===1 ? selection[0] : null; }
function selOnly(kind, id){ selection = [{kind, id}]; }
function selAdd(kind, id){ if(!selHas(kind,id)) selection.push({kind,id}); }
function selToggle(kind, id){
  const i = selection.findIndex(s=>s.kind===kind && s.id===id);
  if(i>=0) selection.splice(i,1); else selection.push({kind,id});
}
function selClear(){ selection = []; }
function selComps(){ return selection.filter(s=>s.kind==='component').map(s=>getComp(s.id)).filter(Boolean); }

/* 选中态/端口高亮：仅同步 DOM class，避免为纯选择变化触发全量 renderAll 重建 */
// 选中虚线框：由 applySelectionClasses 动态维护（renderAll 渲染时也复用此构造）
function makeSelBox(comp){
  const sel = createSVG('rect');
  sel.setAttribute('class','sel-box');
  sel.setAttribute('x',-4); sel.setAttribute('y',-4);
  sel.setAttribute('width',comp.w+8); sel.setAttribute('height',comp.h+8);
  sel.setAttribute('rx',6); sel.setAttribute('fill','none');
  sel.setAttribute('stroke','#00E5FF'); sel.setAttribute('stroke-width',1.5);
  sel.setAttribute('stroke-dasharray','4 3');
  sel.setAttribute('pointer-events','none');
  return sel;
}
function applySelectionClasses(){
  [layerEquip, layerTop].forEach(l=>{
    l.querySelectorAll('.equip-group.selected').forEach(g=>{
      g.classList.remove('selected');
      const box = g.querySelector(':scope > .sel-box');
      if(box) box.remove();
    });
  });
  layerPipes.querySelectorAll('.pipe.pipe-sel').forEach(p=>p.classList.remove('pipe-sel'));
  selection.forEach(s=>{
    if(s.kind==='component'){
      const comp = getComp(s.id);
      const layer = (comp && comp.type==='monitor') ? layerTop : layerEquip;
      const g = layer.querySelector(`.equip-group[data-id="${s.id}"]`);
      if(g){
        g.classList.add('selected');
        if(!g.querySelector(':scope > .sel-box')){
          if(comp){
            const box = makeSelBox(comp);
            // 保持原渲染顺序：虚线框在设备体之上、端口之下
            const firstPort = g.querySelector('.port');
            if(firstPort) g.insertBefore(box, firstPort); else g.appendChild(box);
          }
        }
      }
    }else{
      const g = layerPipes.querySelector(`.pipe-group[data-id="${s.id}"]`);
      if(g){ const path = g.querySelector('.pipe'); if(path) path.classList.add('pipe-sel'); }
    }
  });
}
function applyPortActive(){
  layerEquip.querySelectorAll('.port.active').forEach(c=>c.classList.remove('active'));
  if(connectState && connectState.from){
    layerEquip.querySelectorAll(`.port[data-cid="${connectState.from.cid}"][data-port="${connectState.from.port}"]`)
      .forEach(c=>c.classList.add('active'));
  }
}

function uid(p='c'){ return p + Math.random().toString(36).slice(2,8); }
function snapV(v){ return snap ? Math.round(v/snapGrid)*snapGrid : v; }

/* ============================================================
 * 2. 渲染：全量渲染（renderAll）
 * ============================================================ */
/* SMIL 动画开关：编辑模式暂停所有 SMIL 动画（性能关键，数百个 indefinite 动画会拖垮帧率），运行模式恢复 */
function applySMILState(){
  if(!svg || typeof svg.pauseAnimations !== 'function') return;
  try{ if(running){ svg.unpauseAnimations(); } else { svg.pauseAnimations(); } }catch(err){}
}
/* 编辑模式剥离 SMIL 动画元素：暂停的 SMIL 仍占据渲染树（模板含上千个 animate 节点），
   拖拽改属性时会触发 SVG 大面积重光栅化；编辑态直接不生成动画节点，运行态再注入 */
function stripSMIL(markup){
  if(!markup || markup.indexOf('<animate')<0) return markup;
  return markup
    .replace(/<animate(?:Transform|Motion)?\b[^>]*\/>/g,'')
    .replace(/<animate(?:Transform|Motion)?\b[^>]*>[\s\S]*?<\/animate(?:Transform|Motion)?>/g,'');
}
/* ============================================================
 * 运行开关（开关 Tag）：绑定位号后按实时值驱动设备动画开 / 停
 *   · 单个开关量：值 >= 0.5 → 运行；< 0.5 → 停止（剥掉 SMIL，画面定格在停转瞬间）
 *   · 可绑【多个】开关量，判定逻辑可选：
 *       与（and，默认）：已取到值的位号全部为 1 才运行
 *       或（or）        ：已取到值的位号任一为 1 即运行
 *   · 未绑定 / 绑定的位号全部暂无数据 → 默认运行（不干预）
 *   · 支持范围 = 【所有含动画的组件】，由 hasAnimation() 按模板渲染结果自动判定，
 *     属性面板为其渲染「运行控制」分组；渲染时按运行态决定是否生成动画节点。
 *   数据字段：props.runTags = [{tag}]（旧版单个 props.runTag 字符串自动迁移）
 *            props.runLogic = 'and' | 'or'
 * ============================================================ */
/* 组件是否有动画：渲染一次默认尺寸、看结果里有没有 <animate（按类型缓存） */
const _animTypeCache = new Map();
function hasAnimation(type){
  if(_animTypeCache.has(type)) return _animTypeCache.get(type);
  let r = false;
  try{
    const t = TEMPLATES[type];
    if(t && typeof t.render==='function'){
      const sz = t.defaultSize || { w: 100, h: 100 };
      r = /<animate/.test(String(t.render(sz.w, sz.h, { color:'#9C99FF' }) || ''));
    }
  }catch(e){ r = false; }
  _animTypeCache.set(type, r);
  return r;
}
/* 旧数据迁移：props.runTag（单个字符串）→ props.runTags（列表）；runLogic 默认 and */
function normalizeRunTags(comp){
  const p = comp.props || (comp.props = {});
  if(!Array.isArray(p.runTags)){
    const old = String(p.runTag || '').trim();
    p.runTags = old ? [{ tag: old }] : [];
  }
  if(p.runLogic !== 'or') p.runLogic = 'and';
  if(p.runTag != null) delete p.runTag;
  return p.runTags;
}
/* 取该组件的开关位号列表（兼容未迁移的旧数据，不写回） */
function runTagList(comp){
  const p = (comp && comp.props) || {};
  if(Array.isArray(p.runTags)) return p.runTags;
  const old = String(p.runTag || '').trim();
  return old ? [{ tag: old }] : [];
}
/* 组件运行状态：{ bound, run, logic, values:[{tag,value,on}] }
   liveMap 缺省取全局 sensorValueMap（预览页走局部 doc 时显式传入） */
function compRunState(comp, liveMap){
  const p = (comp && comp.props) || {};
  const map = liveMap || ((typeof sensorValueMap!=='undefined') ? sensorValueMap : null);
  const logic = p.runLogic === 'or' ? 'or' : 'and';
  const values = [];
  runTagList(comp).forEach(it=>{
    const tag = String((it && it.tag) || '').trim();
    if(!tag) return;
    const live = map ? map[tag] : null;
    const raw = live ? live.value : null;
    const v = (raw==null || raw==='') ? null : (isFinite(+raw) ? +raw : null);
    values.push({ tag, value:v, on: v==null ? null : v>=0.5 });
  });
  if(!values.length) return { bound:false, run:true, logic, values };
  const known = values.filter(x=>x.on != null);
  const run = !known.length ? true
            : logic === 'or' ? known.some(x=>x.on)
            : known.every(x=>x.on);
  return { bound:true, run, logic, values };
}
/* 该组件当前是否需要"定格"（有动画 + 绑定开关 Tag 且判定为停止） */
function compStopped(comp){
  return hasAnimation(comp.type) && compRunState(comp).run === false;
}
/* ============================================================
 * 运行开关对【连线】的影响：来源设备停止时，该条输出线的物料流动一并停止，
 * 线色换成"停止色"（中性灰，与各介质本色明显区分），用来表示这条输出线已停。
 *   · 判定口径 = 连线的 from 端（输出线）；管道若是自由折线（无 from）不受影响。
 * ============================================================ */
const PIPE_STOPPED_COLOR = '#6b7280';
function pipeRunStopped(pipe){
  if(!pipe || !pipe.from || !pipe.from.cid) return false;
  const src = (typeof getComp==='function') ? getComp(pipe.from.cid) : null;
  return !!(src && compStopped(src));
}
function pipeColorOf(pipe){
  const pt = PIPE_TYPES[pipe.type] || PIPE_TYPES.solid;
  return pipeRunStopped(pipe) ? PIPE_STOPPED_COLOR : pt.color;
}
/* 按运行态就地刷新单条连线的配色（不重建 DOM；光晕 / 主线 / 标签底 / 标签字） */
function applyPipeColor(pipe){
  if(!layerPipes) return;
  const g = layerPipes.querySelector(`.pipe-group[data-id="${pipe.id}"]`);
  if(!g) return;
  const col = pipeColorOf(pipe);
  const paths = g.querySelectorAll('path');
  if(paths[0]) paths[0].setAttribute('stroke', col);
  if(paths[1]){ paths[1].setAttribute('stroke', col); paths[1].style.color = col; }
  const rects = g.querySelectorAll('rect');
  const texts = g.querySelectorAll('text');
  if(rects[0]) rects[0].setAttribute('stroke', col);
  if(texts[0]) texts[0].setAttribute('fill', col);
}
/* 刷新以某组件为来源的所有输出线配色 */
function applyPipesFrom(compId, docArg){
  const d = docArg || (typeof doc!=='undefined' ? doc : null);
  if(!d || !Array.isArray(d.pipes)) return;
  d.pipes.forEach(p=>{ if(p.from && p.from.cid === compId) applyPipeColor(p); });
}
/* 属性面板「当前状态」胶囊：按运行态着色（运行=绿 / 停止=红 / 未绑定或无数据=灰） */
function setRunStatePill(el, st){
  if(!el) return;
  const txt = el.querySelector('span:last-child');
  if(txt) txt.textContent = runStateText(st);
  const known = st.values.filter(x=>x.on != null);
  const active = !!(st.bound && known.length);
  el.classList.toggle('on', active && st.run);
  el.classList.toggle('off', active && !st.run);
  el.classList.toggle('idle', !active);
}
/* 运行状态文案（属性面板「当前状态」回显） */
function runStateText(st){
  if(!st.bound) return '运行中 · 未绑定';
  const known = st.values.filter(x=>x.on != null);
  if(!known.length) return `运行中 · ${st.values.length} 个位号暂无数据`;
  const on = known.filter(x=>x.on).length;
  return `${st.run ? '运行中' : '已停止'} · ${st.logic === 'or' ? '或' : '与'} ${on}/${known.length}`;
}
/* 端口相对坐标（0~1）：模板里既可以写固定比例，也可以写 (w,h)=>比例 的函数。
   函数式端口用于"定尺部件位置不随机身加高而变"的组件（如斗式提升机的机头/出料溜槽），
   按实际尺寸实算才能让连线锚点始终落在画面上真正的槽口/管口上。*/
function portRatioX(pt, w, h){ return (typeof pt.x === 'function') ? pt.x(w, h) : pt.x; }
function portRatioY(pt, w, h){ return (typeof pt.y === 'function') ? pt.y(w, h) : pt.y; }
function portPos(comp, portId){
  const t = TEMPLATES[comp.type];
  if(!t) return null;
  const port = t.ports.find(p=>p.id===portId);
  if(!port) return null;
  const mirrored = comp.props && comp.props.mirrored;
  const px = portRatioX(port, comp.w, comp.h);
  const py = portRatioY(port, comp.w, comp.h);
  // 镜像翻转: x坐标取反, 方向 left/right 互换
  const mx = mirrored ? (1 - px) : px;
  const my = py;
  const dirMap = {up:'up', down:'down', left:'right', right:'left'};
  const mdir = mirrored ? (dirMap[port.dir] || port.dir) : port.dir;
  const r = (comp.rotation||0) * Math.PI / 180;
  if(Math.abs(r) < 0.001) return { x: comp.x + mx*comp.w, y: comp.y + my*comp.h, dir: mdir };
  const cx = comp.x + comp.w/2, cy = comp.y + comp.h/2;
  const lx = mx*comp.w - comp.w/2, ly = my*comp.h - comp.h/2;
  const cos = Math.cos(r), sin = Math.sin(r);
  const rx = lx*cos - ly*sin, ry = lx*sin + ly*cos;
  // 方向旋转映射
  const dirDeg = {up:0, right:90, down:180, left:270}[mdir] || 0;
  const newDeg = (dirDeg + (comp.rotation||0) + 360) % 360;
  const dMap = {0:'up', 90:'right', 180:'down', 270:'left'};
  return { x: cx + rx, y: cy + ry, dir: dMap[newDeg] };
}

function routePipe(p1, dir1, p2, dir2, bend, straight){
  // 曼哈顿路由：从端口引出 stub，再正交连接；bend 为可选手动折点
  const pts = [{x:p1.x, y:p1.y}];
  if(straight){
    // 直线连接：两端点直接相连，无拐角
    pts.push({x:p2.x, y:p2.y});
    return pts;
  }
  const s1 = stubPoint(p1, dir1, STUB);
  const s2 = stubPoint(p2, dir2, STUB);
  pts.push(s1);
  const horiz = (dir1==='right' || dir1==='left');
  if(bend){
    if(horiz){
      pts.push({x:bend.x, y:s1.y});
      pts.push({x:bend.x, y:s2.y});
    } else {
      pts.push({x:s1.x, y:bend.y});
      pts.push({x:s2.x, y:bend.y});
    }
  } else {
    if(horiz){
      const mx = (s1.x + s2.x)/2;
      pts.push({x:mx, y:s1.y});
      pts.push({x:mx, y:s2.y});
    } else {
      const my = (s1.y + s2.y)/2;
      pts.push({x:s1.x, y:my});
      pts.push({x:s2.x, y:my});
    }
  }
  pts.push(s2);
  pts.push({x:p2.x, y:p2.y});
  return pts;
}
function stubPoint(p, dir, len){
  if(dir==='up') return {x:p.x, y:p.y-len};
  if(dir==='down') return {x:p.x, y:p.y+len};
  if(dir==='left') return {x:p.x-len, y:p.y};
  if(dir==='right') return {x:p.x+len, y:p.y};
  return {x:p.x, y:p.y};
}
function ptsToPath(pts){
  if(!pts || pts.length<2) return '';
  const f = n => (Math.round(n*10)/10).toFixed(1);
  if(pts.length<3) return pts.map((p,i)=>(i?'L':'M')+f(p.x)+' '+f(p.y)).join(' ');
  // 圆角化：直角拐弯用二次贝塞尔平滑，端口段保持直线
  const R = 8;
  let d = 'M'+f(pts[0].x)+' '+f(pts[0].y);
  for(let i=1;i<pts.length-1;i++){
    const a = pts[i-1], c = pts[i], b = pts[i+1];
    const ax = Math.sign(c.x-a.x)||0, ay = Math.sign(c.y-a.y)||0;
    const bx = Math.sign(b.x-c.x)||0, by = Math.sign(b.y-c.y)||0;
    const len1 = Math.abs(c.x-a.x)+Math.abs(c.y-a.y);
    const len2 = Math.abs(b.x-c.x)+Math.abs(b.y-c.y);
    const r = Math.max(2, Math.min(R, len1/2, len2/2));
    const sx = c.x - ax*r, sy = c.y - ay*r;
    const ex = c.x + bx*r, ey = c.y + by*r;
    d += 'L'+f(sx)+' '+f(sy);
    d += 'Q'+f(c.x)+' '+f(c.y)+' '+f(ex)+' '+f(ey);
  }
  const last = pts[pts.length-1];
  d += 'L'+f(last.x)+' '+f(last.y);
  return d;
}

// 沿折线按比例(0~1)取点，用于管道标签定位
function pointAtPolyline(pts, t){
  if(!pts || pts.length===0) return {x:0,y:0};
  if(pts.length===1) return {x:pts[0].x, y:pts[0].y};
  let total=0;
  for(let i=1;i<pts.length;i++) total += Math.hypot(pts[i].x-pts[i-1].x, pts[i].y-pts[i-1].y);
  if(total<=0) return {x:pts[0].x, y:pts[0].y};
  const target = Math.max(0, Math.min(1, t)) * total;
  let acc=0;
  for(let i=1;i<pts.length;i++){
    const seg = Math.hypot(pts[i].x-pts[i-1].x, pts[i].y-pts[i-1].y);
    if(acc+seg >= target){
      const f = seg>0 ? (target-acc)/seg : 0;
      return { x: pts[i-1].x + (pts[i].x-pts[i-1].x)*f, y: pts[i-1].y + (pts[i].y-pts[i-1].y)*f };
    }
    acc += seg;
  }
  return {x:pts[pts.length-1].x, y:pts[pts.length-1].y};
}

// 求折线上距离给定点最近的线段，返回该投影点对应的比例(0~1)
function nearestTOnPolyline(pts, p){
  if(!pts || pts.length<2) return 0.5;
  let total=0;
  const segs=[];
  for(let i=1;i<pts.length;i++){
    const seg = Math.hypot(pts[i].x-pts[i-1].x, pts[i].y-pts[i-1].y);
    segs.push(seg); total += seg;
  }
  if(total<=0) return 0.5;
  let best={t:0, d:Infinity};
  let acc=0;
  for(let i=1;i<pts.length;i++){
    const a=pts[i-1], b=pts[i], seg=segs[i-1];
    const abx=b.x-a.x, aby=b.y-a.y;
    let f = seg>0 ? ((p.x-a.x)*abx+(p.y-a.y)*aby)/(seg*seg) : 0;
    f = Math.max(0, Math.min(1, f));
    const px=a.x+abx*f, py=a.y+aby*f;
    const d = Math.hypot(p.x-px, p.y-py);
    if(d < best.d){ best.d=d; best.t=(acc+seg*f)/total; }
    acc += seg;
  }
  return best.t;
}

function renderAll(){
  rebuildIndex(); // 重建O(1)查找索引
  // pipes under equipment
  layerPipes.innerHTML = '';
  layerEquip.innerHTML = '';
  layerTop.innerHTML = '';
  layerFlow.innerHTML = '';

  // pipes
  doc.pipes.forEach(pipe=>{
    const g = createSVG('g'); g.setAttribute('class','pipe-group'); g.dataset.id = pipe.id;
    let pts;
    if(pipe.from && pipe.to){
      const c1 = getComp(pipe.from.cid);
      const c2 = getComp(pipe.to.cid);
      if(!c1||!c2){ return; }
      const p1 = portPos(c1, pipe.from.port), p2 = portPos(c2, pipe.to.port);
      if(!p1 || !p2){ return; }   // 端口缺失则跳过该管道(防御)
      pts = routePipe(p1, p1.dir, p2, p2.dir, pipe.bend, pipe.straight);
      pipe._pts = pts;
    } else {
      pts = pipe.points || [];
      pipe._pts = pts;
    }
    if(!pts || pts.length<2) return;
    const pt = PIPE_TYPES[pipe.type] || PIPE_TYPES.solid;
    const col = pipeColorOf(pipe);      // 来源设备停止 → 停止色（见「运行开关对连线的影响」）
    const d = ptsToPath(pts);
    const bw = pipe.width || 2.5;
    // 底层光晕：半透明宽描边，营造发光质感（大厂流程图常用双层描边）
    const glow = createSVG('path');
    glow.setAttribute('d', d);
    glow.setAttribute('stroke', col);
    glow.setAttribute('stroke-width', bw + 5);
    glow.setAttribute('stroke-linecap','round');
    glow.setAttribute('stroke-linejoin','round');
    glow.setAttribute('fill','none');
    glow.setAttribute('opacity', 0.14);
    g.appendChild(glow);
    // 主层
    const path = createSVG('path');
    path.setAttribute('d', d);
    path.setAttribute('class','pipe' + (selHas('pipe',pipe.id) ? ' pipe-sel':''));
    path.setAttribute('stroke', col);
    path.setAttribute('stroke-width', bw);
    path.setAttribute('stroke-linecap','round');
    path.setAttribute('stroke-linejoin','round');
    path.setAttribute('stroke-dasharray', pt.dash==='none' ? '' : pt.dash);
    path.setAttribute('fill','none');
    path.style.color = col;
    g.appendChild(path);
    // label（可沿线拖动，位置由 pipe.labelPos 0~1 决定）
    if(pipe.label){
      const mid = pointAtPolyline(pts, pipe.labelPos==null ? 0.5 : pipe.labelPos);
      const tw = pipeLabelWidth(pipe.label);
      const bg = createSVG('rect');
      bg.setAttribute('x', mid.x-tw/2); bg.setAttribute('y', mid.y+LABEL_BOX_DY);
      bg.setAttribute('width', tw); bg.setAttribute('height', LABEL_BOX_H); bg.setAttribute('rx',3);
      bg.setAttribute('fill','#12112Bee'); bg.setAttribute('stroke', col); bg.setAttribute('stroke-width',0.8);
      bg.setAttribute('opacity', 0.9);
      g.appendChild(bg);
      const tx = createSVG('text'); tx.setAttribute('x', mid.x); tx.setAttribute('y', mid.y+LABEL_TEXT_DY);
      tx.setAttribute('text-anchor','middle'); tx.setAttribute('font-size', String(LABEL_FONT_SIZE)); tx.setAttribute('fill', col);
      tx.setAttribute('font-family','inherit'); tx.textContent = pipe.label;
      g.appendChild(tx);
      // 拖动把手：选中时可水平沿线拖动标签
      const hd = createSVG('circle');
      hd.setAttribute('cx', mid.x); hd.setAttribute('cy', mid.y);
      hd.setAttribute('r', 5);
      hd.setAttribute('fill','transparent');
      hd.setAttribute('class','pipe-label-handle');
      hd.dataset.id = pipe.id;
      hd.style.cursor = 'ew-resize';
      g.appendChild(hd);
    }
    layerPipes.appendChild(g);
  });

  // equipment（monitor 类型渲染到 layerTop 悬浮层，其余到 layerEquip）
  doc.components.forEach(comp=>{
    const t = TEMPLATES[comp.type]; if(!t) return;
    const isMonitor = comp.type === 'monitor';
    const layer = isMonitor ? layerTop : layerEquip;
    if(isMonitor){
      normalizeMonitorProps(comp);        // 旧版双 tag 字段迁移 + showLead 默认值
      comp.h = monitorAutoHeight(comp.props); // 高度随监控项数量自适应
      if(comp.props.showLead !== false) renderMonitorLead(comp); // 归属指向折线（先画，位于面板之下；可由属性面板关闭）
    }
    const g = createSVG('g');
    g.setAttribute('transform', `translate(${comp.x},${comp.y}) rotate(${comp.rotation||0} ${comp.w/2} ${comp.h/2})`);
    g.dataset.id = comp.id;
    g.setAttribute('class','equip-group' + (selHas('component',comp.id) ? ' selected':''));
    // 全局水平镜像：对所有组件统一处理
    // 注：原 bodyWrap 的 clip-path 为死代码（子节点随后被移出 bodyWrap），已移除以省去每台设备的 defs/clipPath 开销
    const mirrored = comp.props && comp.props.mirrored;
    /* 运行开关：绑定开关 Tag 且值为 0 的组件直接不生成动画节点（画面定格）；
       未绑定 / 暂无数据仍按全局 running 走。 */
    const markup = (running && !compStopped(comp))
      ? t.render(comp.w, comp.h, comp.props)
      : stripSMIL(t.render(comp.w, comp.h, comp.props));
    if(mirrored){
      const mirrorG = createSVG('g');
      mirrorG.setAttribute('transform', `translate(${comp.w},0) scale(-1,1)`);
      mirrorG.innerHTML = markup;
      g.appendChild(mirrorG);
    }else{
      const bodyG = createSVG('g');
      bodyG.innerHTML = markup;
      g.appendChild(bodyG);
    }
    // selection highlight
    if(selHas('component', comp.id)){
      g.appendChild(makeSelBox(comp));
    }
    // name label + tag: 移出旋转组，保持在组件顶部水平可读
    // 标签节点先收集、待组件本体入层后再追加，避免居中显示时被组件遮挡
    const labelNodes = [];
    const cx = comp.x + comp.w/2, cy = comp.y + comp.h/2;
    const r = (comp.rotation||0) * Math.PI / 180;
    const cos = Math.cos(r), sin = Math.sin(r);
    if(comp.type!=='text' && !isMonitor){
      const lbl = createSVG('text');
      // 名称位置：center=组件中心（+4 为 11px 字号的基线视觉补偿）；默认组件顶部上方
      const ldx = 0, ldy = (comp.props.namePos==='center') ? 4 : -(comp.h/2 + 6);
      lbl.setAttribute('x', cx + ldx*cos - ldy*sin);
      lbl.setAttribute('y', cy + ldx*sin + ldy*cos);
      lbl.setAttribute('text-anchor','middle'); lbl.setAttribute('class','tlabel');
      lbl.dataset.cid = comp.id; lbl.dataset.kind = 'name';
      lbl.textContent = comp.props.name || t.name;
      labelNodes.push(lbl);
    }
    if(comp.props.tag && !isMonitor){
      const tg = createSVG('text');
      const tdx = 0, tdy = (comp.h/2 + 14);
      tg.setAttribute('x', cx + tdx*cos - tdy*sin);
      tg.setAttribute('y', cy + tdx*sin + tdy*cos);
      tg.setAttribute('text-anchor','middle'); tg.setAttribute('class','ttag');
      tg.dataset.cid = comp.id; tg.dataset.kind = 'tag';
      tg.textContent = comp.props.tag;
      labelNodes.push(tg);
    }
    // ports（monitor 无交互端口）
    if(!isMonitor) t.ports.forEach(pt=>{
      const rX = portRatioX(pt, comp.w, comp.h), rY = portRatioY(pt, comp.w, comp.h);
      const px = (mirrored ? (1 - rX) : rX) * comp.w, py = rY*comp.h;
      const c = createSVG('circle');
      c.setAttribute('cx',px); c.setAttribute('cy',py); c.setAttribute('r',4);
      c.setAttribute('class','port' + (connectState && connectState.from && connectState.from.cid===comp.id && connectState.from.port===pt.id ? ' active':''));
      c.dataset.cid = comp.id; c.dataset.port = pt.id;
      g.appendChild(c);
    });
    layer.appendChild(g);
    labelNodes.forEach(n=>layer.appendChild(n));   // 名称/位号最后入层，压在组件本体之上
  });

  updateStatus();
  refreshMonitorValues();
  applySMILState();
  renderOverlay();
  refreshKilnTemp(sensorValueMap);
  refreshReactorLevel(sensorValueMap);
}

/* ============================================================
 * 3. 渲染：监控器组件（悬浮层实时数值面板）
 *     props.monitorTags: [{tag, label}]  任意多个监控项
 *     props.lead: { targetType:'point'|'comp'|'port'|'pipe', x,y, cid?, port?, pipeId?, pipeT?, bend? }
 *                 归属指向折线（面板 → 设备/端口/管道/自由点）
 * ============================================================ */
// 面板高度随监控项数量自适应：行数*MONITOR_ROW_H + 上下留白（空态占位1行，无标题/时间行）
function monitorAutoHeight(props){
  const n = (props && Array.isArray(props.monitorTags)) ? props.monitorTags.length : 0;
  return Math.max(n,1)*MONITOR_ROW_H + MONITOR_PAD_V;
}
// 旧版数据迁移：monitorTag/monitorTag2 双字段 → monitorTags 列表（lead 连接线字段保留）
// showLead: 是否显示归属指向折线（默认 true，老数据自动补；用户可关闭）
function normalizeMonitorProps(comp){
  const p = comp.props || (comp.props = {});
  if(!Array.isArray(p.monitorTags)){
    const mt = [];
    if(p.monitorTag) mt.push({tag:String(p.monitorTag), label:''});
    if(p.monitorTag2) mt.push({tag:String(p.monitorTag2), label:''});
    p.monitorTags = mt;
  }
  if(p.monitorTag!=null) delete p.monitorTag;
  if(p.monitorTag2!=null) delete p.monitorTag2;
  if(p.showLead===undefined) p.showLead = true;
}
// 双格成品储罐：补两格默认标注（默认值定义在 templates/productTankDual.js，模板与面板共用）
function normalizeDualTankProps(comp){
  const p = comp.props || (comp.props = {});
  const d = productTankDualDefaults();
  Object.keys(d).forEach(k=>{ if(p[k]===undefined) p[k] = d[k]; });
}
// 连接线起点：面板左/右边缘中点（按目标方向自动选边，避免线绕过面板）
function monitorLeadAnchor(comp, target){
  const y = comp.y + comp.h/2;
  if(target && target.x < comp.x + comp.w/2) return {x:comp.x, y};
  return {x:comp.x+comp.w, y};
}
// 连接线终点：根据 lead 目标类型解析世界坐标（无 lead 返回 null，不画线）
function monitorLeadTarget(comp){
  const lead = comp.props && comp.props.lead;
  if(!lead) return null;
  if(lead.targetType==='comp'){
    const c = getComp(lead.cid);
    if(c) return {x:c.x+c.w/2, y:c.y+c.h/2};
  } else if(lead.targetType==='port'){
    const c = getComp(lead.cid);
    if(c){ const p = portPos(c, lead.port); if(p) return {x:p.x, y:p.y}; }
  } else if(lead.targetType==='pipe'){
    const p = getPipe(lead.pipeId);
    if(p && p._pts) return pointAtPolyline(p._pts, lead.pipeT==null?0.5:lead.pipeT);
  }
  return {x:lead.x, y:lead.y};
}
// 连接线折线点列：锚点 → (可选折点 bend) → 目标
function monitorLeadPts(comp){
  const b = monitorLeadTarget(comp);
  if(!b) return null;
  const a = monitorLeadAnchor(comp, b);
  const pts = [{x:a.x, y:a.y}];
  const bend = comp.props.lead && comp.props.lead.bend;
  if(bend) pts.push({x:bend.x, y:bend.y});
  pts.push({x:b.x, y:b.y});
  return pts;
}
// 归属折线全局样式（存 doc.meta，对所有监控器生效）：{ width, opacity }
function monitorLeadStyle(){
  const s = doc.meta && doc.meta.monitorLeadStyle;
  return {
    width: (s && +s.width > 0) ? +s.width : 1.6,
    opacity: (s && s.opacity != null && +s.opacity >= 0 && +s.opacity <= 1) ? +s.opacity : 0.85
  };
}
// 渲染归属折线（虚线 + 目标端点圆点），追加到 layerTop
function renderMonitorLead(comp){
  const g = createSVG('g');
  g.setAttribute('class','lead-group');
  g.dataset.id = comp.id;
  const pts = monitorLeadPts(comp);
  if(pts && pts.length>=2){
    const st = monitorLeadStyle();
    const path = createSVG('path');
    path.setAttribute('d', ptsToPath(pts));
    path.setAttribute('class','lead-path');
    path.setAttribute('fill','none');
    path.setAttribute('stroke','#00E5FF');
    path.setAttribute('stroke-width', st.width);
    path.setAttribute('stroke-dasharray','5 3');
    path.setAttribute('opacity', st.opacity);
    path.setAttribute('pointer-events','none');
    g.appendChild(path);
    const end = pts[pts.length-1];
    const dot = createSVG('circle');
    dot.setAttribute('class','lead-dot');
    dot.setAttribute('cx', end.x); dot.setAttribute('cy', end.y);
    dot.setAttribute('r', 3.5);
    dot.setAttribute('fill','#00E5FF');
    dot.setAttribute('stroke','#0a0a1a'); dot.setAttribute('stroke-width','0.8');
    dot.setAttribute('pointer-events','none');
    g.appendChild(dot);
  }
  layerTop.appendChild(g);
}
// 增量更新折线（拖拽端点/移动组件时）
function updateMonitorLead(comp){
  const g = layerTop.querySelector(`.lead-group[data-id="${comp.id}"]`);
  if(!g) return;
  const pts = monitorLeadPts(comp);
  const d = (pts && pts.length>=2) ? ptsToPath(pts) : '';
  const path = g.querySelector('.lead-path');
  if(path) path.setAttribute('d', d);
  const end = pts && pts[pts.length-1];
  const dot = g.querySelector('.lead-dot');
  if(dot && end){ dot.setAttribute('cx', end.x); dot.setAttribute('cy', end.y); }
}
function refreshMonitorLeads(){
  doc.components.forEach(c=>{ if(c.type==='monitor') updateMonitorLead(c); });
}
// 连接线端点智能吸附：端口 > 设备中心 > 管道 > 自由点（半径见 SNAP_R_* 常量，zoom 联动说明同处）
function snapLeadTarget(comp, sp){
  let best=null, bestD=SNAP_R_PORT;
  doc.components.forEach(c=>{
    if(c.id===comp.id || c.type==='monitor') return;
    const t = TEMPLATES[c.type]; if(!t) return;
    t.ports.forEach(pt=>{
      const p = portPos(c, pt.id); if(!p) return;
      const d = Math.hypot(p.x-sp.x, p.y-sp.y);
      if(d<bestD){ bestD=d; best={targetType:'port', cid:c.id, port:pt.id}; }
    });
  });
  if(best) return best;
  bestD=SNAP_R_COMP; best=null;
  doc.components.forEach(c=>{
    if(c.id===comp.id || c.type==='monitor') return;
    const cx=c.x+c.w/2, cy=c.y+c.h/2;
    const d=Math.hypot(cx-sp.x, cy-sp.y);
    if(d<bestD){ bestD=d; best={targetType:'comp', cid:c.id}; }
  });
  if(best) return best;
  bestD=SNAP_R_PIPE; best=null;
  doc.pipes.forEach(p=>{
    if(!p._pts || p._pts.length<2) return;
    const t = nearestTOnPolyline(p._pts, sp);
    const q = pointAtPolyline(p._pts, t);
    const d = Math.hypot(q.x-sp.x, q.y-sp.y);
    if(d<bestD){ bestD=d; best={targetType:'pipe', pipeId:p.id, pipeT:t}; }
  });
  if(best) return best;
  return {targetType:'point', x:sp.x, y:sp.y};
}
// 连接线目标的人类可读描述（用于属性面板）
function leadTargetDesc(comp){
  const lead = comp.props && comp.props.lead;
  if(!lead) return '未设置';
  if(lead.targetType==='comp'){ const c=getComp(lead.cid); return '设备中心 · '+(c?(c.props.name||c.id):lead.cid); }
  if(lead.targetType==='port'){ const c=getComp(lead.cid); return '端口 · '+(c?(c.props.name||c.id):lead.cid)+'.'+lead.port; }
  if(lead.targetType==='pipe') return '管道 · '+lead.pipeId;
  return '自由点 · ('+Math.round(lead.x)+', '+Math.round(lead.y)+')';
}
// 监控器数值格式化：默认四舍五入保留最多 2 位小数（869.71234 → 869.71，12 → 12）
// asInt=true 时取整（温度类测点：899.76 → 900）
function fmtMonVal(v, asInt){
  const n = Number(v);
  if(isNaN(n)) return String(v);
  return asInt ? String(Math.round(n)) : String(Math.round(n*100)/100);
}
// 开关量类型识别（与 isDiscreteSeries 口径保持一致）：用于把 0/1 显示为"关/开"
function isDiscreteSensorType(type){
  if(!type) return false;
  const t = String(type).toUpperCase();
  if(/^(DI|DO|DIGITAL|DISCRETE|SWITCH|BINARY|FLAG|BIT|ONOFF)/.test(t)) return true;
  if(/(DIGITAL|DISCRETE|SWITCH|BIT|FLAG|ONOFF)/.test(t)) return true;
  return false;
}
// 温度类型识别：温度类测点显示整数（如 899.76 → 900），其余类型保留 2 位小数
function isTempSensorType(type){
  return !!type && String(type).indexOf('温度') >= 0;
}
// 按类型格式化监控器数值：开关量 → "开"/"关"，温度 → 整数，其他 → fmtMonVal（最多2位小数）
function fmtMonValByType(v, type){
  if(isDiscreteSensorType(type)){
    const n = Number(v);
    if(isNaN(n)) return '--';
    return n >= 0.5 ? '开' : '关';
  }
  return fmtMonVal(v, isTempSensorType(type));
}
// 刷新画布上所有监控器的实时数值/单位（每监控项一行，开关量 → "开/关"且不显示单位）
function refreshMonitorValues(){
  if(!layerTop) return;
  doc.components.forEach(comp=>{
    if(comp.type!=='monitor') return;
    const g = layerTop.querySelector(`.equip-group[data-id="${comp.id}"]`);
    if(!g) return;
    const tags = (comp.props && comp.props.monitorTags) || [];
    tags.forEach((t,i)=>{
      const live = t.tag ? sensorValueMap[(t.tag||'').trim()] : null;
      const valEl = g.querySelector(`.mon-value[data-i="${i}"]`);
      const unitEl = g.querySelector(`.mon-unit[data-i="${i}"]`);
      if(valEl) valEl.textContent = (live && live.value!=null && live.value!=='') ? fmtMonValByType(live.value, live.type) : '--';
      // 开关量不带单位（避免出现"开 ℃"这种诡异组合）
      if(unitEl) unitEl.textContent = (live && !isDiscreteSensorType(live.type) && live.unit) ? ' '+live.unit : '';
    });
  });
}
// 属性面板：监控项列表（每行 tag + 自定义标签 + 删除）
function renderMonitorTagList(comp){
  const el = $('monTagList'); if(!el) return;
  const tags = comp.props.monitorTags = comp.props.monitorTags || [];
  el.innerHTML = '';
  if(!tags.length){
    el.innerHTML = '<div class="pr-empty" style="padding:10px;font-size:11px;color:var(--text3)">暂无监控项 · 搜索添加 Tag</div>';
    return;
  }
  tags.forEach((t,i)=>{
    const row = document.createElement('div'); row.className='param-row';
    row.innerHTML = `<span class="mon-tag-k" title="${esc(t.tag)}">${esc(t.tag)}</span><input class="pv" value="${esc(t.label||'')}" placeholder="显示标签（默认 Tag）"><button class="pdel" title="删除">×</button>`;
    row.querySelector('.pv').oninput = e=>{ t.label = e.target.value; setDirty(); renderAllDebounced(); };
    row.querySelector('.pdel').onclick = ()=>{ tags.splice(i,1); pushHistory(); renderMonitorTagList(comp); renderAll(); setDirty(); };
    el.appendChild(row);
  });
}
// 属性面板：监控项搜索添加框
function bindMonitorTagSearch(comp){
  const tq = $('monTagSearch'); if(!tq) return;
  const suggest = $('monTagSuggest');
  const renderSuggest = (q)=>{
    if(!suggest) return;
    const cand = tagCandidates();
    const qq=(q||'').trim().toUpperCase();
    let list = Array.from(cand.entries()).filter(([t])=> !qq || t.toUpperCase().includes(qq));
    list = list.slice(0,10);
    const offline = sensorCatalog.length ? '' : TAG_OFFLINE_HINT;
    if(!list.length){ suggest.innerHTML = offline; return; }
    suggest.innerHTML = offline + list.map(([t,meta])=>`<div class="ts-item" data-t="${esc(t)}">${esc(t)}${(meta.type||'')?`<span class="ts-type">${esc(meta.type)}</span>`:''}</div>`).join('');
    suggest.querySelectorAll('.ts-item').forEach(it=>{
      it.onclick = ()=>{
        const tags = comp.props.monitorTags = comp.props.monitorTags || [];
        if(!tags.some(x=>x.tag===it.dataset.t)) tags.push({tag:it.dataset.t, label:''});
        tq.value='';
        suggest.innerHTML='';
        pushHistory();
        renderMonitorTagList(comp);
        renderAll(); setDirty();
      };
    });
  };
  tq.oninput = ()=>renderSuggest(tq.value);
  tq.onblur = ()=>{ setTimeout(()=>{ if(suggest) suggest.innerHTML=''; },150); };
}
/* 属性面板：运行开关位号列表（每行 位号 + 实时值 + 删除） */
function renderRunTagList(comp){
  const el = $('runTagList'); if(!el) return;
  const tags = normalizeRunTags(comp);
  const st = compRunState(comp);
  el.innerHTML = '';
  if(!tags.length){
    el.innerHTML = '<div class="pr-empty" style="padding:10px;font-size:11px;color:var(--text3)">未绑定 · 搜索或回车添加开关 Tag（不绑定则始终运行）</div>';
    return;
  }
  tags.forEach((t,i)=>{
    const info = st.values.find(v=>v.tag === String(t.tag||'').trim()) || {};
    const shown = info.value == null ? '--' : (info.on ? '1' : '0');
    const color = info.value == null ? 'var(--text3)' : (info.on ? 'var(--green)' : 'var(--red)');
    const row = document.createElement('div'); row.className='param-row';
    row.innerHTML = `<span class="mon-tag-k" title="${esc(t.tag)}">${esc(t.tag)}</span>` +
      `<span class="pv" style="flex:0 0 34px;text-align:right;color:${color};font-variant-numeric:tabular-nums" title="实时值">${shown}</span>` +
      `<button class="pdel" title="删除">×</button>`;
    row.querySelector('.pdel').onclick = ()=>{ tags.splice(i,1); pushHistory(); renderRunTagList(comp); renderAll(); setDirty(); };
    el.appendChild(row);
  });
}
/* 属性面板：运行开关位号搜索添加框（可从后端目录选，也可直接回车手工添加） */
function bindRunTagSearch(comp){
  const tq = $('runTagSearch'); if(!tq) return;
  const suggest = $('runTagSuggest');
  const addTag = (tag)=>{
    const v = String(tag||'').trim(); if(!v) return false;
    const tags = normalizeRunTags(comp);
    if(tags.some(x=>String(x.tag||'').trim()===v)) return false;
    tags.push({ tag: v });
    return true;
  };
  const renderSuggest = (q)=>{
    if(!suggest) return;
    const cand = tagCandidates();
    const qq=(q||'').trim().toUpperCase();
    const list = Array.from(cand.entries()).filter(([t])=> !qq || t.toUpperCase().includes(qq)).slice(0,10);
    const offline = sensorCatalog.length ? '' : TAG_OFFLINE_HINT;
    if(!list.length){ suggest.innerHTML = offline; return; }
    suggest.innerHTML = offline + list.map(([t,meta])=>`<div class="ts-item" data-t="${esc(t)}">${esc(t)}${(meta.type||'')?`<span class="ts-type">${esc(meta.type)}</span>`:''}</div>`).join('');
    suggest.querySelectorAll('.ts-item').forEach(it=>{
      it.onclick = ()=>{
        if(addTag(it.dataset.t)){ pushHistory(); renderRunTagList(comp); renderAll(); setDirty(); }
        tq.value=''; suggest.innerHTML='';
      };
    });
  };
  tq.oninput = ()=>renderSuggest(tq.value);
  tq.onfocus = ()=>renderSuggest(tq.value);
  tq.onblur = ()=>{ setTimeout(()=>{ if(suggest) suggest.innerHTML=''; },150); };
  tq.onkeydown = (e)=>{
    if(e.key !== 'Enter') return;
    if(addTag(tq.value)){ pushHistory(); renderRunTagList(comp); renderAll(); setDirty(); }
    tq.value=''; if(suggest) suggest.innerHTML='';
  };
}

/* ============================================================
 * 4. 渲染：增量更新（拖拽时直接修改DOM属性，避免全量重建）
 * ============================================================ */
// 更新单个组件的transform（位置/旋转）
function updateCompTransform(comp){
  const layer = comp.type==='monitor' ? layerTop : layerEquip;
  const g = layer.querySelector(`.equip-group[data-id="${comp.id}"]`);
  if(g) g.setAttribute('transform', `translate(${comp.x},${comp.y}) rotate(${comp.rotation||0} ${comp.w/2} ${comp.h/2})`);
}
// 更新组件名称/位号标签位置
function updateCompLabels(comp){
  const cx = comp.x + comp.w/2, cy = comp.y + comp.h/2;
  const r = (comp.rotation||0) * Math.PI / 180;
  const cos = Math.cos(r), sin = Math.sin(r);
  const nameLbl = layerEquip.querySelector(`.tlabel[data-cid="${comp.id}"]`);
  if(nameLbl){
    const ldx=0, ldy=(comp.props.namePos==='center') ? 4 : -(comp.h/2+6);
    nameLbl.setAttribute('x', cx + ldx*cos - ldy*sin);
    nameLbl.setAttribute('y', cy + ldx*sin + ldy*cos);
  }
  const tagLbl = layerEquip.querySelector(`.ttag[data-cid="${comp.id}"]`);
  if(tagLbl){
    const tdx=0, tdy=(comp.h/2+14);
    tagLbl.setAttribute('x', cx + tdx*cos - tdy*sin);
    tagLbl.setAttribute('y', cy + tdx*sin + tdy*cos);
  }
}
// 更新单根管道的路径和标签位置
function updatePipeGeometry(pipe){
  const pg = layerPipes.querySelector(`.pipe-group[data-id="${pipe.id}"]`);
  if(!pg) return;
  let pts;
  if(pipe.from && pipe.to){
    const c1 = getComp(pipe.from.cid), c2 = getComp(pipe.to.cid);
    if(!c1||!c2) return;
    const p1 = portPos(c1, pipe.from.port), p2 = portPos(c2, pipe.to.port);
    if(!p1||!p2) return;
    pts = routePipe(p1, p1.dir, p2, p2.dir, pipe.bend, pipe.straight);
    pipe._pts = pts;
  } else {
    pts = pipe.points || [];
    pipe._pts = pts;
  }
  if(!pts || pts.length<2) return;
  const d = ptsToPath(pts);
  // 更新glow path和main path
  const paths = pg.querySelectorAll('path');
  if(paths[0]) paths[0].setAttribute('d', d); // glow
  if(paths[1]) paths[1].setAttribute('d', d); // main
  // 更新标签位置
  if(pipe.label){
    const mid = pointAtPolyline(pts, pipe.labelPos==null ? 0.5 : pipe.labelPos);
    const tw = pipeLabelWidth(pipe.label);
    const rects = pg.querySelectorAll('rect');
    const texts = pg.querySelectorAll('text');
    const circles = pg.querySelectorAll('circle');
    if(rects[0]){ rects[0].setAttribute('x', mid.x-tw/2); rects[0].setAttribute('y', mid.y+LABEL_BOX_DY); }
    if(texts[0]){ texts[0].setAttribute('x', mid.x); texts[0].setAttribute('y', mid.y+LABEL_TEXT_DY); }
    if(circles[0]){ circles[0].setAttribute('cx', mid.x); circles[0].setAttribute('cy', mid.y); }
  }
}
// 收集一组组件关联的所有管道（去重）
function collectAffectedPipes(compIds){
  const set = new Set();
  compIds.forEach(id=>{
    getPipesForComp(id).forEach(p=>set.add(p));
  });
  return set;
}
// 增量移动组件：更新transform + 标签 + 关联管道
function incrementalMove(comps){
  const affectedPipes = collectAffectedPipes(comps.map(c=>c.id));
  comps.forEach(c=>{
    updateCompTransform(c);
    updateCompLabels(c);
  });
  affectedPipes.forEach(p=>updatePipeGeometry(p));
  refreshMonitorLeads();
}
/* 拖拽改尺寸的增量刷新：拖拽过程中只更新 transform（外框 + 内容等比缩放预览）、标签、
   相连管道与选中框；松手时 mouseup 里本来就会 renderAll() 一次，内容按新尺寸重画。
   原来这里每帧直接 renderAll() —— 12 个组件就要 22.5ms/帧（约 3 帧预算），改尺寸必然卡。
   内容预览用 scale：把按【旧尺寸】渲染的内容缩放到新尺寸，中心对齐，旋转与镜像一并处理。 */
function incrementalResize(comp, ow, oh){
  if(!comp) return;
  updateCompTransform(comp);
  updateCompLabels(comp);
  const layer = comp.type==='monitor' ? layerTop : layerEquip;
  const g = layer.querySelector(`.equip-group[data-id="${comp.id}"]`);
  const inner = g && g.children && g.children[0];
  if(inner && ow>0 && oh>0 && comp.w>0 && comp.h>0){
    const sx = comp.w/ow, sy = comp.h/oh;
    const mirrored = !!(comp.props && comp.props.mirrored);
    const cx0 = ow/2, cy0 = oh/2, cx1 = comp.w/2, cy1 = comp.h/2;
    const tx = mirrored ? cx1 + cx0*sx : cx1 - cx0*sx;
    const ty = cy1 - cy0*sy;
    inner.setAttribute('transform',
      `translate(${tx.toFixed(2)},${ty.toFixed(2)}) scale(${(mirrored?-sx:sx).toFixed(4)},${sy.toFixed(4)})`);
  }
  collectAffectedPipes([comp.id]).forEach(p=>updatePipeGeometry(p));
  renderOverlay();
}
// 增量调整管道折点
function incrementalBend(pipe){
  updatePipeGeometry(pipe);
  refreshMonitorLeads();
}
// 增量拖动管道标签
function incrementalLabelDrag(pipe){
  const pg = layerPipes.querySelector(`.pipe-group[data-id="${pipe.id}"]`);
  if(!pg || !pipe._pts) return;
  const pts = pipe._pts;
  const mid = pointAtPolyline(pts, pipe.labelPos==null ? 0.5 : pipe.labelPos);
  const tw = pipeLabelWidth(pipe.label);
  const rects = pg.querySelectorAll('rect');
  const texts = pg.querySelectorAll('text');
  const circles = pg.querySelectorAll('circle');
  if(rects[0]){ rects[0].setAttribute('x', mid.x-tw/2); rects[0].setAttribute('y', mid.y+LABEL_BOX_DY); }
  if(texts[0]){ texts[0].setAttribute('x', mid.x); texts[0].setAttribute('y', mid.y+LABEL_TEXT_DY); }
  if(circles[0]){ circles[0].setAttribute('cx', mid.x); circles[0].setAttribute('cy', mid.y); }
}

function createSVG(tag){ return document.createElementNS(SVG_NS, tag); }

/* ============================================================
 * 5. 渲染：覆盖层（缩放手柄、连线橡皮筋预览、管道折点）
 * ============================================================ */
const HANDLES = ['nw','n','ne','e','se','s','sw','w'];
function handleLocal(h, w, hh){
  switch(h){
    case 'nw': return [0,0]; case 'n': return [w/2,0]; case 'ne': return [w,0];
    case 'e': return [w,hh/2]; case 'se': return [w,hh]; case 's': return [w/2,hh];
    case 'sw': return [0,hh]; case 'w': return [0,hh/2];
  }
  return [w/2,hh/2];
}
function handleCursor(h){
  return {nw:'nwse-resize', n:'ns-resize', ne:'nesw-resize', e:'ew-resize',
          se:'nwse-resize', s:'ns-resize', sw:'nesw-resize', w:'ew-resize'}[h]||'default';
}
// 组件本地坐标(相对左上) -> 世界坐标(考虑旋转)
function localToWorld(comp, lx, ly){
  const cx=comp.x+comp.w/2, cy=comp.y+comp.h/2;
  const a=(comp.rotation||0)*Math.PI/180, ca=Math.cos(a), sa=Math.sin(a);
  const px=comp.x+lx, py=comp.y+ly;
  const dx=px-cx, dy=py-cy;
  return {x:cx+dx*ca-dy*sa, y:cy+dx*sa+dy*ca};
}
function previewPath(p1, dir, p2){
  const s = stubPoint(p1, dir, STUB);
  let d = `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} L ${s.x.toFixed(1)} ${s.y.toFixed(1)}`;
  if(dir==='left'||dir==='right'){ d += ` L ${p2.x.toFixed(1)} ${s.y.toFixed(1)} L ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`; }
  else { d += ` L ${s.x.toFixed(1)} ${p2.y.toFixed(1)} L ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`; }
  return d;
}
function renderOverlay(){
  const ov = layerOverlay; ov.innerHTML = '';
  // 连线橡皮筋预览
  if(connectState && connectState.from){
    const c = getComp(connectState.from.cid);
    if(c){
      const p1 = portPos(c, connectState.from.port);
      if(p1){
        const path = createSVG('path');
        path.setAttribute('d', previewPath(p1, p1.dir, cursorPos));
        path.setAttribute('fill','none'); path.setAttribute('stroke','#00E5FF');
        path.setAttribute('stroke-width','2'); path.setAttribute('stroke-dasharray','5 4');
        path.setAttribute('opacity','0.9'); path.style.pointerEvents='none';
        ov.appendChild(path);
        const m = createSVG('circle');
        m.setAttribute('cx',cursorPos.x); m.setAttribute('cy',cursorPos.y); m.setAttribute('r',4);
        m.setAttribute('fill','#00E5FF'); m.style.pointerEvents='none';
        ov.appendChild(m);
      }
    }
  }
  // 选中组件的缩放手柄(仅单个选中且未旋转时显示)
  const _sc = selSingle();
  if(_sc && _sc.kind==='component'){
    const comp = getComp(_sc.id);
    if(comp && (!comp.rotation || comp.rotation===0)){
      HANDLES.forEach(h=>{
        const [lx,ly] = handleLocal(h, comp.w, comp.h);
        const w = localToWorld(comp, lx, ly);
        const r = createSVG('rect');
        r.setAttribute('x', w.x-4); r.setAttribute('y', w.y-4);
        r.setAttribute('width',8); r.setAttribute('height',8); r.setAttribute('rx',1.5);
        r.setAttribute('fill','#0a0a1a'); r.setAttribute('stroke','#00E5FF');
        r.setAttribute('stroke-width',1.5); r.setAttribute('class','resize-handle');
        r.setAttribute('data-handle', h); r.style.cursor = handleCursor(h);
        ov.appendChild(r);
      });
    }
  }
  // 选中管道的折点拖拽手柄(中间转折点)
  if(_sc && _sc.kind==='pipe'){
    const pipe = getPipe(_sc.id);
    if(pipe && pipe._pts && pipe._pts.length>=4){
      const mid = pipe._pts[Math.floor(pipe._pts.length/2)];
      const c = createSVG('circle');
      c.setAttribute('cx',mid.x); c.setAttribute('cy',mid.y); c.setAttribute('r',5);
      c.setAttribute('fill','#00E5FF'); c.setAttribute('stroke','#0a0a1a'); c.setAttribute('stroke-width',1.5);
      c.setAttribute('class','pipe-bend-handle'); c.setAttribute('data-id', pipe.id);
      c.style.cursor='move';
      ov.appendChild(c);
    }
  }
  // 监控器归属折线端点拖拽把手（折线关闭时不出现，避免误导）
  if(_sc && _sc.kind==='component'){
    const mcomp = getComp(_sc.id);
    if(mcomp && mcomp.type==='monitor' && mcomp.props.showLead !== false){
      const t = monitorLeadTarget(mcomp) || { x: mcomp.x+mcomp.w+60, y: mcomp.y+mcomp.h/2 };
      const c = createSVG('circle');
      c.setAttribute('cx', t.x); c.setAttribute('cy', t.y); c.setAttribute('r',6);
      c.setAttribute('fill','#00E5FF'); c.setAttribute('stroke','#0a0a1a'); c.setAttribute('stroke-width',1.5);
      c.setAttribute('class','lead-handle'); c.dataset.id = mcomp.id;
      c.style.cursor='crosshair';
      ov.appendChild(c);
    }
  }
  // 框选矩形
  if(marqueeState){
    const r = createSVG('rect');
    const x = Math.min(marqueeState.sx, marqueeState.ex);
    const y = Math.min(marqueeState.sy, marqueeState.ey);
    const w = Math.abs(marqueeState.ex - marqueeState.sx);
    const h = Math.abs(marqueeState.ey - marqueeState.sy);
    r.setAttribute('x',x); r.setAttribute('y',y); r.setAttribute('width',w); r.setAttribute('height',h);
    r.setAttribute('fill','#00E5FF11'); r.setAttribute('stroke','#00E5FF');
    r.setAttribute('stroke-width',1); r.setAttribute('stroke-dasharray','4 3');
    r.style.pointerEvents='none';
    ov.appendChild(r);
  }
}

/* ============================================================
 * 6. 坐标转换
 * ============================================================ */
// getScreenCTM 求逆开销较高且结果仅在 pan/zoom/resize 时变化，缓存之
let _ctmInv = null;
function invalidateCTM(){ _ctmInv = null; }
function screenToSVG(clientX, clientY){
  if(!_ctmInv){
    const m = svg.getScreenCTM();
    if(!m) return { x:0, y:0 };
    _ctmInv = m.inverse();
  }
  const pt = svg.createSVGPoint();
  pt.x = clientX; pt.y = clientY;
  return pt.matrixTransform(_ctmInv);
}

/* ============================================================
 * 7. 组件库面板
 * ============================================================ */
/* 已折叠的分类（会话内保留：搜索重建面板时不丢折叠状态；刷新页面即恢复全展开） */
const collapsedCats = new Set();

/* 组件库缩略图：剥掉 SMIL + 按类型缓存。
   原来图标是"完整模板渲染"，34 个图标一共 5561 个 DOM 节点、2109 个 SMIL 动画节点，
   而且组件库不在 #canvas 内、不受编辑态 pauseAnimations() 管控 —— 打开编辑器什么都不做，
   这 2109 个动画也一直在后台跑。缩略图是静态的，一律 stripSMIL。
   缓存还顺带解决了"组件库搜索框每敲一个字就重建 34 个模板（实测 65.6ms）"的问题。 */
const _palThumbCache = new Map();
function paletteThumb(type, t){
  if(_palThumbCache.has(type)) return _palThumbCache.get(type);
  const sz = (t && t.defaultSize) || { w: 100, h: 100 };
  let inner = '';
  try{ inner = (t && typeof t.render === 'function') ? (t.render(sz.w, sz.h, { color:'#9C99FF', tag:'?' }) || '') : ''; }catch(e){ inner = ''; }
  const sv = `<svg viewBox="0 0 ${sz.w} ${sz.h}" preserveAspectRatio="xMidYMid meet">${stripSMIL(inner)}</svg>`;
  _palThumbCache.set(type, sv);
  return sv;
}
function buildPalette(filter=''){
  const list = $('paList'); list.innerHTML = '';
  const cats = {};
  Object.entries(TEMPLATES).forEach(([key,t])=>{
    if(filter && !t.name.toLowerCase().includes(filter.toLowerCase()) && !key.includes(filter.toLowerCase())) return;
    (cats[t.category] = cats[t.category]||[]).push([key,t]);
  });
  // 分组顺序以 CATEGORY_ORDER 为准；未登记的兜底补在末尾（顺序规则见 templates.js 头部注释）
  const order = CATEGORY_ORDER.filter(c=>cats[c]);
  Object.keys(cats).forEach(c=>{ if(!order.includes(c)) order.push(c); });

  order.forEach(cat=>{
    const items = cats[cat];
    const group = document.createElement('div'); group.className='pa-group';
    // 搜索时一律展开：命中项若被折叠隐藏，搜索就白搜了
    if(!filter && collapsedCats.has(cat)) group.classList.add('collapsed');

    const h = document.createElement('div'); h.className='pa-cat'; h.textContent=cat;
    h.addEventListener('click', ()=>{
      if(group.classList.toggle('collapsed')) collapsedCats.add(cat); else collapsedCats.delete(cat);
    });
    const body = document.createElement('div'); body.className='pa-group-body';
    items.forEach(([key,t])=>{
      const el = document.createElement('div'); el.className='pa-item'; el.dataset.type=key;
      const ic = document.createElement('div'); ic.className='pa-icon';
      ic.innerHTML = paletteThumb(key, t);
      const nm = document.createElement('div');
      // 审计 5.7：原来用 innerHTML 拼接模板名，与本文件其余 40+ 处 esc() 写法不一致；
      // 改用 textContent，彻底消除拼接注入面（当前 t.name 来自模板常量，属纵深防御）。
      const nmInner = document.createElement('div');
      nmInner.className = 'pa-name';
      nmInner.textContent = t.name;
      nm.appendChild(nmInner);
      el.appendChild(ic); el.appendChild(nm);
      el.addEventListener('mousedown', e=>startPaletteDrag(e, key));
      body.appendChild(el);
    });
    group.appendChild(h); group.appendChild(body); list.appendChild(group);
  });
}

/* ============================================================
 * 8. 拖拽：从组件库到画布
 * ============================================================ */
let dragGhost = null, dragType = null;
function startPaletteDrag(e, type){
  e.preventDefault();
  dragType = type;
  const t = TEMPLATES[type];
  dragGhost = document.createElement('div'); dragGhost.className='drag-ghost';
  dragGhost.innerHTML = paletteThumb(type, t);   // 复用剥掉 SMIL 的缓存缩略图
  document.body.appendChild(dragGhost);
  moveGhost(e);
  document.addEventListener('mousemove', onPaletteDragMove);
  document.addEventListener('mouseup', onPaletteDragUp);
  e.target.closest('.pa-item').classList.add('dragging');
}
function moveGhost(e){ if(dragGhost){ dragGhost.style.left=e.clientX+'px'; dragGhost.style.top=e.clientY+'px'; } }
function onPaletteDragMove(e){ moveGhost(e); }
function onPaletteDragUp(e){
  document.removeEventListener('mousemove', onPaletteDragMove);
  document.removeEventListener('mouseup', onPaletteDragUp);
  document.querySelectorAll('.pa-item.dragging').forEach(el=>el.classList.remove('dragging'));
  if(!dragGhost) return;
  const rect = svg.getBoundingClientRect();
  if(e.clientX>=rect.left && e.clientX<=rect.right && e.clientY>=rect.top && e.clientY<=rect.bottom){
    const sp = screenToSVG(e.clientX, e.clientY);
    const t = TEMPLATES[dragType];
    addComponent(dragType, snapV(sp.x - t.defaultSize.w/2), snapV(sp.y - t.defaultSize.h/2));
  }
  dragGhost.remove(); dragGhost=null; dragType=null;
}

function addComponent(type, x, y){
  const t = TEMPLATES[type];
  const props = { name: t.name, tag: '', color: '#9C99FF', params: [] };
  if(type==='monitor'){
    props.color = '#00E5FF';
    props.monitorTags = [];   // [{tag, label}] 任意多个监控项
    props.lead = { targetType:'point', x: x + t.defaultSize.w + 60, y: y + t.defaultSize.h/2 }; // 归属指向折线（默认右侧自由点，可拖拽吸附设备/端口/管道）
  }
  if(type==='rotaryKiln'){
    // 预设 1# 窑 4 个体温点，沿窑体从左到右颜色渐变（可自行修改）
    props.tempPoints = [
      { tag:'1#窑体温度TI_206A' },
      { tag:'1#窑体温度TI_206B' },
      { tag:'1#窑体温度TI_206E' },
      { tag:'1#窑体温度TI_206F' }
    ];
  }
  if(type==='productTankDual'){
    // 双格成品储罐：写入两格默认标注（默认值定义在 templates/productTankDual.js，模板与面板共用）
    Object.assign(props, productTankDualDefaults());
  }
  if(type==='switchValve'){
    // 三通阀：支持手动（默认）与自动（绑定 A/B 开关量 sensor，互斥切换）
    props.switchValve = (props.switchValve===0 || props.switchValve===1) ? props.switchValve : 0;
    props.controlMode = props.controlMode || 'manual';
    props.sensorA = props.sensorA || '';
    props.sensorB = props.sensorB || '';
  }
  const comp = {
    id: uid('c'), type, x, y, w: t.defaultSize.w, h: t.defaultSize.h, rotation:0,
    props
  };
  doc.components.push(comp);
  pushHistory();
  selOnly('component', comp.id);
  renderAll(); renderProps();
  setDirty();
}

/* ============================================================
 * 9. 画布交互：选中/移动/端口连线/平移
 * ============================================================ */
let connectState = null; // {from:{cid,port}}
let movingState = null;  // {cid, ox, oy, startCX, startCY}
let panningState = null; // {sx, sy, px, py}
let resizeState = null;  // {id, handle, sx, sy, ox, oy, ow, oh}
let bendState = null;    // {id, sx, sy}
let labelDragState = null; // {id, pts}
let marqueeState = null; // {sx, sy, ex, ey, additive}
let leadDragState = null; // {id} 监控器归属折线端点拖拽
let clipboard = null;    // 复制粘贴
let cursorPos = {x:0,y:0};
let spaceDown = false;
let downPoint = null;
/* 拖拽/平移期间给 svg 加 dragging 类（CSS 切到 optimizeSpeed 渲染），降低光栅化成本 */
function setDraggingHint(on){ if(svg) svg.classList.toggle('dragging', !!on); }

if(_isEditor){
svg.addEventListener('mousedown', e=>{
  if(e.button===1 || (spaceDown && e.button===0)){ // pan
    panningState = { sx:e.clientX, sy:e.clientY, px:panX, py:panY };
    svg.classList.add('panning');
    setDraggingHint(true);
    return;
  }
  const sp = screenToSVG(e.clientX, e.clientY);
  downPoint = sp;
  const target = e.target;

  // 缩放手柄
  if(target.classList && target.classList.contains('resize-handle')){
    const sc = selSingle();
    if(sc && sc.kind==='component'){
      const comp = getComp(sc.id);
      if(comp){
        resizeState = {id:sc.id, handle:target.dataset.handle, sx:sp.x, sy:sp.y, ox:comp.x, oy:comp.y, ow:comp.w, oh:comp.h};
      setDraggingHint(true);
        e.preventDefault();
      }
    }
    return;
  }
  // 管道折点拖拽
  if(target.classList && target.classList.contains('pipe-bend-handle')){
    bendState = {id:target.dataset.id, sx:sp.x, sy:sp.y};
    setDraggingHint(true);
    e.preventDefault();
    return;
  }
  // 管道标签沿线拖动
  if(target.classList && target.classList.contains('pipe-label-handle')){
    labelDragState = {id:target.dataset.id, pts:null};
    setDraggingHint(true);
    e.preventDefault();
    return;
  }
  // 监控器归属折线端点拖拽
  if(target.classList && target.classList.contains('lead-handle')){
    leadDragState = {id:target.dataset.id};
    setDraggingHint(true);
    e.preventDefault();
    return;
  }

  // 端口点击 → 连线
  if(target.classList && target.classList.contains('port')){
    const cid = target.dataset.cid, port = target.dataset.port;
    if(!connectState){
      connectState = { from:{cid, port} };
      setMode('connect');
      applyPortActive(); renderOverlay();
    } else {
      if(connectState.from.cid===cid && connectState.from.port===port){
        // 取消
        connectState=null; setMode('select'); applyPortActive(); renderOverlay();
      } else {
        // 建立管道
        addPipe(connectState.from, {cid, port});
        connectState=null; setMode('select'); renderAll();
      }
    }
    return;
  }

  // 选中组件
  const grp = target.closest('.equip-group');
  if(grp){
    const id = grp.dataset.id;
    if(e.shiftKey){ selToggle('component', id); }
    else if(!selHas('component', id)){ selOnly('component', id); }
    // 组移动：移动所有已选组件
    const comps = selComps();
    movingState = { items: comps.map(c=>({id:c.id, ox:c.x, oy:c.y})), sx: sp.x, sy: sp.y, moved:false };
    setDraggingHint(true);
    applySelectionClasses(); renderProps();
    return;
  }
  // 选中管道
  const pg = target.closest('.pipe-group');
  if(pg){
    const id = pg.dataset.id;
    if(e.shiftKey){ selToggle('pipe', id); }
    else if(!selHas('pipe', id)){ selOnly('pipe', id); }
    applySelectionClasses(); renderProps();
    return;
  }
  // 空白：取消连线 / 框选
  if(connectState){ connectState=null; setMode('select'); applyPortActive(); renderOverlay(); renderProps(); return; }
  if(!e.shiftKey) selClear();
  marqueeState = { sx:sp.x, sy:sp.y, ex:sp.x, ey:sp.y, additive:e.shiftKey };
  applySelectionClasses(); renderProps();
});

/* rAF 节流：合并一帧内多次mousemove，避免高频重绘 */
let _moveRafPending = false;
let _latestMoveEvent = null;
function onMouseMove(e){
  _latestMoveEvent = e;
  if(_moveRafPending) return;
  _moveRafPending = true;
  requestAnimationFrame(()=>{
    _moveRafPending = false;
    const ev = _latestMoveEvent;
    if(!ev) return;
    processMouseMove(ev);
  });
}
function processMouseMove(e){
  const sp = screenToSVG(e.clientX, e.clientY);
  cursorPos = sp;
  $('stXY').textContent = `${Math.round(sp.x)}, ${Math.round(sp.y)}`;
  if(panningState){
    const dx = (e.clientX-panningState.sx)/zoom, dy=(e.clientY-panningState.sy)/zoom;
    panX = panningState.px+dx; panY = panningState.py+dy;
    applyView();
    return;
  }
  if(resizeState){
    const comp = getComp(resizeState.id);
    if(comp){
      const dx=sp.x-resizeState.sx, dy=sp.y-resizeState.sy;
      const {ox,oy,ow,oh,handle}=resizeState;
      const MIN=20;
      let nx=ox, ny=oy, nw=ow, nh=oh;
      if(handle.indexOf('e')>=0) nw=Math.max(MIN, ow+dx);
      if(handle.indexOf('s')>=0) nh=Math.max(MIN, oh+dy);
      if(handle.indexOf('w')>=0){ nw=Math.max(MIN, ow-dx); nx=ox+(ow-nw); }
      if(handle.indexOf('n')>=0){ nh=Math.max(MIN, oh-dy); ny=oy+(oh-nh); }
      comp.x=snapV(nx); comp.y=snapV(ny); comp.w=nw; comp.h=nh;
      // 拖拽过程中走增量刷新（外框 + 内容缩放预览 + 相连管道），松手时 mouseup 再全量重建一次
      incrementalResize(comp, resizeState.ow, resizeState.oh);
      renderPropsLive(); setDirty();
    }
    return;
  }
  if(bendState){
    const pipe = getPipe(bendState.id);
    if(pipe){ pipe.bend={x:snapV(sp.x), y:snapV(sp.y)}; incrementalBend(pipe); renderOverlay(); setDirty(); }
    return;
  }
  if(labelDragState){
    const pipe = getPipe(labelDragState.id);
    if(pipe){
      if(!labelDragState.pts) labelDragState.pts = pipe._pts || [];
      pipe.labelPos = nearestTOnPolyline(labelDragState.pts, sp);
      incrementalLabelDrag(pipe); setDirty();
    }
    return;
  }
  if(leadDragState){
    const comp = getComp(leadDragState.id);
    if(comp){
      leadDragState.lastSp = sp;
      comp.props.lead = Object.assign({}, comp.props.lead, { targetType:'point', x:snapV(sp.x), y:snapV(sp.y) });
      updateMonitorLead(comp);
      renderOverlay();
      setDirty();
    }
    return;
  }
  if(marqueeState){
    marqueeState.ex = sp.x; marqueeState.ey = sp.y;
    renderOverlay();
    return;
  }
  if(movingState){
    const dx = sp.x - movingState.sx, dy = sp.y - movingState.sy;
    if(Math.abs(dx)>0.5 || Math.abs(dy)>0.5) movingState.moved = true;
    const movedComps = [];
    movingState.items.forEach(it=>{
      const comp = getComp(it.id);
      if(comp){ comp.x = snapV(it.ox + dx); comp.y = snapV(it.oy + dy); movedComps.push(comp); }
    });
    incrementalMove(movedComps);
    renderOverlay();
    renderPropsLive(); setDirty();
    return;
  }
  if(connectState){ renderOverlay(); }
}
svg.addEventListener('mousemove', onMouseMove);
window.addEventListener('mouseup', ()=>{
  setDraggingHint(false);
  let needFullRender = false;
  if(movingState){ if(movingState.moved){ pushHistory(); needFullRender=true; } movingState=null; }
  if(resizeState){ pushHistory(); needFullRender=true; resizeState=null; }
  if(bendState){ pushHistory(); needFullRender=true; bendState=null; }
  if(labelDragState){ pushHistory(); needFullRender=true; labelDragState=null; }
  if(leadDragState){
    const comp = getComp(leadDragState.id);
    if(comp && leadDragState.lastSp){
      // 松手时执行智能吸附（端点位置取最后一次鼠标位置；未实际拖动则保持原目标不变）
      const snapped = snapLeadTarget(comp, leadDragState.lastSp);
      const bend = comp.props.lead && comp.props.lead.bend;
      comp.props.lead = snapped;
      if(bend) comp.props.lead.bend = bend;
      pushHistory();
      needFullRender = true;
    }
    leadDragState=null;
  }
  if(needFullRender){ renderAll(); renderProps(); }
  if(marqueeState){
    // 选框内的组件加入选择
    const x1=Math.min(marqueeState.sx,marqueeState.ex), x2=Math.max(marqueeState.sx,marqueeState.ex);
    const y1=Math.min(marqueeState.sy,marqueeState.ey), y2=Math.max(marqueeState.sy,marqueeState.ey);
    if(Math.abs(x2-x1)>3 || Math.abs(y2-y1)>3){
      if(!marqueeState.additive) selClear();
      doc.components.forEach(c=>{
        const cx=c.x, cy=c.y, cw=c.w, ch=c.h;
        // 包围盒相交
        if(cx< x2 && cx+cw>x1 && cy<y2 && cy+ch>y1){ selAdd('component', c.id); }
      });
    }
    marqueeState=null; applySelectionClasses(); renderProps();
  }
  if(panningState){ panningState=null; svg.classList.remove('panning'); }
});

// 滚轮交互：普通滚动缩放，Shift+滚轮左右平移，Ctrl+滚轮上下平移
svg.addEventListener('wheel', e=>{
  e.preventDefault();
  if(e.shiftKey){
    // Shift+滚轮：左右平移
    const step = e.deltaY * 0.8;
    panX += step;
    applyView();
  } else if(e.ctrlKey || e.metaKey){
    // Ctrl+滚轮：上下平移
    const step = e.deltaY * 0.8;
    panY += step;
    applyView();
  } else {
    // 普通滚轮：缩放
    const factor = e.deltaY<0 ? 1.1 : 0.9;
    const newZoom = Math.max(VIEW_ZOOM_MIN, Math.min(VIEW_ZOOM_MAX, zoom*factor));
    // 以鼠标为中心缩放
    const sp = screenToSVG(e.clientX, e.clientY);
    zoom = newZoom;
    applyView();
    const sp2 = screenToSVG(e.clientX, e.clientY);
    // 修正：补偿量应为缩放前后 SVG 坐标差值，保证鼠标位置固定
    panX += (sp.x - sp2.x); panY += (sp.y - sp2.y);
    applyView();
  }
},{passive:false});
} // _isEditor

function applyView(){
  const vb = svg.viewBox.baseVal;
  // 用 viewBox 实现 pan/zoom：基础 2000x1200
  const bw = 2000/zoom, bh = 1200/zoom;
  vb.x = panX; vb.y = panY; vb.width = bw; vb.height = bh;
  invalidateCTM();
  $('zoomVal').textContent = Math.round(zoom*100)+'%';
  $('stZoom').textContent = Math.round(zoom*100)+'%';
}
function resetView(){ zoom=1; panX=0; panY=0; applyView(); }
function zoomBy(f){ zoom=Math.max(VIEW_ZOOM_MIN,Math.min(VIEW_ZOOM_MAX,zoom*f)); applyView(); }
function zoomFit(){
  if(!doc.components.length){ resetView(); return; }
  let minX=1e9,minY=1e9,maxX=-1e9,maxY=-1e9;
  for(let i=0;i<doc.components.length;i++){
    const c = doc.components[i];
    minX=Math.min(minX,c.x); minY=Math.min(minY,c.y);
    maxX=Math.max(maxX,c.x+c.w); maxY=Math.max(maxY,c.y+c.h);
  }
  const w=maxX-minX+100, h=maxY-minY+100;
  const rect = svg.getBoundingClientRect();
  zoom = Math.min(rect.width/w, rect.height/h);
  panX = minX-50; panY = minY-50;
  applyView();
}
function rotateCW(){
  const comps = selComps(); if(!comps.length) return;
  comps.forEach(c=>{ c.rotation = ((c.rotation||0) + 90) % 360; });
  pushHistory(); renderAll(); renderProps(); setDirty();
}
function rotateCCW(){
  const comps = selComps(); if(!comps.length) return;
  comps.forEach(c=>{ c.rotation = ((c.rotation||0) - 90 + 360) % 360; });
  pushHistory(); renderAll(); renderProps(); setDirty();
}
function toggleMirror(){
  const comps = selComps(); if(!comps.length) return;
  comps.forEach(c=>{ c.props.mirrored = !c.props.mirrored; });
  pushHistory(); renderAll(); renderProps(); setDirty();
}

/* ============================================================
 * 10. 管道
 * ============================================================ */
function addPipe(from, to){
  // 磁吸合线：若已存在连接相同两个端口(方向任意)的管道，合并为一条，不产生重复线
  // 注意：此处遍历所有管道是必要的（重复检测），但addPipe仅在连线鼠标松开时触发，频率极低，O(n)可接受
  let dup = null;
  for(let i=0;i<doc.pipes.length;i++){ if(sameConnection(doc.pipes[i], from, to)){ dup=doc.pipes[i]; break; } }
  if(dup){
    flash('已磁吸合线：该连接已存在');
    selOnly('pipe', dup.id);
    renderAll(); renderProps();
    return;
  }
  const pipe = {
    id: uid('p'), type: 'solid', from, to, label:'', width:2.5, labelPos:0.5
  };
  doc.pipes.push(pipe);
  pushHistory();
  selOnly('pipe', pipe.id);
  renderAll(); renderProps();
  setDirty();
}

/* 判断两条管道是否连接同一对端口（不管方向）。
   审计 §5.6：外部导入/旧版本数据可能缺 from/to，直接读 .cid 会抛 TypeError 导致连线中断 ——
   这里做防御性解析，结构不完整的管道一律视为"不构成重复连接"（由入口校验负责提示）。 */
function sameConnection(p, from, to){
  const port = (o)=> (o && typeof o === 'object') ? { cid:o.cid, port:o.port } : null;
  const a = port(from), b = port(to), f = port(p && p.from), t = port(p && p.to);
  if(!a || !b || !f || !t) return false;
  const same = (x,y)=> !!x && !!y && x.cid===y.cid && x.port===y.port;
  return (same(f,a) && same(t,b)) || (same(f,b) && same(t,a));
}

/* ============================================================
 * 11. 属性面板
 *   布局：卡片式分组（标题可点折叠，折叠状态按标题记忆、切组件后保持）。
 * ============================================================ */
const fgCollapsed = Object.create(null);   // { 分组标题: true } —— 会话内记住折叠状态
function bindFgCollapse(scope){
  if(!scope) return;
  scope.querySelectorAll('.fg').forEach(fg=>{
    const head = fg.querySelector('.fg-title');
    if(!head) return;
    const key = head.textContent.trim();
    if(fgCollapsed[key]) fg.classList.add('collapsed');
    head.onclick = ()=>{
      fg.classList.toggle('collapsed');
      fgCollapsed[key] = fg.classList.contains('collapsed');
    };
  });
}
// 输入防抖：连续输入时延迟执行，避免每次按键都触发整幅画布重渲染
function debounce(fn, ms){
  let t;
  return function(...args){
    clearTimeout(t);
    t = setTimeout(()=>fn.apply(this,args), ms);
  };
}
/* 属性面板输入共用的防抖渲染（模块级单例）。
   必须在模块级只创建一次：若在每次重建属性列表时新建防抖函数，
   先前排队的定时器会成为孤儿、无法被后续输入取消，防抖即失效。 */
const renderAllDebounced = debounce(()=>{ renderAll(); setDirty(); }, 180);
function renderProps(){
  const body = $('prBody');
  const headIcon = $('prIcon'), headTitle = $('prTitle'), headSub = $('prSub');
  if(selection.length===0){
    headIcon.textContent='—'; headTitle.textContent='未选中'; headSub.textContent='在画布上点击元素以编辑';
    body.innerHTML = `<div class="pr-empty"><svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg><div>选中一个组件或管道<br>即可在此编辑属性</div></div>`;
    return;
  }
  // 多选
  if(selection.length>1){
    const nComp = selection.filter(s=>s.kind==='component').length;
    const nPipe = selection.filter(s=>s.kind==='pipe').length;
    headIcon.textContent='多'; headTitle.textContent='多选'; headSub.textContent = `${nComp} 组件 · ${nPipe} 管道`;
    body.innerHTML = `
      <div class="fg">
        <div class="fg-title">对齐与分布(仅组件)</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px">
          <button class="pr-btn" data-align="left">左对齐</button>
          <button class="pr-btn" data-align="right">右对齐</button>
          <button class="pr-btn" data-align="top">顶对齐</button>
          <button class="pr-btn" data-align="bottom">底对齐</button>
          <button class="pr-btn" data-align="centerH">水平居中</button>
          <button class="pr-btn" data-align="centerV">垂直居中</button>
          <button class="pr-btn" data-align="distH">水平等距</button>
          <button class="pr-btn" data-align="distV">垂直等距</button>
        </div>
      </div>
      <div class="fg">
        <div class="fg-title">批量</div>
        <div class="fg-row"><label>统一颜色</label><input type="color" id="mColor" value="#9C99FF"></div>
      </div>
      <div class="pr-actions">
        <button class="dup" id="btnDup">复制全部</button>
        <button class="del" id="btnDelComp">删除全部</button>
      </div>
    `;
    body.querySelectorAll('[data-align]').forEach(b=>{
      b.onclick = ()=>{ alignSelection(b.dataset.align); };
    });
    const mc = $('mColor');
    if(mc) mc.oninput = e=>{ selComps().forEach(c=>{ c.props.color=e.target.value; }); setDirty(); renderAllDebounced(); };
    $('btnDup').onclick = duplicateComp;
    $('btnDelComp').onclick = deleteSelected;
    return;
  }
  const sel = selection[0];
  if(sel.kind==='component'){
    const comp = getComp(sel.id); if(!comp) return;
    const t = TEMPLATES[comp.type];
    if(comp.type==='productTankDual') normalizeDualTankProps(comp);   // 补两格默认标注，面板与画布取值一致
    headIcon.textContent = t.name.slice(0,1); headTitle.textContent = comp.props.name||t.name; headSub.textContent = `${t.name} · ${comp.id}`;
    const params = comp.props.params || [];
    body.innerHTML = `
      <div class="fg">
        <div class="fg-title">基本</div>
        <div class="fg-row"><label>名称</label><input id="pName" value="${esc(comp.props.name||'')}"></div>
        ${comp.type!=='monitor' ? `<div class="fg-row"><label>位号</label><input id="pTag" value="${esc(comp.props.tag||'')}"></div>` : ''}
        ${(comp.type!=='text' && comp.type!=='monitor') ? `<div class="fg-row"><label>名称位置</label><div class="btn-group" id="namePosGroup"><button class="pr-btn s-btn ${comp.props.namePos==='center'?'':'active'}" data-np="top">顶部</button><button class="pr-btn s-btn ${comp.props.namePos==='center'?'active':''}" data-np="center">居中</button></div></div>` : ''}
        <div class="fg-row"><label>颜色</label><div class="color-row"><input type="color" id="pColor" value="${comp.props.color||'#9C99FF'}"><input id="pColorT" value="${comp.props.color||'#9C99FF'}"></div></div>
      </div>
      <div class="fg">
        <div class="fg-title">几何</div>
        <div class="fg-row2">
          <div class="fld"><label title="横坐标">X</label><input type="number" id="pX" value="${Math.round(comp.x)}"></div>
          <div class="fld"><label title="纵坐标">Y</label><input type="number" id="pY" value="${Math.round(comp.y)}"></div>
        </div>
        <div class="fg-row2">
          <div class="fld"><label title="宽度">宽</label><input type="number" id="pW" value="${Math.round(comp.w)}"></div>
          ${comp.type!=='monitor'
            ? `<div class="fld"><label title="高度">高</label><input type="number" id="pH" value="${Math.round(comp.h)}"></div>`
            : `<div class="fld"><label title="高度">高</label><input value="随监控项自动" readonly></div>`}
        </div>
        <div class="fg-row"><label>旋转</label><div class="rot-row"><input type="number" id="pRot" value="${comp.rotation||0}" title="旋转角度（度）"><button class="mini-btn" id="pRotL" title="左旋 90°">↺</button><button class="mini-btn" id="pRotR" title="右旋 90°">↻</button></div></div>
        <div class="fg-row"><label>镜像</label><div class="btn-group" id="mirrorGroup"><button class="pr-btn s-btn ${!comp.props.mirrored?'active':''}" data-m="0">正常 →</button><button class="pr-btn s-btn ${comp.props.mirrored?'active':''}" data-m="1">镜像 ←</button></div></div>
      </div>
      ${comp.type==='switchValve' ? `
      <div class="fg">
        <div class="fg-title">三通阀控制</div>
        <div class="fg-row">
          <label>控制模式</label>
          <select id="svMode">
            <option value="manual" ${(comp.props.controlMode||'manual')==='manual'?'selected':''}>手动</option>
            <option value="auto" ${comp.props.controlMode==='auto'?'selected':''}>自动（绑定 A/B 开关量，互斥切换）</option>
          </select>
        </div>
        <div id="svManualBox" style="${comp.props.controlMode==='auto'?'display:none':''}">
          <div class="fg-row">
            <label>当前通道</label>
            <div class="btn-group" id="switchValveGroup">
              <button class="pr-btn s-btn ${(comp.props.switchValve||0)===0?'active':''}" data-val="0">出口 A (左)</button>
              <button class="pr-btn s-btn ${(comp.props.switchValve||0)===1?'active':''}" data-val="1">出口 B (右)</button>
            </div>
          </div>
        </div>
        <div id="svAutoBox" style="${comp.props.controlMode==='auto'?'':'display:none'}">
          <div class="fg-row"><label>A 路 sensor</label><input id="svSensorA" value="${esc(comp.props.sensorA||'')}" placeholder="如 1#锰粉仓进料机L0201A状态"></div>
          <div class="fg-row"><label>B 路 sensor</label><input id="svSensorB" value="${esc(comp.props.sensorB||'')}" placeholder="如 1#锰粉仓进料机L0201B状态"></div>
          <div class="fg-row"><label>当前自动激活</label><input id="svAutoActive" readonly value="—"></div>
          <div class="fg-hint">互斥规则：A、B 任一为 1 时对应出口激活；都 0 / 都 1 时保持手动值。下方显示 A/B 实时取值与当前激活路。</div>
        </div>
      </div>
      ` : ''}
      ${comp.type==='rotaryKiln' ? `
      <div class="fg">
        <div class="fg-title">窑体测温点（左→右颜色渐变）</div>
        <div class="kiln-temps" id="kilnTempList"></div>
        <div class="fg-hint">4 个测温点对应窑体从左到右的颜色锚点，温度越高颜色越暖（暗红→橙→红→白热，全程无冷色）。填完整位号，如「1#窑体温度TI_206A」。</div>
      </div>
      ` : ''}
      ${(comp.type==='reactor'||comp.type==='storageSilo') ? `
      <div class="fg">
        <div class="fg-title">液位（动态绑定 Tag）</div>
        <div class="fg-row"><label>液位 Tag</label><input id="rvLevelTag" value="${esc(comp.props.levelTag||'')}" placeholder="如 1#粉煤灰仓料位"></div>
        <div class="fg-row"><label>满量程</label><input type="number" id="rvLevelMax" value="${comp.props.levelMax||50}" min="1" step="1"></div>
        <div class="fg-row"><label>当前液位</label><input id="rvLevelNow" readonly value="—"></div>
        <div class="fg-hint">绑定液位测点（填完整位号）后，罐内液面高度与读数带按实时值/满量程换算并同步更新；未绑定或无数据时按 60% 静态示意、读数显示 --。</div>
      </div>
      ` : ''}
      ${comp.type==='productTankDual' ? `
      <div class="fg">
        <div class="fg-title">两格标注（画在罐内）</div>
        <div class="fg-row"><label>左格名称</label><input id="dtNameA" value="${esc(comp.props.cellAName||'')}" placeholder="如 1#成品储罐"></div>
        <div class="fg-row"><label>左格位号</label><input id="dtTagA" value="${esc(comp.props.cellATag||'')}" placeholder="如 V0301"></div>
        <div class="fg-row"><label>右格名称</label><input id="dtNameB" value="${esc(comp.props.cellBName||'')}" placeholder="如 不合格品储罐"></div>
        <div class="fg-row"><label>右格位号</label><input id="dtTagB" value="${esc(comp.props.cellBTag||'')}" placeholder="如 V0302"></div>
        <div class="fg-hint">格名称过长会自动折两行居中；位号留空则不画。组件自身的「名称 / 位号」标签按上方「名称位置」显示在设备外，只想要格内标注时可把它们留空。</div>
      </div>
      ` : ''}
      ${hasAnimation(comp.type) ? `
      <div class="fg">
        <div class="fg-title">运行控制（开关 Tag）</div>
        <div class="fg-row"><label>判定逻辑</label><div class="btn-group" id="runLogicGroup">
          <button class="pr-btn s-btn ${(comp.props.runLogic||'and')!=='or'?'active':''}" data-lg="and" title="绑定的位号全部为 1 才运行">与 · 全为 1</button>
          <button class="pr-btn s-btn ${comp.props.runLogic==='or'?'active':''}" data-lg="or" title="绑定的位号任一为 1 即运行">或 · 任一为 1</button>
        </div></div>
        <div class="tag-search">
          <span class="ts-icon">⌕</span>
          <input id="runTagSearch" placeholder="搜索 / 添加开关 Tag…">
          <div class="tag-suggest" id="runTagSuggest"></div>
        </div>
        <div class="params-list" id="runTagList"></div>
        <div class="fg-row"><label>当前状态</label><div class="pill idle" id="runState"><span class="pdot"></span><span>—</span></div></div>
        <div class="fg-hint">绑定开关量测点（1 = 运行 / 0 = 停止）后，本组件动画随之启停并定格，其输出线同步停流变色。<b>与</b>：已取到值的位号全为 1 才运行；<b>或</b>：任一为 1 即运行。位号填完整（含前缀），可回车手工添加。</div>
      </div>
      ` : ''}
      ${comp.type==='monitor' ? `
      <div class="fg">
        <div class="fg-title">监控项（画布实时数值）</div>
        <div class="tag-search">
          <span class="ts-icon">⌕</span>
          <input id="monTagSearch" placeholder="搜索 / 添加监控 Tag…">
          <div class="tag-suggest" id="monTagSuggest"></div>
        </div>
        <div class="params-list" id="monTagList"></div>
        <div class="fg-hint">每个监控项在面板上占一行（标签 + 实时值 + 单位），底部显示数据更新时间；高度随监控项数量自动调整。</div>
      </div>
      <div class="fg">
        <div class="fg-title">归属指向折线</div>
        <div class="fg-row"><label>显示指向折线</label><input type="checkbox" id="monShowLead" ${comp.props.showLead!==false?'checked':''}></div>
        <div class="fg-row"><label>当前目标</label><input id="monLeadDesc" value="${esc(leadTargetDesc(comp))}" readonly></div>
        <div class="fg-row"><label>中间折点</label><div class="btn-group"><button class="pr-btn" id="btnClearBend">清除折点</button></div></div>
        <div class="fg-row"><label>线宽</label><input type="number" id="monLeadWidth" value="${monitorLeadStyle().width}" min="0.5" max="6" step="0.1" title="全局：所有监控器折线"></div>
        <div class="fg-row"><label>透明度</label><input type="number" id="monLeadOpacity" value="${monitorLeadStyle().opacity}" min="0" max="1" step="0.05" title="全局：所有监控器折线"></div>
        <div class="fg-hint">选中监控器后，拖动画布上的圆形把手改变指向目标；靠近设备 / 端口 / 管道时自动吸附。线宽 / 透明度对所有监控器全局生效。</div>
      </div>
      ` : `
      <div class="fg">
        <div class="fg-title">运行参数 (Tag)</div>
        <div class="tag-search">
          <span class="ts-icon">⌕</span>
          <input id="tagSearch" placeholder="搜索 / 添加 Tag…">
          <div class="tag-suggest" id="tagSuggest"></div>
        </div>
        <div class="params-list" id="paramsList"></div>
        <button class="pr-btn" id="btnAddParam">+ 添加 Tag</button>
      </div>
      `}
      ${comp.type!=='monitor' ? `
      <div class="fg">
        <div class="fg-title">端口</div>
        <div class="ports-list">
          ${t.ports.map(p=>{
            const pdir = comp.props.mirrored ? ({up:'up',down:'down',left:'right',right:'left'}[p.dir]||p.dir) : p.dir;
            return `<div class="port-row"><span class="pd"></span><span class="pn">${p.id}</span><span class="pl">${pdir}</span></div>`;
          }).join('')}
        </div>
      </div>
      ` : ''}
      <div class="pr-actions">
        <button class="dup" id="btnDup">复制</button>
        <button class="del" id="btnDelComp">删除</button>
      </div>
    `;
    // bind（名称/位号/颜色为 oninput 连续输入，重渲染用防抖；几何用 onchange，失焦/回车才触发，无需防抖）
    const debouncedRenderAll = debounce(()=>{ renderAll(); setDirty(); }, 150);
    $('pName').oninput = e=>{ comp.props.name=e.target.value; headTitle.textContent=e.target.value||t.name; debouncedRenderAll(); };
    if($('pTag')) $('pTag').oninput = e=>{ comp.props.tag=e.target.value; debouncedRenderAll(); };
    $('pColor').oninput = e=>{ comp.props.color=e.target.value; $('pColorT').value=e.target.value; debouncedRenderAll(); };
    $('pColorT').onchange = e=>{ comp.props.color=e.target.value; $('pColor').value=e.target.value; renderAll(); setDirty(); };
    $('pX').onchange = e=>{ comp.x=snapV(+e.target.value); pushHistory(); renderAll(); setDirty(); };
    $('pY').onchange = e=>{ comp.y=snapV(+e.target.value); pushHistory(); renderAll(); setDirty(); };
    $('pW').onchange = e=>{ comp.w=Math.max(20,+e.target.value); pushHistory(); renderAll(); setDirty(); };
    if($('pH')) $('pH').onchange = e=>{ comp.h=Math.max(20,+e.target.value); pushHistory(); renderAll(); setDirty(); };
    $('pRot').onchange = e=>{ comp.rotation=+e.target.value; pushHistory(); renderAll(); setDirty(); };
    if($('pRotL')) $('pRotL').onclick = ()=>{ rotateCCW(); renderProps(); };
    if($('pRotR')) $('pRotR').onclick = ()=>{ rotateCW(); renderProps(); };
    // 三通阀控制：手动模式 + 自动模式（绑定 A/B 开关量 sensor，互斥切换）
    if(comp.type==='switchValve'){
      const sg = $('switchValveGroup');
      if(sg){ sg.querySelectorAll('.s-btn').forEach(b=>{ b.onclick=()=>{ comp.props.switchValve=+b.dataset.val; renderAll(); renderProps(); setDirty(); }; }); }
      const sm = $('svMode');
      if(sm){ sm.onchange = (e)=>{ comp.props.controlMode = e.target.value; pushHistory(); renderProps(); renderAll(); setDirty(); }; }
      const sa = $('svSensorA'), sb = $('svSensorB');
      if(sa){ sa.onchange = (e)=>{ comp.props.sensorA = (e.target.value||'').trim(); pushHistory(); renderAll(); setDirty(); }; }
      if(sb){ sb.onchange = (e)=>{ comp.props.sensorB = (e.target.value||'').trim(); pushHistory(); renderAll(); setDirty(); }; }
      // 自动激活实时显示（属性面板右侧 readout）：依赖 sensorValueMap，refreshSwitchValveAuto 会负责同步
      const aa = $('svAutoActive');
      if(aa){ aa.value = '—'; }
    }
    // 运行开关（开关 Tag）：可绑多个位号，按「与 / 或」逻辑驱动动画开/停（支持所有含动画的组件）
    if(hasAnimation(comp.type)){
      normalizeRunTags(comp);
      bindRunTagSearch(comp);
      renderRunTagList(comp);
      const lg = $('runLogicGroup');
      if(lg){ lg.querySelectorAll('.s-btn').forEach(b=>{ b.onclick=()=>{ comp.props.runLogic = b.dataset.lg; pushHistory(); renderAll(); renderProps(); setDirty(); refreshRunState(sensorValueMap); }; }); }
      setRunStatePill($('runState'), compRunState(comp));
    }
    // 反应釜 / 储料仓：液位动态绑定 tag + 满量程
    if(comp.type==='reactor' || comp.type==='storageSilo'){
      const lt = $('rvLevelTag');
      if(lt){ lt.onchange = (e)=>{ comp.props.levelTag = (e.target.value||'').trim(); pushHistory(); renderAll(); setDirty(); refreshReactorLevel(sensorValueMap); }; }
      const lm = $('rvLevelMax');
      if(lm){ lm.onchange = (e)=>{ const v=+e.target.value; comp.props.levelMax = (isFinite(v)&&v>0)?v:50; pushHistory(); renderAll(); setDirty(); refreshReactorLevel(sensorValueMap); }; }
      const ln = $('rvLevelNow');
      if(ln){ const lv = sensorValueMap[(comp.props.levelTag||'').trim()]; ln.value = lv ? (lv.value + (lv.unit||' m')) : '—'; }
    }
    // 双格成品储罐：两格格内标注（名称 / 位号），边输边更新画布
    if(comp.type==='productTankDual'){
      const bindCell = (inputId, key)=>{
        const el = $(inputId); if(!el) return;
        el.oninput = (e)=>{ comp.props[key] = e.target.value; setDirty(); renderAllDebounced(); };
      };
      bindCell('dtNameA','cellAName'); bindCell('dtTagA','cellATag');
      bindCell('dtNameB','cellBName'); bindCell('dtTagB','cellBTag');
    }
    // 回转窑测温点配置
    if(comp.type==='rotaryKiln') renderKilnTempList(comp);
    // 通用水平镜像控制
    const mg = $('mirrorGroup');
    if(mg){ mg.querySelectorAll('.s-btn').forEach(b=>{ b.onclick=()=>{ comp.props.mirrored=+b.dataset.m===1; pushHistory(); renderAll(); renderProps(); setDirty(); }; }); }
    // 名称位置：顶部（默认）/ 居中
    const npg = $('namePosGroup');
    if(npg){ npg.querySelectorAll('.s-btn').forEach(b=>{ b.onclick=()=>{ comp.props.namePos=b.dataset.np; pushHistory(); renderAll(); renderProps(); setDirty(); }; }); }
    if(comp.type==='monitor'){
      // 监控器：多监控项列表 + 搜索添加 + 归属折线管理
      normalizeMonitorProps(comp);
      comp.h = monitorAutoHeight(comp.props);
      bindMonitorTagSearch(comp);
      renderMonitorTagList(comp);
      if($('btnClearBend')) $('btnClearBend').onclick = ()=>{ if(comp.props.lead){ delete comp.props.lead.bend; } pushHistory(); renderAll(); setDirty(); };
      // 折线全局样式（线宽/透明度）：写入 doc.meta，对所有监控器生效
      const bindLeadStyle = (inputId, key)=>{
        const el2 = $(inputId); if(!el2) return;
        el2.onchange = ()=>{
          if(!doc.meta) doc.meta = {};
          const s = doc.meta.monitorLeadStyle = doc.meta.monitorLeadStyle || {};
          const v = +el2.value;
          if(isNaN(v)) return;
          s[key] = (key==='width') ? Math.min(6, Math.max(0.5, v)) : Math.min(1, Math.max(0, v));
          pushHistory(); renderAll(); setDirty();
        };
      };
      bindLeadStyle('monLeadWidth','width');
      bindLeadStyle('monLeadOpacity','opacity');
      // 显示指向折线 开关：关闭 → 不渲染折线也不出拖拽端点；重新打开时如有历史 lead 直接复用，否则补默认
      const showEl = $('monShowLead');
      if(showEl){
        showEl.onchange = ()=>{
          normalizeMonitorProps(comp);
          const next = !!showEl.checked;
          if(next && !comp.props.lead){
            // 重新打开但从未有过 lead：补一个面板右侧自由点作为默认指向
            comp.props.lead = { targetType:'point', x: comp.x + comp.w + 60, y: comp.y + comp.h/2 };
          }
          comp.props.showLead = next;
          pushHistory(); renderAll(); renderProps(); setDirty();
        };
      }
    }else{
      renderParamsList(comp);
      bindTagSearch(comp);
      $('btnAddParam').onclick = ()=>{ comp.props.params.push({k:nextNewTag(comp),v:'0',u:''}); pushHistory(); tagFilter=''; renderParamsList(comp); renderAll(); setDirty(); };
    }
    $('btnDup').onclick = duplicateComp;
    $('btnDelComp').onclick = deleteSelected;
  } else if(sel.kind==='pipe'){
    const pipe = getPipe(sel.id); if(!pipe) return;
    headIcon.textContent='管'; headTitle.textContent='管道'; headSub.textContent = pipe.id;
    const fromC = pipe.from? getComp(pipe.from.cid): null;
    const toC = pipe.to? getComp(pipe.to.cid): null;
    body.innerHTML = `
      <div class="fg">
        <div class="fg-title">管道属性</div>
        <div class="fg-row"><label>标签</label><input id="pLabel" value="${esc(pipe.label||'')}" placeholder="如：锰粉 / H₂"></div>
        <div class="fg-row"><label>类型</label><select id="pType">${Object.entries(PIPE_TYPES).map(([k,v])=>`<option value="${k}" ${pipe.type===k?'selected':''}>${v.name}</option>`).join('')}</select></div>
        <div class="fg-row"><label>线宽</label><input type="number" id="pWidth" value="${pipe.width||2.5}" step="0.5" min="1"></div>
        <div class="fg-row"><label>直线连接</label><input type="checkbox" id="pStraight" ${pipe.straight?'checked':''}></div>
      </div>
      <div class="fg">
        <div class="fg-title">连接</div>
        <div class="fg-row"><label>起点</label><input value="${fromC?`${fromC.props.name||fromC.id}.${pipe.from.port}`:'(自由)'}" readonly></div>
        <div class="fg-row"><label>终点</label><input value="${toC?`${toC.props.name||toC.id}.${pipe.to.port}`:'(自由)'}" readonly></div>
      </div>
      <div class="pr-actions">
        <button class="dup" id="btnRev">反向</button>
        <button class="del" id="btnDelPipe">删除</button>
      </div>
    `;
    const debouncedRenderAll = debounce(()=>{ renderAll(); setDirty(); }, 150);
    $('pLabel').oninput = e=>{ pipe.label=e.target.value; debouncedRenderAll(); };
    $('pType').onchange = e=>{ pipe.type=e.target.value; renderAll(); setDirty(); };
    $('pWidth').onchange = e=>{ pipe.width=+e.target.value; renderAll(); setDirty(); };
    $('pStraight').onchange = e=>{ pipe.straight=e.target.checked; pushHistory(); renderAll(); renderProps(); setDirty(); };
    $('btnRev').onclick = ()=>{ const t=pipe.from; pipe.from=pipe.to; pipe.to=t; pushHistory(); renderAll(); renderProps(); setDirty(); };
    $('btnDelPipe').onclick = deleteSelected;
  }
  bindFgCollapse(body);   // 分组卡片折叠（标题可点，状态按标题记忆）
}
/* ============================================================
 * 12. 属性面板：运行参数（Tag）管理模式
 *   新增 / 修改 / 删除 / 排序(上下移) / 搜索筛选 / 检索添加
 * ============================================================ */
/* 审计 4.1：原 KNOWN_TAGS 硬编码清单（25 个位号实测 100% 不在后端目录）已废弃。
   检索候选改为单一来源 tagCandidates()：后端目录 + 文档现有位号；
   后端未连接时不再回退硬编码清单，而是显式提示"未连接后端，无法校验位号"。 */

let tagFilter = '';   // 搜索筛选关键字

// —— 后端传感器目录 / 实时值缓存（tag 检索添加与实时数值用）——
let sensorCatalog = [];   // [{tag, type, kiln_id}]
let sensorValueMap = {};  // tag -> {value, unit, reported_at}

// 检索候选单一来源（审计 2.8/4.1）：后端目录（优先）+ 文档现有位号。
// 目录未加载（离线）时不含任何硬编码回退 —— 由调用方提示 TAG_OFFLINE_HINT。
function tagCandidates(){
  const cand = new Map();
  sensorCatalog.forEach(x=>cand.set(x.tag, x));
  docTags().forEach(t=>{ if(!cand.has(t)) cand.set(t, {}); });
  return cand;
}
const TAG_OFFLINE_HINT = '<div class="ts-hint" style="padding:6px 8px;font-size:11px;color:var(--text3);cursor:default">未连接后端，无法校验位号</div>';

/* ============================================================
 * 13. 实时数据：基础设施（目录与实时值缓存，监控器/窑温共用）
 *   - sensorCatalog: 后端传感器目录（tag 检索候选）
 *   - sensorValueMap: tag -> {value, unit, reported_at} 实时值缓存
 * ============================================================ */

// 定位组件 DOM 组：editor 端挂 data-id，preview 端挂 data-cid
function findCompGroupDom(compId){
  return document.querySelector('.equip-group[data-id="'+compId+'"]')
      || document.querySelector('.equip-group[data-cid="'+compId+'"]');
}

// 拉取后端传感器目录，作为 tag 检索添加的候选
async function loadSensorCatalog(){
  try{
    const j = await SENSOR_API.list();
    if(j && Array.isArray(j.data)){
      sensorCatalog = j.data
        .filter(d=>d && d.sensor_tag && d.sensor_tag.trim())
        .map(d=>({ tag:d.sensor_tag.trim(), type:d.type||'', kiln_id:d.kiln_id||'' }));
      // 若当前已选中组件且搜索框存在，刷新候选下拉
      const sc = selSingle();
      if(sc && sc.kind==='component'){
        const comp = getComp(sc.id);
        const tq = $('tagSearch');
        if(comp && tq) renderTagSuggest(comp, tq.value||'');
      }
    }
  }catch(e){ logSensorFailure('传感器目录拉取', e); }   // 失败可观测；离线时检索只剩文档现有位号并提示无法校验
}

// 拉取全部传感器实时值到缓存（type 一并缓存，供监控器面板"开/关"显示使用）
async function refreshSensorValues(){
  try{
    const j = await SENSOR_API.values({ limit: 500 });
    if(j && Array.isArray(j.data)){
      const m = {};
      j.data.forEach(d=>{ if(d && d.sensor_tag){ const t=(d.sensor_tag||'').trim(); if(t) m[t] = { value:d.value, unit:d.unit, reported_at:d.reported_at, type:d.type }; } });
      sensorValueMap = m;
      refreshMonitorValues();
      refreshKilnTemp(sensorValueMap);
      refreshReactorLevel(sensorValueMap);   // 反应釜：绑定液位 tag 时按实时值更新液面与读数
      refreshSwitchValveAuto(sensorValueMap); // 三通阀自动模式：根据 A/B 开关量互斥切换
      refreshRunState(sensorValueMap);       // 运行开关：按开关 tag（可多个 + 与/或逻辑）驱动各设备动画开/停
      setSensorApiState(true);
    }
  }catch(e){ logSensorFailure('实时值拉取', e); }
}

// 更新当前选中组件的 tag 行实时数值（不覆盖正在编辑的输入框）
function updateTagLiveValues(comp){
  // 反应釜 / 储料仓：液位读数回填（只读框，无编辑冲突）
  if(comp.type==='reactor' || comp.type==='storageSilo'){
    const ln = $('rvLevelNow');
    if(ln){
      const lv = sensorValueMap[(comp.props.levelTag||'').trim()];
      ln.value = lv ? (lv.value + (lv.unit||' m')) : '—';
    }
  }
  const list = $('paramsList'); if(!list) return;
  const rows = list.querySelectorAll('.param-row');
  const params = comp.props.params || [];
  rows.forEach((row,i)=>{
    if(!params[i]) return;
    const live = sensorValueMap[(params[i].k||'').trim()];
    if(!live) return;
    const pv = row.querySelector('.pv');
    if(pv && document.activeElement!==pv) pv.value = (live.value!=null ? live.value : pv.value);
    const pu = row.querySelector('.pu');
    if(pu && document.activeElement!==pu && live.unit && !params[i].u) pu.value = live.unit;
  });
}

// 周期刷新当前组件 tag 实时值
let _tagLiveTimer = null;
function startTagLiveUpdate(){
  clearInterval(_tagLiveTimer);
  _tagLiveTimer = setInterval(()=>{
    const sc = selSingle();
    if(!sc || sc.kind!=='component') return;
    const comp = getComp(sc.id);
    if(comp) updateTagLiveValues(comp);
  }, 3000);
}

/* ============================================================
 * 14. 实时数据：监控器面板（后端传感器浏览）
 * ============================================================ */
let _smFilter = '', _smCat = '', _smSelTag = null;

function openSensorPanel(){
  const m = $('sensorModal'); if(!m) return;
  m.classList.add('show');
  renderSensorCats();
  renderSensorList();
  updateSmHint();
}

function closeSensorPanel(){ const m=$('sensorModal'); if(m) m.classList.remove('show'); _smSelTag=null; }

// 分类筛选 chips（来自后端 categories / 目录）
function renderSensorCats(){
  const box = $('smCats'); if(!box) return;
  const counts = {};
  sensorCatalog.forEach(s=>{ counts[s.type]=(counts[s.type]||0)+1; });
  const types = Object.keys(counts).sort();
  let html = `<button class="sm-cat ${!_smCat?'active':''}" data-cat="">全部 (${sensorCatalog.length})</button>`;
  types.forEach(t=>{ html += `<button class="sm-cat ${_smCat===t?'active':''}" data-cat="${esc(t)}">${esc(t)} (${counts[t]})</button>`; });
  box.innerHTML = html;
  box.querySelectorAll('.sm-cat').forEach(b=>{
    b.onclick = ()=>{ _smCat = b.dataset.cat; renderSensorCats(); renderSensorList(); };
  });
}

// 渲染传感器列表行
function renderSensorList(){
  const list = $('smList'); if(!list) return;
  if(!sensorCatalog.length){
    list.innerHTML = '<div class="sm-empty">暂无监控器数据<br>后端不可用或未加载 · 点击右上角 ⟳ 刷新重试</div>';
    return;
  }
  const q = _smFilter.trim().toUpperCase();
  // 使用设备映射：tag -> [设备名]
  const used = {};
  doc.components.forEach(c=>{
    const ps = (c.props && c.props.params) || [];
    ps.forEach(p=>{ if(p.k) (used[p.k]=used[p.k]||[]).push(c.props.name||c.id); });
    if(c.props && c.props.tag) (used[c.props.tag]=used[c.props.tag]||[]).push((c.props.name||c.id)+'[位号]');
  });
  const rows = sensorCatalog.filter(s=>{
    if(_smCat && s.type!==_smCat) return false;
    if(q && !(s.tag.toUpperCase().includes(q) || s.type.toUpperCase().includes(q) || s.kiln_id.toUpperCase().includes(q))) return false;
    return true;
  });
  if(!rows.length){ list.innerHTML = '<div class="sm-empty">未找到匹配的监控器</div>'; return; }
  let html = `<div class="sm-col-head"><span class="sm-col-tag">监控器 Tag</span><span class="sm-col-type">类型</span><span class="sm-col-kiln">窑号</span><span class="sm-col-used">使用设备</span></div>`;
  html += rows.map(s=>{
    const u = used[s.tag];
    const usedTxt = u && u.length ? u.join('、') : '<span style="color:var(--text4)">未使用</span>';
    return `<div class="sm-row ${_smSelTag===s.tag?'sel':''}" data-tag="${esc(s.tag)}">
      <span class="sm-col-tag">${esc(s.tag)}</span>
      <span class="sm-col-type">${esc(s.type)}</span>
      <span class="sm-col-kiln">${esc(s.kiln_id)}</span>
      <span class="sm-col-used">${usedTxt}</span>
    </div>`;
  }).join('');
  list.innerHTML = html;
  list.querySelectorAll('.sm-row').forEach(row=>{
    row.onclick = ()=>{
      _smSelTag = row.dataset.tag;
      list.querySelectorAll('.sm-row').forEach(r=>r.classList.toggle('sel', r===row));
      updateSmHint();
    };
  });
}

function updateSmHint(){
  const hint = $('smHint'); if(!hint) return;
  const sc = selSingle();
  const hasDev = sc && sc.kind==='component';
  const comp = hasDev ? getComp(sc.id) : null;
  const already = comp && _smSelTag ? (comp.props.params||[]).some(p=>p.k===_smSelTag) : false;
  hint.innerHTML = (hasDev ? `已选中设备：<b style="color:var(--cyan)">${esc(comp.props.name||comp.id)}</b>` : '未选中设备')
    + (_smSelTag ? ` · 已选监控器：<b style="color:var(--cyan)">${esc(_smSelTag)}</b>` + (already?'（已添加）':'') : '');
  const btn = $('smAddSel');
  if(btn) btn.disabled = !(hasDev && _smSelTag && !already);
}

// 把当前选中的监控器添加到选中的设备
function smAddToDevice(){
  const sc = selSingle();
  if(!sc || sc.kind!=='component' || !_smSelTag) return;
  const comp = getComp(sc.id); if(!comp) return;
  comp.props = comp.props || {};
  comp.props.params = comp.props.params || [];
  if(comp.props.params.some(p=>p.k===_smSelTag)){ flash('该监控器已在此设备上'); return; }
  comp.props.params.push({ k:_smSelTag, v:'0', u:'' });
  pushHistory();
  renderAll(); renderProps(); setDirty();
  updateSmHint();
  flash('已添加监控器：' + _smSelTag);
}

// 刷新：重新拉取目录
async function refreshSensorPanel(){
  await loadSensorCatalog();
  renderSensorCats();
  renderSensorList();
  updateSmHint();
  flash(sensorCatalog.length ? `已加载 ${sensorCatalog.length} 个监控器` : '加载失败或后端不可用');
}
// 收集文档中已出现的全部 tag（用于提供添加候选）
function docTags(){
  const s = new Set();
  doc.components.forEach(c=>{
    if(c.props && c.props.tag) s.add((c.props.tag||'').trim());
    if(c.props && Array.isArray(c.props.params)) c.props.params.forEach(p=>{ if(p.k) s.add((p.k||'').trim()); });
  });
  return s;
}
// 生成一个不与现有 tag 冲突的新 tag 名
function nextNewTag(comp){
  const used = new Set((comp.props.params||[]).map(p=>p.k));
  const base = 'TAG';
  let n = 1;
  while(used.has(base+n)) n++;
  return base+n;
}
// 绑定 tag 搜索框：筛选现有 + 检索候选添加
function bindTagSearch(comp){
  const tq = $('tagSearch'); if(!tq) return;
  tq.oninput = ()=>{ tagFilter = tq.value||''; renderParamsList(comp); renderTagSuggest(comp, tq.value); };
  tq.onkeydown = e=>{
    if(e.key==='Enter'){
      const q = (tq.value||'').trim();
      if(q){ comp.props.params.push({k:q, v:'0', u:''}); pushHistory(); tq.value=''; tagFilter=''; renderParamsList(comp); renderTagSuggest(comp,''); renderAll(); setDirty(); }
    }
  };
  tq.onblur = ()=>{ setTimeout(()=>{ const s=$('tagSuggest'); if(s) s.innerHTML=''; },150); };
}
// 渲染候选 tag 下拉（模糊匹配，排除已添加）
//   候选来源：tagCandidates()（后端目录 > 文档现有 tag）；离线时显式提示无法校验位号
function renderTagSuggest(comp, q){
  const s = $('tagSuggest'); if(!s) return;
  const existing = new Set((comp.props.params||[]).map(p=>p.k));
  const cand = tagCandidates();   // tag -> {type, kiln_id}
  const qq = (q||'').trim().toUpperCase();
  let list = Array.from(cand.entries()).filter(([t])=>!existing.has(t));
  if(qq) list = list.filter(([t])=>t.toUpperCase().includes(qq));
  list = list.slice(0,10);
  const offline = sensorCatalog.length ? '' : TAG_OFFLINE_HINT;
  if(!list.length){ s.innerHTML = offline; return; }
  s.innerHTML = offline + list.map(([t,meta])=>{
    const type = (meta.type||'').trim();
    return `<div class="ts-item" data-t="${esc(t)}">${esc(t)}${type?`<span class="ts-type">${esc(type)}</span>`:''}</div>`;
  }).join('');
  s.querySelectorAll('.ts-item').forEach(it=>{
    it.onclick = ()=>{
      comp.props.params.push({k:it.dataset.t, v:'0', u:''});
      pushHistory();
      const tq = $('tagSearch'); if(tq) tq.value='';
      tagFilter='';
      renderParamsList(comp); renderTagSuggest(comp,''); renderAll(); setDirty();
    };
  });
}
/* 位号 textarea 行数：按字符宽度预估行数（不读 scrollHeight，避免每次渲染触发布局测量）。
   面板里位号行可用宽约 160px、字号 11px：中文约 14 字/行，ASCII 约 26 字/行。
   用 textarea 而非 input 是因为 input 不能换行，长位号只能显示一半。 */
function autosizeTextarea(el){
  if(!el) return;
  const s = el.value || '';
  let w = 0;
  for(const ch of s) w += /[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]/.test(ch) ? 1 : 0.55;
  const rows = Math.max(1, Math.ceil(w / 14));
  if(el.rows !== rows) el.rows = rows;
}
function renderParamsList(comp){
  const el = $('paramsList'); if(!el) return;
  el.innerHTML='';
  const params = comp.props.params || [];
  const qq = tagFilter.trim().toUpperCase();
  let shown = 0;
  params.forEach((p,i)=>{
    const k = (p.k||'').toUpperCase();
    if(qq && !k.includes(qq)) return;   // 搜索筛选
    shown++;
    const row = document.createElement('div'); row.className='param-row';
    /* 两行结构：位号独占整行宽度，值 / 单位与排序按钮放第二行。
       位号用【自动高度的 textarea】而不是 input —— input 不能换行，
       长位号（如"1#还原系统斗式提升机电机电流A相"）在 160px 宽里只能显示一半。 */
    row.innerHTML =
      `<div class="pr-top"><textarea class="pk" rows="1" placeholder="Tag 名（完整位号）" title="${esc(p.k)}">${esc(p.k)}</textarea><button class="pdel" title="删除">×</button></div>` +
      `<div class="pr-bot"><button class="pmove up" title="上移">▲</button><button class="pmove down" title="下移">▼</button><input class="pv" value="${esc(p.v)}" placeholder="值"><input class="pu" value="${esc(p.u)}" placeholder="单位"></div>`;
    const pkEl = row.querySelector('.pk');
    autosizeTextarea(pkEl);
    pkEl.oninput = e=>{ p.k=e.target.value.trim().replace(/\s+/g,''); autosizeTextarea(pkEl); setDirty(); renderAllDebounced(); };
    pkEl.onkeydown = e=>{ if(e.key==='Enter'){ e.preventDefault(); e.target.blur(); } };   // 位号不接收换行
    row.querySelector('.pv').oninput = e=>{ p.v=e.target.value; setDirty(); renderAllDebounced(); };
    row.querySelector('.pu').oninput = e=>{ p.u=e.target.value; setDirty(); renderAllDebounced(); };
    row.querySelector('.pdel').onclick = ()=>{ comp.props.params.splice(i,1); pushHistory(); renderParamsList(comp); renderAll(); setDirty(); };
    row.querySelector('.up').onclick = ()=>{ if(i>0){ const t=params[i-1]; params[i-1]=params[i]; params[i]=t; pushHistory(); renderParamsList(comp); renderAll(); setDirty(); } };
    row.querySelector('.down').onclick = ()=>{ if(i<params.length-1){ const t=params[i+1]; params[i+1]=params[i]; params[i]=t; pushHistory(); renderParamsList(comp); renderAll(); setDirty(); } };
    el.appendChild(row);
  });
  if(!shown){
    el.innerHTML = qq
      ? '<div class="pr-empty" style="padding:10px;font-size:11px;color:var(--text3)">无匹配的 Tag</div>'
      : '<div class="pr-empty" style="padding:10px;font-size:11px;color:var(--text3)">暂无 Tag · 搜索或点击下方添加</div>';
  }
}
/* 统一转义工具（审计 §4.9）：覆盖 & < > " ' 五个字符。
   原实现只转义 " 和 <（缺 &、>、'）：在单引号属性或需要 & 语义的位置会留下注入面，
   且与 preview.html 的同名实现行为不一致。preview.html 已改为复用本函数。 */
function esc(s){
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function renderPropsLive(){
  const sc = selSingle();
  if(!sc || sc.kind!=='component') return;
  const comp = getComp(sc.id); if(!comp) return;
  const set=(id,v)=>{ const el=$(id); if(el && document.activeElement!==el) el.value=v; };
  set('pX', Math.round(comp.x)); set('pY', Math.round(comp.y));
  set('pW', Math.round(comp.w)); set('pH', Math.round(comp.h));
}

// 回转窑属性面板：窑体测温点（tag → 颜色锚点）配置列表
function renderKilnTempList(comp){
  const el = $('kilnTempList'); if(!el) return;
  el.innerHTML = '';
  const pts = comp.props.tempPoints = comp.props.tempPoints || [];
  while(pts.length < 4) pts.push({ tag:'' });
  const dots = ['#52120A','#88280E','#EE7620','#FFCD4E']; // 色标锚点示例（200/320/650/890℃ 采样）
  const debounced = debounce(()=>{ renderAll(); setDirty(); }, 200);
  pts.forEach((pt, i)=>{
    const row = document.createElement('div');
    row.className = 'ktemp-row';
    row.innerHTML = `<span class="ktemp-dot" style="background:${dots[i]||'#9C99FF'}"></span><input class="ktag" placeholder="测温点 ${i+1} 位号" value="${esc(pt.tag||'')}">`;
    row.querySelector('.ktag').oninput = e=>{ pt.tag = e.target.value; debounced(); };
    el.appendChild(row);
  });
}

/* ============================================================
 * 15. 实时数据：回转窑温度渐变（组件定制联动）
 *   - comp.props.tempPoints: [{tag:'1#窑体温度TI_206A'}, ...]（最多 4 个）
 *   - 温度 → 工业黑体辐射色标（暗红→红→橙→黄→白，单调递增）
 * ============================================================ */
const KILN_TEMP_STOPS = [
  // 黑体辐射色相顺序（暗红→红→橙→黄→白）保持不变，但锚点聚焦到实际工作区间 200~890℃：
  // 该区间内梯度被拉陡，四个测温点（约 200/320/820/890℃）能明显区分；低温端(≤200)与超温端(≥890)快速收敛兜底。
  [0,    [25, 3, 3]],       // 室温/无热辐射：近黑
  [200,  [82, 18, 10]],     // 工作区下界：暗红
  [350,  [150, 45, 15]],    // 红
  [500,  [198, 78, 22]],    // 橙红
  [650,  [238, 118, 32]],   // 橙
  [800,  [255, 158, 46]],   // 亮橙
  [890,  [255, 205, 78]],   // 黄（工作区上界）
  [1000, [255, 235, 140]],  // 白黄
  [1200, [255, 248, 205]],  // 白
  [1500, [255, 255, 255]]   // 亮白
];
function kilnTempRgb(arr){ return 'rgb('+arr[0]+','+arr[1]+','+arr[2]+')'; }
function kilnTempColor(t){
  if(t==null || isNaN(t)) return null;
  const s = KILN_TEMP_STOPS;
  if(t <= s[0][0]) return kilnTempRgb(s[0][1]);
  for(let i=0;i<s.length-1;i++){
    const t0=s[i][0], c0=s[i][1], t1=s[i+1][0], c1=s[i+1][1];
    if(t <= t1){
      const f=(t-t0)/(t1-t0);
      return kilnTempRgb(c0.map((v,j)=>Math.round(v+(c1[j]-v)*f)));
    }
  }
  return kilnTempRgb(s[s.length-1][1]);
}
// 增量更新回转窑温度渐变（不触发 renderAll，避免 SMIL 重置）
// docArg：预览页在 IIFE 内用局部 doc 遮蔽了全局 doc，需显式传入当前文档；编辑器省略则回退全局 doc
function refreshKilnTemp(liveMap, docArg){
  const d = docArg || doc;
  if(!liveMap || !d || !Array.isArray(d.components)) return;
  d.components.forEach(comp=>{
    if(comp.type !== 'rotaryKiln') return;
    const pts = comp.props && comp.props.tempPoints;
    if(!pts || !pts.length) return;
    const g = findCompGroupDom(comp.id);
    if(!g) return;
    const stops = g.querySelectorAll('.kiln-temp-stop');
    pts.forEach((pt, i)=>{
      const stop = stops[i];
      if(!stop) return;
      const live = liveMap[(pt.tag||'').trim()];
      const v = live ? Number(live.value) : NaN;
      const color = kilnTempColor(v);
      if(color) stop.setAttribute('stop-color', color);
    });
  });
}
// 增量更新反应釜液位（不触发 renderAll，避免无谓重绘）
// 绑定 props.levelTag 时按实时值换算液面高度并同步读数；未绑定 / 无数据保持 60% 静态示意、读数显示 --
// geom 换算与模板共用 templates/reactor.js 的 reactorGeom / reactorLevelFrac / reactorLevelText
// docArg：预览页在 IIFE 内用局部 doc 遮蔽了全局 doc，需显式传入当前文档；编辑器省略则回退全局 doc
function refreshReactorLevel(liveMap, docArg){
  const d = docArg || doc;
  if(!d || !Array.isArray(d.components)) return;
  d.components.forEach(comp=>{
    if(comp.type !== 'reactor' && comp.type !== 'storageSilo') return;
    const g = findCompGroupDom(comp.id);
    if(!g) return;
    const gm = (comp.type === 'storageSilo') ? storageSiloGeom(comp.w, comp.h) : reactorGeom(comp.w, comp.h);
    const live = (liveMap && comp.props.levelTag) ? liveMap[(comp.props.levelTag||'').trim()] : null;
    const frac = reactorLevelFrac(live ? live.value : NaN, comp.props.levelMax);
    const f = (frac==null) ? 0.6 : frac;
    const surfaceY = gm.bodyBot - (gm.bodyBot - gm.bodyTop) * f;
    const liqH = Math.max(0, gm.bodyBot - surfaceY);
    const liq = g.querySelector('.rv-liquid'), dots = g.querySelector('.rv-liquid-dots'), surf = g.querySelector('.rv-surface');
    [liq, dots].forEach(el=>{
      if(!el) return;
      el.setAttribute('y', surfaceY.toFixed(1));
      el.setAttribute('height', liqH.toFixed(1));
    });
    if(surf){ surf.setAttribute('y1', surfaceY.toFixed(1)); surf.setAttribute('y2', surfaceY.toFixed(1)); }
    const fclip = g.querySelector('.rv-flow-clip');
    if(fclip){ fclip.setAttribute('y', surfaceY.toFixed(1)); fclip.setAttribute('height', liqH.toFixed(1)); }
    const band = g.querySelector('.rv-band');
    if(band) band.setAttribute('transform', `translate(0,${surfaceY.toFixed(1)})`);
    const rd = reactorLevelText(live);
    const valEl = g.querySelector('.rv-level-value'), unitEl = g.querySelector('.rv-level-unit');
    if(valEl) valEl.textContent = rd.text;
    if(unitEl) unitEl.textContent = rd.unit;
  });
}
// 三通阀自动模式（控制模式 auto）：根据绑定的 A/B 路开关量 sensor 互斥切换激活路。
// 互斥规则：
//   - A=1 且 B=0 → A 路激活（active=0，因为模板里 active=0 表示走 A 路）
//   - A=0 且 B=1 → B 路激活（active=1，走 B 路）
//   - 都 0、都 1、都未绑、取数失败 → 保持手动值（fallback = comp.props.switchValve）
// 仅在 active 真变化时重新生成 innerHTML，避免无谓的 SMIL 重置；同步刷新属性面板 svAutoActive 显示。
// docArg：预览页局部 doc 时需显式传入
function refreshSwitchValveAuto(liveMap, docArg){
  const d = docArg || doc;
  if(!liveMap || !d || !Array.isArray(d.components)) return;
  const fallbackFor = c => ((c.props.switchValve===0||c.props.switchValve===1) ? c.props.switchValve : 0);
  d.components.forEach(comp=>{
    if(comp.type !== 'switchValve') return;
    if((comp.props.controlMode||'manual') !== 'auto') return;
    const tagA = (comp.props.sensorA||'').trim();
    const tagB = (comp.props.sensorB||'').trim();
    const liveA = tagA ? liveMap[tagA] : null;
    const liveB = tagB ? liveMap[tagB] : null;
    const rawA = liveA ? liveA.value : null;
    const rawB = liveB ? liveB.value : null;
    const vA = (rawA==null || rawA==='') ? null : (isFinite(+rawA) ? +rawA : null);
    const vB = (rawB==null || rawB==='') ? null : (isFinite(+rawB) ? +rawB : null);
    const aOn = vA!=null && vA>=0.5;
    const bOn = vB!=null && vB>=0.5;
    let autoActive;
    let activeText;
    if(aOn && !bOn){ autoActive = 0; activeText = 'A 路激活'; }
    else if(bOn && !aOn){ autoActive = 1; activeText = 'B 路激活'; }
    else if(aOn && bOn){ autoActive = fallbackFor(comp); activeText = 'A=B=1 异常（保持手动）'; }
    else { autoActive = fallbackFor(comp); activeText = '待机 A=0 B=0（保持手动）'; }

    // 增量更新画布上对应组件：active 真变化时才换 innerHTML（按需重渲染，避免 SMIL 重置）
    const g = findCompGroupDom(comp.id);
    if(g){
      const cur = (g.dataset.active===undefined || g.dataset.active===''||g.dataset.active==null) ? null : +g.dataset.active;
      if(cur !== autoActive){
        const t = TEMPLATES['switchValve'];
        if(t){
          const tmpProps = Object.assign({}, comp.props, { switchValve: autoActive });
          const inner = t.render(comp.w, comp.h, tmpProps);
          const outInner = (typeof running!=='undefined' && running) ? inner : (typeof stripSMIL==='function' ? stripSMIL(inner) : inner);
          g.innerHTML = outInner;
          g.dataset.active = String(autoActive);
        }
      }
    }

    // 更新属性面板 svAutoActive（仅当属性面板已渲染且包含 svAutoActive）
    const aa = (typeof $==='function') ? $('svAutoActive') : null;
    if(aa){
      const aText = vA!=null ? String(vA) : '—';
      const bText = vB!=null ? String(vB) : '—';
      aa.value = `${activeText}  ·  A=${aText}  B=${bText}`;
    }
  });
}

/* 运行开关（开关 Tag）· 数据驱动动画（通用，支持所有含动画的组件）：
   按 compRunState 判定运行态（多个位号 + 与/或逻辑）：运行 → 生成动画，停止 → 剥掉 SMIL、画面定格；
   未绑定 / 全部无数据 → 默认运行。
   仅在运行态真变化时重生成该组件 innerHTML，避免无谓的 SMIL 重置。
   docArg：预览页局部 doc 时需显式传入 */
function refreshRunState(liveMap, docArg){
  const d = docArg || doc;
  if(!liveMap || !d || !Array.isArray(d.components)) return;
  d.components.forEach(comp=>{
    if(!hasAnimation(comp.type)) return;
    const st = compRunState(comp, liveMap);
    if(!st.bound) return;                 // 未绑定：renderAll 已按默认运行渲染，无需数据驱动
    const run = st.run;
    const g = findCompGroupDom(comp.id);
    if(!g) return;
    const cur = g.dataset.run;
    if(cur!==undefined && cur!=='' && cur!==null && cur===(run?'1':'0')) return;
    const t = TEMPLATES[comp.type];
    if(!t) return;
    const inner = t.render(comp.w, comp.h, Object.assign({}, comp.props, { _run: run }));
    const outInner = (run && (typeof running==='undefined' || running))
      ? inner
      : (typeof stripSMIL==='function' ? stripSMIL(inner) : inner);
    const _bodyEl = g.children && g.children[0];
    if(_bodyEl && String(_bodyEl.tagName).toLowerCase()==='g'){ _bodyEl.innerHTML = outInner; }
    else { g.innerHTML = outInner; }
    g.dataset.run = run ? '1' : '0';
    applyPipesFrom(comp.id, d);   // 该组件的输出线配色随之刷新（停止 → 停止色）
    // 属性面板「当前状态」readout（仅当面板已渲染）
    if(typeof setRunStatePill==='function') setRunStatePill((typeof $==='function') ? $('runState') : null, st);
  });
}
/* 兼容旧名（审计 4.10）：早先导出的单文件 HTML / 旧版预览页可能按名调用，
   三个别名统一在【此处】集中定义，preview.html 不再各复制一份（原副本是 IIFE 局部、
   外部根本调不到，属无效垫片，已删除）。
   @deprecated 保留仅为兼容历史导出物；计划在数据格式 v3 迁移完成后一并删除
   （届时 v2 之前的导出物已自然淘汰）。新增调用点请直接用 refreshRunState。 */
function refreshScrewConveyorRun(m, d){ return refreshRunState(m, d); }
function refreshFilterPressRun(m, d){ return refreshRunState(m, d); }
function refreshPendulumMillRun(m, d){ return refreshRunState(m, d); }

/* ============================================================
 * 16. 操作：删除/复制/对齐/历史
 * ============================================================ */
function deleteSelected(){
  if(selection.length===0) return;
  const compIds = selection.filter(s=>s.kind==='component').map(s=>s.id);
  const pipeIds = selection.filter(s=>s.kind==='pipe').map(s=>s.id);
  doc.pipes = doc.pipes.filter(p=>{
    if(pipeIds.includes(p.id)) return false;
    if(p.from && compIds.includes(p.from.cid)) return false;
    if(p.to && compIds.includes(p.to.cid)) return false;
    return true;
  });
  doc.components = doc.components.filter(c=>!compIds.includes(c.id));
  selClear();
  pushHistory();
  renderAll(); renderProps(); setDirty();
}
function duplicateComp(){
  const comps = selComps(); if(!comps.length) return;
  const newSel = [];
  comps.forEach(c=>{
    const nc = JSON.parse(JSON.stringify(c));
    nc.id = uid('c'); nc.x = snapV(nc.x+30); nc.y = snapV(nc.y+30);
    doc.components.push(nc);
    newSel.push({kind:'component', id:nc.id});
  });
  selection = newSel;
  pushHistory(); renderAll(); renderProps(); setDirty();
}
function alignSelection(type){
  const comps = selComps(); if(comps.length<2) return;
  if(type==='left'){ const m=Math.min(...comps.map(c=>c.x)); comps.forEach(c=>c.x=m); }
  else if(type==='right'){ const m=Math.max(...comps.map(c=>c.x+c.w)); comps.forEach(c=>c.x=m-c.w); }
  else if(type==='top'){ const m=Math.min(...comps.map(c=>c.y)); comps.forEach(c=>c.y=m); }
  else if(type==='bottom'){ const m=Math.max(...comps.map(c=>c.y+c.h)); comps.forEach(c=>c.y=m-c.h); }
  else if(type==='centerH'){ const m=comps.reduce((s,c)=>s+c.x+c.w/2,0)/comps.length; comps.forEach(c=>c.x=snapV(m-c.w/2)); }
  else if(type==='centerV'){ const m=comps.reduce((s,c)=>s+c.y+c.h/2,0)/comps.length; comps.forEach(c=>c.y=snapV(m-c.h/2)); }
  else if(type==='distH'){
    const s=[...comps].sort((a,b)=>a.x-b.x);
    if(s.length>2){ const tot=s[s.length-1].x-s[0].x; const gap=tot/(s.length-1); s.forEach((c,i)=>{ if(i>0&&i<s.length-1) c.x=snapV(s[0].x+gap*i); }); }
  }
  else if(type==='distV'){
    const s=[...comps].sort((a,b)=>a.y-b.y);
    if(s.length>2){ const tot=s[s.length-1].y-s[0].y; const gap=tot/(s.length-1); s.forEach((c,i)=>{ if(i>0&&i<s.length-1) c.y=snapV(s[0].y+gap*i); }); }
  }
  pushHistory(); renderAll(); setDirty();
}

function pushHistory(){
  histStack = histStack.slice(0, histIdx+1);
  let snap;
  try{
    snap = JSON.stringify(doc);
  }catch(e){
    // 序列化失败（循环引用等）时放弃本次快照，但绝不让调用方整体失败（审计 §5.2）
    console.error('[HISTORY] 快照序列化失败，本次不入栈：', e && e.message);
    return;
  }
  histStack.push(snap);
  if(histStack.length>HIST_MAX) histStack.shift();
  histIdx = histStack.length-1;
}
/* 历史快照读取：快照损坏时跳过该步并提示，而不是抛异常让撤销/重做整体失效（审计 §5.2） */
function readHistory(i){
  try{
    const d = JSON.parse(histStack[i]);
    if(!d || !Array.isArray(d.components)) throw new Error('快照结构非法');
    return d;
  }catch(e){
    console.error('[HISTORY] 快照解析失败，已跳过该步：', e && e.message);
    flash('历史记录损坏，已跳过该步');
    return null;
  }
}
function undo(){
  if(histIdx<=0) return;
  const d = readHistory(histIdx-1);
  histIdx--;
  if(!d) return;
  doc=d; selClear(); renderAll(); renderProps(); setDirty(false);
}
function redo(){
  if(histIdx>=histStack.length-1) return;
  const d = readHistory(histIdx+1);
  histIdx++;
  if(!d) return;
  doc=d; selClear(); renderAll(); renderProps(); setDirty(false);
}

function setDirty(d=true){
  dirty = d;
  $('stSaved').textContent = d ? '● 未保存' : '● 已保存';
  $('stSaved').style.color = d ? 'var(--amber)' : 'var(--green)';
}

/* ============================================================
 * 17. 模式
 * ============================================================ */
function setMode(m){
  mode = m;
  $('stMode').textContent = {select:'选择',connect:'连线',pan:'平移'}[m];
  const mp = $('modePill'); mp.className = 'mode-pill '+m;
  $('modeText').textContent = {select:'选择模式',connect:'连线模式',pan:'平移模式'}[m];
  svg.classList.toggle('connecting', m==='connect');
  svg.classList.toggle('panning', m==='pan');
}

/* ============================================================
 * 18. 状态栏
 * ============================================================ */
function updateStatus(){
  $('stCount').textContent = doc.components.length;
  $('stPipes').textContent = doc.pipes.length;
  if(selection.length===1){
    const s=selection[0];
    if(s.kind==='component'){ const c=getComp(s.id); $('stSel').textContent = c?(c.props.name||c.id):'无'; }
    else { $('stSel').textContent = '管道'; }
  } else if(selection.length>1){ $('stSel').textContent = selection.length+' 项'; }
  else $('stSel').textContent='无';
}

/* ============================================================
 * 19. 工具栏（仅编辑页面）
 * ============================================================ */
if(_isEditor){
$('btnTemplate').onclick = ()=>{ loadTemplate(); };
$('btnSave').onclick = saveProject;            // 项目库：已入库原地覆盖，未入库则打开面板命名
$('btnLoad').onclick = openProjectPanel;       // 项目库：可视化列表中选择加载
$('btnExportJson').onclick = ()=>{ openModal('导出 JSON', serializeDoc(doc, 2), txt=>{ navigator.clipboard?.writeText(txt); flash('已复制到剪贴板'); }); };
/* 导入 JSON：与本地文件载入走同一条 validate → normalize → apply 链路（审计 §10.5/§1.3/§1.4）。
   原来直接 doc=JSON.parse(txt) 赋给全局，缺 pipes 等字段会在渲染层抛 TypeError，
   页面停在半渲染状态且提示无效。 */
$('btnImport').onclick = ()=>{ openModal('导入 JSON', '', txt=>{
  let parsed;
  try{
    parsed = JSON.parse(txt);
  }catch(e){
    alert('JSON 解析失败：' + e.message);
    return;
  }
  try{
    applyProjectData(parsed);
    _currentProjectFile = null;          // 导入来源与项目库无关
    _lastFileName = '导入的项目';
    updateFileInfo(_lastFileName, Date.now());
    flash('已导入');
  }catch(e){
    alert('导入失败：' + e.message);
  }
}); };
$('btnPNG').onclick = exportPNG;
$('btnUndo').onclick = undo;
$('btnRedo').onclick = redo;
$('btnRun').onclick = ()=>{ running=!running; $('btnRun').classList.toggle('active',running); if(running) startFlow(); else stopFlow(); };
$('btnPreview').onclick = ()=>{
  // 写失败时不打开预览：否则预览展示的是上一次的旧数据，用户会误以为已同步（审计 §5.1）
  if(!writePreviewDoc()) return;
  setDirty(false);
  window.open('preview.html', '_blank');
};
$('btnExport').onclick = exportStandalone;
$('btnSensors').onclick = openSensorPanel;
$('smClose').onclick = closeSensorPanel;
$('smDone').onclick = closeSensorPanel;
$('smRefresh').onclick = refreshSensorPanel;
$('smAddSel').onclick = smAddToDevice;
$('smSearch').oninput = e=>{ _smFilter = e.target.value; renderSensorList(); };
$('smSearch').onkeydown = e=>{ if(e.key==='Enter') renderSensorList(); };
$('sensorModal').addEventListener('mousedown', e=>{ if(e.target===e.currentTarget) closeSensorPanel(); });
// 项目库面板
$('projClose').onclick = closeProjectPanel;
$('projDone').onclick = closeProjectPanel;
$('projRefresh').onclick = refreshProjectList;
$('projSaveAs').onclick = ()=> saveToLibrary($('projName').value);
$('projName').onkeydown = e=>{ if(e.key==='Enter') saveToLibrary($('projName').value); };
$('projOpenLocal').onclick = loadProjectFromLocalFile;
$('projSaveLocal').onclick = saveProjectToLocalFile;
$('projModal').addEventListener('mousedown', e=>{ if(e.target===e.currentTarget) closeProjectPanel(); });
$('btnSnap').onclick = ()=>{ snap=!snap; $('btnSnap').classList.toggle('active',snap); };
$('btnClear').onclick = ()=>{
  confirmDialog('确定清空所有组件和管道？<br>此操作可通过 撤销(Ctrl+Z) 恢复。', ()=>{
    try{
      doc.components=[]; doc.pipes=[]; selClear(); pushHistory(); renderAll(); renderProps(); setDirty();
      flash('已清空画布');
    }catch(e){ console.error(e); flash('清空出错：'+e.message); }
  });
};
$('btnZoomIn').onclick = ()=>zoomBy(1.2);
$('btnZoomOut').onclick = ()=>zoomBy(0.8);
$('btnZoomFit').onclick = zoomFit;
$('btnRotL').onclick = rotateCCW;
$('btnRotR').onclick = rotateCW;
$('btnMirror').onclick = toggleMirror;

/* 模式快捷按钮(可选): 这里默认 select，端口点击自动进入 connect */
setMode('select');
$('btnSnap').classList.add('active');

/* 搜索 */
$('paSearch').addEventListener('input', e=>buildPalette(e.target.value));

/* ============================================================
 * 20. 键盘快捷键
 * ============================================================ */
window.addEventListener('keydown', e=>{
  if(e.target.tagName==='INPUT' || e.target.tagName==='TEXTAREA' || e.target.tagName==='SELECT') return;
  if(e.code==='Space'){ spaceDown=true; svg.style.cursor='grab'; e.preventDefault(); }
  if(e.key==='Delete' || e.key==='Backspace'){ deleteSelected(); e.preventDefault(); }
  if(e.ctrlKey && e.key==='z'){ undo(); e.preventDefault(); }
  if(e.ctrlKey && (e.key==='y' || (e.shiftKey && e.key==='Z'))){ redo(); e.preventDefault(); }
  if(e.ctrlKey && e.key==='d'){ duplicateComp(); e.preventDefault(); }
  if(e.ctrlKey && e.key==='c' && selComps().length){
    clipboard = selComps().map(c=>JSON.parse(JSON.stringify(c)));
    flash('已复制 '+clipboard.length+' 个组件');
    e.preventDefault();
  }
  if(e.ctrlKey && e.key==='v' && clipboard && clipboard.length){
    const newSel=[];
    clipboard.forEach(c=>{
      const nc = JSON.parse(JSON.stringify(c));
      nc.id = uid('c'); nc.x = snapV(nc.x+30); nc.y = snapV(nc.y+30);
      doc.components.push(nc);
      newSel.push({kind:'component', id:nc.id});
    });
    selection = newSel;
    pushHistory(); renderAll(); renderProps(); setDirty();
    flash('已粘贴 '+newSel.length+' 个');
    e.preventDefault();
  }
  if(e.key==='Escape'){ connectState=null; selClear(); setMode('select'); renderAll(); renderProps(); }
  if(e.key==='s' && e.ctrlKey){ $('btnSave').click(); e.preventDefault(); }
  if(e.key==='[' && e.ctrlKey){ rotateCCW(); e.preventDefault(); }
  if(e.key===']' && e.ctrlKey){ rotateCW(); e.preventDefault(); }
  if(e.key==='h' && !e.ctrlKey && !e.altKey && !e.metaKey){ toggleMirror(); e.preventDefault(); }
});
window.addEventListener('keyup', e=>{ if(e.code==='Space'){ spaceDown=false; svg.style.cursor='default'; } });
} // _isEditor toolbar+keyboard

/* ============================================================
 * 21. 项目保存 / 加载（本地文件通道）
 *     优先 File System Access API 保存到用户指定的磁盘位置，并提供
 *     下载/上传回退。作为项目库面板（见 21b）的次要入口保留了"另存到
 *     任意位置"的能力。
 * ============================================================ */
let _lastFileHandle = null;   // 最近一次保存的文件句柄（用于增量保存）
let _lastFileName = 'pfd_doc.json';
let _currentProjectFile = null;   // 当前项目在项目库中的文件名（null = 尚未入库）
let _projectBaseMtime = null;     // 载入/上次保存时服务端返回的 mtime（并发写保护基线，审计 3.3）

// 保存状态栏信息
function updateFileInfo(name, ts){
  const el = $('stFileInfo');
  if(!el) return;
  if(name){
    const t = ts ? new Date(ts).toLocaleTimeString() : '';
    el.textContent = `${name}${t? ' · '+t : ''}`;
    el.title = `最近保存/加载：${name}\n${ts ? new Date(ts).toLocaleString() : ''}`;
  } else {
    el.textContent = '未保存过文件';
    el.title = '最近一次保存/加载的信息';
  }
}

// 是否为合法项目文档
/* 项目数据入口校验（审计 §10.5）：返回"问题清单"，空数组 = 通过。
   只检查会导致渲染崩溃或语义不明的结构/类型问题，不做业务语义校验。
   原实现只判断三个字段的存在性 —— 缺 pipes 时能通过校验，随后在渲染层以
   TypeError 爆开（实测：Cannot read properties of undefined (reading 'length')）。 */
function projectDataProblems(obj){
  const errs = [];
  if(!obj || typeof obj !== 'object' || Array.isArray(obj)) return ['根节点必须是 JSON 对象'];
  if(!Array.isArray(obj.components)) errs.push('缺少 components 数组');
  if(!Array.isArray(obj.pipes)) errs.push('缺少 pipes 数组');
  if(!obj.meta || typeof obj.meta !== 'object' || Array.isArray(obj.meta)) errs.push('缺少 meta 对象');
  if(obj.version !== undefined && (typeof obj.version !== 'number' || !isFinite(obj.version))) errs.push('version 必须是数字');
  if(typeof obj.version === 'number' && obj.version > (doc.version || 1)) {
    errs.push('文件版本 v' + obj.version + ' 高于当前编辑器支持的 v' + (doc.version || 1) + '，可能无法完整打开');
  }
  (Array.isArray(obj.components) ? obj.components : []).forEach((c, i)=>{
    if(!c || typeof c !== 'object'){ errs.push('components[' + i + '] 不是对象'); return; }
    if(!c.id) errs.push('components[' + i + '] 缺少 id');
    if(!c.type) errs.push('components[' + i + '] 缺少 type');
    else if(!TEMPLATES[c.type]) errs.push('components[' + i + '] 类型 "' + c.type + '" 未注册（可能来自更新版本）');
  });
  (Array.isArray(obj.pipes) ? obj.pipes : []).forEach((p, i)=>{
    if(!p || typeof p !== 'object'){ errs.push('pipes[' + i + '] 不是对象'); return; }
    if(!p.id) errs.push('pipes[' + i + '] 缺少 id');
    if(!p.from || !p.from.cid) errs.push('pipes[' + i + '] 缺少 from.cid');
    if(!p.to || !p.to.cid) errs.push('pipes[' + i + '] 缺少 to.cid');
  });
  return errs;
}
function isValidProject(obj){ return projectDataProblems(obj).length === 0; }
/* 校验失败时把问题清单转成可读提示（最多列 6 条，其余折叠计数） */
function projectProblemText(problems){
  const head = problems.slice(0, 6).join('\n· ');
  return '\n· ' + head + (problems.length > 6 ? '\n… 共 ' + problems.length + ' 项问题' : '');
}

/* 文档序列化单一入口（审计 8.5）：运行时缓存字段（_pts/_segs 等下划线开头）在此统一剥除，
   避免写入存档 / 导出 / 预览通道。原来 stripRuntimeFields（stringify 再 reviver parse，
   双倍开销）、writePreviewDoc 的 stringify replacer、exportStandalone 的手工挑字段三套实现并存，
   现统一为这一份 replacer。
   ⚠️ 撤销历史（pushHistory）是运行时内部快照，需要完整字段（含 _pts），不走本入口。 */
function serializeDoc(v, space){
  return JSON.stringify(v, (k,val)=> k.charAt(0)==='_' ? undefined : val, space);
}
/* 位号有效性批量校验（审计 §数据一致性 4.3）：保存/载入时收集
   params[].k / runTags[].tag / monitorTags[].tag 与后端目录比对，
   失效位号汇总告警（告警不阻断保存/载入）。目录未加载（离线）时不判定失效，
   只显式提示"未连接后端，无法校验位号"。 */
function collectDocTags(d){
  const out = new Set();
  ((d && d.components) || []).forEach(c=>{
    const p = (c && c.props) || {};
    (p.params||[]).forEach(x=>{ const t = String((x && x.k)||'').trim(); if(t) out.add(t); });
    (p.runTags||[]).forEach(x=>{ const t = String((x && x.tag)||'').trim(); if(t) out.add(t); });
    (p.monitorTags||[]).forEach(x=>{ const t = String((x && x.tag)||'').trim(); if(t) out.add(t); });
  });
  return Array.from(out);
}
function warnUnknownTags(when){
  if(!sensorCatalog.length){
    console.warn('[TAG] 未连接后端，无法校验位号（' + when + '）');
    flash('未连接后端，无法校验位号');
    return;
  }
  const known = new Set(sensorCatalog.map(x=>x.tag));
  const unknown = collectDocTags(doc).filter(t=>!known.has(t));
  if(!unknown.length) return;
  const shown = unknown.slice(0,10).join('\n');
  alert(when + '位号校验：以下 ' + unknown.length + ' 个位号不在后端传感器目录中，对应参数将显示 "--"：\n\n'
    + shown + (unknown.length>10 ? '\n…（共 ' + unknown.length + ' 个）' : ''));
}

function buildProjectData(){
  return {
    type: 'pfd-project',
    version: doc.version || 1,
    savedAt: new Date().toISOString(),
    title: (doc.meta && doc.meta.title) || '未命名流程',
    meta: Object.assign({}, doc.meta),
    // 运行时缓存字段由 serializeDoc 在最终序列化时统一剥除（审计 8.5），这里不再做中间拷贝
    components: doc.components,
    pipes: doc.pipes
  };
}

// 校验并恢复项目
function applyProjectData(data){
  const problems = projectDataProblems(data);
  if(problems.length){
    throw new Error('文件内容不是有效的项目数据：' + projectProblemText(problems));
  }
  doc = {
    version: data.version || 1,
    components: data.components || [],
    pipes: data.pipes || [],
    meta: Object.assign({ title:'未命名流程', bg:'#070612' }, data.meta || {})
  };
  selClear(); histStack=[]; histIdx=-1; pushHistory();
  renderAll(); renderProps();
  setDirty(false);
  warnUnknownTags('载入');   // 位号批量校验（审计 §数据一致性 4.3）：失效位号汇总告警
  // 恢复视图
  setTimeout(zoomFit, 50);
}

// 另存为本地文件（File System Access API，回退为下载）
// 项目库面板内的次要入口，保留"存到磁盘任意位置"的原有能力
async function saveProjectToLocalFile(){
  warnUnknownTags('保存');   // 位号批量校验（审计 §数据一致性 4.3）：失效位号汇总告警，不阻断保存
  try{
    const data = buildProjectData();
    const json = serializeDoc(data, 2);
    const suggested = sanitizeFileName((data.title||'工艺流程') + '.json');

    // 优先使用 File System Access API（可保存到指定磁盘位置）
    if(window.showSaveFilePicker){
      let handle = _lastFileHandle;
      try{
        if(!handle){
          handle = await window.showSaveFilePicker({
            suggestedName: suggested,
            types: [{ description:'PFD 项目文件', accept: { 'application/json': ['.json'] } }]
          });
        }
        _lastFileHandle = handle;
        const writable = await handle.createWritable();
        await writable.write(json);
        await writable.close();
        _lastFileName = handle.name || suggested;
        setDirty(false);
        updateFileInfo(_lastFileName, data.savedAt);
        flash('已保存：' + _lastFileName);
      }catch(err){
        // 用户在保存对话框取消
        if(err && err.name === 'AbortError'){ flash('已取消保存'); return; }
        // 权限或句柄失效 -> 回退到下载
        if(err && (err.name === 'InvalidStateError' || err.name === 'NotAllowedError')){
          downloadProject(json, suggested);
          setDirty(false);
          updateFileInfo(_lastFileName, data.savedAt);
          flash('已通过下载保存：' + _lastFileName);
          return;
        }
        throw err;
      }
    } else {
      // 不支持 File System Access API -> 下载
      downloadProject(json, suggested);
      setDirty(false);
      updateFileInfo(_lastFileName, data.savedAt);
      flash('已通过下载保存：' + _lastFileName);
    }
  }catch(err){
    console.error('保存失败', err);
    alert('保存失败：' + (err && err.message ? err.message : '未知错误'));
  }
}

function downloadProject(json, filename){
  const blob = new Blob([json], { type:'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 1500);
}

function sanitizeFileName(name){
  return String(name).replace(/[\\/:*?"<>|]/g, '_').trim() || 'pfd_doc.json';
}

// 从本地文件打开（File System Access API，回退为 <input type=file>）
// 项目库面板内的次要入口
async function loadProjectFromLocalFile(){
  try{
    let file = null, fileName = '';
    // 优先使用 File System Access API 选择文件
    if(window.showOpenFilePicker){
      try{
        const [handle] = await window.showOpenFilePicker({
          types: [{ description:'PFD 项目文件', accept: { 'application/json': ['.json'] } }],
          multiple: false
        });
        file = await handle.getFile();
        fileName = handle.name || file.name;
      }catch(err){
        if(err && err.name === 'AbortError'){ flash('已取消加载'); return; }
        throw err;
      }
    } else {
      // 回退：<input type=file>
      const text = await pickFileFallback();
      if(text === null){ flash('已取消加载'); return; }
      restoreFromText(text, '导入的项目');
      return;
    }

    if(!file){ flash('未选择文件'); return; }
    if(file.size > 10 * 1024 * 1024){ alert('文件过大，无法加载（>10MB）'); return; }
    const text = await file.text();
    restoreFromText(text, fileName);
  }catch(err){
    console.error('加载失败', err);
    alert('加载失败：' + (err && err.message ? err.message : '未知错误'));
  }
}

function pickFileFallback(){
  return new Promise((resolve, reject)=>{
    try{
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.onchange = ()=>{
        const f = input.files && input.files[0];
        if(!f){ resolve(null); return; }
        const reader = new FileReader();
        reader.onload = ()=>resolve(String(reader.result||''));
        reader.onerror = ()=>reject(new Error('读取文件失败'));
        reader.readAsText(f);
      };
      input.click();
    }catch(err){ reject(err); }
  });
}

function restoreFromText(text, fileName){
  try{
    let parsed;
    try{
      parsed = JSON.parse(text);
    }catch(e){
      throw new Error('JSON 解析失败：' + e.message);
    }
    // 兼容旧版存储格式（直接是 doc 结构）
    if(parsed && parsed.type === 'pfd-project'){
      applyProjectData(parsed);
    } else if(isValidProject(parsed)){
      applyProjectData(parsed);
    } else {
      throw new Error('文件内容不是有效的项目数据');
    }
    _currentProjectFile = null;   // 来源未知（本地文件/导入），与项目库解除关联
    _lastFileName = fileName || '导入的项目';
    updateFileInfo(_lastFileName, Date.now());
    flash('已加载：' + _lastFileName);
    return true;
  }catch(err){
    console.error('加载失败', err);
    alert('加载失败：' + (err && err.message ? err.message : '未知错误'));
    return false;
  }
}

/* ============================================================
 * 21b. 项目库（服务端默认目录，可视化保存/加载）
 *     读写走 server.js 的 /pfd-api/projects 接口，默认目录由服务端
 *     PROJECT_DIR 决定（默认 <项目根>/projects）。已入库项目直接原地
 *     覆盖保存；本地文件对话框降为面板内的次要入口。
 * ============================================================ */
const PROJ_API = 'pfd-api/projects';
/* 项目库请求统一入口（审计 3.1 配套）：服务端启用 PFD_API_TOKEN 时，令牌由 server.js
   注入到页面（window.__PFD_TOKEN），这里自动带上 —— 无需人工配置，也不影响未启用鉴权的部署。 */
function projFetch(url, opts){
  const o = Object.assign({}, opts || {});
  const t = (typeof window !== 'undefined' && window.__PFD_TOKEN) || '';
  o.headers = Object.assign({}, o.headers || {});
  if(t) o.headers['X-PFD-Token'] = t;
  return fetch(url, o);
}

// 规范化项目文件名：清洗非法字符并补全 .json 后缀
function projFileName(raw){
  const base = sanitizeFileName(String(raw || '').trim());
  return /\.json$/i.test(base) ? base : base + '.json';
}

/*统一 API 客户端（审计 5.9）：项目库 4 个 fetch 原来各自 `r.json().catch(...)` +
   `if(!j || !j.success) throw`，网络错误 / HTTP 错误 / 业务错误混作一团，失败提示粒度粗。
   统一为一个入口，按状态码分支并抛出规范化错误对象：
   · kind='network'  fetch 本身失败（服务未启动 / 断网）
   · kind='conflict' HTTP 409 并发写冲突（e.mtime = 服务端当前 mtime）
   · kind='http'     响应不是约定的 JSON 结构（e.status 可用）
   · kind='client'   4xx 请求被拒（e.status / e.message 可用）
   · kind='server'   5xx 服务端故障 */
function projApiError(msg, props){
  const e = new Error(msg);
  Object.assign(e, props || {});
  return e;
}
async function projApi(path, opts){
  let r;
  try{
    r = await projFetch(path, opts);
  }catch(e){
    throw projApiError('网络错误或服务未启动：' + ((e && e.message) || e), { kind:'network' });
  }
  const j = await r.json().catch(()=>null);
  if(r.status === 409){
    throw projApiError((j && j.error) || '该项目已被其他会话修改', {
      kind: 'conflict', status: 409,
      mtime: (j && typeof j.mtime === 'number') ? Math.round(j.mtime) : null
    });
  }
  if(!j || typeof j !== 'object' || Array.isArray(j)){
    throw projApiError('服务端响应异常（HTTP ' + r.status + '）', { kind:'http', status:r.status });
  }
  if(!j.success){
    throw projApiError(j.error || ('操作失败（HTTP ' + r.status + '）'), {
      kind: (r.status >= 500) ? 'server' : 'client', status: r.status
    });
  }
  return j;
}
/* 失败提示按错误类别分流（审计 5.9：原来一律笼统报错，用户无法区分断网/被拒/服务端故障） */
function projErrText(e, action){
  if(!e) return action + '：未知错误';
  if(e.kind === 'network') return action + '：无法连接项目库（请确认通过 node server.js 启动，而非直接打开 HTML 文件）';
  return action + '：' + e.message;
}

function openProjectPanel(){
  const m = $('projModal'); if(!m) return;
  const nameInput = $('projName');
  if(nameInput && !nameInput.value){
    nameInput.value = projFileName((doc.meta && doc.meta.title) || '工艺流程');
  }
  m.classList.add('show');
  refreshProjectList();
  // 尚未入库时聚焦命名框，一步完成「保存为」
  if(!_currentProjectFile && nameInput){ nameInput.focus(); nameInput.select(); }
}
function closeProjectPanel(){ const m = $('projModal'); if(m) m.classList.remove('show'); }

function fmtFileSize(n){
  if(n < 1024) return n + ' B';
  if(n < 1024*1024) return (n/1024).toFixed(1) + ' KB';
  return (n/1024/1024).toFixed(2) + ' MB';
}
function fmtFileTime(ms){
  const d = new Date(ms), p = v => String(v).padStart(2,'0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

async function refreshProjectList(){
  const list = $('projList'); if(!list) return;
  list.innerHTML = '<div class="sm-empty">读取中…</div>';
  try{
    const j = await projApi(PROJ_API);
    const dirEl = $('projDir');
    // 安全批次（7.3）后服务端不再回显绝对路径，降级为固定文案
    if(dirEl){ dirEl.textContent = j.dir ? ('目录：' + j.dir) : '目录：项目库（服务端默认目录）'; dirEl.title = j.dir || ''; }
    const hint = $('projHint'); if(hint) hint.textContent = `共 ${(j.files || []).length} 个项目`;
    renderProjectRows(j.files || []);
  }catch(e){
    console.warn('[PROJECT] 列表读取失败', e.kind, e.message);
    list.innerHTML = '<div class="sm-empty">' + esc(projErrText(e, '无法读取项目库')).replace(/\n/g, '<br>') + '</div>';
    const hint = $('projHint'); if(hint) hint.textContent = '';
  }
}

function renderProjectRows(files){
  const list = $('projList'); if(!list) return;
  if(!files.length){
    list.innerHTML = '<div class="sm-empty">项目库为空<br>在上方输入名称后点击「保存到项目库」</div>';
    return;
  }
  list.innerHTML = '';
  files.forEach(f=>{
    const row = document.createElement('div');
    row.className = 'pj-row' + (f.name === _currentProjectFile ? ' active' : '');
    row.innerHTML = `<span class="pj-name" title="${esc(f.name)}">${esc(f.name)}</span>
      <span class="pj-meta">${fmtFileSize(f.size)}</span>
      <span class="pj-meta">${fmtFileTime(f.mtime)}</span>
      <button class="pj-act load">加载</button>
      <button class="pj-act del">删除</button>`;
    row.querySelector('.pj-name').onclick = ()=> loadFromLibrary(f.name);
    row.querySelector('.load').onclick = ()=> loadFromLibrary(f.name);
    row.querySelector('.del').onclick = ()=>{
      confirmDialog(`确定删除项目「${esc(f.name)}」？<br>该文件将从服务器磁盘移除，且不可撤销。`, ()=> deleteFromLibrary(f.name));
    };
    list.appendChild(row);
  });
}

// 保存到项目库（同名覆盖）
async function saveToLibrary(name){
  warnUnknownTags('保存');   // 位号批量校验（审计 §数据一致性 4.3）：失效位号汇总告警，不阻断保存
  const target = projFileName(name);
  const data = buildProjectData();
  const json = serializeDoc(data, 2);
  /* 并发写保护（审计 3.3）：带上载入时的 mtime 作为基线，
     服务端发现文件已被他人改动会返回 409，这里提示用户而不是静默覆盖。 */
  const doSave = withBase => {
    const headers = { 'Content-Type':'application/json' };
    if(withBase && _projectBaseMtime !== null) headers['X-PFD-Base-Mtime'] = String(_projectBaseMtime);
    return projApi(PROJ_API + '/' + encodeURIComponent(target), { method:'POST', headers, body: json });
  };
  try{
    let j, overwritten = false;
    try{
      j = await doSave(true);
    }catch(e){
      if(e.kind !== 'conflict') throw e;
      const ok = confirm('该项目在项目库中已被其他会话修改。\n\n确定 = 用当前画布内容覆盖\n取消 = 放弃本次保存');
      if(!ok){ flash('已取消保存（项目库版本较新）'); return; }
      // 用户确认覆盖：清掉基线重发一次
      _projectBaseMtime = null;
      j = await doSave(false);
      overwritten = true;
    }
    _projectBaseMtime = (typeof j.mtime === 'number') ? Math.round(j.mtime) : null;
    _currentProjectFile = target;
    setDirty(false);
    updateFileInfo(target, Date.now());
    flash((overwritten ? '已覆盖保存到项目库：' : '已保存到项目库：') + target);
    const nameInput = $('projName'); if(nameInput) nameInput.value = target;
    refreshProjectList();
  }catch(e){
    console.error('保存失败', e);
    alert(projErrText(e, '保存到项目库失败'));
  }
}

// 从项目库读取并应用
async function loadFromLibrary(name){
  try{
    const j = await projApi(PROJ_API + '/' + encodeURIComponent(name));
    if(restoreFromText(j.content, name)){
      _currentProjectFile = name;
      _projectBaseMtime = (typeof j.mtime === 'number') ? Math.round(j.mtime) : null;   // 并发基线
      const nameInput = $('projName'); if(nameInput) nameInput.value = name;
      closeProjectPanel();
    }
  }catch(e){
    console.error('加载失败', e);
    alert(projErrText(e, '加载失败'));
  }
}

async function deleteFromLibrary(name){
  try{
    await projApi(PROJ_API + '/' + encodeURIComponent(name), { method:'DELETE' });
    if(_currentProjectFile === name){ _currentProjectFile = null; _projectBaseMtime = null; }
    flash('已从项目库删除：' + name);
    refreshProjectList();
  }catch(e){
    console.error('删除失败', e);
    alert(projErrText(e, '删除失败'));
  }
}

// 工具栏「保存」：已入库则原地覆盖，否则打开面板命名
function saveProject(){
  if(_currentProjectFile){ saveToLibrary(_currentProjectFile); return; }
  openProjectPanel();
}

/* ============================================================
 * 22. 模态框
 * ============================================================ */
function openModal(title, text, onOk){
  $('modalTitle').textContent=title;
  $('modalText').value=text;
  $('modal').classList.add('show');
  $('modalOk').onclick = ()=>{ onOk($('modalText').value); closeModal(); };
  $('modalCancel').onclick = closeModal;
  $('modalClose').onclick = closeModal;
}
function closeModal(){ $('modal').classList.remove('show'); }

// 非阻塞确认框：替代原生 confirm()（原生 confirm 在嵌入/沙箱环境下可能被拦截导致页面卡死）
function confirmDialog(message, onYes){
  const bg = document.createElement('div');
  bg.style.cssText = 'position:fixed;inset:0;background:#000a;z-index:130;display:flex;align-items:center;justify-content:center';
  bg.innerHTML = `<div style="background:var(--panel);border:1px solid var(--line2);border-radius:8px;padding:18px 22px;max-width:320px;text-align:center">
    <div style="font-size:14px;color:var(--text);margin-bottom:16px;line-height:1.6">${message}</div>
    <div style="display:flex;gap:10px;justify-content:center">
      <button id="cfYes" style="height:32px;padding:0 18px;border:1px solid var(--red);background:var(--red);color:#fff;border-radius:5px;font-size:12px;cursor:pointer;font-weight:600">确定</button>
      <button id="cfNo" style="height:32px;padding:0 18px;border:1px solid var(--line2);background:var(--panel2);color:var(--text2);border-radius:5px;font-size:12px;cursor:pointer">取消</button>
    </div>
  </div>`;
  document.body.appendChild(bg);
  const close = ()=>{ bg.remove(); };
  bg.querySelector('#cfYes').onclick = ()=>{ close(); onYes(); };
  bg.querySelector('#cfNo').onclick = close;
  bg.addEventListener('click', e=>{ if(e.target===bg) close(); });
}

/* ============================================================
 * 23. 轻提示（flash）
 * ============================================================ */
let flashTimer=null;
function flash(msg){
  let el = $('flash');
  if(!el){ el=document.createElement('div'); el.id='flash'; el.style.cssText='position:fixed;top:60px;left:50%;transform:translateX(-50%);background:#12112Bee;border:1px solid var(--purple);color:#fff;padding:8px 18px;border-radius:6px;z-index:200;font-size:12px;transition:.3s;pointer-events:none'; document.body.appendChild(el); }
  el.textContent=msg; el.style.opacity='1';
  clearTimeout(flashTimer); flashTimer=setTimeout(()=>el.style.opacity='0',1600);
}

/* ============================================================
 * 24. 运行模式：粒子流动
 * ============================================================ */
let flowRAF = null;
let flowNodes = [];   // 粒子节点池：复用于每次动画帧，避免每帧销毁/重建
const FLOW_TRAIL = 4; // 每个主粒子随影拖尾数（拖尾越长越流畅，节点数 = 粒子数*(1+FLOW_TRAIL)）
function startFlow(){
  if(flowRAF) return;
  applySMILState();
  // 编辑态曾剥离 SMIL 动画元素，运行前重新渲染注入
  if(svg && !svg.querySelector('animate,animateTransform') && doc.components.length) renderAll();
  function ensureNodes(n){
    // 若上次池中的节点已被重渲染清出 DOM（未连接），整体重建池
    if(flowNodes.length && !flowNodes[0].isConnected){ flowNodes = []; layerFlow.innerHTML=''; }
    while(flowNodes.length < n){
      const c = createSVG('circle');
      c.setAttribute('class','flow-dot');
      layerFlow.appendChild(c);
      flowNodes.push(c);
    }
    while(flowNodes.length > n){
      const extra = flowNodes.pop();
      extra.remove();
    }
  }
  function tick(){
    // 计算当前需要的粒子总数（含拖尾）
    const n = FLOW_TRAIL + 1;
    let need = 0;
    doc.pipes.forEach(pipe=>{ if(pipe._pts && pipe._pts.length>=2 && !pipeRunStopped(pipe)) need += 3*n; });
    ensureNodes(need);
    let idx = 0;
    // 管道粒子（含拖尾：沿路径滞后、渐隐渐小）
    doc.pipes.forEach(pipe=>{
      if(!pipe._pts || pipe._pts.length<2) return;
      if(pipeRunStopped(pipe)) return;     // 来源设备停止 → 该输出线不再走料
      const pt = PIPE_TYPES[pipe.type] || PIPE_TYPES.solid;
      const t = (performance.now()/1000 * pt.speed) % 1;
      for(let k=0;k<3;k++){
        const base = (t + k/3) % 1;
        for(let j=0;j<n;j++){
          const u = ((base - j*0.018) % 1 + 1) % 1;
          const p = pointAlongPipe(pipe, u);
          const fade = 1 - j/n;
          const c = flowNodes[idx++];
          c.setAttribute('cx',p.x); c.setAttribute('cy',p.y);
          c.setAttribute('r', 2.6 * (0.35 + 0.65*fade));
          c.setAttribute('fill',pt.color);
          c.setAttribute('opacity', 0.12 + 0.88*fade);
        }
      }
    });
    // 料仓内落料粒子改由模板 SMIL 驱动（见 templates/silo.js），此处不再外挂
    flowRAF = requestAnimationFrame(tick);
  }
  tick();
}
function stopFlow(){
  if(flowRAF){ cancelAnimationFrame(flowRAF); flowRAF=null; }
  layerFlow.innerHTML=''; flowNodes.length=0;
  // 停止后回到编辑态：剥离 SMIL 动画元素
  if(svg && svg.querySelector('animate,animateTransform') && doc.components.length) renderAll();
  applySMILState();
}
// 折线段长缓存：每帧每粒子重算段长表是 O(n·段数) 浪费，改为仅在几何变化时重建
function pipeSegCache(pipe){
  const pts = pipe._pts;
  if(!pts) return null;
  if(!pipe._segs || pipe._segsFor !== pts){
    const segs=[]; let total=0;
    for(let i=1;i<pts.length;i++){ const d=Math.hypot(pts[i].x-pts[i-1].x, pts[i].y-pts[i-1].y); segs.push(d); total+=d; }
    pipe._segs = segs; pipe._segsTotal = total; pipe._segsFor = pts;
  }
  return pipe;
}
function pointAlongPipe(pipe, t){
  pipeSegCache(pipe);
  const pts = pipe._pts, segs = pipe._segs, total = pipe._segsTotal;
  if(!pts || !segs || total<=0) return pts ? pts[pts.length-1] : {x:0,y:0};
  let dist=t*total, acc=0;
  for(let i=1;i<pts.length;i++){
    if(acc+segs[i-1]>=dist){
      const r = segs[i-1]===0?0:(dist-acc)/segs[i-1];
      return { x: pts[i-1].x+(pts[i].x-pts[i-1].x)*r, y: pts[i-1].y+(pts[i].y-pts[i-1].y)*r };
    }
    acc+=segs[i-1];
  }
  return pts[pts.length-1];
}
function pointAlong(pts, t){
  // 按长度均匀
  let segs=[], total=0;
  for(let i=1;i<pts.length;i++){ const d=Math.hypot(pts[i].x-pts[i-1].x, pts[i].y-pts[i-1].y); segs.push(d); total+=d; }
  let dist=t*total, acc=0;
  for(let i=1;i<pts.length;i++){
    if(acc+segs[i-1]>=dist){
      const r = segs[i-1]===0?0:(dist-acc)/segs[i-1];
      return { x: pts[i-1].x+(pts[i].x-pts[i-1].x)*r, y: pts[i-1].y+(pts[i].y-pts[i-1].y)*r };
    }
    acc+=segs[i-1];
  }
  return pts[pts.length-1];
}

/* ============================================================
 * 25. 导出：PNG
 * ============================================================ */
function exportPNG(){
  if(doc.components.length===0 && doc.pipes.length===0){ flash('画布为空，无法导出'); return; }
  let minX=1e9,minY=1e9,maxX=-1e9,maxY=-1e9;
  doc.components.forEach(c=>{ minX=Math.min(minX,c.x); minY=Math.min(minY,c.y); maxX=Math.max(maxX,c.x+c.w); maxY=Math.max(maxY,c.y+c.h); });
  // 监控器归属折线端点/折点纳入包围盒
  doc.components.forEach(c=>{
    if(c.type!=='monitor') return;
    const t = monitorLeadTarget(c);
    if(t){ minX=Math.min(minX,t.x); minY=Math.min(minY,t.y); maxX=Math.max(maxX,t.x); maxY=Math.max(maxY,t.y); }
    if(c.props.lead && c.props.lead.bend){ const b=c.props.lead.bend; minX=Math.min(minX,b.x); minY=Math.min(minY,b.y); maxX=Math.max(maxX,b.x); maxY=Math.max(maxY,b.y); }
  });
  doc.pipes.forEach(p=>{ (p._pts||[]).forEach(pt=>{ minX=Math.min(minX,pt.x); minY=Math.min(minY,pt.y); maxX=Math.max(maxX,pt.x); maxY=Math.max(maxY,pt.y); }); });
  const pad=60;
  minX=Math.floor(minX-pad); minY=Math.floor(minY-pad);
  const w=Math.ceil(maxX-minX+pad*2), h=Math.ceil(maxY-minY+pad*2);
  const clone = svg.cloneNode(true);
  const ov = clone.querySelector('#layerOverlay'); if(ov) ov.remove();
  const fl = clone.querySelector('#layerFlow'); if(fl) fl.remove();
  // 清除选中态
  clone.querySelectorAll('.selected').forEach(e=>e.classList.remove('selected'));
  clone.setAttribute('viewBox', `${minX} ${minY} ${w} ${h}`);
  clone.setAttribute('width', w); clone.setAttribute('height', h);
  const styleEl = document.createElementNS(SVG_NS,'style');
  styleEl.textContent = `
    .grid-line{stroke:#9C99FF;stroke-width:1;opacity:.06}
    .grid-line-major{stroke:#9C99FF;stroke-width:1;opacity:.12}
    .equip-body{fill:url(#gEquip);stroke:#9C99FF;stroke-width:1.5}
    .tlabel{font-size:11px;fill:#fff;font-weight:600;font-family:"Microsoft YaHei",sans-serif}
    .ttag{font-size:9px;fill:#00E5FF;font-family:"Microsoft YaHei",sans-serif}
    .tval{font-size:9px;fill:#80FFFFFF;font-family:"Microsoft YaHei",sans-serif}
    .port{fill:#0a0a1a;stroke:#9C99FF;stroke-width:1.5}
    .pipe{fill:none;stroke-linecap:round;stroke-linejoin:round}
    text{font-family:"Microsoft YaHei",sans-serif}
  `;
  clone.insertBefore(styleEl, clone.firstChild);
  const bg = document.createElementNS(SVG_NS,'rect');
  bg.setAttribute('x',minX); bg.setAttribute('y',minY); bg.setAttribute('width',w); bg.setAttribute('height',h);
  bg.setAttribute('fill','#070612');
  clone.insertBefore(bg, styleEl.nextSibling);
  const xml = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([xml], {type:'image/svg+xml;charset=utf-8'});
  const url = URL.createObjectURL(svgBlob);
  const img = new Image();
  img.onload = ()=>{
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1,w*scale); canvas.height = Math.max(1,h*scale);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#070612'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.scale(scale, scale);
    try{ ctx.drawImage(img, 0, 0); }
    catch(e){
      // 画布污染/尺寸异常会让 drawImage 抛错，导出图会缺内容，必须可见（审计 §5.5）
      console.error('[EXPORT] PNG 绘制失败：', e && e.message);
      flash('PNG 导出内容可能不完整：' + (e && e.message));
    }
    URL.revokeObjectURL(url);
    canvas.toBlob(blob=>{
      if(!blob){ flash('导出失败'); return; }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = (doc.meta.title||'工艺流程')+'.png';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(a.href), 1500);
      flash('已导出 PNG');
    }, 'image/png');
  };
  img.onerror = ()=>{ flash('导出失败：SVG 渲染异常'); URL.revokeObjectURL(url); };
  img.src = url;
}

/* ============================================================
 * 26. 导出：自包含单文件 HTML（供官网直接部署）
 *   把 templates/*.js（设备模板）+ editor.js 内联 + 当前流程数据 + 嵌入模式(localStorage独立)
 *   打包成一个不依赖服务器的独立 HTML
 * ============================================================ */
async function exportStandalone(){
  if(doc.components.length===0 && doc.pipes.length===0){ flash('画布为空，请先搭建流程'); return; }
  let out;
  try{
    out = await fetch('preview.html?v='+Date.now()).then(r=>r.text());
  }catch(e){ flash('生成失败：无法读取 preview.html（需通过 HTTP 访问）'); return; }
  try{
    // 1) 强制嵌入模式（隐藏工具栏/状态栏）
    const es = out.indexOf("const EMBED = new URLSearchParams");
    if(es<0) throw new Error('未找到嵌入标记（preview.html 结构已变化）');
    const ee = out.indexOf('\n', es);
    out = out.slice(0, es) + 'const EMBED = true;' + out.slice(ee);

    // 2) 内联全部设备模板 + editor.js（替换外部加载脚本标签，保持 templates → editor 顺序）
    // 必须校验 r.ok：模板/脚本 404 时错误页 HTML 会被当源码内联进导出文件，
    // 生成一个"能打开但功能全废"的产物且无任何提示（审计 §5.4）
    const fetchSrc = f => fetch(f+'?v='+Date.now()).then(r=>{
      if(!r.ok) throw new Error(f + ' 加载失败（HTTP ' + r.status + '），导出已中止');
      return r.text();
    });
    // 模板已按设备拆分到 templates/，清单唯一来源是入口 templates.js 的 TEMPLATE_FILES
    const loaderTxt = await fetchSrc('templates.js');
    const mf = /TEMPLATE_FILES\s*=\s*\[([\s\S]*?)\]/.exec(loaderTxt);
    if(!mf) throw new Error('未找到 TEMPLATE_FILES 清单（templates.js 结构已变化）');
    /* 清单里含分组注释行（如 `// 输送与给料`）：必须先剥掉行内注释再按逗号切分，
       否则注释会与紧随其后的第一个文件名粘连成 `// 输送与给料\n  'screwConveyor`，
       拼出 `templates/// 输送与给料 'screwConveyor.js` 这种非法路径 → 7 个分类各 404 一次，
       导出必然中止（.github/scripts/render-check.js 一直有这步剥离，导出路径此前漏了）。
       剥完再断言条目是纯文件名：将来清单格式再变会在这里 fail-fast，而不是退化成 404。 */
    const tplFiles = mf[1].replace(/\/\/[^\n]*/g, '')
      .split(',').map(s=>s.trim().replace(/^['"]|['"]$/g,'')).filter(Boolean);
    const badTpl = tplFiles.find(f=>!/^[A-Za-z0-9_-]+$/.test(f));
    if(badTpl) throw new Error('TEMPLATE_FILES 清单解析异常（条目「' + badTpl + '」不是合法文件名）');
    if(!tplFiles.length) throw new Error('TEMPLATE_FILES 清单为空（templates.js 结构已变化）');
    const tplTxt = ['const TEMPLATES = {};']
      .concat(await Promise.all(tplFiles.map(f=>fetchSrc('templates/'+f+'.js'))))
      .join('\n');
    const jsTxt = await fetchSrc('editor.js');
    const safe = t => t.replace(/<\/script/gi, '<\\/script');
    const ls = out.indexOf('<script>document.write');
    if(ls<0) throw new Error('未找到 editor.js 加载脚本');
    const le = out.indexOf('</script>', ls) + '</script>'.length;
    out = out.slice(0, ls) + '<script>' + safe(tplTxt) + '</' + 'script><script>' + safe(jsTxt) + '</' + 'script>' + out.slice(le);

    // 2b) 内联共享样式（审计 4.1/4.2）：preview.html 用 <link rel="stylesheet" href="shared.css">
    //     引用跨页面共享的 .tbtn/.zoom-box/.fps-badge。单文件产物必须自带样式，
    //     否则离线打开会去请求不存在的 shared.css（样式缺失 + 控制台报错）。
    //     按 link 标签定位替换（不是按源码文本做 API，锚点即标签本身，缺失即 fail-fast）。
    const linkRe = /<link\s+rel="stylesheet"\s+href="shared\.css"[^>]*>/i;
    if(!linkRe.test(out)) throw new Error('未找到 shared.css 的 <link> 标签（preview.html 结构已变化）');
    const cssTxt = await fetchSrc('shared.css');
    // 用函数形式替换：避免 CSS 里的 $ 被当作 replace 的替换模式（$&/$1 等）
    out = out.replace(linkRe, () => '<style>\n' + cssTxt + '\n</style>');

    // 3) 在 </body> 前注入数据：利用 preview.html EMBED 模式下暴露的 window.PFDEmbed.load() API。
    //    直接同步调用（不监听 load 事件）：inject 脚本位于最后一个 </script> 之后，此时 IIFE 已
    //    执行完毕、PFDEmbed 已挂载到 window，直接调用即可覆盖空 doc 并触发 render+zoomFit。
    //    必须用 lastIndexOf 找真正的 </body>，因为内联的 editor.js 源码字符串中也含 '</body>'。
    // 运行时字段（_pts 等）由 serializeDoc 统一剥除（审计 8.5），不再手工挑字段
    const standaloneDoc = { version:doc.version||1, components:doc.components, pipes:doc.pipes, meta:doc.meta||{title:'未命名流程',bg:'#070612'} };
    const docJson = serializeDoc(standaloneDoc).replace(/<\/script/gi, '<\\/script');
    const title = (standaloneDoc.meta && standaloneDoc.meta.title) || 'PFD';
    const inject = '<script>(function(){var d='+docJson+';try{window.PFDEmbed.load(d)}catch(e){console.error("Standalone load error:",e);setTimeout(function(){try{window.PFDEmbed.load(d)}catch(e2){console.error("Retry failed:",e2)}},100)}var t=(d.meta&&d.meta.title)||"PFD";if(document.getElementById("docTitle"))document.getElementById("docTitle").textContent=t;document.title=t+" · 预览";})()</'+'script>';
    const bodyEnd = out.lastIndexOf('</body>');
    if(bodyEnd<0) throw new Error('未找到 </body> 标签');
    out = out.slice(0, bodyEnd) + inject + out.slice(bodyEnd);

    // 4) 下载
    const blob = new Blob([out], {type:'text/html;charset=utf-8'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = ((doc.meta&&doc.meta.title)||'pfd') + '.html';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href), 2000);
    flash('已生成单文件 HTML（'+ parseFloat((blob.size/1024).toFixed(0)) +' KB）');
  }catch(e){
    console.error(e);
    flash('生成失败：' + e.message);
  }
}

/* ============================================================
 * 27. 默认模板：还原工艺
 * ============================================================ */
async function loadTemplate(){
  try{
    let data;
    try{
      const resp = await fetch('demo-template.json?v='+Date.now());
      if(resp.ok) data = await resp.json();
      else console.warn('[TEMPLATE] demo-template.json 不可用（HTTP ' + resp.status + '），回退内置示例');
    }catch(e){
      // 预期内的回退（file:// 下无服务端），但要留痕，便于区分"文件缺失"与"网络故障"（审计 §5.5）
      console.warn('[TEMPLATE] demo-template.json 拉取失败，回退内置示例：', e && e.message);
    }
    if(!data){
      data = {"components":[{"id":"cv5i1lk","type":"box","x":280,"y":20,"w":81.72177124023438,"h":81.07854080200195,"rotation":0,"props":{"name":"XV0106","tag":"","color":"#9C99FF","params":[],"showPorts":true}},{"id":"c2h1sjg","type":"switchValve","x":400,"y":60,"w":120,"h":150,"rotation":0,"props":{"name":"固体三通阀","tag":"","color":"#9C99FF","params":[],"showPorts":true,"switchValve":0}},{"id":"cftedn3","type":"screwConveyor","x":480,"y":280,"w":148.60397338867188,"h":59.87129211425781,"rotation":0,"props":{"name":"螺旋输送机","tag":"","color":"#9C99FF","params":[],"showPorts":true}},{"id":"cvgr8ry","type":"screwConveyor","x":300,"y":280,"w":148.60397338867188,"h":59.87129211425781,"rotation":0,"props":{"name":"螺旋输送机","tag":"","color":"#9C99FF","params":[],"showPorts":true,"mirrored":true}},{"id":"c7wraui","type":"silo","x":220,"y":360,"w":90,"h":150,"rotation":0,"props":{"name":"料仓","tag":"V0201","color":"#9C99FF","params":[],"showPorts":true}},{"id":"c9i9h7o","type":"silo","x":620,"y":360,"w":90,"h":150,"rotation":0,"props":{"name":"料仓","tag":"V0202","color":"#9C99FF","params":[],"showPorts":true}},{"id":"cdwj84q","type":"weighFeeder","x":220,"y":600,"w":90.7869873046875,"h":92.75439453125,"rotation":0,"props":{"name":"配料秤/称重料斗","tag":"","color":"#9C99FF","params":[],"showPorts":true}},{"id":"cxi7c5v","type":"screwConveyor","x":360,"y":620,"w":310.05682373046875,"h":71.91217041015625,"rotation":0,"props":{"name":"螺旋输送机","tag":"","color":"#9C99FF","params":[],"showPorts":true}},{"id":"c8o55q0","type":"box","x":320,"y":380,"w":88.30654907226562,"h":66.027099609375,"rotation":0,"props":{"name":"L0106A","tag":"","color":"#9C99FF","params":[],"showPorts":true}},{"id":"clqb7q1","type":"screwConveyor","x":480,"y":540,"w":268.11614990234375,"h":62.30609130859375,"rotation":0,"props":{"name":"螺旋输送机","tag":"","color":"#9C99FF","params":[],"showPorts":true,"mirrored":true}},{"id":"cky5j1k","type":"rotaryKiln","x":700,"y":680,"w":380,"h":180,"rotation":0,"props":{"name":"回转窑/旋转煅烧窑","tag":"","color":"#9C99FF","params":[],"showPorts":true}},{"id":"c5tli5c","type":"tubeCooler","x":1140,"y":700,"w":300,"h":157.7227783203125,"rotation":0,"props":{"name":"回转滚筒冷却机","tag":"","color":"#9C99FF","params":[],"showPorts":true}},{"id":"c41zzyw","type":"valve","x":780,"y":560,"w":39.6124267578125,"h":27.36431884765625,"rotation":0,"props":{"name":" ","tag":"手动阀","color":"#9C99FF","params":[],"showPorts":true}},{"id":"cpa9whi","type":"dustCollector","x":880,"y":340,"w":120,"h":180,"rotation":0,"props":{"name":"除尘布袋","tag":"","color":"#9C99FF","params":[],"showPorts":true}},{"id":"cpkytsa","type":"screwConveyor","x":880,"y":560,"w":201.2919921875,"h":57.05426025390625,"rotation":0,"props":{"name":"螺旋输送机","tag":"L0205B","color":"#9C99FF","params":[],"showPorts":true}},{"id":"c335rfh","type":"blower","x":740,"y":280,"w":75.861328125,"h":69.99862670898438,"rotation":0,"props":{"name":"离心风机/鼓风机","tag":"","color":"#9C99FF","params":[],"showPorts":true,"mirrored":true}},{"id":"clbc8do","type":"desulfTower","x":1000,"y":0,"w":120,"h":297.28591871261597,"rotation":0,"props":{"name":"工业脱硫塔","tag":"","color":"#9C99FF","params":[],"showPorts":true}},{"id":"cti8zsk","type":"blower","x":1120,"y":280,"w":75.861328125,"h":62.295166015625,"rotation":0,"props":{"name":"泵","tag":"","color":"#9C99FF","params":[],"showPorts":true,"mirrored":false}},{"id":"cqqfd5n","type":"box","x":780,"y":200,"w":62.61798095703125,"h":41.09211730957031,"rotation":0,"props":{"name":"C0204","tag":"","color":"#9C99FF","params":[],"showPorts":true}},{"id":"c4ndpuc","type":"blower","x":240,"y":820,"w":66.66668701171875,"h":86.7183837890625,"rotation":90,"props":{"name":"。。。。供风机","tag":"C0204C","color":"#9C99FF","params":[],"showPorts":true,"mirrored":true}},{"id":"chqjt6v","type":"blower","x":240,"y":920,"w":66.66668701171875,"h":86.7183837890625,"rotation":90,"props":{"name":"。。。。供风机","tag":"C0204C","color":"#9C99FF","params":[],"showPorts":true,"mirrored":true}},{"id":"cepvyg7","type":"valve","x":580,"y":940,"w":84.008056640625,"h":44.7008056640625,"rotation":0,"props":{"name":"气密阀","tag":"","color":"#9C99FF","params":[],"showPorts":true}},{"id":"cqxvh8j","type":"coolingPond","x":1200,"y":380,"w":192.5611572265625,"h":120,"rotation":0,"props":{"name":"冷却水池","tag":"","color":"#9C99FF","params":[],"showPorts":true}},{"id":"ceq4k9q","type":"screwConveyor","x":1260,"y":900,"w":213.18994140625,"h":79.015869140625,"rotation":0,"props":{"name":"L0301","tag":"","color":"#9C99FF","params":[],"showPorts":true,"mirrored":true}},{"id":"cva5r78","type":"pump","x":1460,"y":400,"w":46.450439453125,"h":29.742584228515625,"rotation":0,"props":{"name":"工业抽水泵","tag":"","color":"#9C99FF","params":[],"showPorts":true}},{"id":"cs6c3nk","type":"pump","x":1460,"y":440,"w":46.450439453125,"h":29.742584228515625,"rotation":0,"props":{"name":"工业抽水泵","tag":"","color":"#9C99FF","params":[],"showPorts":true}},{"id":"cp0llhp","type":"pump","x":1440,"y":620,"w":46.450439453125,"h":29.742584228515625,"rotation":270,"props":{"name":"工业抽水泵","tag":"","color":"#9C99FF","params":[],"showPorts":true}},{"id":"cjeo19x","type":"pump","x":1520,"y":620,"w":46.450439453125,"h":29.742584228515625,"rotation":270,"props":{"name":"工业抽水泵","tag":"","color":"#9C99FF","params":[],"showPorts":true}}],"pipes":[{"id":"psgi3ck","type":"solid","from":{"cid":"cv5i1lk","port":"right"},"to":{"cid":"c2h1sjg","port":"inlet"},"label":"锰粉","width":2.5,"labelPos":0.5,"bend":{"x":340,"y":80},"straight":true},{"id":"pcczsn9","type":"solid","from":{"cid":"c2h1sjg","port":"outletB"},"to":{"cid":"cftedn3","port":"inlet"},"label":"锰粉","width":2.5,"labelPos":0.5,"straight":true},{"id":"pxcrk9s","type":"solid","from":{"cid":"c2h1sjg","port":"outletA"},"to":{"cid":"cvgr8ry","port":"inlet"},"label":"锰粉","width":2.5,"labelPos":0.5,"straight":true},{"id":"pbvxtrn","type":"solid","from":{"cid":"cftedn3","port":"outlet"},"to":{"cid":"c9i9h7o","port":"top"},"label":"","width":2.5,"labelPos":0.5,"straight":true},{"id":"pchv8g2","type":"solid","from":{"cid":"cvgr8ry","port":"outlet"},"to":{"cid":"c7wraui","port":"top"},"label":"","width":2.5,"labelPos":0.5,"straight":true},{"id":"pl8d487","type":"solid","from":{"cid":"c7wraui","port":"bottom"},"to":{"cid":"cdwj84q","port":"inlet"},"label":"","width":2.5,"labelPos":0.5,"straight":true},{"id":"pm4rgij","type":"solid","from":{"cid":"c8o55q0","port":"bottom"},"to":{"cid":"cxi7c5v","port":"left"},"label":"煤粉","width":2.5,"labelPos":0.5,"straight":true},{"id":"pl9e86s","type":"solid","from":{"cid":"c9i9h7o","port":"bottom"},"to":{"cid":"clqb7q1","port":"inlet"},"label":"","width":2.5,"labelPos":0.5,"straight":true},{"id":"pw8cdvg","type":"solid","from":{"cid":"clqb7q1","port":"right"},"to":{"cid":"cxi7c5v","port":"inlet"},"label":"锰粉","width":2.5,"labelPos":0.5},{"id":"px92weh","type":"solid","from":{"cid":"cdwj84q","port":"outlet"},"to":{"cid":"cky5j1k","port":"inlet"},"label":"锰粉","width":2.5,"labelPos":0.5,"bend":{"x":440,"y":760}},{"id":"pm7wq9k","type":"solid","from":{"cid":"cxi7c5v","port":"outlet"},"to":{"cid":"cky5j1k","port":"inlet"},"label":"","width":2.5,"labelPos":0.5},{"id":"pgevbfl","type":"gas","from":{"cid":"cky5j1k","port":"flueGas"},"to":{"cid":"c41zzyw","port":"in"},"label":"","width":2.5,"labelPos":0.5,"bend":{"x":760,"y":620}},{"id":"p79s3st","type":"gas","from":{"cid":"c41zzyw","port":"out"},"to":{"cid":"cpa9whi","port":"cleanGas"},"label":"","width":2.5,"labelPos":0.5},{"id":"pg7bhry","type":"solid","from":{"cid":"cpa9whi","port":"outlet"},"to":{"cid":"cpkytsa","port":"inlet"},"label":"","width":2.5,"labelPos":0.5,"straight":true},{"id":"prfhzfb","type":"gas","from":{"cid":"cpa9whi","port":"inlet"},"to":{"cid":"c335rfh","port":"in"},"label":"","width":2.5,"labelPos":0.5,"bend":{"x":840,"y":320}},{"id":"pgbphj7","type":"cool","from":{"cid":"clbc8do","port":"slurryOut"},"to":{"cid":"cti8zsk","port":"in"},"label":"","width":2.5,"labelPos":0.5},{"id":"p4tq6sk","type":"cool","from":{"cid":"cti8zsk","port":"out"},"to":{"cid":"clbc8do","port":"sprayIn"},"label":"","width":2.5,"labelPos":0.5,"bend":{"x":1140,"y":100}},{"id":"pxr9ykg","type":"gas","from":{"cid":"c335rfh","port":"out"},"to":{"cid":"clbc8do","port":"overflow"},"label":"","width":2.5,"labelPos":0.5,"bend":{"x":980,"y":260}},{"id":"pdtzx5p","type":"solid","from":{"cid":"clbc8do","port":"gasIn"},"to":{"cid":"cqqfd5n","port":"right"},"label":"","width":2.5,"labelPos":0.5},{"id":"pamlvg0","type":"gas","from":{"cid":"chqjt6v","port":"out"},"to":{"cid":"cepvyg7","port":"in"},"label":"天然气","width":2.5,"labelPos":0.5},{"id":"pj76rvv","type":"hot","from":{"cid":"c4ndpuc","port":"out"},"to":{"cid":"cky5j1k","port":"outlet"},"label":"热气","width":2.5,"labelPos":0.5,"bend":{"x":1100,"y":860}},{"id":"p36lfwj","type":"gas","from":{"cid":"cepvyg7","port":"out"},"to":{"cid":"cky5j1k","port":"outlet"},"label":"天然气","width":2.5,"labelPos":0.5,"bend":{"x":1100,"y":820}},{"id":"p5e4ef1","type":"solid","from":{"cid":"cky5j1k","port":"fuel"},"to":{"cid":"c5tli5c","port":"inlet"},"label":"氧化锰","width":2.5,"labelPos":0.5},{"id":"pu17jwl","type":"solid","from":{"cid":"c5tli5c","port":"airIn"},"to":{"cid":"ceq4k9q","port":"inlet"},"label":"","width":2.5,"labelPos":0.5},{"id":"pgkglyf","type":"cool","from":{"cid":"c5tli5c","port":"airOut"},"to":{"cid":"cqxvh8j","port":"inlet"},"label":"","width":2.5,"labelPos":0.5,"bend":{"x":1220,"y":360}},{"id":"p33vqz6","type":"cool","from":{"cid":"cqxvh8j","port":"overflow"},"to":{"cid":"cva5r78","port":"in"},"label":"","width":2.5,"labelPos":0.5,"bend":{"x":1420,"y":420}},{"id":"p9qftun","type":"cool","from":{"cid":"cqxvh8j","port":"overflow"},"to":{"cid":"cs6c3nk","port":"in"},"label":"","width":2.5,"labelPos":0.5,"bend":{"x":1420,"y":460}},{"id":"pyw4kkt","type":"cool","from":{"cid":"cva5r78","port":"out"},"to":{"cid":"cqxvh8j","port":"inlet"},"label":"","width":2.5,"labelPos":0.5,"bend":{"x":1580,"y":340}},{"id":"pu003ij","type":"cool","from":{"cid":"cs6c3nk","port":"out"},"to":{"cid":"cqxvh8j","port":"inlet"},"label":"","width":2.5,"labelPos":0.5,"bend":{"x":1580,"y":360}},{"id":"p2x1sez","type":"cool","from":{"cid":"c5tli5c","port":"outlet"},"to":{"cid":"cp0llhp","port":"in"},"label":"","width":2.5,"labelPos":0.5,"bend":{"x":1500,"y":680}},{"id":"p05w7jb","type":"gas","from":{"cid":"c5tli5c","port":"outlet"},"to":{"cid":"cjeo19x","port":"in"},"label":"","width":2.5,"labelPos":0.5},{"id":"p5qpd4q","type":"cool","from":{"cid":"cp0llhp","port":"out"},"to":{"cid":"cqxvh8j","port":"outlet"},"label":"","width":2.5,"labelPos":0.5},{"id":"pzp4x7w","type":"cool","from":{"cid":"cjeo19x","port":"out"},"to":{"cid":"cqxvh8j","port":"outlet"},"label":"","width":2.5,"labelPos":0.5}],"meta":{"title":"1#还原系统","bg":"#070612"}};
    }
    const pipes = (data.pipes||[]).map(p=>{ const {_pts,...rest}=p; return rest; });
    const comps = data.components||[];
    const meta = data.meta||{title:'1#还原系统',bg:'#070612'};
    doc = { version:data.version||1, components:comps, pipes:pipes, meta:meta };
    selClear(); histStack=[]; histIdx=-1; pushHistory();
    renderAll(); renderProps(); setDirty();
    setTimeout(zoomFit, 50);
    flash('已加载' + (meta.title||'模板') + '（' + comps.length + '个设备，' + pipes.length + '条管线）');
  }catch(e){
    console.error('loadTemplate error:', e);
    flash('加载模板失败：' + e.message);
  }
}

/* 存储契约（审计 6.7）：编辑器 → 预览页的 localStorage 通道，key + 数据格式的契约。
   原来 'pfd_doc' 裸字符串散落在 editor.js / preview.html / embed-demo.html 三处，
   任何一处改 key 都会静默丢数据。现在统一为命名常量 + 版本化 key：
   数据格式变更时递增 key 版本（pfd_doc:v2 → pfd_doc:v3），读取方保留旧 key 迁移。
   ⚠️ 三文件（editor.js / preview.html / embed-demo.html）的常量定义必须同步修改。 */
const PFD_STORE_KEY = 'pfd_doc:v2';
const PFD_STORE_KEY_LEGACY = 'pfd_doc';

/* 把当前文档写入 localStorage 供预览页读取。
   localStorage 可能写失败：配额超限（QuotaExceededError）或隐私/无痕模式禁用（SecurityError）。
   原来直接 setItem 不捕获 —— 失败时预览页读到的是上一次的旧文档，用户以为已同步（审计 §5.1）。
   现在：捕获异常 + 写后读校验，失败给出明确提示且不打开预览。 */
function writePreviewDoc(){
  let txt;
  try{
    txt = serializeDoc(doc);
  }catch(e){
    alert('序列化当前文档失败：' + (e && e.message));
    return false;
  }
  try{
    localStorage.setItem(PFD_STORE_KEY, txt);
    if(localStorage.getItem(PFD_STORE_KEY) !== txt) throw new Error('写入后校验不一致');
    // 新 key 写入成功后清掉旧 key，避免读取方下次又拿到旧格式数据（审计 6.7）
    localStorage.removeItem(PFD_STORE_KEY_LEGACY);
    return true;
  }catch(e){
    const quota = e && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22 || e.code === 1014);
    console.error('[STORAGE] 写入 ' + PFD_STORE_KEY + ' 失败：', e && e.name, e && e.message);
    alert(quota
      ? '浏览器本地存储空间不足，无法把当前流程同步给预览页。\n建议：清理浏览器站点数据，或改用「项目库保存」后再从项目库打开预览。'
      : '写入本地存储失败（隐私/无痕模式可能禁用了 localStorage）：\n' + (e && e.message));
    return false;
  }
}

/* ============================================================
 * 28. 初始化（仅编辑页面执行）
 * ============================================================ */
if(_isEditor){
buildPalette();
// 启动为空白画布，由用户自行搭建（模板可通过工具栏“模板”按钮加载）
doc = { version:1, components:[], pipes:[], meta:{title:'未命名流程',bg:'#070612'} };
histStack=[]; histIdx=-1; pushHistory();
applyView();
renderAll(); renderProps();
setTimeout(()=>flash('拖拽左侧组件到画布开始搭建 · 点击端口连线'), 400);
window.addEventListener('resize', ()=>{ invalidateCTM(); });
// 后端传感器：拉取目录供 tag 检索添加，周期刷新实时值
loadSensorCatalog();
setInterval(refreshSensorValues, 5000);
startTagLiveUpdate();
}

/* ============================================================
 * 29. 右下角实时帧率（编辑页与预览页共用，预览页嵌入模式下由 CSS 隐藏）
 *   · rAF 采样帧间隔，指数滑动平均（EMA），忽略切后台/长任务造成的异常间隔（FPS_DT_MAX）
 *   · 每 FPS_PAINT_MS（250ms）才写一次 DOM —— 每帧写 DOM 会让"测量工具"本身变成性能问题
 *   · 分级配色（FPS_WARN / FPS_BAD）：≥50 绿 / 30~50 黄 / <30 红
 *   · 点击展开细节（帧时间 / 最差帧 / 画布节点数），双击重置峰值
 * ============================================================ */
function initFpsMeter(){
  if(!document.body || document.getElementById('fpsBadge')) return;
  const el = document.createElement('div');
  el.id = 'fpsBadge'; el.className = 'fps-badge';
  el.title = '实时帧率（点击展开细节，双击重置峰值）';
  el.innerHTML = '<span class="fps-dot"></span><span class="fps-val">--</span><span class="fps-unit">FPS</span><span class="fps-detail"></span>';
  document.body.appendChild(el);
  const val = el.querySelector('.fps-val');
  const detail = el.querySelector('.fps-detail');
  let raf = null, last = 0, ema = 0, worst = 0, paintAt = 0;
  el.onclick = ()=>{ el.classList.toggle('expanded'); };
  el.ondblclick = ()=>{ ema = 0; worst = 0; };
  const tick = (ts)=>{
    raf = requestAnimationFrame(tick);
    if(last){
      const dt = ts - last;
      if(dt > 0 && dt < FPS_DT_MAX){                // 忽略异常间隔（切后台、长任务）
        ema = ema ? ema*0.9 + dt*0.1 : dt;
        if(dt > worst) worst = dt;
      }
    }
    last = ts;
    if(ts - paintAt < FPS_PAINT_MS) return;         // 节流：到点才写一次 DOM
    paintAt = ts;
    const fps = ema > 0 ? 1000/ema : 0;
    val.textContent = fps >= 10 ? fps.toFixed(0) : fps.toFixed(1);
    el.classList.toggle('warn', fps > 0 && fps < FPS_WARN && fps >= FPS_BAD);
    el.classList.toggle('bad', fps > 0 && fps < FPS_BAD);
    if(el.classList.contains('expanded')){
      const canvas = document.getElementById('canvas');
      detail.textContent = `· ${ema.toFixed(1)}ms/帧 · 最差 ${worst.toFixed(0)}ms · 画布节点 ${canvas ? canvas.querySelectorAll('*').length : '-'}`;
    } else if(detail.textContent){
      detail.textContent = '';
    }
  };
  raf = requestAnimationFrame(tick);
  document.addEventListener('visibilitychange', ()=>{
    if(document.hidden){ if(raf){ cancelAnimationFrame(raf); raf = null; } }
    else if(!raf){ last = 0; ema = 0; raf = requestAnimationFrame(tick); }
  });
}
initFpsMeter();
