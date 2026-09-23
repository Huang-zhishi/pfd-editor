#!/usr/bin/env bash
# ============================================================
# PFD Editor · 最小监控探针（评估-服务器侧可承接条目 · C 项）
#   用途：周期探测 /healthz /readyz 与 /api 后端代理可用性，
#         结果追加到日志；失败时退出非 0（便于 systemd/告警联动）。
#   部署：见 deploy/pfd-monitor.service + pfd-monitor.timer
#   日志：/var/log/pfd-monitor.log
#   告警：失败时退出码非 0；可在此基础上接 webhook/邮件（见脚本末尾 TODO）
# ============================================================
set -uo pipefail

B="${PFD_MONITOR_URL:-http://127.0.0.1:8090}"
TS="$(date '+%Y-%m-%d %H:%M:%S')"
LOG="${PFD_MONITOR_LOG:-/var/log/pfd-monitor.log}"
ok=1

# 存活探针
if ! curl -fsS --max-time 5 "$B/healthz" >/dev/null 2>&1; then
  echo "$TS healthz FAIL" >>"$LOG"; ok=0
fi

# 就绪探针（含项目库目录可写检查）
if ! curl -fsS --max-time 5 "$B/readyz" >/dev/null 2>&1; then
  echo "$TS readyz FAIL" >>"$LOG"; ok=0
fi

# 后端代理可用性：200=正常，502=后端不可达，503=未配置 API_TARGET
code=$(curl -s --max-time 5 -o /dev/null -w '%{http_code}' "$B/api/sensors/values?limit=1")
if [ "$code" != "200" ]; then
  echo "$TS api FAIL code=$code" >>"$LOG"; ok=0
fi

# 全部通过也记一行，便于统计可用率
if [ "$ok" = "1" ]; then
  echo "$TS all-ok" >>"$LOG"
fi

# TODO(告警)：失败时在此追加通知（邮件 / IM webhook）。示例：
#   if [ "$ok" != "1" ]; then
#     curl -fsS -X POST 'https://<webhook>' -H 'Content-Type: application/json' \
#       -d '{"text":"PFD Editor 探针失败，请检查"}'
#   fi

exit $((1 - ok))
