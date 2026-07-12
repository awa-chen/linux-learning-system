---
key: l12-gitops
level: L12
title: GitOps 与声明式发布闸门
lang: ansible
objective: 理解 GitOps 闭环（Git 为唯一真源 + 自动同步 + 漂移检测），能结合 Error Budget 实现"预算不足即阻断发布"。
prereq: [l12-budget, l9-node]
estimated_min: 40
sandbox: false
---

# GitOps 与声明式发布闸门

## 概述
GitOps：把**集群的期望状态**以声明式文件（YAML/Helm/Kustomize）存进 Git，由控制器（如 Argo CD / Flux）**持续把实际状态向 Git 对齐**，并检测漂移、自动回滚。Git 成为"唯一事实源"和"审计日志"。

相比传统 CI 推镜像到集群，GitOps 是**拉模型**：集群主动从 Git 拉取，凭据不出集群、变更可审查、回滚 = `git revert`。

与 SRE 的结合点：**发布闸门**。CI 在合并前读取 Error Budget（`l12-budget`）：
- 预算充足 ⇒ 自动合并 + 同步。
- 预算耗尽 ⇒ 阻断非豁免发布，强制先稳系统。

## 怎么做
1. **定义期望状态入 Git**：
   ```yaml
   # apps/api/deploy.yaml（Argo CD 追踪此路径）
   apiVersion: apps/v1
   kind: Deployment
   spec:
     replicas: 4
     template:
       spec:
         containers:
           - name: api
             image: registry/api:1.8.2
   ```
2. **Argo CD 接入并开启自动同步/自愈**：
   ```bash
   argocd app create api --repo <git> --path apps/api \
     --dest-server https://kubernetes.default.svc \
     --sync-policy automated --self-heal --prune
   argocd app get api     # 观察 SYNC STATUS / HEALTH
   ```
3. **CI 发布闸门读取预算**（伪代码）：
   ```bash
   BUDGET=$(curl -s $budget_api/remaining)   # 0~1
   if (( $(echo "$BUDGET < 0.1" | bc -l) )); then
     echo "Error Budget 不足，阻断发布"; exit 1
   fi
   git tag release/$(date +%Y%m%d) && git push
   ```
4. **漂移检测与回滚**：人为改了集群？Argo CD 标 `OutOfSync` 并据 `--self-heal` 拉回；事故时 `git revert` 即回滚。

## 常见坑
- **Git 不是唯一真源**：有人直接 `kubectl edit` 集群，导致漂移且 Git 失准。纪律：一切变更走 PR。
- **自动同步无审批裸奔**：生产应开 `--sync-policy` 但关键应用加 `sync-wave`/手动确认门。
- **闸门只看构建通过**：发布闸门必须接"业务风险（预算）"，而非仅单元测试绿。
- **Secret 进 Git 明文**：用 sealed-secrets / External Secrets，永不提交明文密钥。

## 小结
- GitOps = Git 为唯一真源 + 控制器拉式同步 + 漂移自愈。
- 比"CI 推集群"更安全可审，回滚即 `git revert`。
- 发布闸门接 Error Budget，让"稳系统 vs 发版"自动化决策。
- 进阶：渐进式交付（Argo Rollouts 金丝雀）与 `l12-oncall` 告警联动。
