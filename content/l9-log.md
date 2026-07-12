---
key: l9-log
level: L9
title: 日志体系：rsyslog、journald、logrotate 与集中式思路
lang: shell
objective: 理解系统日志两条线（rsyslog/journald），掌握 logrotate 轮转，建立集中式日志收集思路
prereq: [l9-node]
estimated_min: 45
sandbox: false
---

# 日志体系：rsyslog、journald、logrotate 与集中式思路

## 讲解

指标（L9-node）看趋势，日志看「当时到底发生了什么」。本课补齐可观测性的第三根支柱——**日志**。

现代 Linux 有两条并行的系统日志线：
- **journald（systemd-journald）**：systemd 自带的二进制日志，存 `/run/log/journal`（内存/磁盘）。`journalctl` 是它的查询入口，支持按服务/时间/优先级过滤，如 `journalctl -u nginx -p err --since "1 hour ago"`。优点是结构化、和 unit 强绑定；缺点是二进制格式，跨机分析不便。
- **rsyslog**：传统 syslog 守护进程，按 `facility.priority` 规则把日志写到 `/var/log/*.log`（如 `auth.log`、`syslog`）。可配置把日志**转发**到远程日志服务器（集中式的关键）。很多发行版两者并存：journald 收，rsyslog 从 journal 取并落盘/转发。

还有个绕不开的配角 **logrotate**：日志会无限增长撑爆磁盘，logrotate 按日/周/大小轮转、压缩、保留 N 份、轮完可 reload 服务。配置在 `/etc/logrotate.d/`。

集中式思路：单机 `tail` 在 100 台机器时不现实。业界用 **ELK（Elasticsearch+Logstash+Kibana）/ Loki / 或 Promtail+Loki+Grafana**——各机 agent 把日志推到中心，统一检索。本课建立思路，具体栈可在真实环境搭。

> 沙盒说明：journald/rsyslog 是系统级服务且与真实 unit 绑定，无法在命令模拟器复现，故 `sandbox:false`，请在真实环境练习。

## 动手实验

1. **用 journalctl 查服务日志**：
   ```bash
   journalctl -u nginx -p err --since "2 hours ago"   # 看 nginx 近 2 小时错误
   journalctl -f -u docker                            # 实时跟随（类似 tail -f）
   ```

2. **看传统 syslog 落盘文件**：
   ```bash
   ls -lh /var/log/          # 常见：syslog, auth.log, kern.log
   sudo tail -n 20 /var/log/auth.log   # 看登录/认证相关
   ```

3. **配置 rsyslog 转发到远程（集中式第一步）**，在 `/etc/rsyslog.d/10-forward.conf`：
   ```bash
   *.* @@logserver.example.com:514   # @@ = TCP，@ = UDP
   ```
   ```bash
   sudo systemctl restart rsyslog
   ```

4. **写一条 logrotate 规则** `/etc/logrotate.d/myapp`：
   ```bash
   /var/log/myapp/*.log {
       daily
       missingok
       rotate 14
       compress
       delaycompress
       notifempty
       sharedscripts
       postrotate
           systemctl reload myapp > /dev/null 2>&1 || true
       endscript
   }
   ```
   ```bash
   sudo logrotate -d /etc/logrotate.d/myapp   # 演练（dry-run，不真转）
   sudo logrotate -f /etc/logrotate.d/myapp   # 强制立即轮转验证
   ```

5. **（思路）用 Promtail+Loki 接入 Grafana**：
   在每台机装 Promtail 读 `/var/log/*.log` 与 journal，推到 Loki，Grafana 加 Loki 数据源统一查——与 L9-node 的看板同一入口。

## 常见错误

1. **`journalctl` 没历史（重启丢日志）**：默认 journal 可能只存内存（`Storage=volatile`）。改 `/etc/systemd/journald.conf` 设 `Storage=persistent` 并 `mkdir -p /var/log/journal && systemctl restart systemd-journald`。
2. **磁盘被日志写满（`No space left`）**：忘了配 logrotate 或规则未触发。`df -h /var/log` 排查；确认 logrotate 的 cron/系统 timer 在跑（`systemctl status logrotate.timer`）。
3. **rsyslog 转发不生效**：远程 514 端口被防火墙挡，或用了 `@@`(TCP) 但服务端只收 UDP。先用 `nc -vz logserver 514` 测连通；本机 `logger -p local0.info "test"` 后查远端是否收到。
4. **logrotate 轮完服务仍写旧文件**：轮转后文件被改名但进程还握着旧 fd。务必在 `postrotate` 里 `reload`/`kill -HUP` 让服务重新打开日志文件（或用 `copytruncate` 方案）。

## 小结

- 系统日志两条线：journald（二进制、按 unit、用 `journalctl` 查）+ rsyslog（文本、落盘 `/var/log`、可转发集中）。
- logrotate 是防磁盘爆的刚需：按大小/时间轮转压缩，轮完 reload 服务。
- 进阶指引：把指标（Prometheus）、告警（Alertmanager）、日志（Loki/ELK）三路汇入 Grafana，你就拥有了完整的可观测性体系——这也是 L9 的里程碑。
