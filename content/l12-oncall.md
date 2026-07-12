---
key: l12-oncall
level: L12
title: On-Call 体系与无责事后复盘
lang: shell
objective: 掌握 On-Call 轮值设计、告警分级、Postmortem（无责复盘）模板与行动项闭环，建立可持续的运维文化。
prereq: [l12-budget, l12-chaos]
estimated_min: 35
sandbox: false
---

# On-Call 体系与无责事后复盘

## 概述：On-Call 不是"背锅"
On-Call 是让系统有人负责、事故有人响应的机制，但它的可持续前提是**不把人当防火墙**。好的 On-Call = 合理的负载 + 清晰的升级路径 + 无责（blameless）复盘。

配套三件套：
- **告警分级**：P0（影响核心，立即）、P1（重大，15min）、P2（需关注，次日）、P3（ informational）。避免"全员天天被 P0 轰炸"导致告警疲劳。
- **升级链（Escalation）**：一级未响应自动升级到二级/主管，防止"没人看见"。
- **Postmortem（事后复盘）**：事故后 24~48h 内产出，聚焦时间线 + 根因 + 行动项，**不追责个人**。

## 怎么做
1. **设计轮值与负载保护**：
   ```yaml
   # PagerDuty/Alertmanager 路由示例（伪配置）
   route:
     receiver: primary-oncall
     routes:
       - match: { severity: critical }
         receiver: primary-oncall
         continue: true
       - match: { severity: critical }
         receiver: manager-escalation
         routes: [{ repeat_interval: 15m }]   # 15min 未 ack 升级
   ```
2. **告警分级原则**：只对"用户可感知且需人干预"的事告警；可自愈的不叫人。
3. **Postmortem 模板**（无责）：
   ```markdown
   ## 事故: <标题>
   - 影响: <用户/收入/时长>
   - 时间线: <UTC 事件 + 动作>
   - 根因: <直接 + 深层(流程/架构)>
   - 行动项: <Who/What/When>，须可追踪
   - 教训: <系统而非个人>
   ```
4. **行动项闭环**：复盘产生的 TODO 进工单系统、设 owner 与截止日，下次复盘前回顾完成度。

## 常见坑
- **告警无分级**：所有事都 P0 ⇒ 没人看 P0。分级是 On-Call 可持续的命门。
- **复盘变批斗**：追责会让当事人隐瞒、伪造。blameless 是文化地基。
- **复盘无闭环**：写了 Postmortem 但行动项没人跟 ⇒ 同样事故重演。行动项必须进 tracker。
- **On-Call 无补偿/无脱产**：长期高负载致 burnout；需轮换、备班、事后补休。

## 小结
- On-Call 可持续 = 分级告警 + 升级链 + 轮值保护 + 无责复盘。
- 告警疲劳源于"不该叫人的也叫人"，分级过滤是关键。
- Postmortem 价值在行动项闭环，而非写文档本身。
- 进阶：SLO 驱动的告警（只对"消耗预算的 SLI 越界"告警）、与 `l12-gitops` 闸门联动。
