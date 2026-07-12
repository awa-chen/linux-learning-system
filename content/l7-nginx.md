---
key: l7-nginx
level: L7
title: Nginx：虚拟主机、反向代理与负载均衡
lang: nginx
objective: 掌握 Nginx 安装、基于域名的虚拟主机、反向代理与 upstream 负载均衡配置
prereq: []
estimated_min: 45
sandbox: false
---

# Nginx：虚拟主机、反向代理与负载均衡

## 讲解

Nginx 是当今最流行的 Web 服务器与反向代理之一，以高并发、低内存著称。在 L7「服务与 Web」这一关里，Nginx 扮演三个角色：**静态资源服务器**（直接吐 HTML/图片）、**虚拟主机**（一台机器上用域名区分多个站点）、**反向代理/负载均衡**（把请求转发给后端应用或多个节点）。

理解三个核心概念：
- **虚拟主机（server block）**：一个 `server {}` 块对应一个站点，靠 `server_name` 区分。一台 80 端口的机器可以用 `a.example.com` 和 `b.example.com` 分别服务两个网站。
- **反向代理**：`location / { proxy_pass http://backend; }` 把请求转发给后端（如 Node、Tomcat、Python），客户端只看到 Nginx。好处是隐藏后端、统一入口、做 TLS 终止。
- **负载均衡**：在 `http {}` 里定义 `upstream backend { server 10.0.0.1; server 10.0.0.2; }`，Nginx 默认轮询分发，提升可用性与吞吐。

配置文件主位置：`/etc/nginx/nginx.conf`（全局）+ `/etc/nginx/conf.d/*.conf`（按站点拆分，推荐）。改完用 `nginx -t` 校验语法，再 `systemctl reload nginx` 生效。Nginx 是「配置即代码」的典型——改的是文本，跑的是生产。

## 动手实验

1. **安装并启动**（Debian/Ubuntu）：
   ```bash
   sudo apt update
   sudo apt install -y nginx
   sudo systemctl enable --now nginx
   curl -sI http://localhost | head -n 1   # 预期看到 HTTP/1.1 200 OK
   ```

2. **建一个基于域名的虚拟主机** `conf.d/site_a.conf`：
   ```nginx
   server {
       listen 80;
       server_name a.example.com;
       root /var/www/a;
       index index.html;
       location / { try_files $uri $uri/ =404; }
   }
   ```
   ```bash
   sudo mkdir -p /var/www/a && echo "<h1>Site A</h1>" | sudo tee /var/www/a/index.html
   ```

3. **反向代理到本地 8080 的后端应用**：
   ```nginx
   server {
       listen 80;
       server_name api.example.com;
       location / {
           proxy_pass http://127.0.0.1:8080;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

4. **配置 upstream 负载均衡**（两个后端节点）：
   ```nginx
   upstream app_cluster {
       server 10.0.0.11:8080 weight=2;
       server 10.0.0.12:8080;
   }
   server {
       listen 80;
       server_name app.example.com;
       location / { proxy_pass http://app_cluster; }
   }
   ```

5. **校验并热加载**：
   ```bash
   sudo nginx -t            # 预期：syntax is ok / test is successful
   sudo systemctl reload nginx
   ```

6. **本地验证虚拟主机**（改 hosts 或直接 curl 带 Host 头）：
   ```bash
   curl -H "Host: a.example.com" http://localhost   # 预期返回 <h1>Site A</h1>
   ```

## 常见错误

1. **`nginx: [emerg] unknown directive` 或端口占用**：多半是 `conf.d` 里少了分号，或 80 端口被 Apache 占用。先 `nginx -t` 看行号，再 `sudo ss -tlnp | grep :80` 查冲突进程。
2. **改了配置不生效**：忘了 `reload`。修改配置后必须 `systemctl reload nginx`（热加载，不断连接）；只有改 `user/worker_processes` 等少数项才需 `restart`。
3. **反向代理 502 Bad Gateway**：后端没起或 `proxy_pass` 地址写错。先 `curl http://127.0.0.1:8080` 确认后端本身可达，再查防火墙/SELinux。
4. **`server_name` 不生效、总进默认站点**：Nginx 按 `server_name` 匹配，匹配不到会落到第一个 `server` 或 `default_server`。确认 curl 带了正确的 `Host` 头，或本地 `/etc/hosts` 已绑定域名。

## 小结

- Nginx 三大能力：虚拟主机（`server_name` 分流）、反向代理（`proxy_pass` 隐藏后端）、负载均衡（`upstream` 多节点）。
- 配置写在 `conf.d/*.conf`，改完先 `nginx -t` 再 `reload`，这是生产铁律。
- 进阶指引：下一课用 Docker 把 Nginx 与应用打包成可移植的容器，彻底摆脱「环境不一致」。
