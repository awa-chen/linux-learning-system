# Linux 学习系统 — 架构与契约（SCHEMA v1）

> 本文件是团队共建的"接口契约"。所有伙伴产出的内容/代码都必须遵守，否则主 agent 集成时会失败。
> 系统代号：**Penguin Path（企鹅之路）** —— 从 Linux 小白到高级工程师。

---

## 1. 系统总览

```
linux-learning-system/
├── index.html              # 系统主页（导航 + 进度看板 + 能力雷达图）   [主 agent 做]
├── assets/
│   ├── css/style.css       # 全局样式（暗色极客风）                    [言秘书做]
│   └── js/
│       ├── app.js          # 主页逻辑 / 进度渲染 / 雷达图              [主 agent 做]
│       ├── emulator.js     # 轻量命令模拟器（前端沙盒内核）            [小码哥做]
│       └── course.js       # 课程步骤数据（STEPS 数组）               [共建：各伙伴按契约产出]
├── content/                # 图文课程（每课一个 md 文件）              [共建]
│   ├── index.json          # 课程索引（被主页/沙盒读取）              [共建：汇总后主 agent 生成]
│   └── <id>.md
├── sandbox/
│   └── index.html          # 交互式沙盒页（加载 emulator.js + course.js）[主 agent 做壳/小码哥配合]
├── tools/
│   └── check.py            # 本地校验脚本（校验 content + index 一致性） [小政哥做]
└── docs/
    ├── roadmap.md          # 12 级能力路线图（总纲）                  [少年派做]
    ├── setup-env.md        # 练习环境搭建（VM/WSL/容器）               [小政哥做]
    ├── resources.md        # 书单/文档/实验平台推荐                   [言秘书做]
    └── team-case.md        # 团队整改案例复盘（本项目的协作方法论）     [主 agent + 少年派做]
```

---

## 2. 能力分级（12 级主线）

| 阶段 | 级别 | 代号 | 语言 | 核心目标 |
|------|------|------|------|----------|
| 入门 | L1 | 小白启航 | shell | 不怕终端，会基础文件操作 |
| 入门 | L2 | 文件系统 | shell | 路径/权限/查找 通透 |
| 入门 | L3 | 文本处理 | shell | grep/sed/awk 三剑客 |
| 初级 | L4 | 系统管理 | shell | 用户/进程/服务/包管理 |
| 初级 | L5 | Shell 编程 | bash | 写可复用脚本 |
| 初级 | L6 | 网络基础 | shell | ip/ss/dig/ssh |
| 中级 | L7 | 服务与Web | shell+nginx | Nginx/数据库/容器 |
| 中级 | L8 | 自动化 | ansible | Ansible Playbook |
| 中级 | L9 | 监控运维 | prometheus | Prometheus+Grafana+日志 |
| 高级 | L10 | 安全加固 | shell | 最小权限/防火墙/审计 |
| 高级 | L11 | 性能调优 | shell | USE 方法/内核参数/压测 |
| 高级 | L12 | 架构与SRE | 不限 | 高可用/故障演练/方案设计 |

> 每级 3~5 课，全文约 36~60 课。语言标注说明：shell=纯命令行即可；nginx=配置文件；ansible=YAML；prometheus=YAML+PQL；bash=脚本语言。

---

## 3. 课程内容文件格式（content/\<id\>.md）

每个课程文件**必须**以如下开头的 frontmatter + 固定章节结构：

```markdown
---
key: l1-hello
level: L1
title: 你好，Linux！（第一课）
lang: shell
objective: 认识终端，学会用 help/ls/pwd 摸路
prereq: []
estimated_min: 15
sandbox: true
---

# 你好，Linux！（第一课）

## 讲解
（200~400 字，讲清楚"是什么、为什么、怎么想"）

## 动手实验
（3~6 个编号步骤，给出可复制命令与预期输出）

## 常见错误
（列 2~4 个新手最容易踩的坑 + 解决方法）

## 小结
（3 条要点 + 一句进阶指引）
```

字段约束：
- `key`：全局唯一，格式 `l<级>-<短名>`，纯小写+连字符。
- `level`：必须是 L1~L12 之一。
- `lang`：枚举 `shell|bash|nginx|ansible|prometheus|不限`。
- `prereq`：前置课程 key 数组（跨级引用也可）。
- `sandbox`：布尔，`true` 表示本课有可交互的沙盒步骤（见第 4 节）。

---

## 4. 沙盒交互契约（assets/js/course.js + emulator.js）

