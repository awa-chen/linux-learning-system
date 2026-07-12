---
key: l2-permission
level: L2
order: 5
title: 权限与 chmod
lang: shell
objective: 理解 rwx 权限，会用数字法和符号法修改
prereq: ['l2-path']
estimated_min: 25
sandbox: true
---

# 权限与 chmod（第五课）

## 讲解

Linux 是多用户系统，每个文件都有"谁能看、谁能改、谁能跑"的限制。这就是 **rwx 权限**：

- **r**（read 读）= 4：能看内容
- **w**（write 写）= 2：能改内容
- **x**（execute 执行）= 1：能当作程序运行

权限分三组人：**属主(u)**、**同组(g)**、**其他人(o)**。用 `ls -l` 看，最左一列像 `-rwxr-xr--`：第 1 位是类型，接着 9 位就是 `ugo` 各三位的 rwx。

`chmod` 改权限有两种写法：
- **数字法**：把三组权限各换算成数字相加。如 `755` = `rwxr-xr-x`（属主可读写执行，其他人只能读和执行）。常用 `755` 给脚本、`644` 给普通文件。
- **符号法**：`chmod u+x 文件` 给属主加执行权；`chmod go-w 文件` 去掉同组和其他人的写权；`chmod a=rwx` 所有人全开。

## 动手实验

1. 先看 hello.txt 当前权限：
   ```
   ls -l hello.txt
   ```
   预期类似：`-rw-r--r--`（644）
2. 用数字法让它变成"属主可读写执行，其他只读写"（755）：
   ```
   chmod 755 hello.txt
   ls -l hello.txt
   ```
3. 用符号法只给属主加执行权（从 644 变 744）：
   ```
   chmod u+x notes.txt
   ls -l notes.txt
   ```
4. 去掉"其他人"的所有权限：
   ```
   chmod o-rwx todo.txt
   ls -l todo.txt
   ```
5. 把权限一次性全部打开（符号法）：
   ```
   chmod a=rw script.sh
   ls -l script.sh
   ```

## 常见错误

- **`chmod: 无效模式`**：数字法必须是三位八进制（如 `755`）；符号法要写成 `u+x` 这种格式，别漏掉谁（`u/g/o/a`）。
- **脚本不能运行**：多半缺执行位 `x`。用 `chmod +x 脚本名` 加上即可（本模拟器执行与否不影响，但真实 Linux 会）。
- **数字算错**：记住 r=4 w=2 x=1，三组独立相加。755 = 7(4+2+1) 5(4+1) 5(4+1)。

## 小结

1. rwx = 读/写/执行 = 4/2/1，分属主/同组/其他人三组。
2. `chmod 755 文件`（数字法）或 `chmod u+x 文件`（符号法）。
3. 进阶：L3 学文本处理，你会发现 grep/sed/awk 才是日常最高频的命令。
