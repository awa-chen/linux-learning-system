---
key: l5-debug
level: L5
title: 调试与稳健性（set/trap）
lang: bash
objective: 用 set -eux 与 trap 让脚本出错即停、可追踪、易清理
prereq: ["l5-func", "l5-io"]
estimated_min: 22
sandbox: false
---

# 调试与稳健性（set / trap）

## 讲解

写得出脚本只是第一步，**写得稳**才算工程。Bash 默认很"宽容"：某条命令失败它也继续往下跑，结果在脚本末尾才爆出一堆连锁错误，极难定位。解决办法是脚本开头加 **`set -euo pipefail`** 这个"安全三连"：

- `-e`：任意命令非零退出就立刻中止脚本。
- `-u`：引用未定义变量直接报错（避免 `$name` 为空时静默出错）。
- `-o pipefail`：管道中任一段失败，整条管道视为失败（默认只看最后一段）。

再加 `-x` 可以打印每条执行命令，调试时一目了然。`trap` 则是"捕获信号/退出"的钩子：常用于脚本异常退出时清理临时文件、恢复状态，类似其他语言的 `finally`。

## 动手实验

1. 开启追踪与严格模式：
   ```bash
   set -eux
   name="penguin"
   echo "hello $name"
   false            # 这条会触发 -e，脚本立即中止
   echo "看不到我"   # 不会执行
   ```
   说明：`-x` 会先把要执行的命令打印出来，便于跟流程。

2. 只开严格模式（日常推荐）：
   ```bash
   set -euo pipefail
   echo "严格模式运行中"
   ```

3. trap 做清理（类似 finally）：
   ```bash
   tmp=$(mktemp -d)
   trap 'rm -rf "$tmp"; echo "已清理临时目录"' EXIT
   echo "工作中... (临时目录: $tmp)"
   # 脚本结束（无论正常还是出错）都会执行 trap
   ```

4. 捕获 Ctrl-C：
   ```bash
   trap 'echo "收到中断, 退出"; exit 1' INT
   sleep 10
   ```

## 常见错误

- **只写 `set -e` 没写 `pipefail`**：`cat nofile | grep x` 里 `cat` 失败但 `grep` 成功，整条却"看起来正常"。务必 `set -euo pipefail` 一起用。
- **`-e` 下把"预期会失败"的命令当致命**：如 `grep` 没匹配到会返回 1。可写成 `grep x file || true` 显式允许失败，或用 `if grep ...; then`。
- **trap 在变量展开时才绑定，坑在引号**：`trap "rm -rf $tmp"` 会在定义时立刻展开 `$tmp`；想运行时展开要用单引号 `trap 'rm -rf "$tmp"' EXIT`。
- **`-u` 下 `$1` 未传直接崩**：脚本依赖参数时，先用 `[ $# -ge 1 ] || { echo "用法..."; exit 1; }` 友好地检查。

## 小结

1. 脚本开头 `set -euo pipefail`：出错即停、禁未定义变量、管道任一段失败即失败。
2. `set -x` 打印执行轨迹，是定位"卡在哪"的利器。
3. `trap '...' EXIT/INT` 做清理与中断处理，相当于 `finally`，让脚本更稳健。

进阶：L6 网络脚本里你会把这些和 `ssh`/`curl` 结合，写成"失败自动回滚"的部署小工具。
