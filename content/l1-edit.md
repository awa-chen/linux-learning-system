---
key: l1-edit
level: L1
order: 3
title: 写与整理
lang: shell
objective: 用 echo 重定向写文件，用 cp/mv/rm 复制移动删除
prereq: ['l1-files']
estimated_min: 25
sandbox: true
---

# 写与整理（第三课）

## 讲解

前两课你会"看"和"走"了，现在学"写"和"整理"。

- `echo` 把一段文字打印出来。加上 `> 文件` 叫**重定向**：把本该显示在屏幕的文字写进文件（覆盖）。用 `>> 文件` 则是**追加**到文件末尾，不覆盖原有内容。
- `cp`（copy）：复制文件或目录（目录要加 `-r`）。
- `mv`（move）：移动文件，也可以给文件改名——同一目录下 `mv a.txt b.txt` 就是重命名。
- `rm`（remove）：删除。删目录要加 `-r`（recursive）。**慎用**，模拟终端里删了就没了。

一个好习惯：写重要东西前先 `cat` 看看目标文件现状，避免 `>` 手滑覆盖。

## 动手实验

1. 用 `>` 写入一句话到新文件：
   ```
   echo "Linux 真好用" > memo.txt
   cat memo.txt
   ```
   预期：`Linux 真好用`
2. 用 `>>` 追加第二行（不会覆盖第一行）：
   ```
   echo "每天敲一敲" >> memo.txt
   cat memo.txt
   ```
3. 复制文件：
   ```
   cp memo.txt memo.bak
   ls
   ```
4. 重命名（同目录 mv 即改名）：
   ```
   mv memo.bak memo2.txt
   ls
   ```
5. 删除文件：
   ```
   rm memo2.txt
   ls
   ```
6. 复制整个目录（带 `-r`），再删除它：
   ```
   mkdir src
   echo hi > src/a.txt
   cp -r src dst
   ls
   rm -r dst
   ls
   ```

## 常见错误

- **`>` 把原内容冲掉了**：`>` 是覆盖。要保留原内容用 `>>`。
- **删目录报"是一个目录"**：`rm` 默认只删文件，删目录必须 `rm -r`。
- **`cp` 目录报"略过目录"**：复制目录要加 `-r`，如 `cp -r 源 目标`。

## 小结

1. `echo 文字 > 文件` 覆盖写，`>>` 追加写。
2. `cp` 复制、`mv` 移动/改名、`rm` 删除（目录加 `-r`）。
3. 进阶：L2 学路径与权限，你会理解为什么有时"没有权限"操作文件。
