---
key: l7-docker
level: L7
title: Docker：镜像、容器生命周期与 docker-compose
lang: shell
objective: 理解镜像与容器区别，掌握 Dockerfile 编写、容器生命周期管理与 docker-compose 编排
prereq: []
estimated_min: 50
sandbox: true
---

# Docker：镜像、容器生命周期与 docker-compose

## 讲解

Docker 把「应用 + 它的运行环境」打包成一个**镜像（image）**，镜像是只读模板；**容器（container）** 是镜像的运行实例，带可写层。一句话：**镜像是类，容器是对象**。

三个必须分清的概念：
- **镜像（image）**：由 `Dockerfile` 层层构建出的只读文件系统。每次 `RUN` 产生一层，层可缓存复用——这就是为什么把「不变的安装步骤」放前面能大幅加速构建。
- **容器（container）**：`docker run` 镜像得到的运行实体。它有状态（启动/停止/退出），可以被 `start/stop/rm`。容器的可写层在删除后消失（除非用 volume 持久化）。
- **docker-compose**：用一个 `docker-compose.yml` 描述「多个容器如何一起跑」（如 web + db），一条 `docker compose up` 拉起整套环境，告别手敲一长串 `docker run`。

学习路径：先会 `docker run` 跑现成镜像 → 再写 `Dockerfile` 做自己的镜像 → 最后用 `compose` 编排多服务。L7 的目标是把 L7-nginx 里的 Web 服务容器化，做到「在我机器上能跑，在你机器上也能跑」。

> 提示：本课的沙盒步骤（见沙盒页）用于在模拟终端里练习「用编辑器/echo 创建 Dockerfile」这一文件操作，真实构建请在本地 Docker 环境执行。

## 动手实验

1. **确认环境**：
   ```bash
   docker --version
   docker info | head -n 5
   ```
   预期看到 Client/Server 版本信息（若报 `Cannot connect to the Docker daemon`，说明 daemon 没起：`sudo systemctl start docker`）。

2. **跑一个现成容器**（nginx 官方镜像）：
   ```bash
   docker run -d --name web -p 8080:80 nginx:alpine
   curl -sI http://localhost:8080 | head -n 1   # HTTP/1.1 200 OK
   ```

3. **写一个最小 Dockerfile**（把静态页面打进 nginx）：
   ```dockerfile
   FROM nginx:alpine
   COPY index.html /usr/share/nginx/html/index.html
   EXPOSE 80
   ```
   ```bash
   echo "<h1>Hello Penguin</h1>" > index.html
   docker build -t my-web:v1 .
   docker run -d --name myweb -p 8081:80 my-web:v1
   ```

4. **容器生命周期管理**：
   ```bash
   docker ps                  # 看运行中的容器
   docker stop myweb          # 停止
   docker start myweb         # 再启动
   docker logs myweb          # 看日志
   docker rm -f myweb         # 强制删除（容器态清空）
   ```

5. **用 docker-compose 编排 web+db**：
   ```yaml
   # docker-compose.yml
   services:
     web:
       build: .
       ports: ["8082:80"]
     db:
       image: mysql:8
       environment:
         MYSQL_ROOT_PASSWORD: secret
         MYSQL_DATABASE: app
   ```
   ```bash
   docker compose up -d
   docker compose ps
   docker compose down        # 停止并移除
   ```

## 常见错误

1. **`permission denied` 连不上 daemon**：当前用户不在 `docker` 组。解决：`sudo usermod -aG docker $USER` 后**重新登录**；临时用 `sudo docker ...`。
2. **镜像越 build 越大**：没用 `.dockerignore` 也没清理。把 `apt` 缓存清理、`COPY` 只放必要文件，并加 `.dockerignore`（排除 `.git`、`node_modules`）。
3. **容器一启动就退出（Exited）**：Docker 容器在「主进程退出」后就停止。前台命令（如 `nginx -g 'daemon off;'`）要保持运行；别在容器里跑会立刻结束的脚本当主进程。
4. **数据丢失**：容器删了，里面写的文件也没了。数据库等需持久化的数据必须挂 `volume`（如 `db` 服务加 `volumes: ["dbdata:/var/lib/mysql"]`）。

## 小结

- 镜像=只读模板（Dockerfile 构建），容器=运行实例（有生命周期，删了可写层就没）。
- 三步曲：`docker run` 跑现成 → 写 `Dockerfile` 自制镜像 → `docker compose` 编排多服务。
- 进阶指引：镜像做好了，下一课用 MySQL 容器跑真实数据库，并学会备份恢复。
