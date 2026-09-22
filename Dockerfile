# ============================================================
# PFD Editor · Docker 部署镜像
#   零 npm 依赖：直接用 node 官方镜像运行 server.js
# 构建：docker build -t pfd-editor .
# 运行：
#   docker run -d --name pfd-editor -p 8090:8090 \
#     -e API_TARGET=http://192.168.x.x \
#     pfd-editor
# ============================================================
FROM node:20-alpine

WORKDIR /app

# 项目无 package.json / node_modules，直接复制全部静态资源与 server.js
COPY . .

# 以非 root 用户运行（安全实践）；projects 目录需对 pfd 可写，否则项目库保存会 ENOENT/EACCES
RUN addgroup -S pfd && adduser -S pfd -G pfd \
    && mkdir -p /app/projects \
    && chown -R pfd:pfd /app/projects
USER pfd

ENV PORT=8090
# server.js 默认只监听 127.0.0.1（审计 3.2）；容器内必须监听 0.0.0.0 才能通过端口映射访问
ENV HOST=0.0.0.0
ENV API_TARGET=http://192.168.1.78
# 建议启用：容器通常对外暴露，未设置令牌时项目库接口对同网段任何人可读写删
# ENV PFD_API_TOKEN=change-me

EXPOSE 8090

CMD ["node", "server.js"]
