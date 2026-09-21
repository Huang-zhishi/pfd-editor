# PFD Editor · 工艺流程组态编辑器

基于原生 JavaScript + SVG 的工业流程图（PFD/P&ID）组态编辑器：组件拖拽搭建、端口连线、SMIL 动画预览、后端传感器实时数据联动（监控器面板、回转窑温度渐变），并支持项目持久化与单文件 HTML 导出。

零构建、零框架依赖，克隆后用任意静态服务器即可运行。

## 功能特性

- **组件化设备库**：34 种内置工业组件（料仓、成品储罐、双格成品储罐、回转窑、脱硫塔、压滤机、螺旋输送机、斗式提升机、风机泵阀、仪表监控等），按工艺功能分「输送与给料 / 粉磨与分级 / 储存与反应 / 干燥煅烧与冷却 / 风机泵阀 / 除尘与分离 / 通用与标注」七类，面板内分组可点击折叠，支持拖拽、编辑、旋转、镜像。
- **管道连线**：正交路由自动布线，折点拖拽，6 种线型（固体/气体/高温/冷却/蒸汽/信号），标签沿线自由定位，支持「直线连接」开关。
- **实时数据联动**：监控器面板展示后端传感器实时值（自动刷新）；回转窑组件按 4 个测温点温度做窑体左→右颜色渐变（全程暖色热力色标：暗红→橙→红→白热）。
- **动画预览**：SMIL 设备动画 + 管道物料粒子流动，编辑器与只读预览页均可运行。
- **项目持久化**：本地自动保存（localStorage），磁盘保存/加载（File System Access API，含下载/上传回退），撤销/重做历史。
- **单文件导出**：将组件库 + 编辑器逻辑 + 当前流程数据打包为一个独立 HTML，可直接部署到官网。
- **iframe 嵌入**：预览页提供 `postMessage` API（注入流程 / 适应窗口 / 动画开关 / 选中事件回传）。

## 架构总览

```
┌───────────────────────── 浏览器 ─────────────────────────┐
│  editor.html（编辑器）        preview.html（预览/嵌入页）  │
│        │                            │                    │
│        └──────────┬─────────────────┘                    │
│                   ▼  加载顺序固定：templates.js → templates/*.js → editor.js │
│  templates.js（模板库入口：TEMPLATES 容器 + 设备文件清单）  │
│  templates/*.js（按设备拆分：一个设备一个文件，纯 SVG 数据） │
│  editor.js（应用逻辑：渲染/交互/保存/导出，两页面共用）        │
└──────────────────────────┬───────────────────────────────┘
                           │  /api/*（同源相对路径）
                           ▼
              server.js（开发服务器：静态文件 + 反向代理）
                           │
                           ▼
                后端传感器服务（API_TARGET）
```

关键设计：

- **模板与逻辑分离**：`templates/*.js` 只定义"组件长什么样"（数据 + SVG 字符串），`editor.js` 负责"如何编辑/渲染/联动"。`templates.js` 是入口，只定义 `TEMPLATES` 容器与设备清单 `TEMPLATE_FILES`；render 函数中引用的工具函数由 `editor.js` 在运行期经全局作用域提供，因此加载顺序必须为 templates → editor。
- **双页面共用一份逻辑**：`editor.js` 通过 `_isEditor` 标记区分编辑器/预览环境；预览页另有本地 IIFE 覆盖个别行为（如 `applySMILState`，避免编辑器的暂停状态冻结预览动画）。
- **缓存控制**：两个页面均以 `document.write` + `?v=时间戳` 加载脚本，改代码后刷新即生效。

## 项目结构

```
├── editor.html          # 编辑器主页面（工具栏 / 组件面板 / 属性面板）
├── editor.js            # 应用逻辑（章节化组织，见文件头目录注释）
├── templates.js         # 模板库入口：TEMPLATES 容器 + TEMPLATE_FILES 设备清单
├── templates/           # 设备模板（34 个设备，一个设备一个文件，纯 SVG 数据）
├── preview.html         # 只读预览页（动画 / 实时数据 / 嵌入模式）
├── embed-demo.html      # iframe 嵌入 + postMessage 集成示例
├── demo-template.json   # 默认模板「1#还原系统」的流程数据
├── server.js            # 开发服务器：静态文件 + /api/* 反向代理（推荐）
├── serve.ps1            # 轻量静态服务器（PowerShell，无 API 代理）
└── README.md
```

## 快速开始

**前置**：Node.js（仅用于启动服务器，页面本身无依赖）。

