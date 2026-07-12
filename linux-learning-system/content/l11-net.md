---
key: l11-net
level: L11
title: 网络与内核参数调优（sysctl / 多队列）
lang: shell
objective: 用 sysctl 调 TCP 内核参数提升吞吐，理解网卡多队列与中断均衡
prereq: []
estimated_min: 30
sandbox: false
---

# 网络与内核参数调优（sysctl / 多队列）

## 讲解
网络性能调优分两层：应用层（Nginx 连接数、超时）+ 内核层（TCP 栈参数、网卡队列）。内核关键参数（/proc/sys/net/）：
- **net.core.somaxconn / net.ipv4.tcp_max_syn_backlog**：连接队列上限，高并发 Web 要调大，否则新连接被丢。
- **net.ipv4.tcp_tw_reuse**：复用 TIME_WAIT 端口，缓解"端口耗尽"（注意：不要开 tcp_tw_recycle，已废弃且有 NAT 问题）。
- **net.ipv4.tcp_rmem/wmem**：TCP 收发缓冲区间，大带宽长延迟（BDP 大）链路要调大。
- **net.ipv4.ip_local_port_range**：本地出口端口范围，代理/NAT 场景调宽。
- **网卡多队列 + RPS/RFS**：多核下让不同流分散到不同 CPU，避免单核软中断瓶颈；`ethtool -l` 看队列数，`/proc/interrupts` 看中断分布。

> 改法：`sysctl -w 参数=值` 临时；持久写 `/etc/sysctl.d/99-tuning.conf` 后 `sysctl --system`。

## 动手实验
1. **查看与临时调整关键参数**：
   ```bash
   sysctl net.core.somaxconn net.ipv4.tcp_tw_reuse
   sudo sysctl -w net.core.somaxconn=4096
   sudo sysctl -w net.ipv4.tcp_tw_reuse=1
   sudo sysctl -w net.ipv4.ip_local_port_range="1024 65535"
   ```
2. **按带宽延迟积调 TCP 缓冲（示例：千兆、RTT 20ms）**：
   ```bash
   # BDP ≈ 带宽(bps)/8 * RTT(s) ≈ 1e9/8*0.02 ≈ 2.5MB
   sudo sysctl -w net.ipv4.tcp_rmem="4096 87380 8388608"
   sudo sysctl -w net.ipv4.tcp_wmem="4096 65536 8388608"
   ```
3. **持久化配置**：
   ```bash
   sudo tee /etc/sysctl.d/99-tuning.conf > /dev/null <<'EOF'
   net.core.somaxconn = 4096
   net.ipv4.tcp_max_syn_backlog = 8192
   net.ipv4.tcp_tw_reuse = 1
   net.ipv4.ip_local_port_range = 1024 65535
   EOF
   sudo sysctl --system
   ```
4. **网卡多队列与中断均衡**：
   ```bash
   ethtool -l eth0            # 看 Combined 队列数
   ethtool -L eth0 combined 8 # 设为 8 队列（若支持）
   cat /proc/interrupts | grep eth0   # 看中断分布
   # 软中断均衡：sudo tuned-adm profile network-throughput（RHEL）
   ```

## 常见错误
- **盲目开 tcp_tw_recycle**：Linux 4.12 已移除，且曾导致 NAT 后客户端连接失败。解决：只用 tcp_tw_reuse。
- **只调应用不调内核队列**：Nginx 配了高 worker_connections，但 somaxconn 默认 128，队列溢出照样丢连接。
- **改完没 `sysctl --system` 持久化**：重启丢失。解决：写 `/etc/sysctl.d/*.conf`。
- **多队列数超过 CPU 核数**：没必要，反而增开销。队列数 ≈ 收包 CPU 核数即可。

## 小结
- 网络调优：内核队列（somaxconn/backlog）+ TIME_WAIT 复用 + TCP 缓冲按 BDP 调。
- 网卡多队列把中断分散到多核，避免单核软中断瓶颈。
- 进阶：`ss -tin` 看每连接 TCP 指标、`tuned` 性能profile、`XDP/eBPF` 加速。
