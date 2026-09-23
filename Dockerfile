# ============================================================
# PFD Editor · Docker 部署镜像
#   零 npm 依赖：直接用 node 官方镜像运行 server.js
# 构建：docker build -t pfd-editor .
# 运行：
#   docker run -d --name pfd-editor -p 8090:8090 \
#     -e API_TARGET=http://192.168.x.x \
#     pfd-editor
# ============================================================
# 审计 3.1：基础镜像已固定 index digest（多架构，12 平台）。
#   digest 获取方式：通过镜像加速站 docker.m.daocloud.io 拉取 index manifest 并校验
#   Docker-Content-Digest 与本地 sha256 一致后固化。
#   .github/dependabot.yml 已配置 docker 生态跟踪，会自动提升级 PR。
FROM node:20-alpine@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293

WORKDIR /app

# 审计 8.5：白名单式 COPY —— 原来 `COPY . .` 会把 doc/（含审计文档）、projects/（业务数据）、
# 各类日志与临时产物一起打进镜像。这里只复制运行必需文件。
COPY server.js ./
COPY templates.js editor.js editor.html preview.html embed-demo.html demo-template.json shared.css ./
COPY templates ./templates

# 以非 root 用户运行（安全实践）；projects 目录需对 pfd 可写，否则项目库保存会 ENOENT/EACCES
RUN addgroup -S pfd && adduser -S pfd -G pfd \
    && mkdir -p /app/projects \
    && chown -R pfd:pfd /app/projects
USER pfd

ENV PORT=8090
# server.js 默认只监听 127.0.0.1（审计 3.2）；容器内必须监听 0.0.0.0 才能通过端口映射访问
ENV HOST=0.0.0.0
# 审计 8.3：不再把内网地址烘焙进镜像（原来 ENV API_TARGET=http://192.168.1.78），
# 运行时通过 docker run -e / compose environment 注入。
# 未设置时 /api/* 会返回 503 并提示配置 API_TARGET。
ENV API_TARGET=
# 建议启用：容器通常对外暴露，未设置令牌时项目库接口对同网段任何人可读写删
# ENV PFD_API_TOKEN=change-me

EXPOSE 8090

# 审计 8.2：健康探针。使用 node 内置 fetch（Node 18+），无需额外工具，
# 命中 server.js 新增的 /healthz 端点；start-period 给足启动时间。
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8090)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
