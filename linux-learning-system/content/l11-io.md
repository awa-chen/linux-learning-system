---
key: l11-io
level: L11
title: 磁盘 IO 观测与调度器（iostat / iotop / 调度器）
lang: shell
objective: 用 iostat/iotop 定位 IO 瓶颈，理解 IO 调度器与队列深度调优
prereq: []
estimated_min: 30
sandbox: false
---

# 磁盘 IO 观测与调度器（iostat / iotop / 调度器）

## 讲解
IO 瓶颈的 USE：利用率（磁盘忙 %util）、饱和度（await/queue 长度）、错误（media error）。重点指标：
- **%util**（iostat）：设备忙的时间百分比，接近 100% 说明磁盘饱和。
- **await / r_await / w_await**：平均每次 IO 的等待+服务时间（毫秒）。await 远高于 svctm 说明在排队。
- **aqu-sz**（avg queue）：平均队列深度，越大越饱和。
- **iodepth / nr_requests**：队列深度，SSD/NVMe 可调大以提升并发。
- **调度器**：`none`（NVMe 推荐）、`mq-deadline`（SATA SSD/HDD 通用）、`bfq`（桌面低延迟）。查看/切换在 `/sys/block/<dev>/queue/scheduler`。

## 动手实验
1. **看磁盘利用率与 await**：
   ```bash
   iostat -x 1 3           # -x 扩展指标；看 %util / await / aqu-sz
   ```
2. **看每个进程的 IO 占用**：
   ```bash
   sudo iotop -o -b -n 3   # -o 只看有 IO 的进程
   ```
3. **查看/切换调度器**：
   ```bash
   cat /sys/block/sda/queue/scheduler     # 如：[mq-deadline] none
   echo mq-deadline | sudo tee /sys/block/sda/queue/scheduler
   ```
4. **调队列深度（SSD/NVMe 提升并发）**：
   ```bash
   cat /sys/block/sda/queue/nr_requests
   echo 256 | sudo tee /sys/block/sda/queue/nr_requests
   ```
5. **制造读压力观察变化**：
   ```bash
   sudo dnf install -y fio
   fio --name=randread --rw=randread --bs=4k --numjobs=4 \
       --size=512M --runtime=30 --time_based --filename=/tmp/testfio
   ```

## 常见错误
- **%util 高但吞吐量低就加磁盘**：可能是随机小 IO + 高 await，先排查是否顺序化/加缓存/换 SSD。
- **NVMe 还用 mq-deadline 不放 none**：NVMe 自带队列，用 `none` 更省开销。解决：设 `none`。
- **iotop 报 "Need DISABLE_TASK_DELAY_ACCT"**：内核没开延迟统计。解决：启动加 `delayacct` 或忽略（用 `iostat -x` 替代）。
- **调 nr_requests 不生效**：某些设备（尤其 NVMe）忽略该值；以设备文档为准。

## 小结
- IO 瓶颈看 %util（饱和）、await/aqu-sz（排队）、r/w 拆分。
- NVMe 用 `none`、SATA 用 `mq-deadline`；SSD 可加大 nr_requests。
- 进阶：`fio` 做基准（见 l11-bench）、`blktrace`/`bcc` 下钻到块层。
