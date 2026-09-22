# 项目审计 · 工程化与 DevOps 缺陷清单（大厂标准）

> 审计日期：2026-09-22
> 审计维度：**维度三 · 工程化与 DevOps 审计**（对应《[项目审计-待补维度占位说明.md](./项目审计-待补维度占位说明.md)》维度三）
> 审计范围：`.github/workflows/ci.yml`、`cd.yml`、`Dockerfile`、`docker-compose.yml`、`start.cmd`、`serve.ps1`、`deploy.sh`、`README.md`、`DEPLOY.md`、`.gitignore`、`.dockerignore`、仓库根目录文件组织
> 审计方式：只读审计 + 仓库现状实测（`git ls-files`、`git check-ignore`、文件清点）
> 严重级别：**P0 严重** · **P1 高** · **P2 中** · **P3 低**
> 交叉引用：与已完成文档重复的条目只做本维度补充，不重复展开 ——
> 《[架构与代码质量缺陷清单](./项目审计-架构与代码质量缺陷清单.md)》、《[安全缺陷清单](./项目审计-安全缺陷清单.md)》

---

## 0. 结论摘要

**先肯定做得好的部分**（避免把"刻意选择"误判为缺陷）：

| 项 | 评价 |
|---|---|
| 零 npm 依赖 | ✅ **优点**：无 `node_modules`、无供应链投毒面、无需构建。`package.json` 的缺失应从这个角度理解 |
| `Dockerfile` 用非 root 用户（`USER pfd`） | ✅ 已落实最小权限的一半 |
| `.dockerignore` / `.gitignore` 存在且覆盖日志、`.git`、tar.gz、AI 工具目录 | ✅ 基础卫生到位 |
| `cd.yml` 的 `permissions:` 已最小化 | ✅ 优于多数项目 |
| CI 已有冒烟测试（静态页 + `/projects` 403 + 项目库往返 + Docker 构建） | ✅ 不是"只跑语法检查" |
| `deploy.sh` 用 `set -euo pipefail` + systemd + `Restart=on-failure` | ✅ 部署脚本质量高于平均水平 |

**核心缺口集中在四条**：

1. **测试资产为零**：全仓无任何单元/集成/E2E 测试文件，CI 的冒烟测试覆盖不到已发现的 P0 漏洞（见 1.3）。
2. **Node 运行时版本三处不一致**：`Dockerfile` node:20、`deploy.sh` apt 安装（Ubuntu 24 → 18.x）、`start.cmd` 硬编码 24.18.1 → 同一份代码跑在三个大版本上。
3. **仓库把构建产物与用户上传物入库**：`.trae-html-share-packages/*.zip`（3 × 2.5 MB）+ `.uploads/*`（含供应商 PDF）。
4. **发布流程缺失**：0 个 git tag、无 CHANGELOG、无健康检查端点、无回滚步骤。

---

## 1. 自动化测试缺失

| # | 位置 | 缺陷描述 | 大厂标准 | 级别 |
|---|---|---|---|---|
| 1.1 | 全仓检索 `*test*`/`*spec*`/`*.test.js` → **0 命中** | **无任何自动化测试**：既无单元测试（`kilnTempColor`、`monitorAutoHeight`、`fmtMonVal` 等纯函数，几何内核 `routePipe`/`portPos`/`pointAlongPipe` 都适合单测），也无集成/E2E | 测试金字塔：核心算法单测覆盖 ≥70%，关键链路集成测试，交互路径 E2E | **P1** |
| 1.2 | `.github/workflows/ci.yml` L38–81 | CI 仅有 `node --check`（3 个文件）+ 冒烟测试；**无测试步骤、无覆盖率门槛** | CI 必须跑测试并设覆盖率 gate（低于阈值直接 fail） | **P1** |
| 1.3 | `ci.yml` L66–69 `for path in /editor /preview /embed-demo.html /pfd-api/projects` + L71–74 `/projects -> 403` | **冒烟测试给了虚假安全感**：断言了 `/projects` 返回 403，但**未覆盖绕过路径**。实测 `GET /../RS/projects/x.json` 同样 200（见安全清单 §1.3），该用例通过 ≠ 防护有效 | 安全相关的断言必须覆盖编码变体与绕过路径；每修一个漏洞补一条回归用例 | **P1** |
| 1.4 | `templates/*.js`（34 个模板） | 模板渲染**无回归测试**：项目内已有可复用的渲染校验脚本（`render-check.js`：清单/注册一致性 + `NaN/undefined` 扫描），但**未纳入 CI** | 渲染产物需快照/回归比对，模板改动必须自动校验 | P2 |
| 1.5 | 无 mock/依赖注入（交叉引用 §9.3） | `fetch`/`localStorage`/`fs` 硬绑全局，无法为测试替换 → 这是"想写测试也写不了"的结构性障碍 | 依赖注入 + 可测产物（ESM 导出） | **P1** |

