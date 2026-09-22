# PFD Editor · Ubuntu 24 部署说明

零依赖 Node.js 应用，部署 = 装 Node → 传文件 → systemd 守护 → 防火墙放行。全程不需要 npm install。

## 一、文件清单

| 文件 | 作用 |
| --- | --- |
| `pfd-editor-ubuntu24.tar.gz` | 项目运行时文件（已打好包） |
| `deploy.sh` | 服务器上的一键部署脚本 |

## 二、上传到服务器

在本机（Windows，已有 scp）执行，替换成你的服务器信息：

```bash
scp pfd-editor-ubuntu24.tar.gz deploy.sh 用户名@服务器IP:~/
```

> 或任何你习惯的方式（Tabby / Termius 的 SFTP、宝塔面板等），把这两个文件放到服务器同一目录即可。

## 三、一键部署

SSH 登录服务器后：

```bash
cd ~
sudo bash deploy.sh
```

脚本会自动：检测/安装 Node.js → 解压到 `/opt/pfd-editor` → 写 systemd 服务 → 放行防火墙 → 启动。

完成后访问（替换成你的服务器公网 IP）：

| 地址 | 说明 |
| --- | --- |
| `http://服务器IP:8090/editor` | 编辑器 |
| `http://服务器IP:8090/preview` | 只读预览 |

## 四、唯一需要你确认的配置：后端 API 地址

`deploy.sh` 顶部有一段配置区，**部署前请把 `API_TARGET` 改成你后端传感器的实际监听端口**：

```bash
# deploy.sh 顶部
API_TARGET="http://127.0.0.1:8080"   # ← 改成后端实际地址
```

常见情况：

- 后端是 Spring Boot → 通常是 `http://127.0.0.1:8080`
- 后端在 80 端口 → `http://127.0.0.1`
- 后端在别的端口 → `http://127.0.0.1:端口`

后端对外的接口路径是 `/api/sensors/list`、`/api/sensors/values`、`/api/sensors/history`，前端统一走同源 `/api/*`，由 `server.js` 反代过去，所以只要这个地址能通就行。

## 五、云安全组（阿里云/腾讯云等）

如果这台 Ubuntu 是云服务器，除了脚本里的 ufw，**还要在云控制台的安全组里放行 `8090` 端口**，否则公网访问不到。脚本管不到云安全组。

## 六、更新代码

改完代码重新打包上传，覆盖后重启即可：

```bash
# 本机重新打包（在项目目录）
tar -czf pfd-editor-ubuntu24.tar.gz editor.html editor.js templates.js preview.html demo-template.json embed-demo.html server.js

# 上传 + 覆盖解压 + 重启
scp pfd-editor-ubuntu24.tar.gz 用户名@服务器IP:/tmp/
ssh 用户名@服务器IP "sudo tar -xzf /tmp/pfd-editor-ubuntu24.tar.gz -C /opt/pfd-editor && sudo systemctl restart pfd-editor"
```

## 六·五、升级须知：监听地址改为默认仅本机（2026-09-22 安全修复）

**背景**：安全审计发现 `server.js` 原来 `server.listen(PORT)` 未指定 host，等于绑定 `0.0.0.0`，
把无鉴权的项目库接口直接暴露给整个局域网。现改为 **默认只监听 `127.0.0.1`**（安全默认值）。

**影响**：如果你用 systemd 单元或自定义命令启动，且**没有显式设置 `HOST`**，
升级后服务将只在服务器本机可访问，外部会连不上。

**处理（二选一）**：

```bash
# 方式 1：需要对外提供访问 —— 显式放开监听地址
sudo systemctl edit pfd-editor
# 在打开的编辑器里加入：
#   [Service]
#   Environment=HOST=0.0.0.0
#   Environment=PFD_API_TOKEN=<用 openssl rand -hex 24 生成>
sudo systemctl daemon-reload && sudo systemctl restart pfd-editor
```

```bash
# 方式 2：只允许本机/反向代理访问 —— 保持默认即可（推荐配合 nginx 反代 + 认证）
# 无需改动，但请确认调用方走的是 127.0.0.1 或反向代理
```

**同时建议启用接口鉴权**（原项目库接口零鉴权，同网段任何人可列目录/读写/删除）：
设置 `PFD_API_TOKEN` 后，所有 `/pfd-api/*` 请求必须带 `X-PFD-Token` 头；
令牌会由 server.js 自动注入到 HTML 页面，编辑器/预览页无需人工配置。

> 注意：仓库根目录的 `deploy.sh` 被 `.gitignore` 排除，本次对它的修改（自动写入
> `Environment=HOST=0.0.0.0`）**不会随代码同步到服务器**。若沿用旧版 `deploy.sh` 重新部署，
> 请手工按上面方式 1 补上 `HOST`；或先把 `deploy.sh` 纳入版本控制（见工程化审计 §6.7）。

## 七、常用运维命令

```bash
systemctl status pfd-editor        # 查看状态
journalctl -u pfd-editor -f        # 实时跟踪日志
systemctl restart pfd-editor       # 重启
systemctl stop pfd-editor          # 停止
sudo ss -tlnp | grep 8090          # 确认端口监听
```

## 八、常见问题

