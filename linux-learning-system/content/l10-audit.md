---
key: l10-audit
level: L10
title: 审计与文件完整性（auditd / lynis / AIDE）
lang: shell
objective: 掌握用 auditd 监控系统调用、用 lynis 做安全基线扫描、用 AIDE 检测文件篡改
prereq: [l10-sudo]
estimated_min: 30
sandbox: false
---

# 审计与文件完整性（auditd / lynis / AIDE）

## 讲解
安全加固不能只"防外面"，还要"看得见里面"。三类工具各管一段：
- **auditd**：内核级审计，记录"谁、在什么时间、对什么文件/系统调用做了什么"。可监控 `/etc/passwd` 被改、某用户执行 `sudo` 等。
- **lynis**：安全基线扫描器，逐项检查系统配置（弱密码策略、多余服务、权限问题）并给出加固建议，输出分数与告警。
- **AIDE / Tripwire**：文件完整性校验（HIDS），对文件算哈希建基线库，之后对比发现被篡改（如 `/bin/ls` 被替换）。

三者配合：lynis 找"该改什么"、auditd 记"正在发生什么"、AIDE 验"已被改了什么"。

## 动手实验
1. **auditd 监控关键文件与提权行为**：
   ```bash
   sudo dnf install -y audit
   sudo systemctl enable --now auditd
   # 监控 /etc/passwd 与 /etc/shadow 的写/属性变更
   sudo auditctl -w /etc/passwd -p wa -k identity
   sudo auditctl -w /etc/shadow -p wa -k identity
   # 监控所有 sudo 执行
   sudo auditctl -a always,exit -F arch=b64 -S execve -F euid=0 -k sudo_exec
   sudo auditctl -l                 # 列出当前规则
   # 触发后查看：ausearch -k identity | aureport -f
   ```
2. **lynis 安全基线扫描**：
   ```bash
   sudo dnf install -y lynis
   sudo lynis audit system
   # 重点看 [WARNING]/[SUGGESTION]，按提示加固
   sudo lynis show warnings
   sudo lynis show suggestions
   ```
3. **AIDE 建基线并检测篡改**：
   ```bash
   sudo dnf install -y aide
   sudo aide --init                 # 首次建库（可能较慢）
   sudo cp /var/lib/aide/aide.db.new.gz /var/lib/aide/aide.db.gz
   # 模拟篡改后检测
   sudo touch /etc/passwd
   sudo aide --check                # 报告哪些文件变了
   ```

## 常见错误
- **auditd 规则重启后丢失**：`auditctl` 加的是临时规则。解决：写入 `/etc/audit/rules.d/`，然后 `augenrules --load` 或重启 auditd 持久化。
- **lynis 报告刷屏不知看哪**：满屏 OK 不重要。解决：只看 `[WARNING]` 与 `[SUGGESTION]`，或 `lynis show warnings`。
- **AIDE 初始化后没 copy 成 aide.db.gz**：`--check` 会报"找不到数据库"。解决：把 `aide.db.new.gz` 复制为 `aide.db.gz` 再 check。
- **AIDE 校验频繁误报**：系统更新/日志轮转会改变文件。解决：把 `/var/log`、`/tmp` 等易变目录在 `/etc/aide.conf` 里排除或仅监控元数据。

## 小结
- auditd 记"正在发生"（内核级）、lynis 找"该改什么"（基线扫描）、AIDE 验"已被改了什么"（完整性）。
- audit 规则要落 `rules.d/` 才持久；AIDE 改完基线要重新 `--init`。
- 进阶：把 audit 日志转发到 SIEM（如 L9 的 Prometheus + Loki）做集中审计与告警。
