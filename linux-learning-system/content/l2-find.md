---
key: l2-find
level: L2
order: 6
title: 查找文件
lang: shell
objective: 用 find/locate/which 在系统里定位文件与命令
prereq: ['l2-path']
estimated_min: 20
sandbox: true
---

# 查找文件（第六课）

## 讲解

文件一多就找不到？三把"搜索刀"：

- `find`：最强最慢，按条件在目录树里翻。基本句式 `find 起点 -name 模式`，模式支持 `*` 通配符。还能 `-type f`（只看文件）或 `-type d`（只看目录）。
- `locate`：最快，查一个预建索引库（真实系统要 `updatedb`）。本模拟器里 `locate` 等价于 `find / -name`。
- `which`：专门找"命令"装在哪里，比如 `which ls` 告诉你 `/usr/bin/ls`。

一句话记忆：`find` 按名字挖地三尺，`locate` 查现成索引，`which` 找命令本尊。

## 动手实验

1. 在整棵树里找所有 `.txt` 文件：
   ```
   find / -name "*.txt"
   ```
   预期列出 `/home/guest` 下若干 `.txt` 路径。
2. 只在当前目录找（不递归进子目录，用 `-maxdepth 1` 思路，这里用 `-type` 演示）：
   ```
   find . -name "*.sh"
   ```
   预期：`/home/guest/script.sh`
3. 只找目录（不看文件）：
   ```
   find /home -type d
   ```
4. 快速定位（等价于 find /）：
   ```
   locate readme
   ```
5. 找命令 ls 装在哪：
   ```
   which ls
   which cp
   ```
   预期：`/usr/bin/ls`、`/usr/bin/cp`

## 常见错误

- **`find` 模式要加引号**：`find / -name *.txt` 不加引号时 `*` 会被 shell 先展开。这里用引号包住 `"*.txt"` 最稳妥。
- **`locate` 找不到刚建的文件**：真实系统里它依赖索引库，新文件要 `updatedb` 才会进库（本模拟器无此问题，但要知道）。
- **`which` 报 no**：说明不是可执行命令，可能是你拼错或它是别名/内置命令。

## 小结

1. `find 路径 -name "模式"` 最灵活，`locate` 最快，`which` 专找命令。
2. 通配符 `*` 表示任意多字符，记得用引号包住。
3. 进阶：L3 进入文本处理，grep 是从"文件内容"里找，而 find 是从"文件名"里找，二者互补。