- **改了 API_TARGET 不生效**：改的是 `deploy.sh` 里的变量，需要重新跑 `sudo bash deploy.sh`，或直接编辑 systemd 里的 `Environment=API_TARGET=...` 后 `sudo systemctl daemon-reload && sudo systemctl restart pfd-editor`。
- **实时数据没出来**：先 `curl http://127.0.0.1:后端端口/api/sensors/list` 确认后端本机可通，再核对 `API_TARGET`。
- **浏览器访问不到**：依次排查——服务状态是否 `active (running)`、`ss -tlnp` 是否监听、云安全组是否放行 8090。
- **想要 HTTPS/域名**：后续加一层 Nginx 反代 + 证书即可，本项目无需改动，届时告诉我帮你配。

## 九、回滚方案（工程化审计 §9.1）

> 本服务器当前实际部署方式为 **Docker Compose**（`docker-compose.yml`，容器名 `pfd-editor`），
> 与上文 §3 的 systemd/tarball 方式不同。下面两种方式都给出，按实际部署方式选对应章节。

### 9.1 Docker Compose 部署的回滚

```bash
cd <项目目录>

# 1) 回滚代码到上一个可用版本（v1.0.0 之前的 tag/commit 会连安全修复一起回滚，谨慎）
git fetch --tags
git checkout <上一个可用 commit 或 tag>
# 或直接恢复上一份部署包后重新解压覆盖

# 2) 配置回滚：.env（含 PFD_API_TOKEN / API_TARGET 等）与 docker-compose.yml 是解耦的
#    —— 回滚代码通常不需要动 .env；若需回滚配置，编辑 .env 后重建即可
docker compose up -d --build

# 3) 数据回滚：项目库在命名卷 pfd-projects（/app/projects），重建容器不丢数据
docker compose ps && curl -s localhost:8090/healthz
```

### 9.2 systemd 部署的回滚

```bash
# 1) 代码：git checkout 上一个 tag/commit，或恢复上一份部署包
# 2) 配置：drop-in 方式改的配置，回滚只需删掉 drop-in
sudo rm -f /etc/systemd/system/pfd-editor.service.d/10-deploy.conf \
           /etc/systemd/system/pfd-editor.service.d/20-hardening.conf
sudo systemctl daemon-reload && sudo systemctl restart pfd-editor
# 3) 数据：项目库在 /opt/pfd-editor/projects（或 compose 命名卷），回滚不影响
```

> ⚠️ 回滚到 v1.0.0 **之前**的版本会同时回滚安全修复（4 个 P0：路径穿越任意文件读取、
> 畸形 URI 致进程退出、项目库零鉴权、默认绑定 0.0.0.0）。若非必要不建议回滚到该版本之前。

## 十、前置 Nginx（压缩 / 缓存 / 限流，评估 A 项）

本服务器已在 8090 前置一层 nginx（容器只监听本机 18090），一次性解决四个审计条目：

| 审计条目 | 解决方式 |
|---|---|
| 性能 §1.2 静态资源零压缩 | `gzip`：`editor.js` 实测 188KB → 58KB（~69%） |
| 性能 §1.1 零缓存头 | 静态资源 `Cache-Control: public, max-age=31536000, immutable` |
| 性能 §3.4 无限流 | `limit_req`（/api 20r/s、/pfd-api 10r/s）+ `limit_conn`（50/ip） |
| API 契约 §2.1 实时接口不禁缓存 | `/api/*`、`/pfd-api/*` 强制 `Cache-Control: no-store` |

关键设计：**HTML（/editor /preview 等）设为 `no-cache`**，因为 `server.js` 会把
`PFD_API_TOKEN` 注入到 HTML，缓存会导致令牌轮换后页面拿到旧令牌。

配置文件：仓库 `deploy/nginx-pfd-editor.conf`（已部署到 `/etc/nginx/conf.d/pfd-editor.conf`）。

部署/回滚：
```bash
# 部署（需要 sudo）
sudo cp deploy/nginx-pfd-editor.conf /etc/nginx/conf.d/pfd-editor.conf
sudo nginx -t && sudo nginx -s reload
# 回滚：删掉该文件并 reload
sudo rm -f /etc/nginx/conf.d/pfd-editor.conf && sudo nginx -s reload
```

⚠️ 注意：前置 nginx 后，`server.js` 审计日志里的来源 IP 会变为 docker 网桥网关
（`172.x.0.1`）——真实来源 IP 请查 `/var/log/nginx/access.log`（或后续让 `server.js`
读 `X-Real-IP`，属仓库侧改动，见协作文件待办）。

## 十一、最小监控探针（评估 C 项）

每 1 分钟探测 `/healthz` `/readyz` `/api` 可用性，结果写 `/var/log/pfd-monitor.log`。

部署（需要 sudo）：
```bash
sudo install -m 0755 deploy/pfd-monitor.sh /usr/local/bin/pfd-monitor.sh
sudo cp deploy/pfd-monitor.service deploy/pfd-monitor.timer /etc/systemd/system/
sudo touch /var/log/pfd-monitor.log
sudo systemctl daemon-reload
sudo systemctl enable --now pfd-monitor.timer
```

查看：
```bash
systemctl list-timers pfd-monitor.timer   # 定时器
sudo tail /var/log/pfd-monitor.log        # 探针历史（all-ok / FAIL 行）
```

告警联动：脚本失败时退出码非 0，在 `deploy/pfd-monitor.sh` 末尾的 TODO 处接
webhook/邮件即可。