沙盒交互数据 `STEPS` 采用**分片**方式，避免多人并发写同一文件冲突：
- 每个伙伴在自己的 `partner-workspace/<id>/steps.js` 中，把本课 STEPS 推入全局数组：
  ```js
  if (!window.__PENGUIN_STEPS) window.__PENGUIN_STEPS = [];
  window.__PENGUIN_STEPS.push(
    { id:1, key:'l1-hello', icon:'👋', name:'...', title:'...', desc:'...',
      task:'...', expectedCmd:'help', checker:(cmd)=>cmd.trim()==='help',
      commandHint:'help', tips:'...' },
    // ...更多
  );
  ```
- 沙盒页 `sandbox/index.html` 依次 `<script src="../assets/js/emulator.js"></script>` 与各个 `steps.js`，再读取 `window.__PENGUIN_STEPS`。
- **注意**：`checker` 必须是浏览器内可执行的纯函数；STEPS 的 `key` 必须与对应 `content/<key>.md` 的 frontmatter `key` 完全一致。
- 没有结构化步骤的高级课，`sandbox:false`，该伙伴不要为它写 STEPS（沙盒页自动显示"请在真实环境练习"）。

每个元素的字段：

```js
{
  id: 1,
  key: 'l1-hello',
  icon: '👋',
  name: '你好，Linux！',
  title: '第一步：使用 help 命令',
  desc: 'HTML 字符串，支持 <code> 与 <strong>',
  task: '在终端输入 <code>help</code> 并按回车',
  expectedCmd: 'help',
  checker: (cmd) => cmd.trim() === 'help',   // 纯函数，沙盒用
  commandHint: 'help',
  tips: 'HTML 提示字符串'
}
```

> 完整 STEPS 由 `partner-workspace/<id>/steps.js` 分片提供（见上）。

- `key` 必须与对应 content/\<id\>.md 的 frontmatter `key` 一致，沙盒与图文课才能联动。
- `checker` 必须是一个能跑在浏览器里的纯函数（不能依赖 Node API）。
- 没有结构化步骤的高级课，`sandbox` 设为 `false`，沙盒页对该课显示"请在真实环境练习"提示，不生成 STEPS。

`emulator.js` 职责：
- 接收用户输入字符串 → 解析（极简 tokenizer）→ 匹配"命令-处理器"表 → 返回 `{output, error}`。
- 必须支持的基础命令（返回模拟输出）：`help, ls, pwd, cd, mkdir, touch, cat, echo, cp, mv, rm, chmod, grep, ps, |（管道）, clear, whoami, uname, date`。
- 命令处理用函数表 `{ [cmd]: (args, ctx) => string }`，沙盒状态（cwd、虚拟 fs）由 ctx 维护。
- 出错返回友好中文提示，不抛异常。

---

## 5. 索引契约（content/index.json）

由主 agent 在汇总各伙伴 `content/` 文件后自动生成，结构：

```json
[
  {
    "key": "l1-hello",
    "level": "L1",
    "title": "你好，Linux！（第一课）",
    "lang": "shell",
    "objective": "认识终端，学会用 help/ls/pwd 摸路",
    "prereq": [],
    "estimated_min": 15,
    "sandbox": true,
    "file": "l1-hello.md",
    "done": false
  }
]
```

主页 `app.js` 读取此文件渲染路线图与进度；`done` 由 `localStorage` 覆盖（用户完成标记）。

---

## 6. 进度与质量门禁

- 每个伙伴交付后，主 agent 运行 `tools/check.py` 校验：frontmatter 合法、key 唯一、index 与文件一致、course.js 的 STEPS 与 content 的 key 对应。
- 校验不通过 = 该伙伴本次交付**不收口**，退回补正。
- 全部收口后，主 agent 生成 `index.html` 与 `sandbox/index.html` 完成集成。

---

## 7. 分工（本迭代）

| 伙伴 | 交付物 | 范围 |
|------|--------|------|
| 小码哥 | `assets/js/emulator.js` + L1~L3 全部 content + `partner-workspace/xiaomage/steps.js` | 沙盒内核 + 入门三关 |
| 言秘书 | `assets/css/style.css` + `docs/resources.md` + L4~L6 全部 content + `partner-workspace/yanmishu/steps.js` | 视觉+图文+初级 |
| 小政哥 | `tools/check.py` + `docs/setup-env.md` + L10~L11 全部 content + `partner-workspace/xiaozhengge/steps.js` | 校验器+环境+高级 |
| 少年派 | `docs/roadmap.md` + L7~L9 全部 content + `partner-workspace/shaonianpai/steps.js` + 协调汇总 | 总纲+中级+汇总支持 |
| 主 agent | 目录/SCHEMA/索引生成/`index.html`/`sandbox/index.html`/`team-case.md` | 集成与收口 |

> 原则：课件（content + STEPS）按级别切分给伙伴，保证每人都"写出了真实内容"；emulator/css/check.py/roadmap 各司其职；最后统一集成。
