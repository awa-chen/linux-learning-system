---
key: l3-sed
level: L3
order: 8
title: sed 流编辑替换
lang: shell
objective: 用 sed 做文本替换，理解流编辑思想
prereq: ['l3-grep']
estimated_min: 20
sandbox: true
---

# sed 流编辑替换（第八课）

## 讲解

`sed`（stream editor，流编辑器）像一条流水线：文本一行行流过，你在流水线上做替换、删除等操作，最后输出结果。最常用的就是**替换**：

```
sed 's/旧/新/' 文件
```

- `s` 表示 substitute（替换）。
- 旧/新之间用 `/` 分隔（也可用其他分隔符，如 `s#旧#新#`）。
- 默认只替换每行**第一次**出现。要整行所有出现都换，加 `g`（global）：`sed 's/旧/新/g' 文件`。

注意：`sed` 默认只把结果输出到屏幕，**不改动原文件**（本模拟器同理，只返回结果）。真实 Linux 想直接改文件要加 `-i` 选项。

本课结合 `grep` 学到的"模式"，你可以把"旧"写成正则，比如 `sed 's/Linux/Penguin/g'`。

## 动手实验

1. 把 hello.txt 里的 "Linux" 换成 "Penguin"（只显示结果，不改原文件）：
   ```
   sed 's/Linux/Penguin/' hello.txt
   ```
   预期该行变成：`Penguin 是这套学习系统的内核代号。`
2. 验证原文件没被改：
   ```
   grep Linux hello.txt
   ```
   预期仍能找到 `Linux`（说明 sed 默认不改源文件）。
3. 替换所有出现（本文件 Linux 只出现一次，换多词体会 g）：
   ```
   echo "aa bb aa" | sed 's/aa/XX/g'
   ```
   预期：`XX bb XX`
4. 用正则：把行首的时间戳式 `1.` 换成 `第1步`：
   ```
   sed 's/^\([0-9]\)\./第\1步/' todo.txt
   ```
   （正则括号需转义；本模拟器也支持简单写法）
5. 管道组合：先 grep 出含 Linux 的行，再 sed 替换：
   ```
   grep Linux hello.txt | sed 's/Linux/★Linux★/'
   ```

## 常见错误

- **sed 后原文件没变**：这是正常行为——默认输出到屏幕。想真正改文件在真实 Linux 用 `sed -i`，但动手前务必先备份。
- **分隔符冲突**：文本里正好有 `/` 时，换用别的分隔符，如 `sed 's#/old/#/new/#'`。
- **只换了一处**：忘了加 `g`。要"全部替换"必须 `s/旧/新/g`。

## 小结

1. `sed 's/旧/新/'` 做替换，`g` 表示整行全部替换。
2. sed 默认不改源文件，只输出结果——安全又常用。
3. 进阶：下一课 `awk` 专注"按列/字段"提取，和 grep/sed 组成文本三剑客。