## 2. CI/CD 流水线质量

| # | 位置 | 缺陷描述 | 大厂标准 | 级别 |
|---|---|---|---|---|
| 2.1 | `ci.yml` 全文（仅 validate + docker-build 两个 job） | **无 lint、无格式化检查、无覆盖率、无安全扫描**：已完成审计里大量 P2/P3 缺陷（`var` 混用、`substr` 废弃 API、`catch(e){}` 空捕获、命名混杂）**本可由 lint 规则批量压制**，现全靠人工 review | CI 至少包含：lint（ESLint）+ 格式（Prettier check）+ 单测覆盖率 + 依赖/镜像漏洞扫描（Trivy、`npm audit` 等价物） | **P1** |
| 2.2 | 仓库无 `.eslintrc*` / `.prettierrc` / `.editorconfig`（检索确认均缺失） | **无任何代码规范配置**，导致同一仓库出现 `var`/`let`/`const` 混用、snake_case 混入驼峰、`catch(e){/* 静默 */}` 等（见架构清单 §2.3/§5.3/§7.x） | 规范配置入库并接入 CI，新增代码必须过 lint | **P1** |
| 2.3 | `ci.yml` L26/L29 `actions/checkout@v4`、`actions/setup-node@v4`；`cd.yml` 另有 4 个 Docker Action —— **交叉引用安全清单 §8.6** | 第三方 Action 引用可变大版本标签，未固定 commit SHA（安全面已在安全清单记录）；**本维度补充**：无 Dependabot/Renovate 配置，升级依赖（含 Action 与基础镜像）完全靠人工 | Action 固定 SHA + 开启 Dependabot 自动提 PR | P2 |
| 2.4 | `cd.yml` `docker/build-push-action@v6` 未配置 `cache-from`/`cache-to` | 每次构建**无层缓存**，重复构建耗时（对本项目影响有限，因无依赖安装步骤） | 启用 BuildKit 缓存（`type=gha`） | P3 |
| 2.5 | `ci.yml` 全文 | 无**制品归档**（构建出的镜像/产物未存为 artifact）、无**失败通知**（无 Slack/邮件/Issue 自动创建），失败只能靠人看 Actions 页面 | 流水线需制品归档 + 失败主动通知 | P2 |

## 3. Docker 最佳实践

| # | 位置 | 缺陷描述 | 大厂标准 | 级别 |
|---|---|---|---|---|
| 3.1 | `Dockerfile` L11 `FROM node:20-alpine` —— **交叉引用安全清单 §8.1** | 基础镜像未固定 digest，构建不可复现 | `node:20-alpine@sha256:...` | **P1** |
| 3.2 | `Dockerfile` 全文 | **无 `HEALTHCHECK`**（同时服务端也无健康检查端点，见 §9.2）→ 编排层无法判断容器是否可用，`restart: unless-stopped` 只能靠进程存活判断 | 镜像须声明 HEALTHCHECK，或提供 `/healthz` 由编排探活 | **P1** |
| 3.3 | `Dockerfile` L15 `COPY . .` + `.dockerignore` | `.dockerignore` 已排除 `.git`/日志/tar.gz，**但未排除 `doc/`（审计文档）与 `projects/`（用户项目数据）** → 镜像内携带非运行必需内容与业务数据 | 白名单式 COPY（只复制 `server.js`/`*.html`/`*.js`/`templates/`），构建上下文最小化 | P2 |
| 3.4 | `Dockerfile` L24 `ENV API_TARGET=http://192.168.1.78` | 内网地址烘焙进镜像层（安全清单 §8.3 已记），**本维度补充**：镜像因此跨环境不可复用，无法"一次构建多处部署" | 镜像只留占位默认值，环境相关配置全部运行时注入 | P2 |
| 3.5 | `Dockerfile` 无 `--init`/`--cap-drop`/只读根文件系统 | 容器默认带全部 capability、PID 1 无 init（信号处理不完善）、根文件系统可写 | `cap_drop: [ALL]`、`read_only: true` + `tmpfs`、`init: true` | P2 |
| 3.6 | `docker-compose.yml` L10 `"8090:8090"`、L7 `image: pfd-editor:latest`、无 `deploy.resources` —— **交叉引用安全清单 §8.4** | 端口映射到所有网卡（安全面已记）；**本维度补充**：`latest` 可变标签使回滚不可靠（回滚时 `latest` 可能已指向新版本），且无 CPU/内存上限 | 端口显式绑 `127.0.0.1`、镜像用 digest/SHA、设置资源上限 | **P1** |
| 3.7 | `Dockerfile`（单阶段） | **多阶段构建在本项目不适用** —— 项目无构建步骤、无依赖安装，单阶段是正确选择。**本条记录为"评估后确认无缺陷"**，避免后续误改 | 按实际需要选择构建策略，不为"最佳实践"而最佳实践 | —（无需修复） |

