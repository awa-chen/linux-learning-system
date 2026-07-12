# 任务交付物记录（言秘书 · L4~L6 视觉+资源+初级课）

## Objective
按 SCHEMA.md 契约，完成 Penguin Path 项目中言秘书负责的：全局暗色样式表、学习资源文档、L4~L6 全部 13 篇图文课、以及对应沙盒步骤分片。

## Key Reasoning
- 样式严格对齐参考文件 linux-learning.html 的配色（青绿 #39c981 为主强调），用 CSS 变量集中管理，覆盖主页/沙盒/正文渲染所需全部类名，含双断点响应式。
- 沙盒仅对命令落在模拟器内核支持范围（ps/|/echo/cat/grep）的 2 课（l4-process、l5-io）产出 STEPS，其余 11 课为概念/系统级配置，诚实地设 sandbox:false 不写步骤，避免 checker 永远失败。
- STEPS id 从 401 起，避开其它伙伴分片全局冲突；checker 为纯浏览器函数。
- 资源文档全部引用真实可查书籍/官方源/免费实验平台，未编造。

## Conclusions / Deliverables
- assets/css/style.css（16.5KB）
- docs/resources.md（5.5KB）
- content/l4-user.md, l4-process.md, l4-service.md, l4-package.md
- content/l5-var.md, l5-cond.md, l5-func.md, l5-io.md, l5-debug.md
- content/l6-ip.md, l6-ss.md, l6-dns.md, l6-ssh.md
- partner-workspace/yanmishu/steps.js（8 个 STEPS，id 401-408）
- partner-workspace/yanmishu/REPORT.md（交付报告）

## Verification
- 13 个 content 文件 frontmatter 含全部 6 字段，level∈{L4,L5,L6}，lang∈{shell,bash}。
- sandbox:true 的 l4-process / l5-io 在 steps.js 有对应 STEPS；11 个 sandbox:false 无 STEPS。
- 未改动 SCHEMA.md / PROJECT.md / 他人目录。
