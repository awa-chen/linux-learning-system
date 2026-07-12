---
key: l4-service
level: L4
title: systemd 与服务管理
lang: shell
objective: 理解 systemd 作为 init 系统的角色，掌握 systemctl 启停服务与 journalctl 查日志
prereq: ["l4-process"]
estimated_min: 20
sandbox: false
---

# systemd 与服务管理

## 讲解

现代 Linux 发行版（Ubuntu 16.04+、CentOS 7+、Debian 8+）都用 **systemd** 作为第一个进程（PID 1），它身兼数职：开机启动、服务监管、日志收集、定时任务（timer）、甚至是挂载管理。对我们而言，最常用的就是它管的"**单元（unit）**"——尤其是 `.service` 类型的服务单元。

过去用 `service nginx start` 或 `chkconfig` 的 SysV 时代已经过去，统一入口是 `systemctl`。它管三件事：**启动/停止（start/stop）**、**开机自启（enable/disable）**、**看状态（status）**。而服务产生的日志，不再散落在 `/var/log` 各文件，而是由 `journald` 统一收进二进制日志，用 `journalctl` 查询——这正是和上一课"进程"衔接的地方：每个服务背后都是一个被 systemd 盯着的进程。

## 动手实验

1. 查看某服务状态：
   ```bash
   systemctl status ssh
   ```
   预期：显示 `Active: active (running)`、主进程 PID、最近几行日志。`q` 退出。

2. 启动 / 停止 / 重启：
   ```bash
   sudo systemctl start nginx
   sudo systemctl stop nginx
   sudo systemctl restart nginx
   ```
   说明：restart 常用于改完配置后生效；`reload` 则不停服务只重读配置（支持的服务才有效）。

3. 设置开机自启：
   ```bash
   sudo systemctl enable nginx
   sudo systemctl is-enabled nginx
   ```
   预期：`is-enabled` 返回 `enabled` 表示开机启动已开。

4. 查询日志（journald）：
   ```bash
   journalctl -u nginx -n 50 --no-pager
   journalctl -u nginx -f          # 实时跟踪，类似 tail -f
   ```
   说明：`-u` 指定单元、`-n 50` 看最近 50 行、`-f` 跟随。

5. 列出所有运行中的服务：
   ```bash
   systemctl list-units --type=service --state=running
   ```

## 常见错误

- **`systemctl` 报 "System has not been booted with systemd"**：你可能在 Docker 容器或 WSL1 里，那里没有 systemd。容器里通常直接跑命令，或改用 `service`/手动启动。
- **enable 了却没启动**：`enable` 只管"开机自启"，不立即运行；要立刻生效还需再 `start` 一次。
- **改了配置 restart 没生效**：有些程序必须 `reload` 而非 `restart`；或配置写错导致启动失败，用 `journalctl -u 服务名 -n 50` 看报错。
- **`journalctl` 翻页卡住**：它默认用 `less`，按 `q` 退出；加 `--no-pager` 可一次性输出。

## 小结

1. systemd 是 PID 1，用 `systemctl` 统一管理 `.service` 服务的启停与自启。
2. 三板斧：`start/stop/restart` 控制运行，`enable/disable` 控制开机，`status` 看状态。
3. 日志统一进 journald，用 `journalctl -u 服务名` 排查问题，比翻散落日志文件省心。

进阶：L7 服务的 Nginx/数据库，本质就是写好 `.service` 并被 systemd 接管；到时你会自己写 unit 文件。