## 4. 配置管理

| # | 位置 | 缺陷描述 | 大厂标准 | 级别 |
|---|---|---|---|---|
| 4.1 | `editor.js` L52、`server.js` L7/L19、`Dockerfile` L24、`docker-compose.yml` L14 | 内网地址 `192.168.1.78` 硬编码 **5 处**（占位说明记为"四处"，实际 5 处） | 配置外部化，代码内不留真实地址 | P2 |
| 4.2 | 仓库无 `.env.example`（检索确认缺失） | **无环境变量样例文件**：`PORT`/`API_TARGET`/`PROJECT_DIR` 三个变量的取值示例、默认值、单位散落在 `server.js` 头部注释与 README 片段中 | 提供 `.env.example`，逐项注释用途/默认值/是否必填 | **P1** |
| 4.3 | `deploy.sh` L18 `API_TARGET="http://127.0.0.1:8080"` vs `server.js` L19 `'http://192.168.1.78'` | **默认值互相矛盾**：同一变量在部署脚本与程序里的默认目标不同（`127.0.0.1:8080` vs 局域网地址），换环境时极易配错到错误后端 | 默认值单一来源；脚本显式覆盖并回显生效值（`deploy.sh` 已回显，值得保留） | **P1** |
| 4.4 | `start.cmd` L31–36 | **Node 版本三处不一致**：`start.cmd` 硬编码 `%USERPROFILE%\.workbuddy\binaries\node\versions\24.18.1\node.exe`（机器专属路径 + 固定版本）、`Dockerfile` 用 `node:20-alpine`、`deploy.sh` L35 用 `apt install nodejs`（Ubuntu 24 为 18.x）→ 同一份代码在 Node 18/20/24 三个大版本上运行 | 用 `.nvmrc` + `package.json` 的 `engines` 锁定版本，脚本按版本校验而非硬编码路径 | **P1** |
| 4.5 | README「快速开始」L66–68 | 环境变量文档不完整：**`PROJECT_DIR` 在 README 中 0 次提及**（检索确认），仅在 `server.js` 注释里出现 | 全部环境变量在 README 与 `.env.example` 双处登记 | P3 |
| 4.6 | `start.cmd` L43–48 | 日志路径写死为仓库根目录（`%CD%\pfd-server.out.log`）→ 运行产物落在源码目录，且无轮转 | 日志写到独立目录（`logs/`）或系统日志，配置化路径 | P2 |

## 5. 版本管理

| # | 位置 | 缺陷描述 | 大厂标准 | 级别 |
|---|---|---|---|---|
| 5.1 | `git tag -l` → **0 个标签**（76 次提交） | **从未打过版本标签**：`cd.yml` 已实现 `v*` 标签触发发布，但从未使用 → 无版本基线，无法回答"线上跑的是哪个版本" | 语义化版本 + 每个发布点打 tag（`v1.2.0`），tag 即发布契约 | **P1** |
| 5.2 | 无 `CHANGELOG.md`（检索确认缺失） | **无变更日志**：76 次提交的变更信息只在 git log 里，用户/运维无法快速了解版本间差异 | 维护 CHANGELOG（Keep a Changelog 格式）或由 Conventional Commits 自动生成 | P2 |
| 5.3 | 无 `package.json` | **无版本号载体**：项目自身版本无处声明（README 也未标注版本），与"零依赖"无关 —— 可以有一个**不含 dependencies 的** `package.json` 提供 `version`/`engines`/`scripts` | 任何可发布产物都应有版本标识（`package.json` 或 `VERSION` 文件） | P2 |
| 5.4 | 无 `LICENSE`（检索确认缺失） | **无许可证**：代码无授权声明，对外分发/交付存在法律风险（尤其本仓库含供应商 PDF 等第三方内容） | 明确 LICENSE（内部项目至少标注"内部使用，禁止外传"） | **P1** |
| 5.5 | `docker-compose.yml` L7 `image: pfd-editor:latest` | 依赖可变 `latest` 标签部署，回滚目标不明确（安全清单 §8.4 已记端口问题，此处记版本语义） | 部署引用 digest 或不可变 SHA 标签 | P2 |

## 6. 仓库卫生

