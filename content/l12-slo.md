---
key: l12-slo
level: L12
title: SLO/SLI/Error Budget 理论与实践
lang: prometheus
objective: 理解 SLI/SLO/Error Budget 的关系，能基于真实指标定义可度量的 SLO，并用 PromQL 计算 SLI。
prereq: [l11-bench, l9-alert]
estimated_min: 40
sandbox: false
---

# SLO/SLI/Error Budget 理论与实践

## 概述：为什么需要 SLO
事故无法归零，工程的目标不是"100% 可用"，而是"在可接受的风险下，把可靠性投入到最有价值的地方"。SLO（Service Level Objective，服务质量目标）就是把"可靠"变成**可协商、可度量**的数字契约。

三个核心概念：
- **SLI（Service Level Indicator）**：实际测量值，如成功率、延迟、吞吐。必须是可采集的真指标。
- **SLO**：对 SLI 的目标阈值，如"99.9% 的请求 P99 < 300ms"。是给"内部/用户"的承诺，不是对外的 SLA。
- **Error Budget（错误预算）**：`1 - SLO` 的容忍空间。99.9% 的 SLO ⇒ 每月允许 ~43 分钟不可用。预算消耗越快，越要暂停变更、优先稳定性。

> 关键心智：SLO 不是性能 KPI，而是**风险预算**。它用来决定"这周能不能发版、该不该还技术债"。

## 怎么做
1. **选对 SLI（用户可感知的）**：
   - 成功率：`sum(rate(http_requests_total{code!~"5.."}[5m])) / sum(rate(http_requests_total[5m]))`
   - 延迟（P99）：`histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))`
   - 新鲜度（如数据管道）：`time() - pipeline_last_success_timestamp`
2. **定义 SLO 窗口与阈值**（28 天滚动是 Google SRE 推荐起点）：
   ```yaml
   # 以 Prometheus rule 表达 SLO 目标（示例）
   - record: job:slo_success_ratio:ratio_rate5m
     expr: |
       sum(rate(http_requests_total{job="api",code!~"5.."}[5m]))
       / sum(rate(http_requests_total{job="api"}[5m]))
   ```
3. **算 Error Budget 剩余**：
   ```promql
   # 过去 28 天实际成功率
   avg_over_time(job:slo_success_ratio:ratio_rate5m[28d])
   # 与 SLO 目标(0.999)的差，即预算消耗比率
   1 - avg_over_time(job:slo_success_ratio:ratio_rate5m[28d]) / 0.999
   ```
4. **把 SLO 写进错误预算策略（Error Budget Policy）**：规定预算耗尽时的动作（停发版、冻结功能、复盘），并明确"预算充足时可大胆迭代"。

## 常见坑
- **SLI 选了用户无感的指标**：监控 CPU 而非"请求成功率"，SLO 好看系统却挂了。SLI 必须对应真实用户体验。
- **SLO 定 100%**：等于没有预算，团队永远在救火又永远不敢动。Google 经验值多为 99.9%~99.95%。
- **把 SLO 当 SLA 对外承诺**：SLA 带违约赔偿，需法务参与；SLO 是内部工程目标，二者阈值通常不同。
- **窗口太短导致噪声**：用 1 天窗口会让单日抖动误触发；28 天滚动更稳。

## 小结
- SLO = 用数字管理"可靠性风险预算"，不是追求 100%。
- 好 SLI 必须可测量、且对用户可感知；PromQL 是落地 SLI 的利器。
- Error Budget 的真正价值：给"发版 vs 稳系统"提供客观决策依据。
- 进阶：Burn-Rate 告警（见 `l12-budget`）、混沌演练（见 `l12-chaos`）。
