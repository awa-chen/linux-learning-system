---
key: l6-ip
level: L6
title: ip 命令族与路由
lang: shell
objective: 用 ip 命令查看/管理网络接口、IP 地址与路由表，取代旧版 ifconfig/route
prereq: ["l4-process"]
estimated_min: 22
sandbox: false
---

# ip 命令族与路由

## 讲解

`ip` 命令（来自 `iproute2` 套件）是现代 Linux 管理网络的"瑞士军刀"，它统一取代了老旧的 `ifconfig`、`route`、`arp` 三件套。日常你只要记住它的几个子命令：**`ip addr`**（地址）、**`ip link`**（链路/网卡）、**`ip route`**（路由）。

核心概念三层：
- **link（链路）**：物理或虚拟网卡本身，如 `eth0`、`lo`。看它是不是 `UP`。
- **addr（地址）**：绑定在 link 上的 IP，如 `192.168.1.10/24`。
- **route（路由）**："去某网段该走哪个网关"，系统靠路由表决定包往哪发；默认路由 `default via 网关` 就是"上不了本网段就交给它"。

理解这三层，你就能回答"为什么我连不上网"——多半是 link 没 UP、addr 没配上、或 route 没默认网关。

## 动手实验

1. 查看所有网卡与 IP：
   ```bash
   ip addr show
   ip -br addr         # 精简一行一卡
   ```
   预期：看到 `lo`（回环）、`eth0`/`ens33` 等，含 `inet 192.168.x.x/24` 与状态 `UP`/`DOWN`。

2. 只看路由表：
   ```bash
   ip route show
   ip route get 8.8.8.8
   ```
   预期：`ip route get` 会告诉你"去 8.8.8.8 走哪个网卡、经哪个网关"。

3. 临时给网卡加 IP（重启失效，需 root）：
   ```bash
   sudo ip addr add 192.168.1.100/24 dev eth0
   sudo ip link set eth0 up
   ```

4. 添加默认网关：
   ```bash
   sudo ip route add default via 192.168.1.1
   ```
   说明：生产/桌面环境一般用 NetworkManager 或 `/etc/network/interfaces` 持久化，手动 `ip` 命令仅临时生效。

## 常见错误

- **还在用 `ifconfig` 提示 command not found**：新系统默认只有 `ip`。`ifconfig` 属过时工具，学 `ip addr` 才是正道。
- **配了 IP 但 link 是 DOWN**：`ip link set eth0 up` 忘了执行，网卡不起就收发不了包。先看 `ip link` 状态。
- **`ip` 改完重启就丢**：命令行直接改是内存态，重启还原。要持久化得改发行版的网络配置（Netplan/NetworkManager/interfaces）。
- **默认路由重复或缺失**：多个 `default` 会冲突；没有 `default` 则只能访问本网段。用 `ip route show default` 检查。

## 小结

1. `ip addr` 看地址、`ip link` 看网卡状态、`ip route` 看路由，三件套取代老三样。
2. 网络不通先查三件事：link 是否 UP、addr 是否配上、有无默认路由。
3. 命令行 `ip` 改动是临时的，持久化要走发行版的网卡配置文件。

进阶：下一课用 `ss` 看"哪些端口在监听"，配合本课的 IP/路由，网络排错基本闭环。
