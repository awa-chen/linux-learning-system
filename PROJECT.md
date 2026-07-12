# Penguin Path（企鹅之路）—— Linux 学习系统

> 团队共建项目 · 从入门到高级工程师 · 轻量级纯前端实现（零构建依赖）
> 主 agent：QClaw｜参与伙伴：小码哥 / 言秘书 / 小政哥 / 少年派
> 本项目同时作为 **团队整改协作案例**（见 `docs/team-case.md`，收尾时复盘）

## 目标
做一个开源、可离线、手机也能开的 Linux 学习系统：
- 图文课程（content/*.md）+ 交互式前端沙盒（模拟终端，零后端）
- 12 级能力主线：L1 小白 → L12 架构/SRE
- 轻量：纯 HTML/CSS/JS + Python 校验脚本，无框架、无打包、无数据库

## 目录与契约
见 `SCHEMA.md`（接口契约，所有伙伴必须遵守）。

## 任务看板
| 模块 | 负责人 | 交付物 | 状态 |
|------|--------|--------|------|
| 沙盒内核 | 小码哥 | `assets/js/emulator.js` | ✅ 已交付 |
| 入门课程 L1-L3 | 小码哥 | `content/l1-*.md` `l2-*.md` `l3-*.md` + `partner-workspace/xiaomage/steps.js` | ✅ 已交付 |
| 视觉样式 | 言秘书 | `assets/css/style.css` | ✅ 已交付 |
| 资源文档 | 言秘书 | `docs/resources.md` | ✅ 已交付 |
| 初级课程 L4-L6 | 言秘书 | `content/l4-*.md` `l5-*.md` `l6-*.md` + `partner-workspace/yanmishu/steps.js` | ✅ 已交付 |
| 校验器 | 小政哥 | `tools/check.py` | ✅ 已交付 |
| 环境文档 | 小政哥 | `docs/setup-env.md` | ✅ 已交付 |
| 高级课程 L10-L11 | 小政哥 | `content/l10-*.md` `l11-*.md` + `partner-workspace/xiaozhengge/steps.js` | ✅ 已交付 |
| 总纲路线图 | 少年派 | `docs/roadmap.md` | ✅ 已交付 |
| 中级课程 L7-L9 | 少年派 | `content/l7-*.md` `l8-*.md` `l9-*.md` + `partner-workspace/shaonianpai/steps.js` | ✅ 已交付 |
| 主页/索引生成 | 主 agent | `index.html` `content/index.json` `assets/js/app.js` | ✅ 已集成 |
| 沙盒页 | 主 agent + 小码哥 | `sandbox/index.html` | ✅ 已集成 |
| 团队案例 | 主 agent + 少年派 | `docs/team-case.md` | ✅ 已产出 |

## 验收结果（集成收口后）
- `python3 tools/check.py` → **通过 82 / 失败 0**（40 课 frontmatter 合法 + 42 STEPS 联动正确）
- `python3 tools/gen_index.py` → 生成 `content/index.json` / `index.js` / `courses.js`，无契约错误
- Node 三方一致性核对：40 课程 = 40 正文 = 42 步骤，完全对齐
- 沙盒内核增强：补充 `&&`/`;` 链执行（尊重引号），`help/ls/cd/管道/chmod/&&/clear` 烟测全绿
- 集成时修复：STEPS 全局变量名兼容（单/双下划线）、沙盒重置接口对齐 `createContext()`、`gen_index.py` Windows 控制台 UTF-8 编码

## 进度时间线
- 2026-07-12 08:31 立项，建立目录与契约，派发 4 伙伴（各自独立会话，并行 13~24 分钟）。
- 2026-07-12（并行期）4 伙伴各自交付课件 + steps.js 分片，互不干扰；详见 `DISPATCH-BOARD.md` 看板。
- 2026-07-12（收口）主 agent 集成主页/沙盒、增强 emulator、跑 check.py 验收、产出 team-case.md。
- 2026-07-12 09:46 用户反馈"看不到伙伴活动状态" → 修复可观测性断点：新增 `partner-workspace/<id>/status.json` 自报 + `tools/dispatch_board.py` 看板，并把"多 Agent 并行须状态自报"补丁写入 `DISPATCH-TRIGGER.md`。
- **项目状态：✅ 已完整交付，可离线双击 `index.html` 使用。**
