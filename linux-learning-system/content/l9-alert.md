---
key: l9-alert
level: L9
title: Alertmanager：告警路由与 Webhook 通知
lang: prometheus
objective: 理解 PromQL 告警规则，配置 Alertmanager 分组/静默/路由，并用 Webhook 接通知渠道
prereq: [l9-node]
estimated_min: 50
sandbox: false
---

# Alertmanager：告警路由与 Webhook 通知

## 讲解

监控不告警 = 瞎子点灯。本课在 L9-node 的 Prometheus 之上加 **Alertmanager**，把「指标异常」变成「人能收到的通知」。

两条链路要分清：
- **告警规则（Prometheus 侧）**：在 `rules/*.yml` 里写 PromQL + 阈值 + `for` 持续时间。例如「内存可用率 < 10% 持续 2 分钟」就触发 `HighMemoryUsage` 告警。Prometheus 评估规则，触发后把告警**推给** Alertmanager。
- **告警处理（Alertmanager 侧）**：负责「收到告警后怎么办」——**分组（group_by）** 把同类告警合并、**抑制（inhibit_rules）** 避免雪崩式重复、**路由（route）** 按标签分到不同接收端、**静默（silence）** 维护时免打扰。接收端支持邮件、Slack、钉钉，以及最灵活的 **Webhook**（一个 HTTP POST，把告警 JSON 推给你自己的服务，你再转发到任意渠道）。

思维转变：监控是「看见」，告警是「被通知」。好告警系统追求**高信噪比**——该响的响，不重要的别刷屏。

> 沙盒说明：Alertmanager 的路由与 Webhook 需真实服务联动，无法在命令模拟器完成，故 `sandbox:false`，请在真实环境练习。

## 动手实验

1. **写告警规则 `rules/node.yml`**：
   ```yaml
   groups:
     - name: node_alerts
       rules:
         - alert: HighMemoryUsage
           expr: (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100 < 10
           for: 2m
           labels: { severity: warning }
           annotations:
             summary: "内存可用率低于 10%（{{ $labels.instance }}）"
         - alert: NodeDown
           expr: up == 0
           for: 1m
           labels: { severity: critical }
           annotations:
             summary: "节点失联：{{ $labels.instance }}"
   ```

2. **在 `prometheus.yml` 里挂规则**：
   ```yaml
   rule_files: ["/etc/prometheus/rules/*.yml"]
   alerting:
     alertmanagers:
       - static_configs:
           - targets: ["alertmanager:9093"]
   ```

3. **写 `alertmanager.yml`**（路由 + Webhook 接收端）：
   ```yaml
   route:
     receiver: webhook
     group_by: ['alertname', 'instance']
     group_wait: 30s
     group_interval: 5m
     repeat_interval: 4h
   receivers:
     - name: webhook
       webhook_configs:
         - url: "http://192.168.1.30:5000/alert"
   ```

4. **启动 Alertmanager（容器）**：
   ```bash
   docker run -d --name alertmanager -p 9093:9093 \
     -v $PWD/alertmanager.yml:/etc/alertmanager/alertmanager.yml \
     prom/alertmanager:latest
   ```

5. **最小 Webhook 接收端（Python，验证推送）**：
   ```python
   from http.server import BaseHTTPRequestHandler, HTTPServer
   class H(BaseHTTPRequestHandler):
       def do_POST(self):
           n = int(self.headers.get('Content-Length', 0))
           print("ALERT:", self.rfile.read(n).decode())
           self.send_response(200); self.end_headers()
   HTTPServer(('0.0.0.0', 5000), H).serve_forever()
   ```

6. **在 Alertmanager UI 建静默**（维护窗口）：
   打开 `http://localhost:9093` → Silences → New Silence → 按 `instance` 或 `alertname` 匹配 → 设时间段 → Create。

## 常见错误

1. **告警一直 `PENDING` 不 `FIRING`**：漏了 `for` 持续时间，或 PromQL 算出来根本没超阈值。在 Prometheus UI 的 Alerts 页看状态；先在 Graph 里跑一遍 `expr` 确认数值。
2. **Prometheus 连不上 Alertmanager（告警不发）**：`alerting.alertmanagers.targets` 里的地址在容器网络内要用服务名（如 `alertmanager:9093`）而非 `localhost`。`docker logs prometheus` 看连接报错。
3. **Webhook 收不到 / 429**：接收端服务没起或返回非 2xx。Alertmanager 会重试；确保 Webhook 服务返回 200，且能处理并发 POST。
4. **告警刷屏（噪声）**：没配 `group_by`/`group_wait` 或阈值太敏感。用 `group_by` 合并，用 `inhibit_rules` 抑制「因 NodeDown 引发的连带告警」，调高 `for` 过滤抖动。

## 小结

- 告警分两段：Prometheus 规则（写 PromQL+阈值+for）负责「判是否异常」；Alertmanager 负责「通知谁、怎么合并、何时静默」。
- Webhook 是最灵活的接收端，把告警 JSON POST 给你的服务，再转发任意渠道。
- 进阶指引：下一课补齐监控的最后一环——日志（rsyslog/journald/logrotate 与集中式思路）。