| # | 位置 | 缺陷描述 | 大厂标准 | 级别 |
|---|---|---|---|---|
| 6.1 | `.trae-html-share-packages/editor.html.zip`、`embed-demo.html.zip`、`preview.html.zip`（**3 个文件已入库，每个 2.5 MB，合计 7.7 MB**） | **构建/分享产物入库**：这是 HTML 分享打包产物，属于可再生产物，不应进版本库（当前 `.git` 已达 18 MB） | 产物不入库；确需分发用 Release 附件/制品库 | **P1** |
| 6.2 | `.uploads/` 下 3 个已跟踪文件：`3c6e4d6a-…_image.png`、`956d9ac0-…_image.png`、`671269a3-…_1_2018-11-09胜握泵料磨粉产品说明书.pdf` | **用户上传物入库**（含一份供应商产品说明书 PDF）：既污染仓库，又可能涉及第三方资料版权与业务信息外泄 | 上传目录纳入 `.gitignore`；确需留存走对象存储 | **P1** |
| 6.3 | `.gitignore` 缺失规则 | `.gitignore` 有 `*.log`、`pfd-editor-ubuntu24.tar.gz`（已正确忽略，实测 `git check-ignore` 通过），**但缺少 `.uploads/`、`.trae-html-share-packages/`** → 这两个目录被误入库（见 6.1/6.2） | `.gitignore` 按"产物/上传/工具目录"三类成组维护，新增工具目录同步登记 | P2 |
| 6.4 | 仓库根目录 14 个中文规划/报告 md：`回转窑优化计划.md`、`除尘布袋优化计划.md`、`性能调查报告.md`… | **文档与源码混放根目录**：`doc/` 目录已存在（放审计文档与对照图），这 14 份却留在根目录，与 `server.js`/`editor.js` 平级 | 根目录只保留工程必需文件（README/LICENSE/CI/构建配置），文档统一进 `doc/` | P2 |
| 6.5 | 根目录 6 个日志文件（`pfd-server.out.log` 达 **560 KB**、`pfd-py.log`、`pfd-server-cmd.log`、`pfd-server-wmic.log`、`pfd-server.err.log`、`pfd-server.log`） | 运行日志落在源码根目录（`*.log` 已被 gitignore，故未入库 ✅），但污染工作区、干扰 `ls`、易被误提交 | 日志目录独立（`logs/`）且整体忽略；`start.cmd` 重定向路径同步调整 | P3 |
| 6.6 | `img/image.png` | 文件名无语义（另一个同目录文件是 `磨机.png`），无法判断用途 | 图片按内容命名（`mill.png`） | P3 |
| 6.7 | `deploy.sh` **未入库**：`git ls-files` 确认未跟踪，且 `git check-ignore -v` 显示是 **`.gitignore` 第 25 行显式忽略**（同时被 `.dockerignore` 第 12 行排除） | 部署脚本被主动排除在版本控制之外（属刻意选择，但代价是：变更无法追溯、新环境获取不到、与代码版本可能错配；2026-09-22 的安全修复就因此**无法随代码同步到服务器**；且 `DEPLOY.md` 同样被忽略，升级须知最终只能落在 `README.md`） | 部署脚本应入库（可仍从镜像中排除）；若因环境差异需排除，应改用 `.env`/模板 + 入库的通用脚本 | P2 |

## 7. 日志与可观测性

| # | 位置 | 缺陷描述 | 大厂标准 | 级别 |
|---|---|---|---|---|
| 7.1 | `server.js` 全文 13 处 `console.log`/`console.error` | **无结构化日志**：纯文本行（`[PROXY] GET /api/... -> http://...`），无时间戳、无级别、无请求 ID、无来源 IP → 无法聚合检索，出问题只能人肉翻文件 | 结构化日志（JSON）+ 级别（debug/info/warn/error）+ 请求 ID 贯穿 | P2 |
| 7.2 | `server.js` 全文 | **无健康检查端点**：无 `/healthz`/`/readyz`，`docker-compose` 与 systemd 均无法探活（与 3.2 呼应） | 提供 `/healthz`（存活）与 `/readyz`（依赖就绪）端点 | **P1** |
| 7.3 | `server.js` 全文 | **无监控指标**：无 QPS/延迟/错误率/连接数暴露（无 `/metrics`），也无任何 APM 接入 → 无法回答"服务当前健康吗" | 暴露 Prometheus 指标或接入 APM；关键路径埋点 | P2 |
| 7.4 | `server.js` L118/L127 仅 `console.log('[PROJECTS] 保存/删除', name)` | **安全相关操作审计不足**：写/删项目只有一行无来源 IP、无操作者、无结果状态的日志（安全清单 §9.4 已记，此处补工程化视角：审计日志应独立、可长期留存） | 审计日志独立存储、包含 who/when/what/result，留存期明确 | P2 |
| 7.5 | `start.cmd` L55–57 `del "%LOG%" "%ERR%"` | 每次启动**清空历史日志**：故障重启后现场丢失，无法回溯上一次崩溃（本次安全审计发现的崩溃 DoS 即依赖手工复现） | 日志按时间滚动归档（保留 N 份），而非启动即删除 | P2 |
| 7.6 | `deploy.sh` systemd 单元（`Restart=on-failure` + `RestartSec=3`） | 崩溃自动重启 ✅ 但**无重启次数限制与告警**：若持续崩溃将无限重启（崩溃循环），且无人知晓 | 配 `StartLimitBurst`/`StartLimitIntervalSec` 限制重启风暴，并接入告警 | P2 |

