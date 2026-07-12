# 🐧 Penguin Path · 企鹅之路

> 从 Linux 入门到高级 SRE 工程师的交互式学习系统。纯前端、零依赖、可离线运行。

Penguin Path 是一套面向运维 / SRE 成长路线的开源学习系统，覆盖 **L1 入门 → L12 高级** 共 45 门循序渐进的课程，并内置一个可交互的 Linux 模拟终端，免环境即可动手练习。

## ✨ 特性

- **12 级能力路线**：从「你好，Linux！」到「On-Call 体系与无责复盘」，按真实运维成长路径编排。
- **交互式沙盒**：内置 `emulator.js` 模拟终端，支持管道（`|`）、重定向（`>` / `>>`）、权限（`chmod`）等约 20+ 条命令，中文容错。
- **零依赖纯前端**：无需 Node / 构建工具，双击 `index.html` 即可在浏览器运行；也可通过 `tools/serve.py` 本地起服务。
- **可离线**：所有 CSS / JS / 课程数据内联，`dist/` 目录为自包含单文件版本，不受受限预览环境拦截外链脚本的影响。
- **进度可视化**：学习进度条 + 各能力级别完成度雷达图，进度本地保存（浏览器 localStorage）。
- **参考文档**：12 级总纲、环境搭建、学习资源、团队案例四份长文档，主页内嵌阅读。

## 📁 目录结构

```
linux-learning-system/
├── index.html            # 主入口（能力路线 / 进度看板 / 文档阅读 / 交互沙盒）
├── sandbox/              # 独立沙盒页（交互终端）
├── dist/                 # 自包含构建（零外链，可直接部署/离线）
├── assets/
│   ├── css/style.css     # 暗色极客风样式
│   └── js/               # app.js / emulator.js / sandbox.js / boot-check.js
├── content/              # 课程源文件（Markdown）+ 生成产物
│   ├── *.md              # 45 门课程源文件
│   ├── index.js          # 课程索引（window.__COURSE_INDEX__）
│   ├── courses.js        # 课程正文（window.__COURSES__）
│   └── docs.js           # 参考文档（window.__DOCS__）
├── docs/                 # 12级总纲 / 环境搭建 / 学习资源 / 团队案例（Markdown 源）
├── tools/                # 生成与校验脚本（零第三方依赖）
│   ├── gen_index.py      # 扫描 content/ 生成索引
│   ├── check.py          # 契约校验
│   ├── build_dist.py     # 打包自包含 dist
│   ├── serve.py          # 本地预览服务器（默认 http://127.0.0.1:8011/）
│   └── dispatch_board.py # 协作看板聚合
├── partner-workspace/    # 多 Agent 协作工作区（4 伙伴）
├── SCHEMA.md             # 数据契约
├── PROJECT.md            # 项目看板
├── README.md             # 本文件
└── LICENSE               # MIT License
```

## 🚀 快速开始

### 方式一：直接打开（推荐离线使用）
双击 `index.html`，或打开 `dist/index.html`（自包含版，无任何外链）。

### 方式二：本地服务器
```bash
python3 tools/serve.py
# 默认监听 http://127.0.0.1:8011/ ，可用参数覆盖：
#   python3 tools/serve.py 0.0.0.0 8080   # 监听所有网卡、端口 8080
```

### 方式三：部署到 GitHub Pages
将本仓库推送到 GitHub 后，在仓库 **Settings → Pages** 选择对应分支根目录即可。

## 🛠 开发与构建

```bash
# 1. 编辑 content/ 下课程源文件后，重新生成索引
python3 tools/gen_index.py

# 2. 校验课程契约（字段/依赖完整性）
python3 tools/check.py

# 3. 打包自包含 dist（内联全部资源，零外链）
python3 tools/build_dist.py
```

> 课程文件遵循 `SCHEMA.md` 契约：`key` / `level` / `title` / `lang` / `objective` / `prereq` / `estimated_min` / `sandbox` 等字段。L1–L3 额外含 `order` 字段对应原课程编排序号。

## 📚 课程路线一览

| 等级 | 主题 | 代表课程 |
|------|------|----------|
| L1 | 入门 | 你好，Linux！/ 文件与目录 / 写与整理 |
| L2 | 初级 | 路径是什么 / 权限与 chmod / 查找文件 |
| L3 | 初级 | grep / sed / awk |
| L4 | 初级 | 软件包管理 / 进程与信号 / systemd / 用户与组 |
| L5 | 中级 | Bash 变量 / 条件循环 / 函数 / 重定向 / 调试 |
| L6 | 中级 | ip / ss / DNS / SSH |
| L7 | 中级 | Docker / MySQL / Nginx |
| L8 | 中级 | Ansible / Roles / LEMP 实战 |
| L9 | 高级 | Prometheus 监控 / Alertmanager / 日志体系 |
| L10 | 高级 | sudo 加固 / 审计 / 防火墙 / SSH 防爆破 |
| L11 | 高级 | CPU / IO / 内存 / 网络调优 / 基准测试 |
| L12 | 高级 | SLO / Error Budget / 混沌工程 / GitOps / On-Call |

> 各等级主题依据真实课程标题归纳；完整 45 课见 `content/` 目录与系统内「能力路线」页。

## 📄 开源协议

本项目采用 **MIT License**，与底层编排工具 OpenClaw 保持一致。详见 [LICENSE](./LICENSE)。

## 🙏 致谢

课程路线与交互沙盒由 4 个 Agent（少年派 / 小码哥 / 小政哥 / 言秘书）协作构建，主控 QClaw 调度。