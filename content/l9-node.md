---
key: l9-node
level: L9
title: Prometheus + node_exporter + Grafana 监控部署
lang: prometheus
objective: 部署 node_exporter 采集主机指标，搭建 Prometheus 拉取与存储，用 Grafana 出看板
prereq: [l7-docker]
estimated_min: 55
sandbox: false
---

# Prometheus + node_exporter + Grafana 监控部署

## 讲解

L9 是「把系统看住」的一关。核心三角：**采集（exporter）→ 存储/查询（Prometheus）→ 展示（Grafana）**。

- **node_exporter**：跑在被监控机上，把 CPU/内存/磁盘/网络等指标以 HTTP 接口（`/metrics`）暴露成文本。一个 `node_exporter` 负责一台主机。
- **Prometheus**：时序数据库 + 拉取（pull）模型。它按 `scrape_interval` 主动去各 exporter 的 `/metrics` 拉数据，存进自己的 TSDB。配置写在 `prometheus.yml` 的 `scrape_configs` 里，用 `job_name` + `static_configs.targets` 列出目标。查询语言是 **PromQL**，如 `rate(node_cpu_seconds_total[5m])`。
- **Grafana**：把 Prometheus 当数据源，用仪表盘（Dashboard）把指标画成图。官方社区有大量现成 Dashboard（如 Node Exporter Full，ID 1860），导入即用。

思维转变：从「出问题去翻日志」变成「指标持续在收集，仪表盘实时可见，告警主动找你」。本课把 L7 的 Docker 环境利用起来——整套监控栈都能容器化部署。

> 沙盒说明：Prometheus 的 `promtool` 校验、真实拉取都依赖运行中的服务，无法在纯命令模拟器里完成，故本课 `sandbox:false`，请在真实/容器环境练习。

## 动手实验

1. **部署 node_exporter（容器方式）**：
   ```bash
   docker run -d --name node_exporter -p 9100:9100 \
     prom/node-exporter:latest
   curl -s http://localhost:9100/metrics | grep -E "^node_cpu|^node_memory" | head
   ```

2. **写 `prometheus.yml`**：
   ```yaml
   global:
     scrape_interval: 15s
   scrape_configs:
     - job_name: "node"
       static_configs:
         - targets: ["192.168.1.11:9100", "192.168.1.12:9100"]
     - job_name: "prometheus"
       static_configs:
         - targets: ["localhost:9090"]
   ```

3. **启动 Prometheus（挂载配置）**：
   ```bash
   docker run -d --name prometheus -p 9090:9090 \
     -v $PWD/prometheus.yml:/etc/prometheus/prometheus.yml \
     prom/prometheus:latest
   # 浏览器打开 http://localhost:9090 → Status → Targets 看目标是否 UP
   ```

4. **用 PromQL 查询**（在 9090 的 Graph 页）：
   ```promql
   rate(node_cpu_seconds_total{mode="idle"}[5m])
   node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes * 100
   ```

5. **部署 Grafana 并加数据源**：
   ```bash
   docker run -d --name grafana -p 3000:3000 grafana/grafana:latest
   ```
   登录 `http://localhost:3000`（默认 admin/admin）→ Connections → Data sources → Add Prometheus → URL 填 `http://prometheus:9090`（同网络用服务名）或 `http://宿主机IP:9090`。

6. **导入 Node Exporter 看板**：
   Grafana → Dashboards → Import → 输入 Dashboard ID `1860` → 选 Prometheus 数据源 → Load。即可看到 CPU/内存/磁盘/网络全量图表。

## 常见错误

1. **Prometheus Targets 显示 DOWN**：网络不通或 exporter 没起。先 `curl http://目标:9100/metrics` 确认可达；容器跨主机注意防火墙放 9100。同 docker 网络内用容器名/服务名而非 `localhost`。
2. **Grafana 连不上 Prometheus（`Bad Gateway` / 连接拒绝）**：数据源 URL 填错。Grafana 容器访问宿主机 Prometheus 不能用 `localhost`（那是 Grafana 自己），要用宿主机真实 IP 或把两者放同一 `docker network`。
3. **`prometheus.yml` 缩进错导致启动失败**：YAML 严格缩进，且 `scrape_configs` 下 `- job_name` 的横线不能省。改完用 `docker logs prometheus` 看具体报错行，或用 `promtool check config prometheus.yml` 校验。
4. **指标查出来是空/老数据**：确认 `scrape_interval` 与查询的时间范围（Grafana 右上角时间选择器）覆盖拉取周期；刚启动需等一个 interval 才有数据。

## 小结

- 监控三件套：node_exporter 采集 → Prometheus 拉取存储（PromQL 查询）→ Grafana 可视化。
- 配置核心是 `prometheus.yml` 的 `scrape_configs`；容器化部署最省心。
- 进阶指引：下一课用 Alertmanager 让异常主动告警，而不是等你盯着看板。
