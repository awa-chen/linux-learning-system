# 练习环境搭建（Penguin Path / 企鹅之路）

> 本文档教你准备一台能"真刀真枪"练 L1~L12 课程的 Linux 环境。
> 目标：命令经得起敲，不依赖任何在线服务即可学习。
> 四种方式任选其一，推荐新手从 **容器** 或 **WSL2** 起步，想贴近生产再上 **虚拟机/云主机**。

---

## 0. 先说结论：选哪种？

| 方式 | 上手难度 | 隔离性 | 资源占用 | 适合场景 |
|------|----------|--------|----------|----------|
| 本地虚拟机（VirtualBox/VMware/Hyper-V） | 中 | 强 | 高（需 2G+ 内存） | 想完整体验开机/分区/GRUB/救援模式 |
| WSL2（Windows 自带） | 低 | 中 | 低 | Windows 用户日常练习，最接近真机 |
| 云主机（阿里云/腾讯云轻量） | 低 | 强 | 需花钱 | 想有公网 IP、练 SSH/防火墙/Web |
| 容器（Docker） | 低 | 弱（共享内核） | 极低 | 快速起个 shell 练命令，几秒搞定 |

---

## 1. 本地虚拟机（推荐 Rocky Linux 9 最小化安装）

> Rocky Linux 9 是 RHEL 9 的社区克隆，免费、稳定、企业生产级，最适合学习。

### 1.1 选择虚拟化软件
- **VirtualBox**（免费、跨平台）：https://www.virtualbox.org
- **VMware Workstation Player / Pro**（Windows/Linux）：https://www.vmware.com
- **Hyper-V**（Windows 专业版/企业版自带，仅 Windows）

### 1.2 下载系统镜像
- Rocky Linux 9 最小化 ISO：`https://rockylinux.org/download`（选 "Minimal" 约 1.3GB）
- 备用：AlmaLinux 9、CentOS Stream 9（命令几乎一致）

### 1.3 创建虚拟机（以 VirtualBox 为例）
1. 新建 → 名称 `penguin-lab` → 类型 `Linux` / 版本 `Red Hat (64-bit)`。
2. 内存 ≥ 2048 MB；硬盘 ≥ 20 GB（VDI，动态分配）。
3. 设置 → 存储 → 控制器 IDE 挂载刚才下的 `Rocky-9-...-minimal.iso`。
4. 网络：默认 `NAT` 即可；想主机直连用 `桥接网卡`。
5. 启动 → 安装界面选 `Install Rocky Linux 9` → 语言选中文或 English。

### 1.4 安装过程要点
- 安装目标（Installation Destination）：自动分区即可（新手）。
- 软件选择（Software Selection）：**最小安装（Minimal Install）**。
- 用户设置：设置 root 密码 + 新建一个普通用户并勾选"将此用户设为管理员"。
- 完成 → 重启，弹出 ISO → 进入系统。

### 1.5 首次登录后的初始化命令
```bash
# 更新系统（中国大陆用户可先换镜像源，见下文）
sudo dnf update -y

# 安装常用工具（最小化安装缺很多命令，L6 以后必用）
sudo dnf install -y vim net-tools iproute-traceroute bind-utils \
        bash-completion tar gzip unzip wget curl git tree

# 确认里有 sudo（普通用户提权用，L10 会讲精细授权）
sudo whoami        # 应输出 root

# 关闭 SELinux 仅用于练习环境（可选，生产勿关）
getenforce
```

> 换源（中科大 Rocky 镜像，练习机提速）：
> ```bash
> sudo sed -i 's|^mirrorlist=|#mirrorlist=|g; s|^#baseurl=http://dl.rockylinux.org|baseurl=https://mirrors.ustc.edu.cn/rocky|g' /etc/yum.repos.d/rocky*.repo
> sudo dnf makecache
> ```

---

## 2. WSL2（Windows 用户最省事）

### 2.1 一键安装
以**管理员**打开 PowerShell：
```powershell
wsl --install
# 默认装 Ubuntu；重启后按提示设用户名/密码
```
如需指定发行版（推荐 Ubuntu 22.04 或 Debian）：
```powershell
wsl --list --online      # 查看可安装列表
wsl --install -d Ubuntu-22.04
```

### 2.2 开启 systemd（很多服务依赖它）
WSL2 默认不带 systemd。编辑 `/etc/wsl.conf`：
```bash
sudo tee /etc/wsl.conf > /dev/null <<'EOF'
[boot]
systemd=true
EOF
```
回到 **PowerShell** 重启 WSL 使配置生效：
```powershell
wsl --shutdown
wsl
```
进入后验证：
```bash
ps -p 1 -o comm=     # 输出 systemd 即成功
```

### 2.3 常用设置
```bash
# 更新
sudo apt update && sudo apt full-upgrade -y

# 装工具（Debian/Ubuntu 系用 apt）
sudo apt install -y vim net-tools iproute2 dnsutils \
        bash-completion tar gzip unzip wget curl git tree

# 在文件资源管理器访问 WSL 文件：\\wsl$\<发行版名>\
```

