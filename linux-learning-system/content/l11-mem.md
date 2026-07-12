---
key: l11-mem
level: L11
title: 内存观测与 OOM 调优（free / vmstat / OOM）
lang: shell
objective: 用 free/vmstat 判断内存压力，理解 OOM 机制与 oom_score_adj 保护关键进程
prereq: []
estimated_min: 30
sandbox: false
---

# 内存观测与 OOM 调优（free / vmstat / OOM）

## 讲解
内存瓶颈同样用 USE：利用率（已用/可用）、饱和度（swap 用量、是否开始回收）、错误（OOM）。关键概念：
- **available**（free 输出）：真正"立刻可用"的内存，比 `free` 列更准（含可回收的 page cache）。
- **swap**：当 available 见底，内核把不活跃页换到磁盘，swap 使用量上升 = 内存压力信号；若 si/so（vmstat）持续非零，说明在频繁换入换出，性能骤降。
- **OOM Killer**：内存彻底耗尽时内核挑"最该杀"的进程回收内存。选择依据是 `oom_score`（与进程占用内存成正比），可写 `/proc/<pid>/oom_score_adj`（-1000 表示永不被杀，保护关键进程如数据库）。

> 三条线：free 看总量、vmstat 看变化趋势（si/so/free 列）、`dmesg -T | grep -i oom` 看是否发生过 OOM。

## 动手实验
1. **看内存总量与可用**：
   ```bash
   free -h                 # -h 人类可读；重点看 available 列
   cat /proc/meminfo | head -5
   ```
2. **看内存压力趋势（swap 换入换出）**：
   ```bash
   vmstat 1 5              # si/so 非 0 表示在换页；free 列持续下降=吃紧
   ```
3. **制造内存压力并观察 OOM（练习机专用，先保存工作）**：
   ```bash
   # 用 stress-ng 申请大内存
   sudo dnf install -y stress-ng
   stress-ng --vm 1 --vm-bytes 90% --vm-hang 0 &
   vmstat 1 5
   dmesg -T | grep -i "out of memory"     # 若真 OOM 会有记录
   ```
4. **保护关键进程不被 OOM 杀掉**：
   ```bash
   PID=$(pgrep -f mysqld | head -1)
   echo -1000 | sudo tee /proc/$PID/oom_score_adj   # -1000=永不被杀
   cat /proc/$PID/oom_score_adj
   ```
5. **调全局 OOM 倾向（可选）**：
   ```bash
   # 0=保守(宁可杀少)  1/2=更激进回收; 默认 0
   cat /proc/sys/vm/overcommit_memory
   ```

## 常见错误
- **只看 free 列忽略 available**：free 列小可能只是 page cache 占着，available 才反映真实可用；误判"内存不够"。
- **swap 用了就慌**：偶发 swap 正常（内核回收冷页）；只有 si/so 持续非零才说明真不够。
- **盲目调 swappiness=0**：设为 0 并不总是更快，数据库场景可设 1~10 减少换出，但不要直接禁 swap（禁了 OOM 风险更高）。
- **oom_score_adj 写非 root**：需 root 才能改别的进程；且进程重启后失效，应写进 service 文件（`OOMScoreAdjust=`）。

## 小结
- 内存看 available（真可用）、vmstat 看 si/so（换页=压力）、dmesg 看 OOM 历史。
- 关键进程用 `oom_score_adj=-1000` 保护；别直接关 swap。
- 进阶：`/proc/sys/vm/swappiness`、`vmtouch` 预热缓存、`cgroup` 内存限额。