```bash
# 推荐：含 API 代理，实时数据功能可用
node server.js

# 可选配置（环境变量）
# PORT=9000 API_TARGET=http://192.168.x.x node server.js   （bash）
# $env:PORT=9000; $env:API_TARGET='http://192.168.x.x'; node server.js   （PowerShell）
```

启动后访问：

| 地址 | 说明 |
| --- | --- |
| http://localhost:8090/editor | 编辑器 |
| http://localhost:8090/preview | 只读预览页 |
| http://localhost:8090/embed-demo.html | iframe 嵌入示例 |

备选方式：`powershell -File serve.ps1` 或 `python -m http.server 8090`。注意二者均无 API 代理，实时数据、传感器目录检索不可用（页面仍可正常搭建流程）。

## 后端 API 约定

前端统一走同源相对路径 `/api/*`，由 `server.js` 代理转发，避免 CORS。响应格式为 `{ success: boolean, data: [...] }`。

| 接口 | 参数 | 说明 |
| --- | --- | --- |
| `GET /api/sensors/list` | - | 传感器目录：`[{sensor_tag, type, kiln_id}]` |
| `GET /api/sensors/values` | `sensor_tag` / `type` / `kiln_id` / `limit` | 实时数值：`[{sensor_tag, value, unit, reported_at}]` |
| `GET /api/sensors/history` | `sensor_tag` + `time_range`(10m/30m/1h/6h/12h/24h) 或 `start`/`end`，`limit` | 历史数据 |

切换后端环境：`editor.html?api=https://后端地址`（`file://` 直连时需后端支持 CORS）。

## 数据模型（项目 JSON）

保存/加载/导出的项目文档结构：

```jsonc
{
  "version": 1,
  "components": [{
    "id": "cv5i1lk",          // 唯一 id
    "type": "silo",           // 对应 templates/*.js 的模板 key
    "x": 280, "y": 20,        // 画布坐标
    "w": 90,  "h": 150,       // 尺寸
    "rotation": 0,            // 旋转角度
    "props": {
      "name": "料仓", "tag": "V0201", "color": "#9C99FF",
      "params": [],           // 运行参数 Tag: [{k, v, u}]
      "showPorts": true
      // 组件专属：monitor 的 monitorTags/lead；rotaryKiln 的 tempPoints 等
    }
  }],
  "pipes": [{
    "id": "psgi3ck", "type": "solid",       // 对应 PIPE_TYPES
    "from": {"cid": "组件id", "port": "端口id"},
    "to":   {"cid": "组件id", "port": "端口id"},
    "label": "锰粉", "width": 2.5, "labelPos": 0.5
  }],
  "meta": { "title": "1#还原系统", "bg": "#070612" }
}
```

## 新增组件模板

在 `templates/` 下新增一个设备文件（形如 `templates/myTank.js`），并把文件名加入 `templates.js` 的 `TEMPLATE_FILES` 清单（同一分类的组件在清单中相邻排列）；`category` 取 `CATEGORY_ORDER` 中的分类，面板据此自动归组，分组顺序由 `CATEGORY_ORDER` 决定、组内顺序即清单顺序：

```js
/* templates/myTank.js */
TEMPLATES.myTank = {
  name: '储罐', category: '储存与反应',
  defaultSize: { w: 100, h: 120 },
  ports: [                                  // x/y 为 0-1 相对坐标，dir 为出向
    { id: 'top',    x: .5, y: 0, dir: 'up' },
    { id: 'bottom', x: .5, y: 1, dir: 'down' },
  ],
  render: (w, h, p) => `                    // 返回内部 SVG 字符串（不含外层 <g>）
    <rect x="0" y="0" width="${w}" height="${h}" rx="8" class="equip-body" stroke="${p.color}"/>
  `,
};
```

约定：`render(w, h, p)` 在运行期由 `editor.js` 调用；SVG 内引用的 CSS class（如 `equip-body`、`tlabel`）定义于两个页面的 `<style>` 中。

**端口坐标可以是固定比例，也可以是函数**：`ports[].x / .y` 写 `0~1` 的数字表示相对比例；写 `(w,h)=>比例` 的函数则按组件实际尺寸实算。后者用于「定尺部件的位置不随机身加高而变」的组件——例如斗式提升机的机头是按机宽封顶的，机头侧面的出料溜槽槽口位置只能实算，写死比例会在拉伸机身高度时与画面脱开：

```js
ports: [
  { id:'outlet', x:(w,h)=>bucketElevatorOutlet(w,h).x/w,
                 y:(w,h)=>bucketElevatorOutlet(w,h).y/h, dir:'down' },
]
```

