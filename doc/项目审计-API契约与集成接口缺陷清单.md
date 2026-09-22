# 项目审计 · API 契约与集成接口缺陷清单（大厂标准）

> 审计日期：2026-09-22（维度六认领完成）
> 审计范围：① `/pfd-api/projects` REST 语义 ② 传感器 REST 约定（`{success, data}`）③ `postMessage` 嵌入协议（`pfd-host`/`pfd-embed`）④ 单文件导出的 `window.PFDEmbed` 对外承诺
> 审计方式：只读静态审计（server.js / editor.js 客户端 / preview.html 嵌入端 / embed-demo.html 宿主端 / README 契约文档四方对照）
> 严重级别：**P0 严重** · **P1 高** · **P2 中** · **P3 低**（与既有清单一致）
> 关联文档：[架构与代码质量缺陷清单](./项目审计-架构与代码质量缺陷清单.md)｜[安全缺陷清单](./项目审计-安全缺陷清单.md)（鉴权/路径/dir 回显等安全面条目本文只交叉引用）｜[待补维度占位说明](./项目审计-待补维度占位说明.md)

---

## 0. 正面结论（审计实证）

| 项 | 实证 |
|---|---|
| **统一响应信封** | `/pfd-api` 全端点统一 `{success:true, ...}` / `{success:false, error}`（server.js `sendJSON` 51-54），客户端统一按 `j.success` 分支（editor.js:2994/3039/3057/3073）——双端契约一致 |
| **文件名校验双侧对齐** | 客户端 `sanitizeFileName`+`projFileName`（editor.js:2960-2963）↔ 服务端 `path.basename`+`.json` 白名单（server.js:57-62），纵深防御且规则一致 |
| **传感器 API 客户端封装规范** | `SENSOR_API._get` 统一校验 `r.ok` + `success` 信封 + 5s AbortController 超时（editor.js:54-65） |
| **传感器 API 有契约文档** | README L87-89 记录三端点、查询参数、响应字段（`sensor_tag/type/kiln_id`、`value/unit/reported_at`、`time_range` 枚举） |
| **嵌入协议有参考实现** | `embed-demo.html` 完整可运行的宿主侧示例；README L176-186 文档化 `postMessage` 消息与 `window.PFDEmbed` 五方法 |
| **REST 方法语义基本完整** | GET/POST/DELETE/405（不支持的方法）/404（不存在）均有响应；POST 明确 upsert（"同名覆盖" editor.js:3029 注释与实现一致） |

---

## 一、`/pfd-api/projects` REST 语义（检查要点 1）

| # | 位置 | 缺陷描述 | 大厂标准 | 级别 |
|---|---|---|---|---|
| 1.1 | README（grep `/pfd-api` 与「项目库」均 **0 命中**） | **内部 REST API 零契约文档**：四个端点（GET 列表 / GET 读取 / POST 覆盖保存 / DELETE）的方法、路径参数、响应体结构、错误语义在 README 完全未记录（对比：传感器 API 有文档），契约只存在于 server.js 源码中——第三方（或未来的前端重构）只能读码逆向 | 内部 API 也须契约文档化（README 章节 / OpenAPI spec）；响应体示例 + 错误码表 | **P2** |
| 1.2 | `server.js:51-54`（`sendJSON` 信封）、`:101/:107/:117/:126/:133/:135`（各错误分支） | **错误信封无机器可读错误码**：`{success:false, error:'中文文案'}`——客户端只能把 `error` 展示给用户（editor.js:2994 等），无法按错误类别分支处理（如「文件名非法」可提示重输、「写入失败」可建议重试）。且错误文案是面向人的 UI 字符串，构成事实上的 API 契约，改文案即破坏客户端逻辑 | `{success:false, code:'INVALID_NAME', message:'人类可读文案'}`；code 稳定、message 可变 | **P2** |
| 1.3 | `server.js:133-136`（catch-all → 400） | **状态码语义失真**：所有异常（含 `fs.writeFile` 内部错误、`JSON.parse` 之外的意外异常）统一回 400——客户端视角"请求错误"与"服务器错误"不可区分，重试策略无从制定（重试 400 无意义，重试 500 才有意义）—— **交叉引用已完成文档 §5.8、安全清单 9.1**，本条为 API 契约语义视角 | 校验类错误 4xx + code，内部错误 5xx + 不泄漏内部信息 | P2（交叉引用补强） |
| 1.4 | `server.js:133`（405 响应） | 405 响应缺 `Allow` 头——RFC 9110 要求 405 必须携带 `Allow` 列出支持的方法；当前客户端不会触发该路径，纯契约合规问题 | 405 + `Allow: GET, POST, DELETE` | P3 |
| 1.5 | `server.js:113-122`（POST 同名覆盖，无 ETag/If-Match/版本号） | **接口不提供乐观并发控制原语**：upsert 语义 last-write-wins，两个客户端先后保存同名项目即静默丢失前者修改，API 层无任何检测/协商手段（冲突行为本身归维度五审计，本条记契约能力缺失） | 至少提供 `If-Match: <mtime/hash>` 可选头或响应携带版本号供客户端做条件写 | P2（交叉引用维度五 #5） |
| 1.6 | `server.js:94`（列表/读取响应无 Cache-Control）、`:105-110` | **GET 无缓存语义**：列表与读取响应无 `Cache-Control`，浏览器可能启发式缓存——「保存后刷新列表看不到新项目」类怪象的温床（同源 fetch 通常受启发式缓存影响有限，但代理链路上任何一层都可能缓存） | API 响应显式 `Cache-Control: no-store`（或列表短 max-age+版本参数） | P3 |
| 1.7 | `server.js:108`（`content` 作为 JSON 字符串嵌入信封） | 项目内容双重编码（文件 JSON → 字符串 → 再套信封 JSON）：体积膨胀 + 客户端两层 parse；且无原始文件下载途径（无 `Content-Disposition` 附件端点）。设计权衡可接受，标注为已知取舍 | 提供原始下载端点（`?raw=1`）或分页/压缩；至少在文档中标注取舍 | P3 |