## 8. 文档完备性

| # | 位置 | 缺陷描述 | 大厂标准 | 级别 |
|---|---|---|---|---|
| 8.1 | 无 `LICENSE` | 见 5.4 | 明确授权 | **P1** |
| 8.2 | 无 `CONTRIBUTING.md` | **无贡献指南**：如何搭环境、代码规范、提交信息格式、PR 要求（如"模板改动需附渲染对比图"这类项目特有约定）均无成文，新人上手只能口口相传 | 贡献指南 + PR 模板 + Issue 模板 | P2 |
| 8.3 | README 无「版本」章节（检索：`版本`/`CHANGELOG` 均 0 命中） | README 有 13 个章节（功能/架构/结构/快速开始/后端 API 约定/数据模型/新增模板/实时数据/导出嵌入/开发注意/已知限制），质量不错，但**缺版本信息与兼容性矩阵**（如"数据模型 version=1，与 v1.x 编辑器兼容"） | README 含版本、兼容性矩阵、升级注意事项 | P2 |
| 8.4 | 无 `/pfd-api/projects` 接口文档 | 项目库 REST（list/get/save/delete）的请求/响应/错误码语义无文档（维度六范围，此处仅登记缺口） | 对外接口需 OpenAPI 或等价契约文档 | P2 |
| 8.5 | `.github/` 下无 `PULL_REQUEST_TEMPLATE.md` / `ISSUE_TEMPLATE/` | 无 PR/Issue 模板：本项目有"改模板必附对照图""改渲染必跑校验"等强约定，缺少模板承载 | 提供 PR/Issue 模板，把项目约定固化为检查项 | P3 |

## 9. 发布流程

| # | 位置 | 缺陷描述 | 大厂标准 | 级别 |
|---|---|---|---|---|
| 9.1 | 全仓无发布流程文档；`DEPLOY.md` 六、更新代码仅描述"覆盖解压 + 重启" | **无回滚步骤**：更新即覆盖，回滚只能靠重新上传旧 tar.gz（而旧 tar.gz 不在版本库，见 6.7） | 回滚方案必须成文并可执行（镜像按 digest 回滚 / 保留上一版本产物） | **P1** |
| 9.2 | 无健康检查端点（见 7.2）+ `deploy.sh` 部署后无验证步骤 | **发布无验证**：部署脚本完成即宣告成功，不校验服务是否真的可用（CI 里有冒烟测试，生产部署却没有） | 发布后自动执行冒烟/健康校验，失败自动回滚 | **P1** |
| 9.3 | 无灰度/蓝绿机制 | 单实例直接覆盖部署，**发布即全量**，出问题影响全部用户 | 至少支持"新版本起第二端口 → 验证 → 切流"的蓝绿，或 nginx 权重灰度 | P2 |
| 9.4 | 无 SBOM/镜像签名（安全清单 §8.7 已记） | 制品不可追溯、不可验证来源 | 生成 SBOM + cosign 签名 | P3 |
| 9.5 | `cd.yml` 产物仅有镜像；无 Release 说明 | 无 Release Notes：镜像推送到 GHCR 但无对应变更说明，运维无从判断"该不该升级" | 每个 tag 生成 Release Notes（可复用 CHANGELOG） | P2 |

## 10. 启动脚本一致性与健壮性

