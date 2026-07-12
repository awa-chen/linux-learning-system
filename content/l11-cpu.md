---
key: l11-cpu
level: L11
title: CPU 性能观测（top / mpstat / pidstat / 负载）
lang: shell
objective: 用 USE 方法定位 CPU 瓶颈，掌握负载含义与 mpstat/pidstat 进程级分析
prereq: []
estimated_min: 30
sandbox: true
---

# CPU 性能观测（top / mpstat / pidstat / 负载）

## 讲解
CPU 调优遵循 **USE 方法**（Utilization 利用率、Saturation 饱和度、Errors 错误）。先看整体利用率和负载，再下钻到具体进程。核心指标：
- **利用率**：CPU 忙的时间占比，`top` 里的 `%Cpu(s)`、`mpstat` 的 `%usr/%sys`。
- **饱和度**：排队等待 CPU 的进程数，用 **负载（load average）** 衡量——1/5/15 分钟平均"可运行+不可中断"进程数。经验值：load ≈ 核数 算饱和，>核数 说明在排队。
- **错误**：通常靠硬件计数器/内核日志，命令行少见。

工具分工：`top` 看实时全局；`mpstat -P ALL` 看每个核；`pidstat -u` 看每个进程的 CPU 占用；`uptime`/`cat /proc/loadavg` 看负载趋势。

> sysstat 包提供 mpstat/pidstat/iostat，RHEL 系 `dnf install -y sysstat`，Debian 系 `apt install -y sysstat`。

## 动手实验
1. **看实时全局与负载**：
   ```bash
   uptime                 # 看 1/5/15 分钟负载
   top -b -n1 | head -20  # 非交互模式抓一屏
   ```
2. **逐个 CPU 核利用率（排查"单核跑满"）**：
   ```bash
   mpstat -P ALL 1 3       # 每核每秒采样，共 3 次
   # %usr 用户态 / %sys 内核态 / %iowait 等；iowait 高见 l11-io
   ```
3. **进程级 CPU 占用（找吃 CPU 的进程）**：
   ```bash
   pidstat -u 1 3          # 每进程每秒采样 3 次
   pidstat -u -p ALL 1 2   # 等价更全
   ```
4. **制造一个 CPU 压力并观察负载变化**（另开终端对比）：
   ```bash
   # 终端 A：占满 1 个核 30 秒
   taskset -c 0 yes > /dev/null &
   # 终端 B：观察
   watch -n1 'uptime; mpstat -P ALL 1 1'
   # 结束：kill %1
   ```

## 常见错误
- **把 load average > 核数 当成一定异常**：短时尖峰正常；看 15 分钟值是否在趋势下降。容器里 load 含宿主机进程，需结合 cgroup 限额看。
- **top 里 %Cpu 看的是全核平均**：单核瓶颈要看 `mpstat -P ALL`，否则掩盖问题。
- **iowait 高误判为 CPU 不够**：其实是磁盘/IO 在等（见 l11-io），加 CPU 无效。
- **mpstat/pidstat 命令找不到**：没装 sysstat。解决：`dnf/apt install sysstat`。

## 小结
- USE：利用率（%usr/%sys）、饱和度（load≈核数即饱和）、错误。
- `top` 全局 → `mpstat -P ALL` 分核 → `pidstat -u` 分进程，逐级下钻。
- 进阶：用 `perf top` 看热点函数、`/proc/stat` 自己算利用率。
