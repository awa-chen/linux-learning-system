---
key: l4-user
level: L4
title: 用户与组管理
lang: shell
objective: 理解 Linux 多用户模型，掌握 useradd/passwd/groupadd/usermod 的日常用法
prereq: ["l1-hello", "l3-grep"]
estimated_min: 20
sandbox: false
---

# 用户与组管理

## 讲解

Linux 从设计上就是**多用户**操作系统：一台机器上可以有多个账号同时工作，彼此的文件互相隔离。这一切的"户口登记簿"就是两个文本文件——`/etc/passwd`（账号信息）和 `/etc/shadow`（密码哈希，仅 root 可读）。与之配合的是"组"（`/etc/group`），用来把多个用户归到同一权限集合里，比如让 `dev` 组的成员都能读某个项目目录。

真正的权限判断发生在进程访问文件时：内核看"当前进程所属的用户/组"是否匹配文件的 owner/group 与 rwx 位。所以"管理用户"的本质，就是维护好这几张表，并理解"我是谁、我属于哪些组、我能碰什么"。

> 注意：本课的 `useradd`/`passwd` 等命令会真正修改系统账户，请在虚拟机/容器里练习，不要在生产机器乱跑。

## 动手实验

1. 查看当前用户与所属组：
   ```bash
   whoami
   id
   groups
   ```
   预期：`id` 会打印 `uid=1000(你的名) gid=1000(你的名) groups=...`，`groups` 列出你隶属的全部组。

2. 新建一个用户（需 root）：
   ```bash
   sudo useradd -m -s /bin/bash alice
   ```
   说明：`-m` 同时创建家目录 `/home/alice`，`-s /bin/bash` 指定登录 shell。

3. 为该用户设置密码：
   ```bash
   sudo passwd alice
   ```
   系统会交互式要求输入两次密码（屏幕上不回显）。

4. 新建组并把用户加进去：
   ```bash
   sudo groupadd dev
   sudo usermod -aG dev alice
   ```
   关键：`-aG` 的 `-a`（append）必须有，否则会**覆盖**该用户原有的组关系。

5. 验证与清理：
   ```bash
   id alice
   getent group dev
   sudo userdel -r alice
   ```
   预期：`id alice` 应出现 `groups=...(dev)`；`userdel -r` 会连家目录一起删掉。

## 常见错误

- **`useradd` 后无法登录/没有家目录**：很多发行版默认不加 `-m`，家目录不会自动建。务必加上 `-m`；若想统一默认行为，改 `/etc/login.defs` 的 `CREATE_HOME`。
- **`usermod -G` 把用户踢出其他组**：漏写 `-a` 会直接覆盖附属组列表。记住口诀："**加组必带 -a**"。
- **`passwd` 提示鉴定令牌操作错误**：普通用户改别人密码需要 root；忘记 `sudo` 就会失败。
- **UID 冲突**：手动指定 `-u` 时若与已有账号重复，会导致文件归属混乱，务必先 `getent passwd <uid>` 查重。

## 小结

1. 用户信息在 `/etc/passwd`、密码在 `/etc/shadow`、组在 `/etc/group`，都是纯文本表。
2. `useradd -m` 建人、`passwd` 设密、`usermod -aG` 加组，三者是日常三板斧。
3. "组"是权限批量分配的单位，理解 owner/group/other 与 rwx 的关系就理解了 Linux 权限根基。

进阶：下一课看进程时，你会用 `ps -o user= -p <pid>` 反查"某个进程到底是谁跑的"，正好衔接本课的用户视角。
