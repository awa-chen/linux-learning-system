# 言秘书 · 交付报告（Penguin Path 企鹅之路 · L4~L6 + 视觉 + 资源）

> 迭代范围：视觉样式、学习资源、初级三关（L4 系统管理 / L5 Shell 编程 / L6 网络基础）图文课与沙盒步骤分片。
> 遵守契约：未改动 SCHEMA.md / PROJECT.md / 他人目录，仅写入本人负责文件。

---

## 一、文件清单

### 1. 全局样式表
- `assets/css/style.css` —— 零框架依赖暗色极客风样式表（含详细头部注释说明配色与栅格思路）。

### 2. 学习资源文档
- `docs/resources.md` —— 表格化推荐：必读书籍（书名/理由/优先级）、官方文档（资源/地址/说明）、在线课程、免费实验平台（Killercoda / Play-with-Docker 等）、中文社区。全部真实可查。

### 3. L4 系统管理（shell）图文课 · 4 课
- `content/l4-user.md` —— 用户/组/`useradd`/`passwd`/`groupadd`/`usermod`（sandbox:false）
- `content/l4-process.md` —— `ps`/`top`/`kill`/信号（**sandbox:true**）
- `content/l4-service.md` —— `systemd`/`systemctl`/`journalctl`（sandbox:false）
- `content/l4-package.md` —— `apt`/`yum`/`dnf` 包管理（sandbox:false）

### 4. L5 Shell 编程（bash）图文课 · 5 课
- `content/l5-var.md` —— 变量/引号/数组/位置参数（sandbox:false）
- `content/l5-cond.md` —— 条件判断/`for`/`while`/`case`（sandbox:false）
- `content/l5-func.md` —— 函数/参数/`return`/`local`（sandbox:false）
- `content/l5-io.md` —— 重定向/管道/here-doc（**sandbox:true**）
- `content/l5-debug.md` —— `set -eux`/管道符/`trap`（sandbox:false）

### 5. L6 网络基础（shell）图文课 · 4 课
- `content/l6-ip.md` —— `ip` 命令族/接口/路由（sandbox:false）
- `content/l6-ss.md` —— `ss` 端口/连接（sandbox:false）
- `content/l6-dns.md` —— `dig`/`nslookup`/`resolv.conf`（sandbox:false）
- `content/l6-ssh.md` —— 密钥/`ProxyJump`/端口转发（sandbox:false）

### 6. 沙盒步骤分片
- `partner-workspace/yanmishu/steps.js` —— 向全局 `window.__PENGUIN_STEPS__` 推入 STEPS。

**合计 13 个 content 文件 + 1 样式 + 1 资源文档 + 1 步骤分片 = 16 个交付文件。**

---

## 二、样式设计要点（assets/css/style.css）

- **配色（CSS 变量，集中在 `:root`）**：严格对齐 `linux-learning.html` 观感——
  `--bg:#0a0e14`（近黑深蓝）、`--surface:#131820`、`--border:#1e293b`、`--text:#bfc7d5`、
  `--accent:#39c981`（青绿/成功/主操作）、`--info:#5ccfe6`、`--warn:#ffb454`、`--error:#ff6b6b`、
  `--cmd:#73d0ff`（命令文本）、`--output:#8b9dc3`、`--prompt:#39c981`。改一处即可整体换肤。
- **栅格**：
  - 主页 `.app-shell` 用 CSS Grid（`264px` 侧栏 + 自适应主区）；`.reader` 固定定位从右滑入。
  - 沙盒页 `.sandbox-shell` flex 纵向，`.sandbox-body` Grid（`320px` 引导栏 + 终端）。
  - 间距统一 `--gap:12px`、圆角 `--radius:6px`，字号偏好等宽字体。
- **覆盖的主 agent 类名**（均已在界面中使用）：`.app-shell` `.sidebar` `.topbar` `.card` `.btn` `.btn-primary` `.level-badge` `.radar` `.progress-bar` `.course-list` `.course-item(.done)` `.terminal` `.term-output` `.term-input` `.step(.done/.active)` `.tag` `.alert`，并补充 `.reader` `.panel` `.roadmap` `.level-col` 等主页组件样式、`.sandbox-*`/`.guide-*` 沙盒组件样式，以及正文 Markdown 渲染后的 `h1~h6/code/pre/ul/ol`。
- **响应式**：`@media (max-width:860px)` 侧栏转为顶部横向导航、沙盒两栏堆叠；`@media (max-width:560px)` 路线图单列。

---

## 三、沙盒步骤说明（steps.js）

- **id 自 401 起递增**，避开 xiaomage 等其它分片（1~）的全局冲突；渲染时主 agent 会按 key 重排。
- **仅 2 课产出 STEPS**（其余 11 课为概念/配置型，已设 `sandbox:false` 不写步骤）：
  - `l4-process`：401 `ps`、402 `ps -ef`、403 `ps aux`、404 `ps | grep bash`（4 步）。
  - `l5-io`：405 `echo > note.txt`、406 `echo >> note.txt`、407 `cat note.txt`、408 `cat note.txt | grep penguin`（4 步）。
  - 共 **8 个 STEPS**，key 与对应 md frontmatter 完全一致。
- **checker 均为浏览器内纯函数**：仅依赖输入字符串，做归一化（去首尾/合并空格）后精确或正则匹配；不依赖任何 Node API，沙盒页可直跑。
- 选这两课的原因：SCHEMA §4 规定模拟器内核支持 `ps`、`|`、`echo`、`cat`、`grep` 等命令，而 `l4-process`/`l5-io` 的练习步骤恰好落在该支持范围内；用户/服务/包管理/网络等命令（useradd、systemctl、ip、ss、dig、ssh 等）模拟器不支持，强写步骤会导致 checker 永远失败，故诚实地设为 `sandbox:false`。

---

## 四、资源来源说明（docs/resources.md）

- 书籍均为真实出版物（如 William Shotts《The Linux Command Line》、鸟哥《Linux 私房菜》、Nemeth《UNIX/Linux 系统管理技术手册》等），并标注免费获取渠道（linuxcommand.org 提供免费 PDF）。
- 官方文档链接指向 Arch Wiki、Debian/Ubuntu 官方手册、freedesktop systemd、man7.org、GNU Bash 手册等稳定官方源。
- 实验平台为真实免费服务：Killercoda、Play with Docker、Play with Kubernetes、OverTheWire Bandit；并明确标注本项目沙盒仅模拟基础命令，系统级操作仍需真实平台。
- 社区链接指向 Stack Overflow、Unix & Linux Stack Exchange、知乎/V2EX 等真实站点。未编造任何书名或链接。

---

## 五、一致性自检

- 13 个 content 文件 frontmatter 均含 `key/level/lang/objective/prereq/estimated_min/sandbox` 六字段，格式符合 SCHEMA §3。
- 全部 `level` ∈ {L4,L5,L6}；`lang` 取值 ∈ {shell,bash}（符合 L4/L6=shell、L5=bash）。
- `sandbox:true` 的 2 课（l4-process、l5-io）在 steps.js 中均有对应 STEPS；`sandbox:false` 的 11 课均无 STEPS——与契约"不宜沙盒的课不写 STEPS"一致。
- 未触碰 SCHEMA.md / PROJECT.md / 他人目录。
