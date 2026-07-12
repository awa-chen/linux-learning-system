---
key: l11-bench
level: L11
title: 基准测试（sysbench / fio / wrk）
lang: shell
objective: 用 sysbench/fio/wrk 对 CPU/磁盘/Web 做可复现基准测试并读懂指标
prereq: [l11-cpu, l11-io, l11-net]
estimated_min: 35
sandbox: false
---

# 基准测试（sysbench / fio / wrk）

## 讲解
调优前必须先有"基线"，否则不知道改了有没有用。三类基准对应三类资源：
- **sysbench**：CPU/内存/线程/数据库（MySQL）压测。CPU 测试算素数为例，看 events/s 与延迟。
- **fio**（Flexible IO Tester）：磁盘 IO 基准，支持顺序/随机、读/写、同步/异步、不同块大小；输出 IOPS、带宽、延迟分位（clat p95/p99）。
- **wrk / wrk2**：HTTP 基准，看吞吐（req/s）、延迟分布、连接数；`wrk2` 能做恒定速率（Coordinated Omission 更友好）。

黄金法则：**单一变量、可复现、看分布不看均值**——记录测试命令、环境、p99 延迟，对比才有意义。别在跑基准时开别的重负载进程。

## 动手实验
1. **sysbench CPU 基准**：
   ```bash
   sudo dnf install -y sysbench
   sysbench cpu --cpu-max-prime=20000 --threads=4 run
   # 看 total time / events per second
   ```
2. **fio 磁盘随机读/写基准**：
   ```bash
   sudo dnf install -y fio
   # 随机读 4K，4 并发，30 秒
   fio --name=randread --rw=randread --bs=4k --numjobs=4 \
       --size=1G --runtime=30 --time_based --filename=/tmp/fio.tmp \
       --ioengine=libaio --direct=1 --group_reporting
   # 关注 IOPS、BW、clat(usec) 的 p95/p99
   ```
3. **wrk HTTP 基准**：
   ```bash
   # 先起一个本机服务，例如 python 静态页或 Nginx
   sudo dnf install -y wrk
   wrk -t4 -c100 -d30s http://127.0.0.1:80/
   # 看 Requests/sec、Latency 分布（2.5%/50%/97.5%）
   ```
4. **wrk2 恒定速率（更准的延迟）**：
   ```bash
   wrk2 -t4 -c100 -d30s -R2000 http://127.0.0.1:80/
   # -R2000 表示恒定 2000 req/s，看是否跟得上、延迟如何
   ```
5. **记录基线对比**（建议写进笔记）：
   ```bash
   echo "env: 4C8G Rocky9; disk: nvme" > /tmp/bench-baseline.txt
   # 把关键输出追加进去，调优前后对比
   ```

## 常见错误
- **基准时机器还在跑别的负载**：结果不可信。解决：停掉无关进程、`nice`/`taskset` 绑核、关掉桌面。
- **只看均值不看 p99**：均值好看但尾延迟爆炸（用户感知卡）。解决：重点看 clat p99 / wrk 97.5% 延迟。
- **fio 用 buffered IO 测不出真实磁盘**：没加 `--direct=1` 会走 page cache，数字虚高。解决：加 `--direct=1`。
- **wrk 并发数乱给**：`-c` 太小压不满、`-t` 超过核数无益。解决：c ≈ 预期并发，t ≤ CPU 核数。

## 小结
- 先建基线再调优；sysbench(CPU)、fio(磁盘)、wrk(Web) 各管一段。
- 看分布（p99）而非均值；单一变量、可复现、记录环境。
- 进阶：`perf` 找热点、`flamegraph` 火焰图、`prometheus` 长期趋势（见 L9）。