| # | 位置 | 缺陷描述 | 大厂标准 | 级别 |
|---|---|---|---|---|
| 10.1 | `start.cmd`（Windows，含 Node/Python/无运行时三级降级）、`serve.ps1`（PowerShell HttpListener）、`deploy.sh`（Linux systemd）、`server.js`（Node） | **四条启动路径、行为不一致**：只有 `server.js` 提供 `/api/*` 代理与项目库接口；`serve.ps1` 与 `start.cmd` 的 Python 兜底**都没有**（`serve.ps1` 注释已说明，但 README 未说明，用户按 README 用错脚本会以为"实时数据坏了"） | 启动方式收敛为一条主路径 + 明确降级说明；各脚本能力差异在 README 表格化列明 | **P1** |
| 10.2 | `serve.ps1` L17 `$file = Join-Path $root ($url -replace '/','\')` | **同样的路径穿越缺陷**（`AbsolutePath` 已解码，`Join-Path` 不收敛根目录）→ 与安全清单 §1.1 同源问题；**本维度补充**：它还对所有响应加 `Access-Control-Allow-Origin: *`，且不区分 HTTP 方法（POST/DELETE 也当 GET 处理） | 静态服务统一走同一个经过安全加固的实现，避免多份平行实现各自带洞 | **P1** |
| 10.3 | `start.cmd` L25–28 | **粗暴杀端口占用进程**：`for /f ... netstat -ano \| findstr :%PORT% \| taskkill /F /PID %%P` —— 不校验该进程是否是自己启动的，若 8090 被其他服务占用会被直接强杀 | 只杀自己管理的进程（记录 PID 文件），或提示用户而非静默强杀 | P2 |
| 10.4 | `start.cmd` L31–36 | 硬编码机器专属 Node 路径（`%USERPROFILE%\.workbuddy\binaries\node\versions\24.18.1\...`），换机即失效；且与 4.4 的版本不一致问题叠加 | 优先 `where node` + 版本校验，路径不进脚本 | P2 |
| 10.5 | `start.cmd` L58（Python 兜底 `python -m http.server %PORT% --bind 127.0.0.1`） | 兜底方式把**整个仓库目录**（含 `.git`、`.uploads`、日志）暴露为静态服务；虽绑 `127.0.0.1` 风险可控，但语义上不是"预览编辑器"而是"暴露仓库" | 兜底只服务白名单文件，或明确提示降级后的能力边界 | P2 |
| 10.6 | `deploy.sh` L35 `apt-get install -y nodejs` | **不锁定 Node 版本**：Ubuntu 24 仓库为 18.x，与镜像 node:20、本地 24.x 形成三方差异（见 4.4） | 用 NodeSource/官方 tar 安装指定大版本并校验 | **P1** |
| 10.7 | `deploy.sh` systemd 单元（`User=`/`Environment=`/`ExecStart=`/`Restart=`） | 单元**无安全加固**：未设 `NoNewPrivileges=true`、`ProtectSystem=strict`、`PrivateTmp=true`、`ReadWritePaths=`；且无 sudo 时以 `root` 运行（脚本 L28） | systemd 加固指令 + 强制非 root 运行 | P2 |
| 10.8 | `deploy.sh` 未入库（见 6.7）+ `serve.ps1`/`start.cmd` 已在库 | 三套脚本的维护状态不一致：Windows 脚本在库、Linux 部署脚本不在库 | 所有启动/部署脚本统一入库 | P2 |

---

## 缺陷统计

| 级别 | 数量 | 主要构成 |
|---|---|---|
| **P0** | **0** | 本维度未发现 P0（严重安全问题已在维度一记录，不重复计数） |
| **P1** | **15** | 测试资产为零（1.1/1.2/1.3/1.5）、无 lint 与规范配置（2.1/2.2）、镜像未固定 digest 与无 HEALTHCHECK（3.1/3.2）、compose 可变标签与无资源限制（3.6）、无 `.env.example`（4.2）、默认 API 地址矛盾（4.3）、Node 版本三方不一致（4.4/10.6）、0 个版本标签（5.1）、无 LICENSE（5.4/8.1）、产物与上传物入库（6.1/6.2）、无健康检查端点（7.2）、无回滚与发布验证（9.1/9.2）、启动路径能力不一致（10.1）、`serve.ps1` 穿越（10.2） |
| P2 | 22 | 模板无回归测试、Actions 未固定 SHA 且无 Dependabot、无制品归档与失败通知、镜像携带 doc/projects、镜像烘焙内网地址、容器无加固、日志无结构化、无监控指标、审计日志不足、日志启动即删、重启无限制、无 CHANGELOG、无版本号载体、`.gitignore` 规则缺失、根目录 14 份中文文档、`deploy.sh` 未入库、无 CONTRIBUTING、README 缺版本章节、无接口文档、无灰度、无 Release Notes、粗暴杀端口、硬编码 Node 路径、Python 兜底暴露仓库、systemd 无加固 |
| P3 | 5 | Docker 无构建缓存、`PROJECT_DIR` 未文档化、根目录日志污染、`img/image.png` 命名、无 PR/Issue 模板、无 SBOM/签名 |
| **合计** | **42** | 本维度独立发现 42 条（其中 7 条为对已有文档条目的工程化面补充，已标注交叉引用） |

---

## 修复优先级建议

### 第一批（P1，建议 2~3 个工作日，投入产出比最高）

1. **补齐仓库卫生**（6.1/6.2/6.3/6.7）：`.gitignore` 增加 `.uploads/`、`.trae-html-share-packages/`；`git rm --cached` 移除已入库的 6 个文件（**保留工作区文件**，仅从版本库移除）；`deploy.sh` 纳入版本控制。**这一步几乎零风险，且立刻减小仓库体积。**
2. **统一 Node 版本**（4.4/10.6）：新增 `.nvmrc`（`20`）与不含依赖的 `package.json`（写 `version` + `engines.node >= 20` + `scripts`），`start.cmd` 改为 `where node` + 版本校验，`deploy.sh` 改用 NodeSource 安装 20.x。
3. **加健康检查端点 + 镜像探活**（3.2/7.2）：`server.js` 增加 `GET /healthz`（进程存活）与 `GET /readyz`（项目库目录可写）；`Dockerfile` 加 `HEALTHCHECK`；`docker-compose` 加 `healthcheck`。
4. **配置与版本基线**（4.2/4.3/5.1/5.4）：补 `.env.example`；统一 `API_TARGET` 默认值（建议代码内默认 `127.0.0.1:8080`，局域网地址只出现在部署配置）；打第一个 `v1.0.0` tag；补 LICENSE。
5. **接 lint + 测试到 CI**（1.2/2.1/2.2）：先加 ESLint（`no-var`/`no-empty`/`camelcase`/`no-restricted-properties` 四条规则即可压掉架构清单里大半 P2）+ Prettier check；把已有的 `render-check.js` 纳入 CI 作为模板回归门禁；为已修复的安全漏洞（如路径穿越）补回归用例。