## 实时数据联动

- **监控器组件**：从组件面板拖入「监控器」，在属性面板搜索后端传感器目录并添加，画布面板即实时刷新数值；选中后可拖动圆形把手生成指向目标设备/端口/管道的归属折线。
- **回转窑温度渐变**：选中回转窑，在「窑体测温点」中填入 4 个测温位号（须为后端完整位号，如 `1#窑体温度TI_206A`），窑体从左到右按各点温度以暖色色标渐变（暗红→橙→红→白热，全程无蓝/青/绿冷色），增量更新不重置动画。
- **运行开关（开关 Tag）**：给设备绑定开关量位号，实时值 **1 = 运行 / 0 = 停止**；停止时该组件不再生成 SMIL 动画节点（画面定格），值恢复 1 后自动继续。
  - **可绑多个位号**，判定逻辑可选：**与（默认，`and`）** = 已取到值的位号全部为 1 才运行；**或（`or`）** = 任一为 1 即运行。未绑定、或绑定的位号全部暂无数据时，按「始终运行」处理（有数据的位号才参与判定）。
  - **支持范围 = 所有含动画的组件**（23 个），无需登记：`hasAnimation(type)` 会渲染一次默认尺寸、按结果里是否含 `<animate` 自动判定并缓存，属性面板据此自动渲染「运行控制」分组；新增带动画的组件自动获得该能力。
  - 数据字段：`props.runTags = [{tag}]` + `props.runLogic = 'and' | 'or'`（旧版单个 `props.runTag` 字符串读取时自动兼容、打开属性面板时自动迁移）。
- **运行参数（Tag）**：任意组件可挂多个 tag，属性面板显示实时值。

## 导出与嵌入

**单文件导出**（编辑器工具栏「导出 HTML」）：抓取 `preview.html`，按 `TEMPLATE_FILES` 清单把 `templates/*.js` + `editor.js` 内联，注入当前流程数据并强制嵌入模式，生成不依赖服务器的独立 HTML。

**iframe 嵌入**（详见 `embed-demo.html`）：

```html
<iframe src="https://你的域名/preview.html?embed=1" style="width:100%;height:600px;border:0"></iframe>
```

```js
// 宿主 → iframe 指令
iframe.contentWindow.postMessage({ source: 'pfd-host', type: 'load', doc }, '*'); // 注入流程
iframe.contentWindow.postMessage({ source: 'pfd-host', type: 'fit' }, '*');        // 适应窗口
iframe.contentWindow.postMessage({ source: 'pfd-host', type: 'run', value: true }, '*');

// iframe → 宿主事件
window.addEventListener('message', e => {
  if (e.data.source === 'pfd-embed') { /* e.data.type: 'ready' | 'select' */ }
});
```

嵌入模式亦提供 `window.PFDEmbed` 直接 API：`load(doc)` / `fit()` / `setRunning(bool)` / `getRunning()` / `getTitle()`。

## 开发注意事项

- **加载顺序不可变**：`templates.js` 必须先于 `templates/*.js` 和 `editor.js` 加载（两个页面均由同一处 `document.write` 保证；入口内部再逐个 `document.write` 设备文件）。
- **设备模板按文件维护**：改某个设备只动 `templates/<设备>.js`；新增/删除设备时同步维护 `templates.js` 的 `TEMPLATE_FILES` 清单。
- **单文件导出对 `preview.html` 结构有文本锚点依赖**（`const EMBED = new URLSearchParams`、`<script>document.write`、`</body>`），重构 `preview.html` 时需同步检查 `editor.js` 中的 `exportStandalone()`。
- **预览页局部覆盖**：`preview.html` 的 IIFE 覆盖了 `applySMILState` 等函数，修改动画相关逻辑时两处都要看。
- **`editor.js` 章节编号**：文件头有目录（TOC），新增代码请挂到对应章节并更新目录。
- **无自动化测试**：改动后建议手动回归三条链路——编辑器搭建/保存、预览页动画与实时数据、导出单文件并打开验证。

## 已知限制

- 实时数据位号须与后端完全一致（含中文前缀），简写（如 `TI_206A`）无法匹配 `1#窑体温度TI_206A`。
- `file://` 协议直连后端时依赖后端 CORS 配置，建议始终通过 `server.js` 访问。
- 项目数据与浏览器 localStorage 绑定（key：`pfd_doc`），跨浏览器迁移请使用磁盘保存/加载。
