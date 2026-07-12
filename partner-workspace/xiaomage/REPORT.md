# 小码哥交付报告 — Penguin Path 沙盒内核 + 入门三关（L1~L3）

> 交付日期：2026-07-12 ｜ 负责人：小码哥 ｜ 范围：SCHEMA 第 7 节「小码哥」列

## 一、创建的文件清单

| 文件 | 类型 | 说明 |
|------|------|------|
| `assets/js/emulator.js` | 沙盒内核 | 零依赖前端 Linux 模拟器（约 24KB） |
| `content/l1-hello.md` | 图文课 | L1 小白启航①：help/ls/pwd |
| `content/l1-files.md` | 图文课 | L1 小白启航②：cd/mkdir/touch/cat |
| `content/l1-edit.md` | 图文课 | L1 小白启航③：echo 重定向/cp/mv/rm |
| `content/l2-path.md` | 图文课 | L2 文件系统①：绝对/相对路径、. 与 ..、~ |
| `content/l2-permission.md` | 图文课 | L2 文件系统②：rwx/chmod 数字与符号 |
| `content/l2-find.md` | 图文课 | L2 文件系统③：find/locate/which |
| `content/l3-grep.md` | 图文课 | L3 文本处理①：grep 基础与正则 |
| `content/l3-sed.md` | 图文课 | L3 文本处理②：sed 替换 |
| `content/l3-awk.md` | 图文课 | L3 文本处理③：awk 字段 |
| `partner-workspace/xiaomage/steps.js` | 沙盒步骤 | 9 课共 24 个 STEPS，推入 `window.__PENGUIN_STEPS` |
| `partner-workspace/xiaomage/REPORT.md` | 本报告 | — |

> 未改动 `SCHEMA.md` / `PROJECT.md` / 他人目录。每课 md 均含合法 frontmatter（key/level/lang/objective/prereq/estimated_min/sandbox 齐全）与四固定章节（讲解/动手实验/常见错误/小结）。

## 二、emulator.js 命令实现要点

接口：`window.PenguinEmulator(input, ctx)` → `{output, error, clear}`；`PenguinEmulator.createContext()` 创建虚拟 fs + cwd 状态（需会话内持有并复传）。

- **虚拟文件系统**：以树形对象 `{type:'dir'|'file', perm, owner, group, children|content, mtime}` 维护，初始预置 `/home/guest/{hello.txt(含"Linux"单词),notes.txt,todo.txt,script.sh,projects/readme.txt}` 及 `/etc/hostname`、`/tmp`。路径解析 `normalize()` 支持绝对/相对/`~`/`.`/`..`，与真实 shell 一致。
- **函数表**：`COMMANDS = { [cmd]: (args, ctx, stdin)=>string }`，出错一律返回友好中文提示，最外层 `try/catch` 兜底，绝不抛异常到页面。
- **已实现命令**：
  - 契约强制：help, ls(-l/-a), pwd, cd, mkdir(-p), touch, cat, echo(支持 `>` 覆盖、`>>` 追加), cp(-r), mv, rm(-r/-f), chmod(数字 755 与符号 u+x/go-w/a=rwx), grep(-i/-n/-r), ps, date, whoami, uname, clear, `|` 管道。
  - 为让 L2/L3 沙盒步骤真实可跑，额外补齐：find(-name/-type)、locate、which、sed(s/旧/新/g)、awk({print $N}/$0/NF/-F)。
- **管道**：`tokenize` 按引号、`|`、`>`、`>>`、`<` 分片，逐段执行，前段 stdout 作后段 stdin。
- **重定向**：`writeRedirect` 处理 `>`（覆盖）与 `>>`（追加），父目录不存在时报中文错。
- **权限串**：`permToString` 输出 `rwxr-xr-x` 形态；`ls -l` 输出对齐的权限/属主/大小/时间/名，贴近真实 `ls -l`。
- **chmod 符号法**：`applySymbolic` 解析 `u/g/o/a` + `+/-/= ` + `rwx`，与 `chmod` 真实语义一致。
- **grep/awk/sed 正则**：用原生 `RegExp`（捕获异常时退化为字面转义），支持基础正则与 `-i/-n/-r`。

## 三、steps.js 要点

- 全局数组从 `id:101` 起递增（101~124，共 24 个），避免与其它伙伴分片冲突；主 agent 集成时会重排 id，但 **key 与 content frontmatter 完全一致**已校验。
- 每课 STEPS 数：l1-hello×3、l1-files×3、l1-edit×3、l2-path×3、l2-permission×3、l2-find×2、l3-grep×3、l3-sed×2、l3-awk×2。
- `checker` 全部为浏览器内可执行纯函数，仅依赖传入命令字符串，并用正则做宽松匹配（容忍多余空格/引号变体）。
- 已编写本地校验脚本确认：24 个 STEPS 的 `expectedCmd` 均能通过自身 `checker`；9 个 content 文件 frontmatter 合法且 key 与 STEPS 双向对应；无重复 id、无缺字段。

## 四、关键决策

1. **接口形态**：严格遵循 SCHEMA「接收输入字符串 + ctx，返回 `{output,error}`」。额外返回 `clear` 标记，方便沙盒页对 `clear` 命令清屏（不破坏契约，属安全扩展）。
2. **ctx 生命周期**：约定由调用方（sandbox 页）持有 `ctx` 并每次传回，命令间状态（cwd/fs/user）得以保持。emulator 在缺 ctx 时自动建默认上下文，保证可独立测试。
3. **超出契约的加分命令**：SCHEMA 第 4 节强制清单未列 find/sed/awk，但 L2/L3 课程正文与沙盒步骤需要它们才"经得起敲"。我将其实现为真实可用的模拟（非占位），使沙盒与图文课完全联动。
4. **id 空间**：按任务指示用 101 起，而非 1 起，规避全局其它分片（L4~L11 各伙伴）可能的 id 冲突；主 agent 集成时统一重排即可。
5. **容错优先**：所有命令路径都有中文友好报错（如 `ls: 无法访问 x：没有那个文件或目录`），且顶层吞掉一切异常，符合"出错不抛异常"硬要求。

## 五、一句话总结

沙盒内核 `emulator.js` 已支持 24 条命令（含管道/重定向/权限/三剑客）并全命令中文容错，配套 9 课图文与 24 个可校验沙盒步骤全部落盘、契约自检通过，L1~L3 入门三关可即插即用。
