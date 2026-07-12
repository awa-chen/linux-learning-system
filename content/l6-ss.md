---
key: l6-ss
level: L6
title: ss 查看端口与连接
lang: shell
objective: 用 ss 查看监听端口、 established 连接，理解端口/套接字概念
prereq: ["l6-ip"]
estimated_min: 18
sandbox: false
---

# ss 查看端口与连接

## 讲解

服务跑起来后，它会在某个**端口（port）**上"监听"，等待连接。排查"服务起没起、端口被没被占、连没连上"就要看**套接字（socket）**统计——这正是 `ss`（socket statistics，取代老旧 `netstat`）的活。

常用组合：
- `ss -tuln`：`t`CP/`u`DP、`l`istening 监听中、`n` 数字显示（不解析主机名，更快）。
- `ss -tnp`：看 **established（已建立）** 的 TCP 连接，并显示进程 `-p`。

关键术语：**LISTEN** 表示在等连接；**ESTABLISHED** 表示已连上；**端口**是 0~65535 的数字，<1024 为特权端口（需 root 才能监听，如 80/443）。看到 `0.0.0.0:22` 监听，意思是"本机所有网卡都在 22 端口等 SSH"。

## 动手实验

1. 查看所有监听端口：
   ```bash
   ss -tuln
   ```
   预期：列出 `Local Address:Port`，如 `0.0.0.0:22`、`127.0.0.1:3306`，状态 `LISTEN`。

2. 只看 TCP 已建立连接：
   ```bash
   ss -tnp
   ```
   预期：显示本端/对端 IP:端口 与状态 `ESTAB`，`-p` 附进程名（需 root）。

3. 查看特定端口是否被占用：
   ```bash
   ss -tlnp 'sport = :80'
   ss -tln | grep ':22'
   ```

4. 按状态过滤（仅 ESTABLISHED）：
   ```bash
   ss -tan state established
   ```

## 常见错误

- **`netstat` 找不到**：新系统推荐 `ss`；`netstat` 属废弃工具。习惯 `ss -tuln`。
- **忘记 `-n` 导致卡顿**：不加 `-n` 会做反向 DNS 解析，慢且有时误导。看端口一律加 `-n`。
- **看到 `127.0.0.1:port` 却外部连不上**：那是只监听本机回环，不接受外部连接。要让外网访问需监听 `0.0.0.0`。
- **`-p` 看不到进程**：普通用户看不到别人的进程名，加 `sudo` 再试。

## 小结

1. `ss -tuln` 看监听端口、`ss -tnp` 看已建立连接，取代旧 `netstat`。
2. LISTEN=等待连接，ESTABLISHED=已连上；`0.0.0.0` 监听所有网卡，`127.0.0.1` 仅本机。
3. 排查"端口被占/服务没起"第一件事就是 `ss -tulnp`。

进阶：下一课用 `dig` 看"域名怎么解析成 IP"，配合端口知识，端到端连不通时能精确定位是 DNS 还是端口问题。
