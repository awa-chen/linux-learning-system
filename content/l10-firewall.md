---
key: l10-firewall
level: L10
title: 防火墙默认拒绝（iptables / nftables / firewalld）
lang: shell
objective: 理解 Linux 防火墙三层工具，掌握"默认拒绝、按需放行"的最小暴露原则
prereq: [l10-sudo]
estimated_min: 30
sandbox: false
---

# 防火墙默认拒绝（iptables / nftables / firewalld）

## 讲解
Linux 防火墙内核态是 `netfilter`，用户态工具有三代：
- **iptables**（传统，仍在大量在用）：基于表（filter/nat/mangle）+ 链（INPUT/OUTPUT/FORWARD）的 rule 列表。
- **nftables**（新标准，RHEL 8+/内核 ≥ 3.13 推荐）：替代 iptables/ipset，语法统一、性能更好。
- **firewalld**（RHEL/CentOS 默认管理前端）：基于"区域(zone)+服务(service)"，底层调用 nftables/iptables。

核心原则：**默认拒绝（default drop）**——先 `DROP` 所有入站，再显式放行需要的端口（22/80/443 等）。这样任何没主动开放的端口天然不可达，攻击面最小。

> 选哪个？RHEL 9 推荐 firewalld（省心）/nftables（精细）；老系统或脚本兼容用 iptables。三者不要混管同一张表。

## 动手实验
1. **firewalld（RHEL 9 默认）默认拒绝实战**：
   ```bash
   sudo systemctl enable --now firewalld
   sudo firewall-cmd --set-default-zone=public
   sudo firewall-cmd --zone=public --remove-service=dhcpv6-client --permanent
   # 先确保 ssh 放行，避免把自己锁外面
   sudo firewall-cmd --add-service=ssh --permanent
   sudo firewall-cmd --add-service=http --add-service=https --permanent
   sudo firewall-cmd --reload
   sudo firewall-cmd --list-all
   ```
2. **nftables 手写默认拒绝**（想精细控制时）：
   ```bash
   sudo systemctl disable --now firewalld   # 与 nftables 二选一
   sudo nft add table inet filter
   sudo nft add chain inet filter input '{ type filter hook input priority 0; policy drop; }'
   sudo nft add rule inet filter input ct state established,related accept
   sudo nft add rule inet filter input iifname "lo" accept
   sudo nft add rule inet filter input tcp dport {22,80,443} accept
   sudo nft list ruleset
   ```
3. **iptables 经典默认拒绝**（兼容老环境）：
   ```bash
   sudo iptables -P INPUT DROP
   sudo iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
   sudo iptables -A INPUT -i lo -j ACCEPT
   sudo iptables -A INPUT -p tcp -m multiport --dports 22,80,443 -j ACCEPT
   sudo iptables -L -n -v
   # 持久化（RHEL）：service iptables save  或  iptables-save > /etc/sysconfig/iptables
   ```

## 常见错误
- **默认 DROP 前忘了放行 SSH（22）**：一执行就被踢下线。解决：先 `-A INPUT -p tcp --dport 22 -j ACCEPT` 或 firewalld `--add-service=ssh`，再设默认策略。
- **firewalld 只用临时规则没 `--permanent`**：`--reload` 或重启后规则丢失。解决：放行类命令加 `--permanent`，最后统一 `--reload`。
- **同时跑 firewalld 和 nftables/iptables 手工规则**：规则互相覆盖、行为诡异。解决：选一套，禁用其余（`systemctl disable --now firewalld`）。
- **nftables 链 policy 写错位置**：必须 `policy drop` 写在 chain 定义里，仅加 `drop` 规则不会默认拒绝。

## 小结
- 防火墙铁律：默认拒绝 + 显式放行必要端口，暴露面最小。
- RHEL 9 优先 firewalld（按服务放行）；需精细用 nftables；老系统兼容用 iptables。
- 进阶：用 nftables `set`/ipset 做大量 IP 封禁、用 `limit` 限连接速率防 CC。
