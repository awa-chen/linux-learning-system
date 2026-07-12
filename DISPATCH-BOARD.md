# 伙伴派发看板（实时）

> 由 `tools/dispatch_board.py` 生成，扫描各伙伴 `partner-workspace/<id>/status.json`。

**总览**：4/4 伙伴已完成

| 伙伴 | 任务 | 状态 | 进度 | 开始 | 结束 | 用时 |
|------|------|------|------|------|------|------|
| 🔧 小政哥 | 校验器 + 环境 + L10~L11 高级课 | ✅已完成 | 100% | 08:39:28 | 09:05:32 | 26m03s |
| 🛠️ 小码哥 | 沙盒内核 + L1~L3 入门课 | ✅已完成 | 100% | 08:39:45 | 08:55:31 | 15m46s |
| 🧭 少年派 | 总纲 + L7~L9 中级课 + 协调 | ✅已完成 | 100% | 08:40:00 | 09:02:32 | 22m31s |
| 📝 言秘书 | 样式 + 资源 + L4~L6 初级课 | ✅已完成 | 100% | 08:40:19 | 08:56:26 | 16m06s |

## 🔧 小政哥 · 校验器 + 环境 + L10~L11 高级课
- 状态：✅ 已完成
- 当前：全部完成
- 步骤清单：
  1. 编写 check.py 质量门禁（零依赖，退出码 0/1）
  2. 编写 setup-env.md（虚拟机/WSL2/云主机/容器）
  3. 撰写 L10 四课（sudo/sshsec/firewall/audit）
  4. 撰写 L11 五课（cpu/mem/io/net/bench）
  5. 编写 steps.js（6 步，id 1001~，仅 l10-sudo/l11-cpu 开沙盒）
- 交付物：
  - `tools/check.py`
  - `docs/setup-env.md`
  - `content/l10-sudo.md ~ l11-bench.md（9 课）`
  - `partner-workspace/xiaozhengge/steps.js`

## 🛠️ 小码哥 · 沙盒内核 + L1~L3 入门课
- 状态：✅ 已完成
- 当前：全部完成
- 步骤清单：
  1. 搭建 emulator.js 虚拟文件系统 + 命令表
  2. 实现 24 条命令（管道/重定向/权限/三剑客）
  3. 撰写 L1 三课（hello/files/edit）
  4. 撰写 L2 三课（path/permission/find）
  5. 撰写 L3 三课（grep/sed/awk）
  6. 编写 steps.js（24 步，id 101~124）
- 交付物：
  - `assets/js/emulator.js`
  - `content/l1-hello.md ~ l3-awk.md（9 课）`
  - `partner-workspace/xiaomage/steps.js`
  - `partner-workspace/xiaomage/REPORT.md`

## 🧭 少年派 · 总纲 + L7~L9 中级课 + 协调
- 状态：✅ 已完成
- 当前：全部完成
- 步骤清单：
  1. 编写 12 级能力总纲 roadmap.md
  2. 撰写 L7 三课（nginx/docker/mysql）
  3. 撰写 L8 三课（ansible/roles/lamp）
  4. 撰写 L9 三课（node/alert/log）
  5. 编写 steps.js（4 步，id 701~704，仅 l7-docker/l8-ansible 开沙盒）
  6. 编写 COORD.md 协调说明
- 交付物：
  - `docs/roadmap.md`
  - `content/l7-nginx.md ~ l9-log.md（9 课）`
  - `partner-workspace/shaonianpai/steps.js`
  - `partner-workspace/shaonianpai/COORD.md`

## 📝 言秘书 · 样式 + 资源 + L4~L6 初级课
- 状态：✅ 已完成
- 当前：全部完成
- 步骤清单：
  1. 编写暗色极客风 style.css（对齐约定类名）
  2. 编写 resources.md（真实书单/官方文档/免费实验平台）
  3. 撰写 L4 四课（user/process/service/package）
  4. 撰写 L5 五课（var/cond/func/io/debug）
  5. 撰写 L6 四课（ip/ss/dns/ssh）
  6. 编写 steps.js（8 步，id 401~408，仅 l4-process/l5-io 开沙盒）
- 交付物：
  - `assets/css/style.css`
  - `docs/resources.md`
  - `content/l4-user.md ~ l6-ssh.md（13 课）`
  - `partner-workspace/yanmishu/steps.js`
