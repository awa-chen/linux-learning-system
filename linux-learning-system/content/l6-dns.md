---
key: l6-dns
level: L6
title: DNS 解析（dig / nslookup / resolv.conf）
lang: shell
objective: 理解域名解析流程，会用 dig/nslookup 排查 DNS，看懂 resolv.conf
prereq: ["l6-ss"]
estimated_min: 20
sandbox: false
---

# DNS 解析（dig / nslookup / resolv.conf）

## 讲解

你输入 `example.com`，机器怎么知道连哪个 IP？靠 **DNS（域名系统）**——一套分布式的"电话簿"。当你访问域名，系统先查本机缓存/`/etc/hosts`，再问**DNS 解析器（resolver）**，解析器按 `resolv.conf` 里配置的 DNS 服务器去递归查询，最终拿到 A 记录（IPv4）或 AAAA 记录（IPv6）。

排查 DNS 用两把刀：
- **`dig`**（首选，信息全）：默认查 A 记录，加 `@8.8.8.8` 可指定 DNS 服务器，`+short` 只输出结果。
- **`nslookup`**：交互/非交互皆可，较老但简单。

`/etc/resolv.conf` 是解析器配置：`nameserver 8.8.8.8` 指明用哪个 DNS。注意：用 NetworkManager/systemd-resolved 的机器里这个文件常被自动管理，手动改可能被覆盖。

## 动手实验

1. 用 dig 查 A 记录：
   ```bash
   dig example.com
   dig +short example.com          # 只要 IP
   dig @8.8.8.8 example.com        # 指定 DNS 服务器
   ```
   预期：输出里 `ANSWER SECTION` 含 `example.com.  N  A  93.184.216.34` 之类。

2. 查 MX / 指定类型：
   ```bash
   dig example.com MX
   dig example.com AAAA
   ```

3. 用 nslookup：
   ```bash
   nslookup example.com
   nslookup example.com 8.8.8.8
   ```

4. 看本机 DNS 配置：
   ```bash
   cat /etc/resolv.conf
   ```
   预期：含 `nameserver 127.0.0.53` 或 `nameserver 8.8.8.8` 之类。

## 常见错误

- **能 ping IP 但 ping 不通域名**：典型 DNS 问题。先看 `/etc/resolv.conf` 有没有 `nameserver`，再用 `dig` 验证。
- **`/etc/resolv.conf` 改完重启没了**：被 NetworkManager/systemd-resolved 接管。应在对应网络管理配置里改 DNS，而非直接编辑此文件。
- **dig 报 SERVFAIL**：上游 DNS 拒绝/出故障，换 `@8.8.8.8` 或 `@1.1.1.1` 再试，定位是本地 DNS 还是域名本身问题。
- **`/etc/hosts` 优先级更高**：`getent hosts 域名` 先看 hosts 再看 DNS；若 hosts 里写错了脏数据，会"解析到奇怪的 IP"。

## 小结

1. DNS 把域名翻译成 IP；解析顺序：本机缓存/`/etc/hosts` → `resolv.conf` 指定的 nameserver。
2. `dig`（首选，信息全）与 `nslookup` 用于排查；`+short`/`@服务器` 是常用技巧。
3. 能连 IP 不能连域名，多半是 DNS；先看 `resolv.conf`，再用 `dig @公共DNS` 区分责任。

进阶：下一课 `ssh` 是日常最常用到的"基于 IP+端口"的远程连接，配合 DNS 你就能 `ssh user@主机名` 直连。
