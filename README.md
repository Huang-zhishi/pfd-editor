# PFD Editor · 工艺流程组态编辑器

基于原生 JavaScript + SVG 的工业流程图（PFD/P&ID）组态编辑器：组件拖拽搭建、端口连线、SMIL 动画预览、后端传感器实时数据联动（监控器面板、回转窑温度渐变），并支持项目持久化与单文件 HTML 导出。

零构建、零框架依赖，克隆后用任意静态服务器即可运行。

## 功能特性

- **组件化设备库**：20 种内置工业组件（料仓、回转窑、脱硫塔、鼓风机、阀类、搅拌器、加热炉、螺旋输送机、回转滚筒冷却机、监控器等），分「设备 / 阀门管件 / 仪表 / 通用 / 监控」五类，支持拖拽、编辑、旋转、镜像。
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
│                   ▼  加载顺序固定：templates.js → editor.js │
│  templates.js（组件模板库：SVG 定义，纯数据）               │
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

- **模板与逻辑分离**：`templates.js` 只定义"组件长什么样"（数据 + SVG 字符串），`editor.js` 负责"如何编辑/渲染/联动"。render 函数中引用的工具函数由 `editor.js` 在运行期经全局作用域提供，因此加载顺序必须为 templates → editor。
- **双页面共用一份逻辑**：`editor.js` 通过 `_isEditor` 标记区分编辑器/预览环境；预览页另有本地 IIFE 覆盖个别行为（如 `applySMILState`，避免编辑器的暂停状态冻结预览动画）。
- **缓存控制**：两个页面均以 `document.write` + `?v=时间戳` 加载脚本，改代码后刷新即生效。

## 项目结构

```
├── editor.html          # 编辑器主页面（工具栏 / 组件面板 / 属性面板）
├── editor.js            # 应用逻辑（章节化组织，见文件头目录注释）
├── templates.js         # 组件模板库（20 种组件的 SVG 定义）
├── preview.html         # 只读预览页（动画 / 实时数据 / 嵌入模式）
├── demo.html            # 单文件导出示例（由「导出 HTML」功能生成，可独立打开）
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
| http://localhost:8090/demo | 单文件导出示例（离线可用） |
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
    "type": "silo",           // 对应 templates.js 中的模板 key
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

在 `templates.js` 的 `TEMPLATES` 中追加一项即可，组件面板按 `category` 自动归组：

```js
const TEMPLATES = {
  // ...
  myTank: {
    name: '储罐', category: '设备',
    defaultSize: { w: 100, h: 120 },
    ports: [                                  // x/y 为 0-1 相对坐标，dir 为出向
      { id: 'top',    x: .5, y: 0, dir: 'up' },
      { id: 'bottom', x: .5, y: 1, dir: 'down' },
    ],
    render: (w, h, p) => `                    // 返回内部 SVG 字符串（不含外层 <g>）
      <rect x="0" y="0" width="${w}" height="${h}" rx="8" class="equip-body" stroke="${p.color}"/>
    `,
  },
};
```

约定：`render(w, h, p)` 在运行期由 `editor.js` 调用；SVG 内引用的 CSS class（如 `equip-body`、`tlabel`）定义于两个页面的 `<style>` 中。

## 实时数据联动

- **监控器组件**：从组件面板拖入「监控器」，在属性面板搜索后端传感器目录并添加，画布面板即实时刷新数值；选中后可拖动圆形把手生成指向目标设备/端口/管道的归属折线。
- **回转窑温度渐变**：选中回转窑，在「窑体测温点」中填入 4 个测温位号（须为后端完整位号，如 `1#窑体温度TI_206A`），窑体从左到右按各点温度以暖色色标渐变（暗红→橙→红→白热，全程无蓝/青/绿冷色），增量更新不重置动画。
- **运行参数（Tag）**：任意组件可挂多个 tag，属性面板显示实时值。

## 导出与嵌入

**单文件导出**（编辑器工具栏「导出 HTML」）：抓取 `preview.html`，将 `templates.js` + `editor.js` 内联，注入当前流程数据并强制嵌入模式，生成不依赖服务器的独立 HTML（本仓库的 `demo.html` 即由此生成）。

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

- **加载顺序不可变**：`templates.js` 必须先于 `editor.js` 加载（两个页面均由同一处 `document.write` 保证）。
- **单文件导出对 `preview.html` 结构有文本锚点依赖**（`const EMBED = new URLSearchParams`、`<script>document.write`、`</body>`），重构 `preview.html` 时需同步检查 `editor.js` 中的 `exportStandalone()`。
- **预览页局部覆盖**：`preview.html` 的 IIFE 覆盖了 `applySMILState` 等函数，修改动画相关逻辑时两处都要看。
- **`editor.js` 章节编号**：文件头有目录（TOC），新增代码请挂到对应章节并更新目录。
- **无自动化测试**：改动后建议手动回归三条链路——编辑器搭建/保存、预览页动画与实时数据、导出单文件并打开验证。

## 已知限制

- 实时数据位号须与后端完全一致（含中文前缀），简写（如 `TI_206A`）无法匹配 `1#窑体温度TI_206A`。
- `file://` 协议直连后端时依赖后端 CORS 配置，建议始终通过 `server.js` 访问。
- 项目数据与浏览器 localStorage 绑定（key：`pfd_doc`），跨浏览器迁移请使用磁盘保存/加载。