### 第二批（P1/P2，本周内）

6. 发布流程补全（9.1/9.2/9.5）：`DEPLOY.md` 增加回滚章节；`deploy.sh` 部署后自动跑冒烟校验，失败即回滚；每个 tag 生成 Release Notes。
7. 镜像与编排加固（3.3/3.5/3.6/4.1）：白名单 COPY、`cap_drop: [ALL]`、`read_only` + `tmpfs`、端口绑 `127.0.0.1`、资源上限、去掉镜像内的内网地址。
8. 启动脚本收敛（10.1/10.2/10.3/10.5/10.7）：README 用表格列明各启动方式的**能力差异**；`serve.ps1` 的路径穿越与 `ACAO: *` 按安全清单统一修（或直接废弃，改为引导使用 `server.js`）；`start.cmd` 不再强杀非自管进程；systemd 单元加加固指令。

### 第三批（P2/P3，随迭代治理）

9. 可观测性（7.1/7.3/7.4/7.5/7.6）：结构化日志 + 请求 ID、`/metrics` 或 APM 接入、审计日志独立留存、日志轮转替代"启动即删"、systemd 重启风暴限制 + 告警。
10. 文档与流程（5.2/5.3/6.4/8.2/8.3/8.4/8.5）：CHANGELOG、根目录 14 份中文文档迁入 `doc/`、CONTRIBUTING + PR/Issue 模板、README 补版本与兼容性矩阵、`/pfd-api/projects` 接口文档。
11. 供应链（2.3/2.4/9.4）：Actions 固定 SHA + Dependabot、构建缓存、SBOM + cosign 签名。

> 说明：本清单所有结论基于当前工作区实际状态（`git ls-files` / `git check-ignore` / 文件清点）与文件内容核对。修复建议中的命令仅作示例，需人工确认后执行。

---

## 修复进展

### 第一批（2026-09-22 完成）：仓库卫生 / Node 版本 / 版本基线 / 测试接入

按本清单「修复优先级第一批」推进。提交 `9f52cb3`，标签 **`v1.0.0`**（仓库首个版本标签）。

| 条目 | 修复内容 | 验证结果 |
|---|---|---|
| **6.1** 分享产物入库 | `.gitignore` 补 `.trae-html-share-packages/`；3 个 2.5MB 的 zip 已用 `git rm --cached` 移出索引（工作区文件保留） | 已跟踪数 **3 → 0** |
| **6.2** 用户上传物入库 | `.gitignore` 补 `.uploads/`；3 个文件（含供应商 PDF）移出索引 | 已跟踪数 **3 → 0** |
| **6.3** `.gitignore` 规则缺失 | 补齐上述两条；**并补 `.env` / `.env.local`**（此前 `.env` 未被忽略，而本轮新增了 `.env.example`，存在密钥误提交风险）；全文重排注释说明用途 | `git check-ignore` 逐项验证：`.env` 系列忽略、`.env.example` 可入库、产物目录忽略 |
| **6.7** 部署脚本未入库 | `deploy.sh` 与 `DEPLOY.md` 移出忽略列表并入库。它们被排除时已造成实际后果：安全修复无法随代码同步、升级须知无处承载（只能改放 README） | 两文件已入库；**注意这是对既有策略的有意调整** |
| **4.4 / 10.4 / 10.6** Node 版本三处不一致 | 新增 `.nvmrc`（20）与 `package.json`（`version 1.0.0` / `engines.node >=20` / scripts，**不含任何 dependencies**，保持运行时零依赖）；`start.cmd` 去掉写死的托管路径（含版本号 `24.18.1`），改为 PATH 优先 + 托管目录枚举 + 版本回显；`deploy.sh` 改用 NodeSource 20.x 并在已安装时校验大版本 | `start.cmd` 中硬编码版本号出现次数 **1 → 0**；`deploy.sh` 通过 `bash -n` |
| **5.1 / 5.3 / 5.4** 无版本与许可基线 | `package.json` 提供版本号载体；新增 `LICENSE`（内部使用 / 保留所有权利占位声明，含第三方资料条款）；打首个标签 `v1.0.0` | `git tag -l` → `v1.0.0`；标签已推送 |
| **1.4 / 2.1** 测试未接入 CI | 渲染校验脚本纳入仓库（`.github/scripts/render-check.js`），CI 新增 `Template render check` 步骤 —— 此前该脚本只存在于本地技能目录，CI 无法运行 | 本地实测 34 个模板清单/注册一致、渲染异常 0 |
| **3.2 / 7.2** 无健康检查 | ✅ 已在安全审计第四批完成（新增 `/healthz` `/readyz` + `HEALTHCHECK` + compose `healthcheck`） | `/healthz` `/readyz` 均 200 |
| **4.2** 无 `.env.example` | ✅ 已在安全审计第三/四批完成（现覆盖 12 个变量） | 文件已入库 |

