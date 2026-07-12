---
key: l6-ssh
level: L6
title: SSH 远程登录与端口转发
lang: shell
objective: 掌握 ssh 密钥登录、ProxyJump 跳板与本地/远程端口转发
prereq: ["l6-dns", "l4-user"]
estimated_min: 25
sandbox: false
---

# SSH 远程登录与端口转发

## 讲解

`ssh`（Secure Shell）是 Linux 运维的命脉：加密地远程登录、执行命令、传文件。`ssh user@host` 默认用密码登录，但**密钥登录**才是正道——本地持私钥、远端 `~/.ssh/authorized_keys` 放公钥，既免密又抗暴力破解。

三个进阶玩法极其实用：
- **ProxyJump（`-J`）**：透过一台跳板机连内网机器，`ssh -J jump user@内网`，不用手动先登跳板。
- **本地转发（`-L`）**：把本地端口隧穿到远端能访问的资源（`-L 本地端口:目标:目标端口`）。
- **远程转发（`-R`）**：反过来，把远端端口映射到本机，常用于内网穿透演示。

安全底线：禁用 root 直登、只用密钥、改掉默认 22 端口（或前置防火墙）、用 `~/.ssh/config` 固化常用连接。

## 动手实验

1. 生成密钥并分发公钥（免密登录）：
   ```bash
   ssh-keygen -t ed25519 -C "my-laptop"
   ssh-copy-id user@host        # 把公钥送进远端 authorized_keys
   ssh user@host                # 此后免密
   ```
   说明：一路回车用默认路径 `~/.ssh/id_ed25519`；`ssh-copy-id` 自动处理权限。

2. 用 `~/.ssh/config` 简化：
   ```bash
   cat >> ~/.ssh/config <<'EOF'
   Host web
     HostName 192.168.1.10
     User deploy
     IdentityFile ~/.ssh/id_ed25519
   EOF
   chmod 600 ~/.ssh/config
   ssh web        # 直接别名登录
   ```

3. ProxyJump 跳板登录：
   ```bash
   ssh -J jumpuser@jumphost deploy@10.0.0.5
   ```
   说明：先连 jumphost 再跳转内网 `10.0.0.5`，本地无需直连内网。

4. 本地端口转发（访问远端内网服务）：
   ```bash
   ssh -L 8080:127.0.0.1:80 deploy@host
   ```
   说明：本机访问 `localhost:8080` 就等于访问 host 上的 `127.0.0.1:80`。

## 常见错误

- **`Permission denied (publickey)`**：远端 `authorized_keys` 没你的公钥，或文件权限太开放（`.ssh` 须 700、`authorized_keys` 须 600）。先 `ssh-copy-id` 重发。
- **`config` 文件权限过宽被忽略**：`~/.ssh/config` 必须是 600，否则 SSH 出于安全直接不读。
- **ProxyJump 连不上内网**：跳板机能登但内网 IP 不通，确认跳板机能访问目标，且 `-J` 后是"最终目标"而非跳板。
- **端口转发不生效**：忘了转发期间保持 ssh 连接不断开；且本地端口若被占用会报 "bind: Address already in use"，换一个本地端口。

## 小结

1. 密钥登录：`ssh-keygen` 生成、`ssh-copy-id` 分发、远端 `authorized_keys` 收公钥，免密又安全。
2. `~/.ssh/config` 固化 Host/User/密钥，`ssh 别名` 一键连；文件权限须 600。
3. `-J` 跳板、`-L` 本地转发、`-R` 远程转发，是运维与内网访问的三把钥匙。

进阶：L8 Ansible 默认就走 SSH（最好密钥+config），理解本课你已具备批量管理集群的连接基础。
