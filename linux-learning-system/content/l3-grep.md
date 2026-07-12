---
key: l3-grep
level: L3
order: 7
title: grep 文本搜索
lang: shell
objective: 用 grep 在文件/输出里按模式搜索，初识正则
prereq: ['l2-find']
estimated_min: 25
sandbox: true
---

# grep 文本搜索（第七课）

## 讲解

`find` 按"文件名"找，`grep` 按"文件内容"找——它是文本处理三剑客之首。基本句式：

```
grep 模式 文件
```

常用选项：
- `-i`：忽略大小写（ignore case）
- `-n`：显示行号（显示"第几行:内容"）
- `-r`：递归搜目录里所有文件

"模式"可以是普通词，也可以是**正则**（regular expression）：
- `^Linux` 表示行首是 Linux
- `txt$` 表示以 txt 结尾的行
- `.` 匹配任意一个字符，`*` 表示前面那个字符重复零次或多次

本模拟器支持 `-i`、`-n`、`-r` 以及基础正则。配合管道 `|`，grep 能从任何命令的输出里筛内容，比如 `ls -l | grep txt`。

## 动手实验

1. 在 hello.txt 里找含 "Linux" 的行：
   ```
   grep Linux hello.txt
   ```
   预期：`Linux 是这套学习系统的内核代号。`
2. 忽略大小写再找（试试小写 linux）：
   ```
   grep -i linux hello.txt
   ```
3. 显示行号：
   ```
   grep -n Linux hello.txt
   ```
   预期：`2:Linux 是这套学习系统的内核代号。`
4. 用正则：找出以 "Linux" 开头的行：
   ```
   grep "^Linux" hello.txt
   ```
5. 管道：从 ls 输出里筛出 sh 文件：
   ```
   ls | grep sh
   ```
6. 递归在 projects 目录里找含 "练习" 的内容：
   ```
   grep -r 练习 projects
   ```

## 常见错误

- **grep 报"是一个目录"**：你给了目录当文件。加 `-r` 让它递归搜目录，或只搜具体文件。
- **大小写不匹配啥也搜不到**：默认区分大小写。要忽略大小写就加 `-i`。
- **正则特殊字符被误解**：`.`、`*`、`^`、`$` 在 grep 里是元字符。想搜字面点号就加引号并用反斜杠，如 `grep "file\.txt"`。

## 小结

1. `grep 模式 文件`，加 `-i` 忽略大小写、`-n` 行号、`-r` 递归。
2. grep 配合 `|` 管道能从任意命令输出里筛选，威力巨大。
3. 进阶：下一课 `sed` 不只是"找"，还能"找了之后替换"。
