---
key: l1-files
level: L1
order: 2
title: 文件与目录
lang: shell
objective: 学会用 cd 走动、mkdir 建目录、touch 建文件、cat 看内容
prereq: ['l1-hello']
estimated_min: 20
sandbox: true
---

# 文件与目录（第二课）

## 讲解

现实里我们用文件夹装文件，Linux 里叫"目录"（directory）。这节课学四件事：怎么走、怎么建、怎么造、怎么看。

- `cd`（change directory）：切换目录，像走进不同的房间。`cd ..` 回上一层，`cd ~` 回自己家目录，`cd projects` 走进 projects 文件夹。
- `mkdir`（make directory）：新建一个目录，像买个新抽屉。
- `touch`：新建一个空文件（或更新已有文件的修改时间），像放一张白纸进去。
- `cat`（concatenate）：把文件内容打印到屏幕，像把纸上字读出来。

记住目录树是分层的：`/home/guest` 是家，`projects` 是它里面的一个子目录。走之前先用 `pwd` 确认自己在哪。

## 动手实验

1. 确认位置并进入 projects 目录：
   ```
   pwd
   cd projects
   pwd
   ```
   预期：`/home/guest/projects`
2. 新建一个目录并进去看看：
   ```
   mkdir notes
   ls
   cd notes
   pwd
   ```
3. 在 notes 里新建一个空文件并查看内容（应为空）：
   ```
   touch idea.txt
   cat idea.txt
   ```
4. 退回上一层，再回家里：
   ```
   cd ..
   pwd
   cd ~
   pwd
   ```
5. 一次性建多级目录（需 `-p`，父目录不存在也能建）：
   ```
   mkdir -p a/b/c
   ls -R
   ```

## 常见错误

- **`cd: 没有那个文件或目录`**：目录名拼错，或还没建。先用 `ls` 看看当前目录到底有哪些名字。
- **`cd` 后没变化**：其实可能进去了，用 `pwd` 确认，别靠感觉。
- **`touch` 报"没有那个文件或目录"**：你写的路径里某级父目录不存在。先 `mkdir -p` 建好父目录。

## 小结

1. `cd` 走路、`mkdir` 建房、`touch` 造纸、`cat` 读字。
2. 不确定位置就 `pwd`；不确定内容就 `ls`。
3. 进阶：下一课学 `echo` 重定向、`cp`/`mv`/`rm`，真正开始"编辑与整理"文件。
