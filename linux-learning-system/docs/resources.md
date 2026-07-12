# 📚 Penguin Path · 学习资源推荐

> 言秘书整理。以下书籍、文档、课程、平台均为真实可查资源；链接尽量用官方/稳定地址。
> 资源持续更新，建议配合本项目 L1~L12 主线按需取用。

---

## 一、必读书籍

| 书名 | 理由 | 优先级 |
|------|------|--------|
| 《The Linux Command Line》（William Shotts，有免费中文译本《快乐的 Linux 命令行》） | 最友好的命令行入门书，从 shell 基础讲到脚本，概念清晰、例子多，零基础首选 | ⭐⭐⭐ 高 |
| 《鸟哥的 Linux 私房菜 基础学习篇》 | 中文世界经典，覆盖文件系统、权限、shell、网络，讲解细致，适合系统性打底 | ⭐⭐⭐ 高 |
| 《UNIX/Linux 系统管理技术手册》（Nemeth 等，第 5 版） | 系统管理"百科全书"，用户/进程/服务/网络/存储全涉及，进阶案头书 | ⭐⭐ 中 |
| 《Linux 命令行与 shell 脚本编程大全》（Richard Blum） | bash 脚本专题，变量/条件/函数/调试讲得透，配合本项目 L5 极好 | ⭐⭐ 中 |
| 《How Linux Works》（Brian Ward） | 讲清"系统是怎么跑起来的"：init、内核、设备、网络栈，适合想通透理解的人 | ⭐⭐ 中 |
| 《TCP/IP 详解 卷 1》（Stevens） | 网络底层权威，配合 L6/L7 网络与服务，深而经典 | ⭐ 低（按需） |

> 优先读免费/开源资源：《The Linux Command Line》官网提供完整 PDF 免费下载（linuxcommand.org）。

---

## 二、官方文档

| 资源 | 地址 | 说明 |
|------|------|------|
| Arch Wiki | https://wiki.archlinux.org | 近乎"通用 Linux 百科"，发行版无关，覆盖安装/网络/服务/排错，质量极高 |
| Debian 手册 | https://www.debian.org/doc/ | 官方使用手册，包管理(apt/dpkg)权威参考 |
| Ubuntu Server 文档 | https://ubuntu.com/server/docs | 服务器场景的官方指引，含 systemd/网络 |
| systemd 官方文档 | https://www.freedesktop.org/wiki/Software/systemd/ | unit 文件、`systemctl`/`journalctl` 最权威出处 |
| man7.org (Linux man pages) | https://man7.org | 在线 man 手册，查 `ip`/`ss`/`kill`/`signal` 等的精确语义 |
| Bash 参考手册 | https://www.gnu.org/software/bash/manual/ | bash 变量/引号/数组/流程控制官方定义 |
| IPv6/网络工具 iproute2 文档 | https://wiki.linuxfoundation.org/networking/iproute2 | `ip`/`ss` 命令族说明 |

---

## 三、在线课程

| 课程 | 平台 | 说明 |
|------|------|------|
| Introduction to Linux | edX / Linux Foundation | 免费入门课，证书可选，体系化 |
| Linux Command Line Basics | Udacity (免费) | 短平快，适合零基础摸终端 |
| LFCS / LFCE 认证课 | Linux Foundation | 面向系统管理员认证的付费系统课，覆盖 L4~L6 主题 |
| 红帽 RHCSA/RHCE 课程 | Red Hat / 各大培训机构 | RHEL 系系统管理实战，对应 yum/dnf、systemd |
| MIT 6.NULL / 各类高校"实用 Linux"公开课 | 各校 OCW | 偏实战的命令行与系统管理 |

> 提示：B 站/慕课也有大量中文 Linux 入门视频，关键词"鸟哥 Linux""尚硅谷 Linux"；注意甄别时效性，优先近 3 年内容。

---

## 四、免费实验平台（不装虚拟机也能练）

| 平台 | 地址 | 说明 |
|------|------|------|
| Killercoda | https://killercoda.com | 浏览器内即开即用的 Linux 实验场，含命令行/网络/K8s 场景，免登录试玩 |
| Play with Docker | https://labs.play-with-docker.com | Docker 官方提供的免费 4 小时沙盒，练习容器与命令 |
| Play with Kubernetes | https://labs.play-with-k8s.com | 同上，K8s 实验场 |
| overthewire (Bandit) | https://overthewire.org/wargames/bandit/ | 游戏化命令行闯关，从 `ssh` 基础到文本处理，趣味练手 |
| IBM Skills Network Labs | https://skills.network | 提供限时 Linux 实验环境 |
| 本项目交互沙盒 | 本仓库 `sandbox/index.html` | 由 emulator.js 模拟的浏览器终端，练 L1~L6 基础命令 |

> 本项目 `sandbox/` 仅模拟基础命令（help/ls/cd/ps/echo/cat/grep/| 等），系统级操作（useradd/systemctl/网络）请在上述真实平台练习。

---

## 五、中文社区与问答

| 社区 | 地址 | 说明 |
|------|------|------|
| 知乎 Linux 话题 | https://www.zhihu.com/topic/19550956 | 大量科普与实战长文 |
| V2EX 技术节点 | https://www.v2ex.com/?node=linux | 日常讨论、踩坑分享 |
| 博客园 / CSDN Linux 频道 | https://www.cnblogs.com / https://www.csdn.net | 中文教程与排错笔记（注意甄别时效性） |
| Stack Overflow (英文) | https://stackoverflow.com | 提问前先搜，标签 `[linux]` `[bash]` `[ssh]` |
| Unix & Linux Stack Exchange | https://unix.stackexchange.com | 比 SO 更专精的 Unix/Linux 问答社区 |
| Arch 中文论坛 / 各发行版官方论坛 | 见各官网 | 发行版专属问题的一手来源 |
| GitHub / GitLab 开源项目 | https://github.com | 读源码、提 issue，跟真实工程学习 |

---

## 使用建议

1. **先主线后扩展**：按本项目 L1→L6 顺序刷完图文课 + 沙盒，再按需深入书籍/官方文档。
2. **动手优先**：每看一个命令，立刻在 Killercoda 或本项目沙盒敲一遍，比只读强十倍。
3. **排错靠官方**：遇到命令语义不清，首选 `man` 与 man7.org；发行版问题查对应 Wiki。
4. **社区提问艺术**：先 `man`/`search`/看日志，附上命令+完整报错+环境，别人更愿意帮你。
