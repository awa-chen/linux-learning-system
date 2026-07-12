---
key: l1-hello
level: L1
order: 1
title: 你好，Linux！
lang: shell
objective: 认识终端，学会用 help/ls/pwd 摸路
prereq: []
estimated_min: 15
sandbox: true
---

# 你好，Linux！（第一课）

## 讲解

欢迎来到 **Penguin Path（企鹅之路）** ！这一课我们要跨过"怕黑框"这道坎。Linux 的终端（Terminal）就是一个输入框：你敲命令，它给结果。它不可怕，反而非常诚实——你输入什么，它就做什么。

三个最基础的"探路"命令：

- `help`：查看当前模拟终端支持哪些命令。忘了命令就敲 `help`。
- `ls`（list）：列出当前目录里有什么文件和文件夹，像翻开一个抽屉看里面。
- `pwd`（print working directory）：告诉你"我现在在哪个目录"，相当于抬头看路牌。

我们一开始就活在 `/home/guest` 这个目录里（guest 是你的用户名）。后面所有操作都从这里出发。先别急着记命令，先学会"看路"。

## 动手实验

1. 输入 `help` 回车，看看支持哪些命令：
   ```
   help
   ```
2. 看看现在在哪个目录：
   ```
   pwd
   ```
   预期输出：`/home/guest`
3. 看看这个目录里有什么：
   ```
   ls
   ```
   预期输出包含：`hello.txt  notes.txt  projects  script.sh  todo.txt`
4. 用 `-l` 看更详细的信息（权限、大小、时间）：
   ```
   ls -l
   ```
   预期开头：`-rw-r--r-- 1 guest guest ... hello.txt`
5. 组合拳：看详细列表并从中筛出含 `txt` 的名字（管道）：
   ```
   ls -l | grep txt
   ```

## 常见错误

- **敲完没反应**：多半是没按回车。命令要回车才会执行。
- **命令提示"未找到命令"**：模拟终端只支持 `help` 列出的命令。检查拼写，比如 `helo` 会报错，应敲 `help`。
- **`ls` 看不到隐藏文件**：以 `.` 开头的文件是隐藏的，要加 `-a`：试试 `ls -a`。

## 小结

1. `help` 是万能求助键，`ls` 看内容，`pwd` 看位置。
2. 终端是"输入即执行"，错了也不会坏，放心多敲。
3. 进阶：下一课学 `cd` 和 `mkdir`，学会在目录之间走动和新建文件夹。
