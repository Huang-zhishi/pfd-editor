# 更新日志

本文件记录本项目的显著变更，格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [未发布]

### 计划中
- 架构：去 `document.write`（架构审计 §2.4）→ 落地后收紧 CSP 的 `script-src`
- 工程化：镜像固定 digest（见下方说明）、ESLint 警告预算逐批下调至 0
- 数据一致性：位号失效治理（维度五审计 §4.1–4.3）

## [1.0.0] - 2026-09-22

首个版本基线。本版本主要是**审计驱动的一轮质量修复**，功能行为对外保持兼容，
但**部署默认值有收紧**（见「变更」与「升级注意」）。

### 新增
- **健康检查端点**：`GET /healthz`（存活）、`GET /readyz`（就绪，检查项目库目录可写）
- **结构化日志与审计**：`logLine()` 输出单行 JSON；项目库保存/删除/冲突留痕（来源 IP、UA、字节数）
- **项目库并发写保护**：GET 返回 `mtime` 基线，POST 支持 `X-PFD-Base-Mtime`，冲突返回 409
- **项目库可选鉴权**：环境变量 `PFD_API_TOKEN`（留空=不鉴权，向后兼容）
- **安全响应头**：`X-Content-Type-Options` / `Referrer-Policy` / `Permissions-Policy` / CSP / `X-Frame-Options`
- **右下角实时帧率徽标**：rAF 采样 + EMA，分级配色，点击展开细节、双击重置峰值
- **仓库工程化基线**：`.nvmrc`(20)、`package.json`（无运行时依赖）、`LICENSE`、`.env.example`、`.editorconfig`
- **CI 门禁**：模板渲染校验、ESLint 警告预算、安全回归（越界路径/畸形 URI/默认监听）、
  令牌鉴权回归、代理加固回归（前缀逃逸/请求头白名单/超时/体积上限）
- **供应链**：GitHub Actions 全部固定 commit SHA；镜像构建产出 SBOM 与 provenance
- **容器加固**：非 root 运行、`HEALTHCHECK`、`cap_drop: [ALL]`、`no-new-privileges`、只读根文件系统

### 变更（**部署默认值收紧，升级前请阅读**）
- `HOST` 默认由 `0.0.0.0` 改为 **`127.0.0.1`** —— 对外提供服务需显式设置 `HOST=0.0.0.0`
- `API_TARGET` **不再有默认值** —— 未配置时 `/api/*` 返回 503 并给出提示
- CORS 默认**不开放**（需配 `PFD_CORS_ORIGINS`）；iframe 嵌入默认**仅同源**（需配 `PFD_EMBED_ORIGINS`）；
  `?api=` 跨源覆盖需登记在 `PFD_API_ALLOW`
- 静态文件服务改为按**解析后的真实路径**做越界校验（原实现可被 `..` 绕过）
- 项目库列表接口不再回显服务器绝对路径
- 性能：组件库缩略图剥离 SMIL 并按类型缓存（后台动画节点 2109 → 0）；
  拖拽改尺寸改为增量刷新（40.6ms/帧 → 0.07ms/帧）

### 修复
- **安全（4 个 P0）**：静态文件路径穿越任意文件读取、畸形 URI 触发未捕获异常导致进程退出、
  项目库接口零鉴权、默认绑定 0.0.0.0
- **安全（P1）**：`/api/` 前缀可被 `..` 逃逸、CORS 全开放、请求头全量透传、
  代理无超时与体积上限、postMessage 不校验来源、`?doc=`/`?api=` 无校验
- **健壮性**：localStorage 配额失败静默、undo/redo 反序列化无保护、传感器拉取失败静默、
  导出时 404 错误页被当源码内联、导入路径缺 schema 校验导致渲染崩溃
- **模板**：`instrument.js` 标签未转义、`text.js` 依赖宿主全局 `esc()`（渲染校验异常清零）

### 升级注意
1. **systemd / 自定义命令部署**：需显式补 `Environment=HOST=0.0.0.0` 与 `Environment=API_TARGET=...`，
   否则升级后服务仅本机可访问、`/api/*` 返回 503。详见 README「⚠️ 升级须知」。
2. **跨域调用 `/api/*` 的站点**：需配置 `PFD_CORS_ORIGINS`。
3. **跨域 iframe 嵌入预览页**：需配置 `PFD_EMBED_ORIGINS`。
4. 全部环境变量见 `.env.example`（12 项）。

### 已知限制
- Docker 基础镜像 `node:20-alpine` **尚未固定 digest**（构建环境无法访问 registry，
  无法取得可信 digest）。可在有网络的环境执行下列命令后补上：
  ```bash
  docker buildx imagetools inspect node:20-alpine   # 取 index 的 Digest
  # 然后改为：FROM node:20-alpine@sha256:<digest>
  ```
- `.git` 目录体积仍约 19M：已用 `git rm --cached` 移出历史入库的大文件，
  但历史对象仍在；彻底瘦身需 `git filter-repo` 重写历史（高风险，未执行）。
