---
key: l12-budget
level: L12
title: Error Budget 燃烧率告警与策略
lang: prometheus
objective: 掌握基于"燃烧率"（Burn Rate）的多窗口错误预算告警，理解 Error Budget Policy 的运作与发布闸门机制。
prereq: [l12-slo]
estimated_min: 35
sandbox: false
---

# Error Budget 燃烧率告警与策略

## 概述
SLO 告诉我们"目标多少"，但**怎么在预算快烧完时及时叫停**？靠"每日成功率 < 99.9%"这种单阈值告警太迟钝（要烧一整天才响）。SRE 用 **Burn Rate（燃烧率）** 解决：预算消耗速度 = 实际错误率 / (1 - SLO)。

- 燃烧率 = 1 ⇒ 匀速把一个月预算烧完（慢，但持续）。
- 燃烧率 = 14.4 ⇒ 2 小时烧光整月预算（快，必须立刻响应）。
- 核心思想：**既要在快速烧毁时立刻告警，也要避免慢速滴漏的噪声。**

## 怎么做
1. **多窗口多燃烧率告警（Google SRE 标准做法）**：对同一 SLO 同时设"长窗口+低燃烧率"和"短窗口+高燃烧率"两组，取 AND，显著降低误报。
   ```promql
   # 长窗口(1h)中等燃烧率
   (
     sum(rate(http_requests_total{code=~"5.."}[1h]))
     / sum(rate(http_requests_total[1h]))
   ) > (14.4 * (1 - 0.999))
   # AND 短窗口(5m)高燃烧率
   and
   (
     sum(rate(http_requests_total{code=~"5.."}[5m]))
     / sum(rate(http_requests_total[5m]))
   ) > (14.4 * (1 - 0.999))
   ```
2. **定义 Error Budget Policy（错误预算策略）**：写进文档，明确阈值动作：
   - 预算消耗 < 100%：正常迭代，可发版。
   - > 100% 或连续 N 天高燃烧：冻结非关键发布、成立稳定性专项。
   - 重大事后复盘（Postmortem）必做，且无追责（blameless）。
3. **把预算接进发布闸门**：CI/CD 在发版前读取预算剩余，预算不足时阻断或双签放行。

## 常见坑
- **只看单窗口**：1h 窗口 + 燃烧率 14.4 会在短时抖动反复误报；必须配 5m 高燃烧率窗口 AND。
- **告警不接动作**：有燃烧率告警却无"停发版"策略，等于没预算。预算的价值在"决策"而非"报警"。
- **复盘追责化**：Error Budget 前提是 blameless 文化，追责会让团队隐瞒事故、伪造指标。
- **SLO 阈值不合理导致预算永远满/空**：需随业务阶段调参，初期可放宽到 99.0% 观察真实波动。

## 小结
- 燃烧率告警 = 用"预算消耗速度"替代"是否越界"，响应更快、误报更低。
- 多窗口 AND 是工业级标准，不要只设单一阈值。
- Error Budget 必须配套 Policy + 发布闸门 + blameless 复盘，否则只是数字。
- 进阶：自动化预算看板、与 `l12-gitops` 的发布闸门联动。
