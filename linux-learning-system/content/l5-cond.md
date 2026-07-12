---
key: l5-cond
level: L5
title: 条件判断、循环与 case
lang: bash
objective: 掌握 test/[ ] 判断、if/elif/else、for/while 循环与 case 分支
prereq: ["l5-var"]
estimated_min: 25
sandbox: false
---

# 条件判断、循环与 case

## 讲解

会赋值还不够，脚本要"懂事"——这就靠流程控制。Bash 的判断核心是 `test` 命令，写作 `[ 条件 ]`（注意**括号内侧必须有空格**）。常见判断：`-f` 文件存在、`-d` 目录、`-z` 字符串为空、`=` 相等、`-gt` 大于等。

三大结构：
- **`if ... elif ... else ... fi`**：二选一/多选一。
- **`for ... in ...; do ... done`**：遍历列表。
- **`while` / `case`**：循环与多分支匹配（case 像简化版 switch，用 `*` 兜底）。

判断的退出码是灵魂：命令**成功返回 0，失败返回非 0**；`if` 就是看这条命令的退出码。记住这点，你能写出 `if grep -q foo file; then ...` 这种"无输出也好用"的判断。

## 动手实验

1. 文件判断：
   ```bash
   if [ -f "$HOME/.bashrc" ]; then
     echo "bashrc 存在"
   else
     echo "没有 bashrc"
   fi
   ```

2. 字符串与数字比较：
   ```bash
   n=5
   if [ "$n" -gt 3 ]; then echo "大于3"; fi
   name="bob"
   if [ "$name" = "bob" ]; then echo "是 bob"; fi
   ```

3. for 循环批量处理：
   ```bash
   for f in *.txt; do
     echo "处理: $f"
   done
   ```

4. while 读文件每行：
   ```bash
   while read -r line; do
     echo "行: $line"
   done < list.txt
   ```

5. case 多分支：
   ```bash
   case "$1" in
     start) echo "启动" ;;
     stop)  echo "停止" ;;
     *)     echo "用法: $0 start|stop" ;;
   esac
   ```

## 常见错误

- **`[` 内侧漏空格**：`[ -f x]` 会报语法错，必须 `[ -f x ]`。`[` 本质是个命令，参数间要空格。
- **字符串比较用 `-eq`**：`-eq` 是数字比较，字符串相等用 `=`（或 `==`）。混用会报 "integer expression expected"。
- **变量为空时 `[ $x = a ]` 裂开**：变量为空会退化成 `[ = a ]` 语法错误。永远写成 `[ "$x" = a ]`（加双引号）。
- **for 循环吞掉带空格的文件名**：`for f in $(ls)` 遇空格会拆词；优先用 `for f in *` 或 `while read` 逐行读。

## 小结

1. 判断用 `[ 条件 ]`，括号内侧必须留空格；退出码 0=真 非0=假。
2. 数字用 `-gt/-eq`，字符串用 `=`，文件用 `-f/-d/-z`；变量务必双引号包裹。
3. `for` 遍历、`while` 读行、`case` 分支，三者覆盖绝大多数脚本逻辑。

进阶：下一课把它们封进函数，并用 `return` 返回状态码，脚本就能像搭积木一样复用。
