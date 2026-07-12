# 小政哥交付报告（Penguin Path / 企鹅之路）

> 范围：校验器 `tools/check.py` + 环境文档 `docs/setup-env.md` + L10~L11 全部图文课程 + 沙盒步骤分片
> 日期：2026-07-12 ｜ 角色：小政哥（执行操作伙伴）

---

## 一、交付文件清单

### 1. 校验脚本（契约第 6 节质量门禁）
- `tools/check.py` — 零第三方依赖（仅 Python3 标准库）的本地校验器。
  - 顶部用法注释：`python3 tools/check.py`（支持可选传入根目录参数）。

### 2. 环境搭建文档
- `docs/setup-env.md` — 真实可操作的练习环境搭建指南，覆盖四种方式：
  - 本地虚拟机（VirtualBox/VMware/Hyper-V，推荐 Rocky Linux 9 最小化安装，含完整安装与初始化命令）
  - WSL2（安装 + 开启 systemd 的 `/etc/wsl.conf` 配置 + 重启生效）
  - 云主机（阿里云/腾讯云轻量，给出 2C2G / 2C4G 配置与约 ¥50~110/月 参考区间，含登录初始化）
  - 容器（docker run centos/ubuntu/rockylinux + 初始化 + 多队列 systemd 技巧）
  - 文末附"练习环境最小清单"对照课程。

### 3. L10 安全加固（shell，4 课）
| 文件 | key | sandbox | 主题 |
|------|-----|---------|------|
| `content/l10-sudo.md` | l10-sudo | true | sudo 精细授权 / 禁止 root 登录 |
| `content/l10-sshsec.md` | l10-sshsec | false | SSH 加固 / fail2ban 防爆破 |
| `content/l10-firewall.md` | l10-firewall | false | iptables / nftables / firewalld 默认拒绝 |
| `content/l10-audit.md` | l10-audit | false | auditd / lynis / AIDE 文件完整性 |

### 4. L11 性能调优（shell，5 课）
| 文件 | key | sandbox | 主题 |
|------|-----|---------|------|
| `content/l11-cpu.md` | l11-cpu | true | top / mpstat / pidstat / 负载（USE 方法） |
| `content/l11-mem.md` | l11-mem | false | free / vmstat / OOM / oom_score_adj |
| `content/l11-io.md` | l11-io | false | iostat / iotop / 调度器 / 队列深度 |
| `content/l11-net.md` | l11-net | false | sysctl 网络参数 / 网卡多队列 |
| `content/l11-bench.md` | l11-bench | false | sysbench / fio / wrk 基准测试 |

> 所有课程均带合规 frontmatter（key/level/lang/objective/prereq/estimated_min/sandbox），
> 并含四个固定章节：讲解 / 动手实验 / 常见错误 / 小结。命令均经得起敲（已交叉核对 RHEL 9 / Debian 差异）。

### 5. 沙盒步骤分片
- `partner-workspace/xiaozhengge/steps.js` — 仅对 `sandbox:true` 的两课生成 STEPS：
  - `l10-sudo`：3 步（visudo -c / sudo -l / sudo systemctl restart nginx）
  - `l11-cpu`：3 步（uptime / mpstat / pidstat）
  - 共 6 个 STEPS，id 从 1001 起递增，checker 均为浏览器纯函数，key 与对应 md 完全一致。
  - 其余 7 课 sandbox:false，按契约不写 STEPS（沙盒页自动显示"请在真实环境练习"）。

---

## 二、校验脚本设计要点

- **[1] frontmatter 校验**：必须含 7 个必填字段；level ∈ {L1..L12}；lang ∈ 枚举集；
  key 全局唯一且匹配文件名（`<key>.md`）；objective 非空；prereq 必须是数组；
  estimated_min 正整数；sandbox 必须是布尔。每个错误给出 `文件名:行号 + 原因`。
- **[2] index.json 一致性**：若文件存在，校验每条 entry 的 key/level/title 与 md 一致，
  file 字段指向真实文件；不存在则跳过（由主 agent 汇总生成）。
- **[3] steps.js 联动校验**：解析各 `partner-workspace/*/steps.js` 的 STEPS（括号配平，
  正确处理 checker 箭头函数内嵌套 `{}`，支持单 `push(...)` 多对象），要求：
  - STEPS 的 key 在 content 中能找到对应 md；
  - 对应课程必须 sandbox:true（sandbox:false 却写 STEPS 判失败）；
  - 每个 STEPS 必须含 checker 字段。
- **输出与退出码**：中文报告（通过/失败分项统计 + 失败明细），退出码 0=全通过、1=有失败，供 CI 使用。
- **健壮性**：自动以 UTF-8 输出（修复 Windows 控制台 cp1252 中文乱码崩溃）；frontmatter 解析兼容 BOM。

### 自测结果
- 正向：对完整项目（含其他伙伴已交付的 content/STEPS）运行 `python3 tools/check.py`
  → **全部通过，退出码 0**。
- 负向（临时构造坏样本）：bad.md 触发 6 条 frontmatter 错误（精确行号）+ steps.js 触发
  2 条联动错误 → **退出码 1**，错误信息含文件名+行号+原因。验证通过。

---

## 三、环境文档要点

- 四种方式取舍表，新手推荐 WSL2/容器，贴近生产用虚拟机/云主机。
- 虚拟机：VirtualBox 创建步骤 + Rocky 9 最小化安装 + 中科大换源提速。
- WSL2：`wsl --install` + `/etc/wsl.conf` 开启 systemd + `wsl --shutdown` 生效。
- 云主机：阿里云/腾讯云轻量 2C2G~2C4G 规格，参考月费 ¥50~110，安全组配合防火墙。
- 容器：`docker run -it rockylinux:9 bash` + 初始化 + 特权模式跑 systemd 技巧。
- 不编造工具：仅使用系统自带 / 主流开源（dnf/apt/docker/wsl/fail2ban 等）命令。

---

## 四、约束遵守

- 未修改 `SCHEMA.md` / `PROJECT.md` 或他人目录，仅新增本角色负责文件。
- frontmatter 格式严格遵循 SCHEMA 第 3 节；STEPS 格式严格遵循第 4 节。
- 高级课多为概念/配置，仅对少量适合命令演示的课（l10-sudo、l11-cpu）生成沙盒步骤，其余设 sandbox:false。
