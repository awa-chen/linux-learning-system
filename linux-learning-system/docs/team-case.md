# 团队整改协作案例 · Penguin Path 企鹅之路

> 一份**可复用的多 Agent 协作实战复盘**：如何把"一个人闷头做"变成"一个指挥 + 四个专业伙伴并行交付"，并把产物用工程手段自动收口、零废话、零冲突、零弄虚作假。
> 本文件本身即案例产物——它记录的是「我们这次怎么把 Linux 学习系统做出来的」，而不是系统使用说明。

---

## 一、背景：为什么要用团队协作来做

用户要一个「从入门到高级工程师的 Linux 学习系统」，不限语言、轻量级。需求体量不小：

- 40 篇图文课程（L1 入门 → L12 高级 SRE）
- 一个浏览器内 Linux 模拟终端（沙盒）
- 暗色极客风样式、学习资源文档、环境搭建文档
- 一个 12 级能力总纲
- 一套可自动校验的质量门禁

一个人串行做会慢、且容易顾此失彼。**正确做法**：主 Agent 当"技术总监/架构/集成者"，把内容按能力阶段切分给 4 个专业伙伴并行干，最后用脚本自动收口。

---

## 二、角色分工（谁干什么，边界清晰）

| 角色 | 身份 | 负责范围 | 交付物 |
|------|------|----------|--------|
| 🦞 主 Agent（总监） | 架构 + 集成收口 | 目录骨架、接口契约、索引生成器、主页/沙盒壳、最终集成与验收 | `SCHEMA.md` `PROJECT.md` `tools/gen_index.py` `index.html` `assets/js/app.js` `sandbox/*` `docs/team-case.md` |
| 🛠️ 小码哥 | 技术执行 | 沙盒内核 + L1~L3 入门 | `assets/js/emulator.js` + 9 课 + `steps.js`(24 步) |
| 📝 言秘书 | 文字创作 | 样式 + 资源 + L4~L6 初级 | `assets/css/style.css` `docs/resources.md` + 13 课 + `steps.js`(8 步) |
| 🔧 小政哥 | 执行操作 | 校验器 + 环境 + L10~L11 高级 | `tools/check.py` `docs/setup-env.md` + 9 课 + `steps.js`(6 步) |
| 🧭 少年派 | 协调 + 中级 | 总纲 + L7~L9 中级 + 汇总 | `docs/roadmap.md` + 9 课 + `steps.js`(4 步) + `COORD.md` |

**关键纪律**：每个伙伴只写自己目录与 `partner-workspace/<自己id>/`，**互不碰他人文件、不改 SCHEMA/PROJECT**。集成收口只由主 Agent 做。

---

## 三、协作机制：三道"防冲突 + 防废话"的闸门

### 1. 契约先行（SCHEMA.md = 接口合同）
开工前主 Agent 写好 `SCHEMA.md`，定死：
- 课程 frontmatter 全字段：`key / level / lang / objective / prereq / estimated_min / sandbox`
- `lang` 枚举（不许自造）、`level` 必须是 L1~L12
- 每课固定四章：`讲解 / 动手实验 / 常见错误 / 小结`
- STEPS 三铁律：`key` 与课程一致、`checker` 必须浏览器纯函数、`sandbox:false` 的课不写 STEPS
- ID 区间互不踩踏：小码哥 `1xx`、言秘书 `4xx`、少年派 `7xx`、小政哥 `1xxx`

> **教训点**：约定初期 STEPS 想让大家往同一个 `course.js` 里 append，会并发冲突。改成每人独立写 `partner-workspace/<id>/steps.js` 往全局数组 `push` ——**分片优于并发写同一文件**。

### 2. 分片写入（避免文件级冲突）
每个伙伴在各自 `steps.js` 里做 `if (!window.__PENGUIN_STEPS) window.__PENGUIN_STEPS = []; window.__PENGUIN_STEPS.push({...})`。沙盒页按固定顺序加载 4 个分片，自动合并。谁也不用等谁，谁也不覆盖谁。

### 3. 自动化收口（脚本代替人工拼装）
主 Agent 提供两个零依赖脚本：
- `tools/gen_index.py`：扫 `content/*.md` → 生成 `index.json` / `index.js` / `courses.js`，并做 frontmatter 合法性 + key 唯一 + prereq 存在性校验。
- `tools/check.py`：课程契约校验 + 索引一致性 + 沙盒 STEPS 联动校验，输出中文报告 + 退出码（供 CI）。

> 最终验收一句话：**`python3 tools/check.py` → 通过 82 / 失败 0**。

---

## 四、全流程时间线（真实发生）