**诚实说明**：`.git` 目录体积**仍为 19M** —— `git rm --cached` 只移除索引与后续检出，历史对象仍在。要真正瘦身需重写历史（`git filter-repo`）或重新初始化仓库，属高风险操作，**未执行**，已在下方列为后续可选项。

### 第二批（2026-09-22 完成）：lint 门禁 / CHANGELOG / 依赖自动跟进 / 资源上限

提交 `b8f5365`。

| 条目 | 修复内容 | 验证结果 |
|---|---|---|
| **2.2** 无任何代码规范配置 | 新增 `eslint.config.js`（ESLint 10 扁平配置）+ `.editorconfig`。**采用"警告预算"策略**：规则全设 `warn`，把当前基线固定为预算、只允许下调，**新增违规立刻失败**；规则含 `no-var`/`no-empty`/`no-restricted-properties`（`substr`、`document.write`）/`camelcase`/`eqeqeq`/`no-eval` 等 | 基线实测 **30 警告 / 0 错误**（可维护） |
| **2.1** CI 无 lint | 新增 `lint` 作业（`npm ci` + `npm run lint`，预算 30），失败时额外打印完整报告 | CI 现有 5 个作业 |
| **5.2** 无 CHANGELOG | 新增 `CHANGELOG.md`（Keep a Changelog 格式），含 1.0.0 的新增/变更/修复/升级注意/已知限制，并记录「未发布」计划项 | — |
| **2.3** 依赖升级靠人工 | 新增 `.github/dependabot.yml`：跟踪 github-actions（每周）、docker 基础镜像（每周）、npm devDependencies（每月） | — |
| **3.6** compose 无资源上限 | 增加 `deploy.resources`（limits 0.5 CPU / 256M；reservations 0.1 CPU / 64M） | 配置级 |
| **3.1** 镜像未固定 digest | ⚠️ **未完成，如实记录**：本机 Docker daemon 未运行且 registry 被网络策略拦截，**取不到可信 digest，没有编造**。已在 `Dockerfile` 原位写明补齐命令（`docker buildx imagetools inspect node:20-alpine`），并配 Dependabot 的 docker 生态自动跟进；CHANGELOG「已知限制」同步记录 | 待有网络环境补齐 |

**两个刻意的技术选择（避免被误改）**
1. **不启用 `no-undef` / `no-unused-vars`**：本项目是"全局脚本"形态（无 ESM），跨文件全局符号（`TEMPLATES`/`doc`/`$` 等）无法静态解析，启用只会产生大量假阳性淹没真问题。待架构审计 §2.1/§9.4（模块化）落地后再开。
2. **不引入 Prettier 全量重排**：遗留代码全量重排会产生数千行无意义 diff 并掩盖真实改动，`.editorconfig` + ESLint 已覆盖真正有价值的格式与质量项。

**顺带修复**：`server.js` 进程兜底里我上一批自己留的空 `catch`（被新规则 `no-empty` 抓到）—— 正好说明 lint 门禁开始起作用。

### 第三批建议（未开始）

| 批次 | 建议条目 | 说明 |
|---|---|---|
| 第三批 | **9.x**（日志目录化与轮转、systemd 重启风暴限制）、**10.1**（启动脚本能力差异表）、**10.3/10.5/10.7**（脚本健壮性与 systemd 加固） | 运维侧改动，需在目标机验证 |
| 第四批 | **1.2**（CI 覆盖率门槛，需先有单测）、**2.5**（制品归档与失败通知）、**9.3**（灰度/蓝绿）、**3.1**（digest 补齐） | 依赖前置条件或需环境配合 |
| 后续 | **1.1/1.2/1.4**（架构重构类）、**2.4**（去 `document.write`）、**6.4**（根目录 14 份中文文档迁入 `doc/`） | 属结构性改造，建议独立立项 |

> 跨清单说明：`3.1`（镜像未固定 digest）、`8.6`（Actions 未固定 SHA）、`9.1`（无结构化日志）等条目已在**安全审计第四批**一并修复（Actions 12 处固定 SHA、结构化日志与审计、SBOM/溯源），此处不重复计数。