## 二、传感器 REST 契约（检查要点 2）

| # | 位置 | 缺陷描述 | 大厂标准 | 级别 |
|---|---|---|---|---|
| 2.1 | `server.js:173-180`（代理原样透传后端响应头，仅追加 CORS） | **实时值接口不强制禁缓存**：`/api/sensors/values` 是实时数据，若后端响应未带 `Cache-Control`，链路上任何缓存层（浏览器启发式、未来加的 CDN/反代）都可能返回陈旧值——监控大屏显示旧数据是最难排查的故障类别。代理是唯一统一收口点，却未兜底 | 代理对 `/api/sensors/*` 强制追加 `Cache-Control: no-store`；`history` 接口可例外允许短缓存 | **P2** |
| 2.2 | `editor.js:61`（`return j && j.success ? j : null`） | **错误语义在客户端封装层被哑化**：非 2xx、非 JSON、`success:false`、超时（AbortController）四种失败全部坍缩为 `null`——上层（§5.3 已记静默吞错）无法区分「后端没配 / 网络断 / 后端 5xx / 数据格式变了」，监控页面只能统一显示"没有数据" | `_get` 抛分类异常（`ApiError{kind:'timeout'|'http'|'protocol'}`）或返回 `{ok, error}` 对象；上层按类别展示（离线徽标/重试按钮） | **P2** |
| 2.3 | `editor.js:79-84`（`time_range` 魔术串）、README L89（枚举 10m/30m/1h/6h/12h/24h） | `time_range` 枚举双侧硬编码为裸字符串、无共享常量、无客户端预校验；非法值的后端行为契约未定义（返回空？400？全量？） | 枚举常量单一来源 + 客户端入参校验；契约文档写明非法值行为 | P3 |
| 2.4 | `server.js:177`（声明 `Access-Control-Allow-Methods: GET, POST, OPTIONS`）vs `:153-192`（`proxyRequest` 转发任意方法，DELETE 直通） | **CORS 声明与代理实际行为不一致**：声明只允许 GET/POST，实现却转发包括 DELETE 在内的任意方法——未来接入方按声明写代码会在 DELETE 上踩坑，按行为写则埋下越权调用面（安全维度的 CORS 全开放已另记，本条是契约一致性） | 声明与实现一致：要么代理限制方法白名单，要么声明补全 | P3 |
| 2.5 | `editor.js:50-52`（`?api=` 覆盖基址、`file://` 回退硬编码 `http://192.168.1.78`） | 环境切换开关以 URL 参数形式暴露在契约面上、无白名单校验—— **交叉引用安全清单 5.5/5.6 与已完成文档 §6.6**（硬编码内网 IP 四处） | `?api=` 白名单域；默认值收敛单一配置源 | P3（交叉引用） |

## 三、postMessage 嵌入协议（检查要点 3）

