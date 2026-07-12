---
key: l10-sshsec
level: L10
title: SSH 加固与 fail2ban 防爆破
lang: shell
objective: 学会加固 OpenSSH 服务并部署 fail2ban 自动封锁暴力破解来源 IP
prereq: [l10-sudo]
estimated_min: 25
sandbox: false
---

# SSH 加固与 fail2ban 防爆破

## 讲解
SSH 是 Linux 服务器最主要的远程入口，也是攻击者首选目标。加固围绕三件事：**认证方式、暴露面、失败次数**。

1. **认证方式**：禁用 root 直登、禁用密码登录、只用密钥（密钥长度 ≥ 3072 位 RSA 或 ed25519）。
2. **暴露面**：改默认端口（仅"降低噪声"，不是真安全）、限制允许的用户/来源、空闲超时断开。
3. **失败次数**：用 `fail2ban` 监控 `/var/log/secure`（或 `auth.log`）中的失败登录，达到阈值就调用 iptables/nftables 临时封 IP。

fail2ban 由 `jail`（监控规则）+ `filter`（日志匹配正则）+ `action`（封禁动作）组成；`[sshd]` jail 默认监控 SSH，按 `maxretry` 与 `bantime` 执行封禁。

## 动手实验
1. 备份并加固 `sshd_config` 关键项：
   ```bash
   sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak
   sudo sed -i -e 's/^#\?PermitRootLogin.*/PermitRootLogin no/' \
               -e 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' \
               -e 's/^#\?X11Forwarding.*/X11Forwarding no/' \
               -e 's/^#\?ClientAliveInterval.*/ClientAliveInterval 300/' \
               -e 's/^#\?ClientAliveCountMax.*/ClientAliveCountMax 2/' \
               /etc/ssh/sshd_config
   sudo sshd -t            # 先测语法，再重启
   sudo systemctl restart sshd
   ```
2. 安装并启用 fail2ban（RHEL 系需先开 EPEL）：
   ```bash
   sudo dnf install -y epel-release
   sudo dnf install -y fail2ban
   sudo systemctl enable --now fail2ban
   ```
3. 写 SSH jail 配置：
   ```bash
   sudo tee /etc/fail2ban/jail.d/sshd.local > /dev/null <<'EOF'
   [sshd]
   enabled = true
   port = ssh
   filter = sshd
   logpath = /var/log/secure
   maxretry = 5
   bantime = 1h
   findtime = 10m
   backend = systemd
   EOF
   sudo systemctl restart fail2ban
   ```
4. 查看封禁状态与日志：
   ```bash
   sudo fail2ban-client status sshd
   sudo fail2ban-client status sshd | grep -A5 "Banned IP list"
   sudo journalctl -u fail2ban -n 50
   ```
5. 手动解封某个 IP（误封时）：
   ```bash
   sudo fail2ban-client set sshd unbanip 203.0.113.50
   ```

## 常见错误
- **改完 sshd 没 `sshd -t` 就重启**：语法错会导致 sshd 起不来，远程直接断连。解决：每次改完先 `sshd -t` 再 `restart`。
- **禁密码登录前密钥没生效**：连不上。解决：用 `ssh -i 密钥 用户@主机` 验证可登录后再关密码。
- **fail2ban 找不到日志路径**：RHEL 9 用 `journald`，应设 `backend = systemd` 并把 `logpath` 设为 `/var/log/secure`；Debian 用 `/var/log/auth.log`。路径错则永远不封。
- **bantime 设太短**：攻击者可循环试探。练习机可设 1h，公网可设更长或 `bantime.increment = true` 递增封禁。

## 小结
- SSH 加固 = 禁 root 直登 + 仅密钥 + 空闲超时；fail2ban 兜底封暴力破解 IP。
- 每次改 `sshd_config` 必 `sshd -t` 再重启，避免锁死自己。
- 进阶：用 `AllowUsers` 限制可登录账号、用 `Match Address` 做来源白名单。
