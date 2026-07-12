---
key: l5-io
level: L5
title: 重定向、管道与 here-doc
lang: bash
objective: 理解 stdin/stdout/stderr，掌握 > >> < | 与 << 的用法
prereq: ["l5-var"]
estimated_min: 22
sandbox: true
---

# 重定向、管道与 here-doc

## 讲解

Linux 哲学：一切皆文件，程序默认有三个"流"——**标准输入 stdin(0)**、**标准输出 stdout(1)**、**标准错误 stderr(2)**。默认它们都连着终端。

- **重定向 `>` / `>>`**：把 stdout 从屏幕"引流"到文件。`>` 覆盖、`>>` 追加。
- **输入重定向 `<`**：让程序从文件读，而不是从键盘读（如 `sort < list.txt`）。
- **管道 `|`**：把"左边程序的 stdout"接成"右边程序的 stdin"，是 Linux 最强大的组合拳。
- **here-doc `<<`**：把一段文本直接当作某命令的 stdin，常用来生成配置文件或写脚本。

聚焦一个事实：**管道 `|` 串起的是数据流，不是命令本身**。你可以用 `ps | grep` 过滤、`cat x | sort | uniq` 去重，无限搭积木。

> 本课 `echo`/`cat`/`grep`/`|`/`>` 均可在沙盒中实操，请多试几组组合。

## 动手实验

1. 输出重定向（沙盒可练）：
   ```bash
   echo "hello penguin" > note.txt
   echo "second line" >> note.txt
   cat note.txt
   ```
   预期：`cat` 显示两行；`>` 覆盖、`>>` 追加。

2. 管道过滤（沙盒可练）：
   ```bash
   ps | grep bash
   ```
   预期：只留下命令行含 `bash` 的行。

3. 管道串联去重：
   ```bash
   printf "a\nb\na\nc\n" | sort | uniq
   ```
   预期：输出 `a b c` 三行去重结果。

4. 分离错误流：
   ```bash
   ls /no/such 2>err.log      # 仅把错误写进 err.log
   ls / 2>&1 | grep bin        # 把 stderr 合并进 stdout 再过滤
   ```
   说明：`2>` 重定向错误，`2>&1` 把 2 合并到 1。

5. here-doc 生成文件：
   ```bash
   cat > hello.sh <<'EOF'
   #!/bin/bash
   echo "由 here-doc 生成"
   EOF
   cat hello.sh
   ```
   说明：引号 `'EOF'` 阻止内部 `$变量` 被展开，最安全。

## 常见错误

- **`>` 误用清空了文件**：`command > file` 会先**清空** file 再写。想追加务必 `>>`；`> file` 单独用也能清空文件（陷阱）。
- **管道只传 stdout，错误丢了**：`grep` 在管道右边看不到左边的 stderr。要一起过滤用 `2>&1 |`。
- **here-doc 结束符缩进/拼写错**：终止的 `EOF` 必须顶格且一字不差；用了 `<<-` 才能容忍前导 Tab。
- **`echo $var > file` 变量未展开**：若变量在单引号 heredoc/字符串里则不会展开。需要展开就别加引号或用双引号。

## 小结

1. 三流：stdin(0)/stdout(1)/stderr(2)；`>` 覆盖、`>>` 追加、`<` 输入重定向。
2. 管道 `|` 把左 stdout 接成右 stdin，是组合命令的核心。
3. here-doc `<<` 就地喂文本；`2>&1` 合并错误流，排查时极有用。

进阶：下一课把 `set -eux`、管道符行为、`trap` 组合进脚本，让它在出错时自动止损、优雅退出。
