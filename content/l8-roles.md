---
key: l8-roles
level: L8
title: Ansible Roles：结构、Jinja2 模板与 ansible-vault
lang: ansible
objective: 掌握 Roles 标准目录结构、用 Jinja2 渲染配置文件、用 ansible-vault 加密敏感变量
prereq: [l8-ansible]
estimated_min: 55
sandbox: false
---

# Ansible Roles：结构、Jinja2 模板与 ansible-vault

## 讲解

当 Playbook 越写越长，就要把它拆成 **Role（角色）**——Ansible 官方推荐的「可复用单元」。一个 Role 是一个按约定目录组织的文件夹，别人 `roles/myrole` 拿来就能 `roles: [myrole]` 引用，像搭积木。

标准 Role 目录（约定优于配置，Ansible 会自动加载）：
```
roles/nginx/
├── tasks/main.yml        # 主任务列表
├── handlers/main.yml     # 由 notify 触发的处理（如重载）
├── templates/            # Jinja2 模板 (.j2)
├── files/                # 静态文件
├── vars/main.yml         # 角色内变量
├── defaults/main.yml     # 默认变量（优先级最低，易被覆盖）
└── meta/main.yml         # 依赖声明
```

两个关键能力：
- **Jinja2 模板**：`templates/nginx.conf.j2` 里写 `worker_processes {{ ansible_processor_vcpus }};`，Ansible 按目标机事实渲染成真实配置。这是「一套模板适配千台机器」的核心。
- **ansible-vault**：敏感数据（密码、密钥）绝不能明文进 git。`ansible-vault create secret.yml` 加密，`--ask-vault-pass` 解密执行。团队约定把 vault 密码放 CI 环境变量，而非仓库。

## 动手实验

1. **用脚手架初始化 Role**：
   ```bash
   ansible-galaxy init roles/nginx
   tree roles/nginx
   ```

2. **写 tasks/main.yml**（安装并启用 nginx，变更后重载）：
   ```yaml
   - name: 安装 nginx
     apt: { name: nginx, state: present, update_cache: true }
     become: true
   - name: 渲染配置
     template:
       src: nginx.conf.j2
       dest: /etc/nginx/nginx.conf
     become: true
     notify: reload nginx
   - name: 启动 nginx
     service: { name: nginx, state: started, enabled: true }
     become: true
   ```

3. **写 handlers/main.yml**：
   ```yaml
   - name: reload nginx
     service: { name: nginx, state: reloaded }
     become: true
   ```

4. **写 Jinja2 模板 `templates/nginx.conf.j2`**：
   ```jinja
   worker_processes {{ ansible_processor_vcpus }};
   events { worker_connections 1024; }
   http {
       server {
           listen {{ nginx_port | default(80) }};
           server_name {{ inventory_hostname }};
           root {{ web_root | default('/var/www/html') }};
       }
   }
   ```

5. **用 ansible-vault 加密敏感变量**：
   ```bash
   ansible-vault create group_vars/web/vault.yml
   # 在编辑器里写： db_password: "StrongPass!23"
   ansible-vault view group_vars/web/vault.yml     # 需输入 vault 密码
   ```

6. **在 Playbook 里引用 Role 并执行**：
   ```yaml
   - hosts: web
     roles: [nginx]
   ```
   ```bash
   ansible-playbook -i inventory.ini site.yml --ask-vault-pass
   ```

## 常见错误

1. **Role 没被找到（`ERROR! the role ... could not be found`）**：检查 `roles/` 目录名与 `roles:` 引用是否一致，且 Role 目录下有 `tasks/main.yml`（入口文件缺失会报错）。
2. **Jinja2 变量未定义报 `undefined variable`**：模板引用了没传的变量。给默认值（`{{ x | default(80) }}`）或在 `defaults/main.yml` 声明；调试用 `ansible web -m setup` 看可用 fact。
3. **vault 文件执行报 `Vault password not provided`**：忘了加 `--ask-vault-pass`，或 CI 没注入 `VAULT_PASSWORD`。也可用 `--vault-password-file`。
4. **handler 不触发**：只有 task 标了 `notify: reload nginx` 且该 task 状态为 `changed` 时，handler 才在 Playbook 末尾触发；用 `changed_when: false` 的 task 不会触发。

## 小结

- Role = 约定目录结构的可复用单元（tasks/handlers/templates/vars…），`ansible-galaxy init` 生成骨架。
- Jinja2 模板让「一套配置适配千机」；ansible-vault 让敏感变量安全入版本库。
- 进阶指引：下一课把 L7 的 LEMP（Linux+Nginx+MySQL+PHP）整条链路用 Role 一键部署实战。
