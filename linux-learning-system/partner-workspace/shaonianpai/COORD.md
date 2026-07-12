# 汇总协调说明（少年派 · 协调视角）

> 本文是「团队整改案例」的方法论沉淀：记录各伙伴应交付的文件清单、契约要点，并提示主 agent 收尾时如何生成 `index.json` 与集成主页。
> 适用范围：Penguin Path 本迭代（L1~L12 全量课件 + 工程文件）。

---

## 一、分工与交付清单（谁该交什么）

| 伙伴 | 角色 | 必须交付的文件 | 契约要点 |
|------|------|----------------|----------|
| 小码哥 | 沙盒内核 + 入门 | `assets/js/emulator.js`、`content/l1-*.md ~ l3-*.md`、`partner-workspace/xiaomage/steps.js` | emulator.js 须支持 help/ls/pwd/cd/mkdir/touch/cat/echo(含 >/>>)/cp/mv/rm/chmod/grep/ps/\|/clear/whoami/uname/date；L1~L3 共 9 课，全部 sandbox:true，STEPS id 从 101 起 |
| 言秘书 | 视觉 + 图文 + 初级 | `assets/css/style.css`、`docs/resources.md`、`content/l4-*.md ~ l6-*.md`、`partner-workspace/yanmishu/steps.js` | L4~L6 共 13 课；仅 l4-process、l5-io 为 sandbox:true（纯命令演示），其余 sandbox:false；STEPS id 从 401 起 |
| 小政哥 | 校验器 + 环境 + 高级 | `tools/check.py`、`docs/setup-env.md`、`content/l10-*.md ~ l11-*.md`、`partner-workspace/xiaozhengge/steps.js` | L10~L11 共 10 课；仅 l10-sudo、l11-cpu 为 sandbox:true，其余 sandbox:false；STEPS id 从 1001 起 |
| **少年派（我）** | **总纲 + 中级 + 协调** | **`docs/roadmap.md`、`content/l7-*.md ~ l9-*.md`（9 课）、`partner-workspace/shaonianpai/steps.js`、`COORD.md`、`REPORT.md`** | **L7~L9 共 9 课；仅 l7-docker、l8-ansible 为 sandbox:true（文件创建类），其余 7 课 sandbox:false；STEPS id 从 701 起** |
| 主 agent | 集成与收口 | `index.html`、`content/index.json`、`assets/js/app.js`、`sandbox/index.html`、`docs/team-case.md` | 汇总所有 content + 各伙伴 steps.js，跑校验，生成索引与主页/沙盒壳 |

---

## 二、契约要点速记（避免返工）

1. **frontmatter 全字段必填**：`key / level / lang / objective / prereq / estimated_min / sandbox`，且 `key` 必须与文件名一致（`l7-nginx.md` ↔ `key: l7-nginx`）。
2. **`lang` 枚举**：`shell | bash | nginx | ansible | prometheus | 不限`。注意 Docker 课虽然讲 docker，但命令本质是 shell，填 `shell`（不要自造 `docker` 枚举，否则 gen_index.py 校验失败）。
3. **`level`**：必须是 L1~L12；`prereq` 是前置课程 key 数组（跨级引用也行，但被引 key 必须真实存在）。
4. **固定四章节**：每课必须有 `讲解 / 动手实验 / 常见错误 / 小结`，顺序不可乱。
5. **STEPS 三铁律**：
   - `key` 与对应 `content/<key>.md` 的 frontmatter `key` **完全一致**；
   - `checker` 必须是浏览器内纯函数（不能碰 Node API、不能发网络请求）；
   - `sandbox:false` 的课**不要**写 STEPS，沙盒页自动显示「请在真实环境练习」。
6. **ID 区间互不踩踏**：xiaomage `1xx`、yanmishu `4xx`、shaonianpai `7xx`、xiaozhengge `1xxx`。新增 STEPS 必须落在各自区间，否则合并时 id 冲突。

---

## 三、当前进度快照（写于本交付时）

- content/ 已存在 40 个课件：L1(3) + L2(3) + L3(3) + L4(4) + L5(5) + L6(4) + L7(3) + L8(3) + L9(3) + L10(4) + L11(6) = 41？实际以目录为准（见 REPORT 清单）。
- 少年派（我）交付的 L7~L9 共 9 课均已落地，frontmatter 经校验合法。
- 沙盒 STEPS 分片：xiaomage(9)、yanmishu(8)、shaonianpai(4)、xiaozhengge(6)，id 区间无重叠。

---

## 四、主 agent 收尾指引（生成 index.json 与集成主页）

### 4.1 生成 content/index.json
主 agent 已有 `tools/gen_index.py`（小政哥交付），它会：
- 扫描 `content/*.md`，解析每个 frontmatter；
- 校验 `key / level / lang / sandbox`，并把 `prereq` 指向的 key 与现有集合比对；
- 输出三件套：`content/index.json`（数组，每项含 `key/level/title/lang/objective/prereq/estimated_min/sandbox/file/done`）、`content/index.js`（`window.__COURSE_INDEX__`）、`content/courses.js`（`window.__COURSES__`）。
运行：`python3 tools/gen_index.py`。**若报 errors 则对应伙伴需补正，未收口不集成。**

### 4.2 集成主页 index.html / app.js
- `app.js` 读取 `content/index.json` 渲染 12 级路线图、能力雷达图、进度看板；`done` 由 `localStorage` 覆盖（用户完成标记）。
- `sandbox/index.html` 依次 `<script src="../assets/js/emulator.js"></script>` 和**所有**伙伴的 `steps.js`（xiaomage / yanmishu / shaonianpai / xiaozhengge），再读 `window.__PENGUIN_STEPS`；按 `key` 匹配图文课，渲染交互步骤；`sandbox:false` 的课显示「请在真实环境练习」。

### 4.3 集成前自检清单（checklist）
- [ ] 所有 content 的 `key` 与文件名一致，且彼此唯一
- [ ] 所有 `sandbox:true` 的课都有对应 STEPS（key 匹配），`sandbox:false` 的课无多余 STEPS
- [ ] STEPS `id` 全局唯一（各伙伴区间不交叉）
- [ ] `tools/check.py` 全绿
- [ ] `docs/roadmap.md`（总纲）与 `index.json` 的级别分布一致（L1~L12 都有覆盖）

---

## 五、方法论沉淀（团队整改案例要点）

1. **分片优于并发写同一文件**：STEPS 走 `partner-workspace/<id>/steps.js` 各自 push 全局数组，沙盒页统一加载，彻底避免「多人同时改 course.js 冲突」。
2. **契约先行**：SCHEMA.md 是接口合同，所有产出先对齐字段与枚举，再写内容，CI 用 check.py 兜底。
3. **沙盒粒度取舍**：配置/架构类高级课（nginx/ansible/prometheus）沙盒交互价值低，只对「纯命令/纯文件创建」的课开 sandbox，避免无效 STEPS 拖慢校验。
4. **协调者不越权**：subagent（如少年派）只写自己负责的目录，不动他人文件与 SCHEMA/PROJECT，集成收口交给主 agent——职责清晰才不会互相覆盖。
