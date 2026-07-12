---
key: l4-package
level: L4
title: 软件包管理（apt / yum / dnf）
lang: shell
objective: 掌握 Debian 系 apt 与 RHEL 系 yum/dnf 的装包、查包、卸包日常操作
prereq: ["l1-hello"]
estimated_min: 18
sandbox: false
---

# 软件包管理（apt / yum / dnf）

## 讲解

Linux 上"装软件"一般不从官网下安装包双击，而是交给**包管理器**：它从软件源（repository）下载 `.deb`（Debian/Ubuntu）或 `.rpm`（RHEL/CentOS）包，自动解决依赖、登记到系统数据库、还能干净卸载。这样做的好处是"一处安装、全网可复现"，也是 DevOps 自动化的基础。

两大阵营：
- **Debian/Ubuntu 系** → `apt`（底层是 `dpkg`）。
- **RHEL/CentOS 系** → 老版用 `yum`，CentOS 8+/Fedora 推荐 `dnf`（`dnf` 是 `yum` 的下一代，命令基本兼容）。

记住一句：装之前先 `update`（刷新软件源索引），否则可能装到旧版本或找不到包。

## 动手实验

1. 刷新软件源索引（Debian 系 / RHEL 系）：
   ```bash
   sudo apt update            # Debian/Ubuntu
   sudo dnf check-update      # RHEL/Fedora (yum 同)
   ```

2. 搜索并安装软件：
   ```bash
   apt search htop
   sudo apt install -y htop
   # RHEL 系：
   dnf search htop
   sudo dnf install -y htop
   ```
   说明：`-y` 自动回答"是"，脚本里常用；交互安装可去掉。

3. 查看已装包的详情 / 文件列表：
   ```bash
   dpkg -l | grep htop        # 是否已装
   dpkg -L htop               # 这个包装了哪些文件
   # RHEL 系：
   rpm -q htop
   rpm -ql htop
   ```

4. 卸载（保留/删除配置）：
   ```bash
   sudo apt remove htop       # 保留配置
   sudo apt purge htop        # 连配置文件一起删
   # RHEL 系：
   sudo dnf remove htop
   ```

5. 升级全部已装包（谨慎，生产先测试）：
   ```bash
   sudo apt upgrade -y
   sudo dnf upgrade -y
   ```

## 常见错误

- **`apt` 报 "Unable to locate package"**：多半是没先 `sudo apt update` 刷新索引；或包名拼错。先 update 再装。
- **两套命令混用**：在 Ubuntu 上敲 `yum`、在 CentOS 上敲 `apt` 都会"命令未找到"。先确认发行版：`cat /etc/os-release`。
- **`upgrade` 把生产环境搞崩**：无差别升级可能引入不兼容。生产机先在 staging 验证，或锁定关键包版本（`apt-mark hold`）。
- **用 pip/npm 装系统级工具**：能用系统包管理器就用它，混用会导致依赖库版本冲突、难以审计。

## 小结

1. 包管理器负责下载、依赖解析、登记与卸载，是 Linux 装软件的标准入口。
2. Debian 系用 `apt`（底层 `dpkg`），RHEL 系用 `dnf`/`yum`（底层 `rpm`）。
3. 装前先 `update`，卸可用 `remove`（留配置）或 `purge`/`remove`（清配置）。

进阶：L8 Ansible 的 `apt`/`dnf` 模块，本质就是把本课命令写成可重复执行的剧本。
