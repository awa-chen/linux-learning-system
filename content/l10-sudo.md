---
key: l10-sudo
level: L10
title: sudo 精细授权与禁止 root 登录
lang: shell
objective: 掌握通过 /etc/sudoers 做最小权限授权，并关闭 root 直接登录提升安全性
prereq: []
estimated_min: 25
sandbox: true
---

# sudo 精细授权与禁止 root 登录

## 讲解
`sudo`（superuser do）让普通用户以指定身份执行命令，是"最小权限原则"落地的核心工具。直接把用户塞进 `wheel` 组（`%wheel ALL=(ALL) ALL`）等于给了完整 root，风险大；更安全的做法是按"需要什么就给什么"的思路，在 `/etc/sudoers.d/` 下写细粒度规则。

sudoers 规则基本语法：
```
用户/组  主机=(可切换身份)  可执行的命令列表
```
例如 `lab ALL=(ALL) NOPASSWD: /bin/systemctl restart nginx` 表示 lab 只能在重启 nginx 时用 root，且免密。

另一半是"禁止 root 直接登录"：攻击者常先扫 root 账号爆破密码，关掉 root 的 SSH 登录（PermitRootLogin no）能挡掉一大半自动化攻击。配合"禁止密码登录、只用密钥"，安全性进一步提高。

> 永远用 `visudo` 编辑 sudoers（它会做语法检查，写错会导致所有人都无法提权）；或把规则写到 `/etc/sudoers.d/文件名`，同样会被 `visudo -c` 校验。

## 动手实验
1. 用 `visudo -c` 检查当前配置语法是否 OK：
   ```bash
   sudo visudo -c
   # /etc/sudoers: parsed OK
   ```
2. 为运维用户 `lab` 添加"只能重启 nginx、查看日志"的精细规则：
   ```bash
   sudo tee /etc/sudoers.d/lab-nginx > /dev/null <<'EOF'
   lab ALL=(root) NOPASSWD: /bin/systemctl restart nginx, /bin/systemctl status nginx, /usr/bin/tail /var/log/nginx/*
   EOF
   sudo chmod 440 /etc/sudoers.d/lab-nginx
   sudo visudo -c
   ```
3. 切换到 lab 验证权限是否生效（只能做授权内的事）：
   ```bash
   sudo -u lab -i
   sudo -l            # 列出 lab 被允许执行的命令
   sudo systemctl restart nginx
   sudo reboot        # 应被拒绝：Sorry, user lab is not allowed to execute...
   ```
4. 禁止 root 通过 SSH 登录（编辑 `/etc/ssh/sshd_config`）：
   ```bash
   sudo sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
   sudo grep -i PermitRootLogin /etc/ssh/sshd_config
   sudo systemctl restart sshd
   ```
5. 顺手关掉密码登录、只用密钥（前提：你已部署好公钥）：
   ```bash
   echo 'PasswordAuthentication no' | sudo tee -a /etc/ssh/sshd_config
   sudo systemctl restart sshd
   ```

## 常见错误
- **直接 `vim /etc/sudoers` 写错语法**：一旦语法错误，sudo 会拒绝所有提权，可能把自己锁死。解决：一律用 `visudo`，或在 `/etc/sudoers.d/` 增删文件、用 `visudo -c` 校验。
- **规则没加 `Defaults secure_path` 导致 sudo 找不到命令**：报 `command not found`。解决：写绝对路径（如 `/bin/systemctl`），或在 sudoers 里 `Defaults secure_path="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"`。
- **忘了 `chmod 440` sudoers.d 文件**：sudo 会忽略权限过松（如 0644）的文件并报错。解决：`chmod 440 /etc/sudoers.d/文件名`。
- **先禁密码登录却没部署密钥**：一重启 SSH 就再也连不上。解决：确认 `~/.ssh/authorized_keys` 已就位再改 `PasswordAuthentication no`。

## 小结
- sudoers 按"最小权限"写规则，放 `/etc/sudoers.d/` 下、权限 `440`、用 `visudo -c` 校验。
- `PermitRootLogin no` + 密钥登录，是挡住自动化爆破的基本盘。
- 进阶：用 `sudo` 审计日志（`/var/log/secure` 或 `journalctl -t sudo`）追踪谁做过什么。
