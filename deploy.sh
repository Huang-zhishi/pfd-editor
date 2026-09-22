#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# PFD Editor · Ubuntu 24 一键部署脚本
# ------------------------------------------------------------
# 用法：把 deploy.sh 与 pfd-editor-ubuntu24.tar.gz 放到服务器同一目录，
#       然后执行：  sudo bash deploy.sh
# ============================================================

# ---------------- 配置区（按需修改这一块即可） ----------------
APP_NAME="pfd-editor"
APP_DIR="/opt/${APP_NAME}"
PORT=8090
# 后端传感器服务地址：后端已部署在本机时，改成实际监听端口。
#   Spring Boot 常见 8080；若后端在 80 端口则写 http://127.0.0.1
API_TARGET="http://127.0.0.1:8080"
TARBALL="pfd-editor-ubuntu24.tar.gz"
# --------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TAR_PATH="${SCRIPT_DIR}/${TARBALL}"
UNIT_NAME="${APP_NAME}.service"
UNIT_PATH="/etc/systemd/system/${UNIT_NAME}"

# 运行服务的系统用户：有 sudo 则用原登录用户，否则 root
if [ -n "${SUDO_USER:-}" ]; then RUN_USER="${SUDO_USER}"; else RUN_USER="root"; fi

echo "============================================================"
echo " PFD Editor 部署"
echo "   目录     : ${APP_DIR}"
echo "   端口     : ${PORT}"
echo "   后端 API : ${API_TARGET}"
echo "   运行用户 : ${RUN_USER}"
echo "============================================================"

# 1. 检测/安装 Node.js
echo "==> [1/5] 检测 Node.js"
# 审计 10.6：apt 仓库的 nodejs 版本随发行版变化（Ubuntu 24 为 18.x），
# 与镜像的 node:20、.nvmrc 的 20 不一致。改为安装 NodeSource 的 20.x。
NODE_MAJOR_REQUIRED=20
need_install=1
if command -v node >/dev/null 2>&1; then
  cur="$(node -v | sed 's/^v\([0-9]*\).*/\1/')"
  if [ "$cur" = "$NODE_MAJOR_REQUIRED" ]; then
    echo "    已安装 Node $(node -v)，符合要求"
    need_install=0
  else
    echo "    当前 Node 大版本为 ${cur}，与要求 ${NODE_MAJOR_REQUIRED} 不一致，将安装 ${NODE_MAJOR_REQUIRED}.x"
  fi
fi
if [ "$need_install" = "1" ]; then
  echo "    通过 NodeSource 安装 Node.js ${NODE_MAJOR_REQUIRED}.x ..."
  sudo apt-get update -y
  sudo apt-get install -y ca-certificates curl gnupg
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR_REQUIRED}.x" | sudo -E bash -
  sudo apt-get install -y nodejs
fi
NODE_BIN="$(command -v node)"
echo "    Node $("${NODE_BIN}" -v) @ ${NODE_BIN}"

# 2. 校验部署包
echo "==> [2/5] 校验部署包"
if [ ! -f "${TAR_PATH}" ]; then
  echo "    错误：找不到 ${TAR_PATH}"
  echo "    请确认 deploy.sh 与 ${TARBALL} 在同一目录。"
  exit 1
fi

# 3. 解压
echo "==> [3/5] 解压到 ${APP_DIR}"
sudo mkdir -p "${APP_DIR}"
sudo tar -xzf "${TAR_PATH}" -C "${APP_DIR}"

# 4. 写入 systemd 服务
echo "==> [4/5] 写入 systemd 服务 ${UNIT_NAME}"
sudo tee "${UNIT_PATH}" >/dev/null <<EOF
[Unit]
Description=PFD Editor (工艺流程组态编辑器)
After=network.target

[Service]
Type=simple
User=${RUN_USER}
WorkingDirectory=${APP_DIR}
Environment=PORT=${PORT}
# server.js 默认只监听 127.0.0.1（审计 3.2）；本脚本用于对外提供访问，显式放开
Environment=HOST=0.0.0.0
# 项目库接口鉴权令牌（可选，留空=不鉴权）。对外暴露时建议设置强随机串
Environment=PFD_API_TOKEN=${PFD_API_TOKEN:-}
Environment=API_TARGET=${API_TARGET}
ExecStart=${NODE_BIN} ${APP_DIR}/server.js
Restart=on-failure
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload

# 5. 防火墙放行 + 启动
echo "==> [5/5] 防火墙放行 + 启动"
if command -v ufw >/dev/null 2>&1 && sudo ufw status 2>/dev/null | grep -q "Status: active"; then
  sudo ufw allow "${PORT}/tcp" >/dev/null && echo "    ufw 已放行 ${PORT}/tcp"
else
  echo "    未启用 ufw（若用云安全组，请手动放行 ${PORT}/tcp）"
fi

sudo systemctl enable "${UNIT_NAME}" >/dev/null 2>&1
sudo systemctl restart "${UNIT_NAME}"

echo "============================================================"
echo " 部署完成"
echo "   编辑器   : http://<服务器IP>:${PORT}/editor"
echo "   预览     : http://<服务器IP>:${PORT}/preview"
echo "   导出示例 : http://<服务器IP>:${PORT}/demo"
echo "------------------------------------------------------------"
echo " 常用命令："
echo "   systemctl status ${UNIT_NAME}   # 查看状态"
echo "   journalctl -u ${UNIT_NAME} -f   # 跟踪日志"
echo "   systemctl restart ${UNIT_NAME}  # 重启"
echo "============================================================"
