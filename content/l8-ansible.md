---
key: l8-ansible
level: L8
title: Ansible：Inventory、ad-hoc 与第一个 Playbook
lang: ansible
objective: 理解 Inventory 与 ad-hoc 命令，写出第一个可复用的 Playbook 批量管理节点
prereq: []
estimated_min: 50
sandbox: true
---

# Ansible：Inventory、ad-hoc 与第一个 Playbook

## 讲解

Ansible 是无 Agent 的自动化运维工具：只靠 SSH 连上目标机，用 YAML 描述「要什么状态」，它负责把现状变成目标状态（幂等）。L8 承接 L7——L7 你手工把 Nginx/MySQL 跑起来了，L8 把它们变成「一行命令复制到 N 台机器」。

三个核心概念：
- **Inventory（清单）**：描述「管哪些机器、分组、连接信息」。默认 `/etc/ansible/hosts`，也可 `-i` 指定。分组用 `[web]` 这种方括号。
- **ad-hoc（临时命令）**：`ansible web -m ping` 或 `ansible web -m shell -a "uptime"`，适合一次性查看/操作，不用写文件。
- **Playbook**：YAML 描述的「剧本」，把多个任务编排成可复用、可版本控制的流程。`ansible-playbook site.yml` 执行。

关键思维转变：从「我一步步敲命令」变成「我声明目标状态，Ansible 自己算差异并执行」。Playbook 里的 `module` 是最小执行单元（`apt`/`copy`/`service`/`service` 等），每个 module 都尽量幂等（跑多次结果一致）。

> 沙盒提示：本课沙盒步骤练习用编辑器/`echo` 创建 Inventory 与第一个 Playbook 文件（文件操作可在模拟终端完成）；真实执行需在装有 Ansible 的机器上 `ssh` 可达目标节点。

## 动手实验

1. **安装 Ansible**：
   ```bash
   sudo apt update && sudo apt install -y ansible
   ansible --version | head -n 1     # 预期看到 ansible [core x.y.z]
   ```

2. **写一份 Inventory**（`inventory.ini`）：
   ```ini
   [web]
   192.168.1.11
   192.168.1.12

   [db]
   192.168.1.21

   [all:vars]
   ansible_user=ubuntu
   ansible_ssh_private_key_file=~/.ssh/id_rsa
   ```

3. **ad-hoc 连通性与探活**：
   ```bash
   ansible web -i inventory.ini -m ping
   ansible web -i inventory.ini -m shell -a "uptime"
   ```

4. **第一个 Playbook**（`site.yml`）——给 web 组装 nginx 并启动：
   ```yaml
   - hosts: web
     become: true
     tasks:
       - name: 安装 nginx
         apt:
           name: nginx
           state: present
           update_cache: true
       - name: 确保 nginx 运行
         service:
           name: nginx
           state: started
           enabled: true
   ```

5. **执行并验证**：
   ```bash
   ansible-playbook -i inventory.ini site.yml
   ansible web -i inventory.ini -m shell -a "systemctl is-active nginx"
   ```

## 常见错误

1. **`to use the 'ssh' connection type with passwords, you must install sshpass`**：Inventory 没配 key，又用密码连。要么配 `ansible_ssh_private_key_file`，要么 `apt install sshpass` 并设 `ansible_password`（不推荐明文密码）。
2. **`UNREACHABLE` / 超时**：目标机 SSH 不通、用户不对或防火墙挡 22。先 `ssh ubuntu@192.168.1.11` 手动确认可达，再检查 Inventory 的 `ansible_user`。
3. **YAML 缩进报错（`mapping values are not allowed here`）**：YAML 对缩进极敏感，务必用空格（别用 Tab），同一层级对齐。推荐 2 空格缩进。
4. **Playbook 跑过一次再跑「没变化」**：这是**幂等**在生效，不是失败。Ansible 比对现状与目标，一致就 `ok`/`changed: false`，放心重复执行。

## 小结

- Inventory 管「目标机器清单」，ad-hoc 管「一次性操作」，Playbook 管「可复用编排」。
- 思维转变：声明目标状态而非逐步敲命令；module 幂等，可反复执行。
- 进阶指引：下一课用 Roles 把 Playbook 拆成可共享的结构，并用 Jinja2 模板与 ansible-vault 管理配置与密钥。