| # | 位置 | 缺陷描述 | 大厂标准 | 级别 |
|---|---|---|---|---|
| 3.1 | `preview.html:1557-1591`（协议本体）、`embed-demo.html:91/103/106`（宿主侧） | 协议消息**无版本字段**、origin 不校验/发送 `'*'`—— **交叉引用维度二清单 10.1（P2）、安全清单 5.3/5.4（P1/P2）**，不重复计级 | 消息体加 `v:1`；双向 origin 白名单 | P2（交叉引用） |
| 3.2 | `editor.js:3339-3347`（导出注入脚本：同步调用 `PFDEmbed.load` + 失败 100ms 后重试一次） | **就绪握手缺失，靠时序假设 + 魔法重试兜底**：注入脚本假设内联脚本已执行完、`PFDEmbed` 已挂载（注释自证依赖脚本顺序）；失败则 `setTimeout(100)` 盲重试一次——100ms 是拍脑袋值（慢设备上可能不够），重试耗尽即静默失败（用户拿到空流程的单文件 HTML，交叉引用 §5.4 的产物损坏链） | 事件驱动握手：嵌入端 dispatch `pfd-ready` 事件 / Promise 化 `PFDEmbed.whenReady()`；注入端等待就绪而非定时重试 | **P2** |
| 3.3 | `embed-demo.html:111`（`frame.addEventListener('load', ... setTimeout(injectDoc, 300)`） | **官方宿主示例用 `setTimeout(300)` 硬等注入时机**——协议明明有 `ready` 事件却不用；300ms 是魔法数：iframe 加载慢于 300ms 时注入落在 PFDEmbed 挂载前（当前实现恰好能兜住，因为 load 消息会等 EMBED 分支挂载后处理），示例教会接入方的姿势本身就是反模式 | 示例改为监听 `ready` 事件后注入；删除魔法延时 | P3 |
| 3.4 | `preview.html:1580-1584`（`select` 事件仅带 `{id, name}`） | 协议事件不完整：无「取消选中/清空选中」消息类型，宿主无法感知选中态归零（设备失焦时宿主侧联动面板无法同步关闭）；`select` 也未带组件 type（宿主分类处理需自行维护映射） | 事件载荷补全（type/ports）+ 增加 `deselect` 事件；或统一为 `selectionChanged{items[]}` | P3 |

## 四、`window.PFDEmbed` 对外承诺（检查要点 4）

| # | 位置 | 缺陷描述 | 大厂标准 | 级别 |
|---|---|---|---|---|
| 4.1 | `preview.html:1557`（`if(EMBED)` 才定义 `window.PFDEmbed`）vs README L186（无条件承诺五方法） | **契约前提未在 API 层自证**：`PFDEmbed` 仅 `?embed=1` 时存在；宿主漏带参数时拿到 `undefined`，调用 `load()` 即 TypeError 且无任何诊断信息（README 未强调该前提，embed-demo.html iframe src 正确所以示例内看不出来） | 非 EMBED 模式也挂载 `PFDEmbed` 并在方法内告警「需 ?embed=1」；或文档以显著方式标注前提 | P3 |
| 4.2 | `preview.html:1573`（`load()` 内 catch → 仅 `console.error`） | `load(doc)` 失败静默：宿主传入坏 doc（schema 不符/JSON 解析失败）无回调、无事件、无 Promise reject——宿主侧无法感知注入失败（数据校验缺失本体交叉引用 §10.5） | `load` 返回 Promise（成功 resolve/失败 reject），并 dispatch `pfd-error` 消息 | P3 |

---

## 缺陷统计（本维度新发现，不含交叉引用）

| 级别 | 数量 | 条目 |
|---|---|---|
| **P2** | 5 | 1.1 `/pfd-api` 零契约文档 · 1.2 错误信封无机器可读 code · 2.1 实时接口不强制 no-store · 2.2 错误语义哑化（四类失败坍缩为 null）· 3.2 导出注入靠时序假设 + 魔法重试 |
| **P3** | 9 | 1.4 405 缺 Allow · 1.6 GET 无缓存语义 · 1.7 content 双重编码取舍未标注 · 2.3 time_range 魔术串 · 2.4 CORS 声明与行为不一致 · 3.3 示例 setTimeout 硬等 · 3.4 select 事件不完整 · 4.1 PFDEmbed 前提未自证 · 4.2 load 失败静默 |
| **合计** | **14** | 另交叉引用 6 条（1.3→§5.8/安全9.1；dir 回显→安全7.3；并发写→维度五；`?api=`→安全5.5；协议版本/origin→维度二10.1/安全5.3-5.4；schema 校验→§10.5） |

## 修复优先级建议

1. **契约文档补齐（治 1.1，成本最低收益立现）**：README 增加 `/pfd-api/projects` 章节（端点表 + 请求/响应示例 + 错误语义），与传感器 API 文档对齐；顺手标注 1.7 的双重编码取舍。
2. **错误契约升级（治 1.2/1.3/2.2，一次改动三处受益）**：信封加 `code` 字段；server.js 错误分级 4xx/5xx；`SENSOR_API._get` 返回分类错误而非 null——前端监控页即可区分「未配置/断网/后端异常」并给出对应 UI。
3. **就绪握手标准化（治 3.2/3.3/4.1）**：`PFDEmbed.whenReady()` Promise + `pfd-ready` 事件；导出注入与官方示例改为等就绪后注入；`PFDEmbed` 非 EMBED 模式挂载告警版。
4. **代理兜底（治 2.1/2.4）**：`/api/sensors/*` 强制 `Cache-Control: no-store`；CORS 方法声明与代理白名单对齐（约 5 行）。
5. **并发原语与事件补全（治 1.5/3.4/4.2）**：与维度五的并发写审计结论合并设计（If-Match 或版本号）；`selectionChanged`/`error` 事件补全。
