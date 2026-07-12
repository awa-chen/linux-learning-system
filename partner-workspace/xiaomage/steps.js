/* Penguin Path 沙盒步骤分片 —— 小码哥（L1~L3 入门三关，共 9 课）
 * 推入全局数组 window.__PENGUIN_STEPS，由 sandbox/index.html 读取。
 * 约定：
 *   - id 从 101 起递增，避免与其它伙伴分片冲突（主 agent 集成时会统一重排）。
 *   - key 必须与 content/<key>.md 的 frontmatter key 完全一致。
 *   - checker 必须是浏览器内可执行的纯函数，仅依赖传入的命令字符串。
 *   - desc / task / tips 为 HTML 字符串，支持 <code> <strong> 等。
 */
if (!window.__PENGUIN_STEPS) window.__PENGUIN_STEPS = [];
window.__PENGUIN_STEPS.push(

  /* ---------- L1 小白启航 ---------- */

  // L1-1
  {
    id: 101, key: 'l1-hello', icon: '👋', name: '你好，Linux！',
    title: '第一步：使用 help 命令',
    desc: '在模拟终端里，<code>help</code> 能列出所有支持的命令。先敲它熟悉一下环境。',
    task: '在终端输入 <code>help</code> 并按回车',
    expectedCmd: 'help',
    checker: (cmd) => cmd.trim() === 'help',
    commandHint: 'help',
    tips: '忘记命令就敲 <code>help</code>。注意拼写，<code>helo</code> 会报错。'
  },
  // L1-2
  {
    id: 102, key: 'l1-hello', icon: '📂', name: '你好，Linux！',
    title: '第二步：用 pwd 看位置',
    desc: '<code>pwd</code> 显示当前所在目录（print working directory），相当于抬头看路牌。',
    task: '输入 <code>pwd</code> 查看你此刻在哪个目录',
    expectedCmd: 'pwd',
    checker: (cmd) => cmd.trim() === 'pwd',
    commandHint: 'pwd',
    tips: '预期输出 <code>/home/guest</code>，那是你的家目录。'
  },
  // L1-3
  {
    id: 103, key: 'l1-hello', icon: '📃', name: '你好，Linux！',
    title: '第三步：用 ls 看内容',
    desc: '<code>ls</code> 列出当前目录下的文件和文件夹。加 <code>-l</code> 看详细信息。',
    task: '输入 <code>ls</code> 看看当前目录有什么',
    expectedCmd: 'ls',
    checker: (cmd) => ['ls', 'ls -l', 'ls -a', 'ls -la'].indexOf(cmd.trim()) >= 0,
    commandHint: 'ls',
    tips: '试试 <code>ls -l</code> 看权限、大小、时间；<code>ls -a</code> 看隐藏文件。'
  },

  // L1-4
  {
    id: 104, key: 'l1-files', icon: '🚪', name: '文件与目录',
    title: '第一步：用 cd 走进目录',
    desc: '<code>cd</code> 切换目录。<code>cd 目录名</code> 进入，<code>cd ..</code> 回上层，<code>cd ~</code> 回家。',
    task: '输入 <code>cd projects</code> 进入 projects 目录',
    expectedCmd: 'cd projects',
    checker: (cmd) => cmd.trim() === 'cd projects',
    commandHint: 'cd projects',
    tips: '进不去？先用 <code>ls</code> 看看当前目录是否真有 <code>projects</code>。'
  },
  // L1-5
  {
    id: 105, key: 'l1-files', icon: '📁', name: '文件与目录',
    title: '第二步：用 mkdir 建目录',
    desc: '<code>mkdir 目录名</code> 新建一个目录。多级目录用 <code>mkdir -p a/b/c</code>。',
    task: '输入 <code>mkdir notes</code> 新建一个叫 notes 的目录',
    expectedCmd: 'mkdir notes',
    checker: (cmd) => /^\s*mkdir(\s+-[a-zA-Z]+)*\s+notes\s*$/.test(cmd),
    commandHint: 'mkdir notes',
    tips: '建好后用 <code>ls</code> 确认它出现了。'
  },
  // L1-6
  {
    id: 106, key: 'l1-files', icon: '📄', name: '文件与目录',
    title: '第三步：用 touch 建文件 + cat 查看',
    desc: '<code>touch 文件名</code> 新建空文件；<code>cat 文件名</code> 打印内容。',
    task: '输入 <code>touch idea.txt</code> 新建空文件，再用 <code>cat idea.txt</code> 查看',
    expectedCmd: 'touch idea.txt',
    checker: (cmd) => /^\s*touch\s+idea\.txt\s*$/.test(cmd) || /^\s*cat\s+idea\.txt\s*$/.test(cmd),
    commandHint: 'touch idea.txt',
    tips: '空文件 <code>cat</code> 出来没有内容，这是正常的。'
  },

  // L1-7
  {
    id: 107, key: 'l1-edit', icon: '✍️', name: '写与整理',
    title: '第一步：echo 重定向写文件',
    desc: '<code>echo 文字 &gt; 文件</code> 把文字写入文件（覆盖）；<code>&gt;&gt;</code> 是追加。',
    task: '输入 <code>echo "Linux 真好用" &gt; memo.txt</code> 写一句话到 memo.txt',
    expectedCmd: 'echo "Linux 真好用" > memo.txt',
    checker: (cmd) => /^\s*echo\s+.*>\s*memo\.txt\s*$/.test(cmd),
    commandHint: 'echo "Linux 真好用" > memo.txt',
    tips: '用 <code>cat memo.txt</code> 验证写入成功。<code>&gt;</code> 是覆盖，<code>&gt;&gt;</code> 是追加。'
  },
  // L1-8
  {
    id: 108, key: 'l1-edit', icon: '📋', name: '写与整理',
    title: '第二步：cp 复制与 mv 移动',
    desc: '<code>cp 源 目标</code> 复制；<code>mv 源 目标</code> 移动或改名（目录用 -r）。',
    task: '输入 <code>cp memo.txt memo.bak</code> 复制一份备份',
    expectedCmd: 'cp memo.txt memo.bak',
    checker: (cmd) => /^\s*cp(\s+-[a-zA-Z]+)*\s+memo\.txt\s+memo\.bak\s*$/.test(cmd),
    commandHint: 'cp memo.txt memo.bak',
    tips: '复制目录要加 <code>-r</code>，如 <code>cp -r 源 目标</code>。'
  },
  // L1-9
  {
    id: 109, key: 'l1-edit', icon: '🗑️', name: '写与整理',
    title: '第三步：rm 删除',
    desc: '<code>rm 文件</code> 删文件；删目录要 <code>rm -r 目录</code>。模拟环境里删了就没了，慎用。',
    task: '输入 <code>rm memo.bak</code> 删除刚才的备份',
    expectedCmd: 'rm memo.bak',
    checker: (cmd) => /^\s*rm(\s+-[a-zA-Z]+)*\s+memo\.bak\s*$/.test(cmd),
    commandHint: 'rm memo.bak',
    tips: '删目录记得 <code>-r</code>。删之前确认名字，别误删。'
  },

  /* ---------- L2 文件系统 ---------- */

  // L2-1
  {
    id: 110, key: 'l2-path', icon: '🧭', name: '路径是什么',
    title: '第一步：绝对路径直接访问',
    desc: '以 <code>/</code> 开头的绝对路径从根目录写全住址，无论在哪都指向同一文件。',
    task: '输入 <code>cat /home/guest/hello.txt</code> 用绝对路径查看文件',
    expectedCmd: 'cat /home/guest/hello.txt',
    checker: (cmd) => /^\s*cat\s+\/home\/guest\/hello\.txt\s*$/.test(cmd),
    commandHint: 'cat /home/guest/hello.txt',
    tips: '绝对路径最稳，脚本里优先用它。'
  },
  // L2-2
  {
    id: 111, key: 'l2-path', icon: '⬆️', name: '路径是什么',
    title: '第二步：.. 与 ~',
    desc: '<code>..</code> 是上层目录，<code>~</code> 是家目录。先用 <code>cd projects</code>，再 <code>cd ..</code> 返回。',
    task: '输入 <code>cd ..</code> 从当前目录回到上层',
    expectedCmd: 'cd ..',
    checker: (cmd) => cmd.trim() === 'cd ..',
    commandHint: 'cd ..',
    tips: '迷路了就 <code>cd ~</code> 一键回家，再 <code>pwd</code> 确认。'
  },
  // L2-3
  {
    id: 112, key: 'l2-path', icon: '🌲', name: '路径是什么',
    title: '第三步：用 ~ 与 -p 建嵌套目录',
    desc: '回到家用 <code>cd ~</code>，再用 <code>mkdir -p work/draft</code> 一次建多级目录。',
    task: '输入 <code>mkdir -p work/draft</code> 创建嵌套目录',
    expectedCmd: 'mkdir -p work/draft',
    checker: (cmd) => /^\s*mkdir\s+-p\s+work\/draft\s*$/.test(cmd),
    commandHint: 'mkdir -p work/draft',
    tips: '不加 <code>-p</code> 时父目录不存在会报错；<code>-p</code> 会自动补齐父目录。'
  },

  // L2-4
  {
    id: 113, key: 'l2-permission', icon: '🔑', name: '权限与 chmod',
    title: '第一步：查看权限 ls -l',
    desc: '用 <code>ls -l</code> 看权限串，如 <code>-rw-r--r--</code> 表示属主可读写、其他人只读。',
    task: '输入 <code>ls -l hello.txt</code> 查看文件权限',
    expectedCmd: 'ls -l hello.txt',
    checker: (cmd) => /^\s*ls\s+-l\s+hello\.txt\s*$/.test(cmd),
    commandHint: 'ls -l hello.txt',
    tips: '第一位 <code>-</code> 是文件、<code>d</code> 是目录；接着 9 位是 u/g/o 三组 rwx。'
  },
  // L2-5
  {
    id: 114, key: 'l2-permission', icon: '🔢', name: '权限与 chmod',
    title: '第二步：数字法 chmod 755',
    desc: 'r=4 w=2 x=1。755 = rwxr-xr-x。用 <code>chmod 755 文件</code> 修改。',
    task: '输入 <code>chmod 755 hello.txt</code> 修改权限',
    expectedCmd: 'chmod 755 hello.txt',
    checker: (cmd) => /^\s*chmod\s+755\s+hello\.txt\s*$/.test(cmd),
    commandHint: 'chmod 755 hello.txt',
    tips: '普通文件常设 644，可执行脚本常设 755。'
  },
  // L2-6
  {
    id: 115, key: 'l2-permission', icon: '➕', name: '权限与 chmod',
    title: '第三步：符号法 chmod u+x',
    desc: '符号法更直观：<code>u+x</code> 给属主加执行权，<code>go-w</code> 去掉写权，<code>a=rwx</code> 全开。',
    task: '输入 <code>chmod u+x notes.txt</code> 给属主加执行权限',
    expectedCmd: 'chmod u+x notes.txt',
    checker: (cmd) => /^\s*chmod\s+[ugoa]*[+\-=][rwx]*\s+notes\.txt\s*$/.test(cmd),
    commandHint: 'chmod u+x notes.txt',
    tips: '符号法不必记数字，写 <code>u+x</code> 即可给属主加执行位。'
  },

  // L2-7
  {
    id: 116, key: 'l2-find', icon: '🔎', name: '查找文件',
    title: '第一步：find 按名查找',
    desc: '<code>find 起点 -name "模式"</code> 按文件名查找，<code>*</code> 是通配符。',
    task: '输入 <code>find / -name "*.txt"</code> 找出所有 txt 文件',
    expectedCmd: 'find / -name "*.txt"',
    checker: (cmd) => /^\s*find\s+\/\s+-name\s+"?\*?\.txt"?\s*$/.test(cmd),
    commandHint: 'find / -name "*.txt"',
    tips: '模式用引号包住，避免 <code>*</code> 被提前展开。'
  },
  // L2-8
  {
    id: 117, key: 'l2-find', icon: '📍', name: '查找文件',
    title: '第二步：which 找命令',
    desc: '<code>which 命令</code> 告诉你命令装在哪，比如 <code>/usr/bin/ls</code>。',
    task: '输入 <code>which ls</code> 查看 ls 命令的位置',
    expectedCmd: 'which ls',
    checker: (cmd) => /^\s*which\s+ls\s*$/.test(cmd),
    commandHint: 'which ls',
    tips: '报 "no" 说明不是可执行命令，可能拼错或是别名。'
  },

  /* ---------- L3 文本处理 ---------- */

  // L3-1
  {
    id: 118, key: 'l3-grep', icon: '🔍', name: 'grep 文本搜索',
    title: '第一步：grep 基础搜索',
    desc: '<code>grep 模式 文件</code> 在文件内容里找匹配行。',
    task: '输入 <code>grep Linux hello.txt</code> 找含 Linux 的行',
    expectedCmd: 'grep Linux hello.txt',
    checker: (cmd) => /^\s*grep\s+Linux\s+hello\.txt\s*$/.test(cmd),
    commandHint: 'grep Linux hello.txt',
    tips: '默认区分大小写；忽略大小写加 <code>-i</code>，如 <code>grep -i linux hello.txt</code>。'
  },
  // L3-2
  {
    id: 119, key: 'l3-grep', icon: '🔢', name: 'grep 文本搜索',
    title: '第二步：grep -n 显示行号',
    desc: '加 <code>-n</code> 让 grep 显示"第几行:内容"，方便定位。',
    task: '输入 <code>grep -n Linux hello.txt</code> 带行号搜索',
    expectedCmd: 'grep -n Linux hello.txt',
    checker: (cmd) => /^\s*grep\s+-n\s+Linux\s+hello\.txt\s*$/.test(cmd),
    commandHint: 'grep -n Linux hello.txt',
    tips: '想忽略大小写同时显示行号？<code>grep -in linux hello.txt</code> 可以叠加选项。'
  },
  // L3-3
  {
    id: 120, key: 'l3-grep', icon: '📡', name: 'grep 文本搜索',
    title: '第三步：管道 ls | grep',
    desc: '管道 <code>|</code> 把左边输出喂给右边命令。用 <code>ls | grep sh</code> 筛选文件名。',
    task: '输入 <code>ls | grep sh</code> 从 ls 结果里筛出含 sh 的文件',
    expectedCmd: 'ls | grep sh',
    checker: (cmd) => cmd.trim().replace(/\s+/g, ' ') === 'ls | grep sh',
    commandHint: 'ls | grep sh',
    tips: '管道是 Linux 灵魂：左边命令的输出，直接变成右边命令的输入。'
  },

  // L3-4
  {
    id: 121, key: 'l3-sed', icon: '🔁', name: 'sed 流编辑替换',
    title: '第一步：sed 替换',
    desc: '<code>sed "s/旧/新/" 文件</code> 把"旧"换成"新"，默认只输出结果、不改原文件。',
    task: '输入 <code>sed "s/Linux/Penguin/" hello.txt</code> 把 Linux 换成 Penguin',
    expectedCmd: 'sed "s/Linux/Penguin/" hello.txt',
    checker: (cmd) => /^\s*sed\s+["']?s\/Linux\/Penguin\/["']?\s+hello\.txt\s*$/.test(cmd),
    commandHint: 'sed "s/Linux/Penguin/" hello.txt',
    tips: 'sed 默认不改源文件，很安全。整行全替换加 <code>g</code>：<code>s/Linux/Penguin/g</code>。'
  },
  // L3-5
  {
    id: 122, key: 'l3-sed', icon: '🌐', name: 'sed 流编辑替换',
    title: '第二步：sed 全部替换 g',
    desc: '加 <code>g</code>（global）让一行里所有匹配都被替换，而不只是第一个。',
    task: '输入 <code>echo "aa bb aa" | sed "s/aa/XX/g"</code> 体会全局替换',
    expectedCmd: 'echo "aa bb aa" | sed "s/aa/XX/g"',
    checker: (cmd) => cmd.replace(/\s+/g, ' ').trim() === 'echo "aa bb aa" | sed "s/aa/XX/g"',
    commandHint: 'echo "aa bb aa" | sed "s/aa/XX/g"',
    tips: '忘了 <code>g</code> 只会换每行第一个——这是新手最常见的 sed 困惑。'
  },

  // L3-6
  {
    id: 123, key: 'l3-awk', icon: '📊', name: 'awk 字段提取',
    title: '第一步：awk 取第一列',
    desc: '<code>awk "{print $1}" 文件</code> 取每行的第一列。<code>$0</code> 是整行，<code>NF</code> 是字段数。',
    task: '输入 <code>awk "{print $1}" todo.txt</code> 提取每行的序号列',
    expectedCmd: 'awk "{print $1}" todo.txt',
    checker: (cmd) => cmd.replace(/\s+/g, ' ').trim() === 'awk "{print $1}" todo.txt',
    commandHint: 'awk "{print $1}" todo.txt',
    tips: '字段从 <code>$1</code> 开始，<code>$0</code> 才是整行；默认按空白分列。'
  },
  // L3-7
  {
    id: 124, key: 'l3-awk', icon: '🧮', name: 'awk 字段提取',
    title: '第二步：awk 指定分隔符 -F',
    desc: '用 <code>-F</code> 指定列分隔符，如 <code>-F:</code> 按冒号分列，适合处理结构化文本。',
    task: '输入 <code>echo "name:Linux:2026" | awk -F: "{print $2}"</code> 取第二列',
    expectedCmd: 'echo "name:Linux:2026" | awk -F: "{print $2}"',
    checker: (cmd) => cmd.replace(/\s+/g, ' ').trim() === 'echo "name:Linux:2026" | awk -F: "{print $2}"',
    commandHint: 'echo "name:Linux:2026" | awk -F: "{print $2}"',
    tips: '分列不对多半是忘了 <code>-F</code>。逗号分隔数据用 <code>-F,</code>。'
  }
);
