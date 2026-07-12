---
key: l12-chaos
level: L12
title: 混沌工程与故障演练
lang: shell
objective: 理解混沌工程原则，能设计最小可行实验（MVE），用 Chaos Mesh / 手动注入验证系统韧性。
prereq: [l12-slo, l10-sshsec]
estimated_min: 38
sandbox: false
---

# 混沌工程与故障演练

## 概述：什么是混沌工程
混沌工程不是"随机搞破坏"，而是**在可控环境下，主动注入故障，验证系统是否如预期那样失败/恢复**，从而提前发现盲区。Netflix 的经典定义：在分布式系统上进行实验，建立对系统抵御失控条件能力的信心。

五大原则（PRINCIPLES OF CHAOS）：
1. 用稳定状态假设（如"成功率 > 99.9%"）衡量系统健康。
2. 真实反映生产环境的事件类型（不是造一个玩具故障）。
3. 在生产和类生产环境做（影子/引流也可，但越接近越可信）。
4. 持续自动化运行（一次演练 ≠ 永久可靠）。
5. 控制爆炸半径（最小可行实验 MVE，先小后大）。

## 怎么做
1. **手写最小实验（无需工具）**：先用手动方式验证，成本最低。
   ```bash
   # 在测试节点杀掉关键进程，看副本是否自动拉起
   ssh node-7 'pkill -9 myapp'        # 模拟进程崩溃
   # 观察：副本重建时间？请求是否短暂 5xx 飙升？
   ```
2. **注入网络故障（验证超时/重试）**：
   ```bash
   # 用 tc 模拟到依赖服务的 200ms 延迟 + 1% 丢包
   ssh node-7 "tc qdisc add dev eth0 root netem delay 200ms loss 1%"
   # 验证上游是否配置了合理超时与重试（而非雪崩）
   ssh node-7 "tc qdisc del dev eth0 root"
   ```
3. **用 Chaos Mesh（K8s 原生）做标准化实验**：
   ```yaml
   # kill pod 实验
   kubectl apply -f - <<'EOF'
   apiVersion: chaos-mesh.org/v1alpha1
   kind: PodChaos
   metadata: { name: kill-api }
   spec:
     action: pod-kill
     mode: one
     selector: { labelSelectors: { app: api } }
     scheduler: { cron: "@every 10m" }
   EOF
   ```
4. **对照 SLO 判定**：演练期间盯着 `l12-slo` 的 SLI，若突破 SLO/预算告警，说明韧性不足，回到架构改进。

## 常见坑
- **一上来就炸生产**：必须先小范围、可回滚、有止损按钮（"红钮"一键停实验）。
- **没有稳定状态假设**：只"跑了看日志"不算演练，必须有可量化的 SLI 阈值作判据。
- **只在测试环境做且一次就停**：环境差异会让结论失真；要持续、靠近生产。
- **把混沌当甩锅工具**：演练目的是发现系统弱点，不是证明某人是谁的责任。

## 小结
- 混沌工程 = 主动、可控、持续的故障注入，验证韧性。
- 先用手动 `ssh`/`tc` 做 MVE，再上 Chaos Mesh 标准化。
- 必须配合稳定状态假设（SLI/SLO）与一键止损。
- 进阶：自动化演练排程、与 `l12-oncall` 的演练值班联动。