> 想练 Rocky/Alibaba 系？WSL 商店也有 `Rocky Linux` 可用，安装方式同上 `wsl --install -d Rocky`。

---

## 3. 云主机（阿里云 / 腾讯云轻量应用服务器）

> 适合想有公网 IP、练 SSH 加固、防火墙、Nginx 的场景。费用以 2026 年常见促销价估算，**实际以下单页为准**。

### 3.1 配置与月费区间参考
| 厂商 | 规格 | 系统盘 | 带宽/流量 | 参考月费（新用户促销） |
|------|------|--------|-----------|------------------------|
| 腾讯云轻量应用服务器 | 2 核 2G | 40~60 GB SSD | 3~4 Mbps / 200~300 GB 流量 | ¥50 ~ ¥70 |
| 腾讯云轻量应用服务器 | 2 核 4G | 60~80 GB SSD | 4~5 Mbps / 300~500 GB 流量 | ¥80 ~ ¥110 |
| 阿里云轻量应用服务器 | 2 核 2G | 40~60 GB SSD | 3~4 Mbps / 200~300 GB 流量 | ¥50 ~ ¥70 |
| 阿里云 ECS（突发型） | 2 核 2G | 40 GB | 按量/包年 | ¥60 ~ ¥90 |

- 镜像选 **Rocky Linux 9 / AlmaLinux 9 / Ubuntu 22.04 LTS** 均可。
- 新用户首年常有 ¥几十 的特价，老用户价约翻倍。

### 3.2 登录与初始化
购买后在控制台"重置密码"或下载密钥，然后用本地终端登录：
```bash
# 密钥方式（推荐）
ssh -i ~/.ssh/id_rsa <用户名>@<公网IP>

# 或密码方式
ssh <用户名>@<公网IP>
```
登录后立即做三件事（与 L10 呼应）：
```bash
# 1) 更新
sudo dnf update -y          # RHEL 系
#   或 sudo apt update && sudo apt upgrade -y   # Debian/Ubuntu 系

# 2) 新建普通用户并给 sudo（不要长期用 root 直登）
sudo adduser lab && sudo usermod -aG wheel lab    # RHEL 系
#   或 sudo adduser lab && sudo usermod -aG sudo lab  # Debian 系

# 3) 配置防火墙默认拒绝（详见 L10-firewall）
```
> ⚠️ 云主机安全组也要在厂商控制台设置，只放行 22/80/443 等必要端口。

---

## 4. 容器方式（Docker，最快起手）

> 几秒起一个 Linux，练命令零负担。注意：容器共享宿主机内核，无法练 GRUB/内核参数/完整 systemd（可用 `docker run --privileged` 或 `systemd` 镜像弥补部分需求）。

### 4.1 安装 Docker
- Windows / macOS：装 Docker Desktop（https://www.docker.com/products/docker-desktop/）。
- Linux：`curl -fsSL https://get.docker.com | sudo sh`

### 4.2 起一个练习容器
```bash
# CentOS Stream 9
docker run -it --name penguin-lab centos:stream9 bash

# 或 Ubuntu 22.04
docker run -it --name penguin-lab ubuntu:22.04 bash

# 或 Rocky Linux 9（贴近生产推荐）
docker run -it --name penguin-lab rockylinux:9 bash
```

### 4.3 初始化容器里的系统
```bash
# Rocky/CentOS（RHEL 系）
dnf update -y && dnf install -y vim net-tools iproute bind-utils \
        bash-completion tar gzip unzip wget curl git tree

# Ubuntu（Debian 系）
apt update && apt install -y vim iproute2 dnsutils \
        bash-completion tar gzip unzip wget curl git tree
```

### 4.4 常用容器操作
```bash
docker ps -a                       # 查看容器（含已退出）
docker start -ai penguin-lab       # 重新进入交互
docker exec -it penguin-lab bash   # 在运行中的容器再开一个 shell
docker rm -f penguin-lab           # 删掉重来
```
> 想练 systemd 管理的服务？用特权模式：`docker run -it --privileged --name lab rockylinux:9 /sbin/init`，
> 然后在另开终端 `docker exec -it lab bash`，里面 `systemctl` 即可用。

---

## 5. 练习环境最小清单（对照课程）

- [ ] 能 `ssh` / `wsl` / `docker exec` 进入一台 Linux。
- [ ] 有普通用户且能 `sudo`（L4/L10）。
- [ ] 装好 `vim curl wget git net-tools`（L2~L6 全程用到）。
- [ ] 能 `dnf update` / `apt update`（联网）。
- [ ] 想练内核/防火墙/审计：优先虚拟机或云主机，而非容器。

> 下一步：回到课程 L1 开始"你好，Linux！"。遇到命令不懂，用 `man <命令>` 或 `<命令> --help`。
