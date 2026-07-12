---
key: l8-lamp
level: L8
title: Ansible 实战：一键部署 LEMP 栈
lang: ansible
objective: 用 Role + Playbook 把 L7 的 Nginx/MySQL/PHP 串成可一键部署的 LEMP 生产栈
prereq: [l8-ansible, l8-roles, l7-nginx, l7-mysql]
estimated_min: 60
sandbox: false
---

# Ansible 实战：一键部署 LEMP 栈

## 讲解

本课是 L8 的收口实战：把 L7 你手工搭过的 Nginx、MySQL 用 Ansible **一键复现并扩展为 LEMP**（Linux + Nginx + MySQL + PHP）。它验证你前几课的能力——Inventory 分组、Role 结构、Jinja2 渲染、vault 加密——能否拼成一条「从零到生产可用」的流水线。

设计思路（一个 Playbook 编排三个 Role）：
- `role: nginx`：装 Nginx、渲染虚拟主机模板、启动。
- `role: mysql`：装 MySQL、用 vault 里的密码建库建用户、开防火墙。
- `role: php`：装 php-fpm，让 Nginx 把 `.php` 转给 php-fpm（FastCGI）。
- Playbook 顶层按 `[web]`、`[db]` 分组分别套 Role；敏感密码走 `group_vars/all/vault.yml`（ansible-vault 加密）。

一句话价值：以前你花半小时手工装一套，现在 `ansible-playbook -i inventory.ini lemp.yml --ask-vault-pass` 几十秒在 10 台机器上复制出 10 套一致环境。**一致性**是自动化的第一收益。

## 动手实验

1. **Inventory 分组**（沿用 l8-ansible 的 `inventory.ini`，确保 web/db 分组存在）。
   ```ini
   [web]
   192.168.1.11
   [db]
   192.168.1.21
   ```

2. **PHP Role 的 tasks（`roles/php/tasks/main.yml`）**：
   ```yaml
   - apt: { name: [php-fpm, php-mysql], state: present, update_cache: true }
     become: true
   - service: { name: php8.1-fpm, state: started, enabled: true }
     become: true
   ```

3. **Nginx 虚拟主机模板支持 PHP（`roles/nginx/templates/vhost.conf.j2`）**：
   ```jinja
   server {
       listen 80;
       server_name {{ domain }};
       root {{ web_root }};
       index index.php index.html;
       location ~ \.php$ {
           include fastcgi_params;
           fastcgi_pass unix:/run/php/php8.1-fpm.sock;
           fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
       }
   }
   ```

4. **MySQL Role 用 vault 建库建用户（`roles/mysql/tasks/main.yml`）**：
   ```yaml
   - mysql_db: { name: "{{ db_name }}", state: present }
     become: true
   - mysql_user:
       name: "{{ db_user }}"
       password: "{{ db_password }}"      # 来自 vault
       priv: "{{ db_name }}.*:ALL"
       host: "192.168.1.%"
       state: present
     become: true
   ```

5. **顶层 Playbook `lemp.yml`**：
   ```yaml
   - hosts: web
     roles: [nginx, php]
   - hosts: db
     roles: [mysql]
   ```

6. **一键执行**：
   ```bash
   ansible-playbook -i inventory.ini lemp.yml --ask-vault-pass
   ansible web -i inventory.ini -m shell -a "curl -s localhost | head -n1"
   ```

## 常见错误

1. **php-fpm socket 路径对不上**：Nginx 模板里 `fastcgi_pass` 的 sock 路径（如 `php8.1-fpm.sock`）必须和装的 PHP 版本一致，否则 502。用 `ls /run/php/` 确认真实 sock 名，再用变量传入模板。
2. **MySQL Role 报 `mysqldb`/`mysql_user` 模块缺失**：需要 `pip install pymysql` 且 Playbook 里 task 加 `become: true` 或以 `ansible_python_interpreter` 指向装了 PyMySQL 的解释器。
3. **vault 变量在 Role 里取不到**：vault 文件应放在 `group_vars/<组>/` 或 `host_vars/`，且变量名与模板/`{{ }}` 引用一致；执行必须带 `--ask-vault-pass`。
4. **幂等误判导致每次都 restart**：对 `service` 用 `state: started` 是幂等的（已起则 unchanged）；但若 task 总 `changed`，检查是不是 `command`/`shell` 没加 `creates`/`creates` 或 `changed_when: false`。

## 小结

- LEMP 一键化 = nginx + php-fpm + mysql 三个 Role 由顶层 Playbook 按分组编排，敏感数据全部走 vault。
- 自动化的第一收益是**环境一致性**：一份 Playbook，N 台机器，零偏差。
- 进阶指引：L9 用 Prometheus 给这套 LEMP 装上「仪表盘与报警器」，让它能自己告警。