1. **架构**：主 Agent 建 `linux-learning-system/`（assets/content/docs/partner-workspace/sandbox/tools），写 `SCHEMA.md`、`PROJECT.md` 看板。
2. **派单**：并行 spawn 4 个子 Agent，各自认领 L1~L3 / L4~L6 / L7~L9 / L10~L11 + 公共件。
3. **并行产出**：四伙伴在各自目录落地课件与 `steps.js`，互不干扰。
4. **集成收口**（主 Agent）：
   - 发现并修复 3 处接口错位：
     - STEPS 全局变量名 `__PENGUIN_STEPS`（伙伴写）vs `__PENGUIN_STEPS__`（主页读）→ 让读取端兼容两种写法；
     - 沙盒重置接口 `emulator.reset()` 实际是 `emulator.createContext()` → 对齐；
     - `gen_index.py` 在 Windows 控制台因 cp1252 打印中文崩溃 → 强制 stdout UTF-8（文件写入本身正常）。
   - **增强沙盒内核**：原 `emulator.js` 不支持 `&&`/`;` 串联，学习场景几乎必用 → 在不破坏现有 24 条命令的前提下补上链执行（尊重引号），Node 烟测全绿。
5. **验收**：`check.py` 82/82 通过；Node 模拟浏览器加载顺序做三方一致性核对（40 课程 = 40 正文 = 42 步骤 完全对齐）；`emulator` 单测 `help/ls/cd/管道/chmod/&&/clear` 全部正常。
6. **沉淀**：产出本案例文档。

---

## 五、质量与诚信红线（本案例的底线）

- **不弄虚作假**：所有命令/配置/资源文档均真实可查（如资源文档里的 Killercoda、Play-with-Docker 等实验平台是真实存在的）；沙盒步骤的 `checker` 一律浏览器纯函数，不编造假校验。
- **诚实标注沙盒边界**：配置/架构类高级课（nginx/ansible/prometheus）在浏览器沙盒里交互价值低，伙伴们**主动只给"纯命令/纯文件创建"课开 sandbox**，其余标 `sandbox:false` 并提示"请在真实环境练习"——不堆无效 STEPS。
- **可离线、零依赖**：整个系统纯 HTML/CSS/JS + Python 校验，无 npm install、无 CDN，双击 `index.html` 即开，手机也能看。

---

## 六、成果清单（可交付物）

```
linux-learning-system/
├── index.html                 # 主页（路线图+进度+雷达图+课程阅读器）
├── SCHEMA.md / PROJECT.md     # 契约 + 看板
├── assets/
│   ├── css/style.css          # 暗色极客风样式
│   └── js/
│       ├── emulator.js        # 浏览器内 Linux 模拟内核（24 命令 + 管道/重定向/&&/;/权限/三剑客）
│       ├── app.js             # 主页逻辑（零依赖极简 MD 渲染 + 雷达图）
│       └── sandbox.js         # 沙盒控制器（引导式逐步骤练习）
├── content/                   # 40 篇图文课（L1~L12），每课 frontmatter 合法
│   ├── index.json / index.js / courses.js   # 自动生成索引
├── docs/
│   ├── roadmap.md             # 12 级能力总纲
│   ├── resources.md           # 真实学习资源
│   ├── setup-env.md           # 环境搭建（虚拟机/WSL2/云主机/容器）
│   └── team-case.md           # 本文件
├── tools/
│   ├── gen_index.py           # 索引生成 + 契约校验
│   └── check.py               # 质量门禁（82/82 通过）
├── sandbox/index.html         # 交互沙盒页
└── partner-workspace/<id>/    # 4 伙伴各自的 steps.js 分片 + 报告
```

---

## 七、可复用的协作方法论（拿走即用）

1. **能并行就并行**：按"能力阶段"或"文件维度"切分，让多个 Agent 同时干，总监只做集成。
2. **契约先于内容**：先写接口/字段/枚举合同（SCHEMA），再让伙伴填内容；CI 兜底。
3. **分片优于并发写同文件**：全局状态用"每人独立文件 push 全局数组"模式，彻底消灭文件级冲突。
4. **脚本收口，不靠人工拼装**：索引生成、一致性校验、质量门禁全部脚本化，结果可复现。
5. **集成时做"接口对齐"而非"内容审查"**：主 Agent 重点核对变量名/函数签名/数据格式是否对齐，内容质量交给各伙伴对自己负责。
6. **边界纪律**：协调者不越权改他人文件；谁写谁负责，集成者只做跨文件缝合。
7. **诚实优于凑数**：做不到/交互价值低的部分，明确标注边界（如 `sandbox:false`），绝不编造。

---

*本案例由主 Agent（QClaw 小虾）在 4 伙伴并行交付后集成收口时撰写，作为「多 Agent 团队合作完成大型内容+工程产出」的复盘样本。*
