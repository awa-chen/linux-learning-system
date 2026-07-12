/* ============================================================================
 * Penguin Path · 言秘书 沙盒步骤分片 (partner-workspace/yanmishu/steps.js)
 * 推入全局 window.__PENGUIN_STEPS__，由 sandbox/index.html 依次加载。
 *
 * 参与范围: L4~L6 共 13 课（图文/资源见交付报告）。
 * 其中仅有以下课程的命令落在模拟器内核支持范围内 (help/ls/ps/echo/cat/grep/|)
 * 故设为 sandbox:true 并产出 STEPS:
 *   - l4-process  (ps / ps -ef / ps aux / ps | grep bash)
 *   - l5-io       (echo > / >> / cat / cat | grep)
 * 其余 11 课 (用户组/服务/包管理/bash 变量·判断·函数·调试/ip·ss·dns·ssh)
 * 均为需真实环境的概念/配置操作，已设 sandbox:false，不在此写 STEPS。
 *
 * 约定:
 *   - id 自 401 起递增，避免与 xiaomage(1~) 等其它分片冲突。
 *   - key 与对应 content/<key>.md 的 frontmatter key 完全一致。
 *   - checker 为浏览器内可执行的纯函数（仅依赖输入字符串）。
 * ========================================================================== */
if (!window.__PENGUIN_STEPS) window.__PENGUIN_STEPS = [];
(function () {
  "use strict";
  // 归一化：去首尾空格、合并中间多余空格，便于稳定比较命令
  var n = function (s) { return String(s).trim().replace(/\s+/g, " "); };

  window.__PENGUIN_STEPS.push(

    /* ---------------- L4 进程与信号 (l4-process) ---------------- */
    {
      id: 401,
      key: 'l4-process',
      icon: '⚙️',
      name: '查看进程快照',
      title: '用 ps 查看当前进程',
      desc: 'Linux 里每条运行的命令都是一个<strong>进程</strong>，内核给它编号 PID。<br><code>ps</code> 抓取当前会话的进程快照。',
      task: '在终端输入 <code>ps</code> 并按回车',
      expectedCmd: 'ps',
      checker: function (cmd) { return n(cmd) === 'ps'; },
      commandHint: 'ps',
      tips: '输出含 PID、TTY、CMD 三列。PID 是进程身份证，后面 kill 时会用到。'
    },
    {
      id: 402,
      key: 'l4-process',
      icon: '📋',
      name: '完整格式',
      title: 'ps -ef 看全部进程与父子关系',
      desc: '<code>ps -ef</code> 以完整格式列出<strong>所有</strong>进程，多出 UID 与 PPID（父进程号），能看清进程树。',
      task: '输入 <code>ps -ef</code>',
      expectedCmd: 'ps -ef',
      checker: function (cmd) { return n(cmd) === 'ps -ef'; },
      commandHint: 'ps -ef',
      tips: 'PPID 是"谁启动了我"。排错时顺着 PPID 往上找，常能定位到真凶父服务。'
    },
    {
      id: 403,
      key: 'l4-process',
      icon: '🔭',
      name: 'BSD 风格',
      title: 'ps aux 另一种全量视图',
      desc: '<code>ps aux</code> 是 BSD 风格的全量列表，带 CPU/内存占用列，和 <code>-ef</code> 信息互补。',
      task: '输入 <code>ps aux</code>',
      expectedCmd: 'ps aux',
      checker: function (cmd) { return n(cmd) === 'ps aux'; },
      commandHint: 'ps aux',
      tips: 'top 实时刷新就是基于这类数据；卡顿先看 %CPU/%MEM 最高的进程。'
    },
    {
      id: 404,
      key: 'l4-process',
      icon: '🔗',
      name: '管道过滤',
      title: 'ps | grep bash 组合搜索',
      desc: '管道 <code>|</code> 把左边 <code>ps</code> 的输出喂给右边 <code>grep</code> 过滤。这是日常排查的标配组合。',
      task: '输入 <code>ps | grep bash</code>',
      expectedCmd: 'ps | grep bash',
      checker: function (cmd) { return n(cmd) === 'ps | grep bash'; },
      commandHint: 'ps | grep bash',
      tips: '管道让你像搭积木一样串命令：左边产出 → 右边筛选，无限叠加。'
    },

    /* ---------------- L5 重定向与管道 (l5-io) ---------------- */
    {
      id: 405,
      key: 'l5-io',
      icon: '➡️',
      name: '输出重定向',
      title: 'echo 写入文件 (>)',
      desc: '<code>></code> 把命令的 stdout 从屏幕"引流"到文件，<strong>覆盖</strong>原内容。',
      task: '输入 <code>echo "hello penguin" > note.txt</code>',
      expectedCmd: 'echo "hello penguin" > note.txt',
      checker: function (cmd) { return /echo\s+.+\s+>\s*note\.txt/.test(n(cmd)); },
      commandHint: 'echo "hello penguin" > note.txt',
      tips: '注意 &gt; 会清空原文件再写；单独 `> file` 也能清空文件，小心别误用。'
    },
    {
      id: 406,
      key: 'l5-io',
      icon: '📎',
      name: '追加重定向',
      title: 'echo 追加内容 (>>)',
      desc: '<code>>></code> 把输出<strong>追加</strong>到文件末尾，不破坏已有内容。',
      task: '输入 <code>echo "second line" >> note.txt</code>',
      expectedCmd: 'echo "second line" >> note.txt',
      checker: function (cmd) { return /echo\s+.+\s+>>\s*note\.txt/.test(n(cmd)); },
      commandHint: 'echo "second line" >> note.txt',
      tips: '写日志、累积结果都用 >>；> 与 >> 一字之差，效果天壤之别。'
    },
    {
      id: 407,
      key: 'l5-io',
      icon: '📄',
      name: '读回文件',
      title: 'cat 查看文件内容',
      desc: '<code>cat</code> 把文件内容打印到 stdout，用来确认前面写入的结果。',
      task: '输入 <code>cat note.txt</code>',
      expectedCmd: 'cat note.txt',
      checker: function (cmd) { return n(cmd) === 'cat note.txt'; },
      commandHint: 'cat note.txt',
      tips: 'cat 后面可跟多个文件依次显示；大文件用 less 翻页更舒服。'
    },
    {
      id: 408,
      key: 'l5-io',
      icon: '🧹',
      name: '管道实战',
      title: 'cat note.txt | grep penguin',
      desc: '把 <code>cat</code> 的输出经管道交给 <code>grep</code> 过滤，只留下含 "penguin" 的行——这就是数据流的典型用法。',
      task: '输入 <code>cat note.txt | grep penguin</code>',
      expectedCmd: 'cat note.txt | grep penguin',
      checker: function (cmd) { return n(cmd) === 'cat note.txt | grep penguin'; },
      commandHint: 'cat note.txt | grep penguin',
      tips: '管道串的是"数据流"：左边 stdout → 右边 stdin。试试把 grep 换成别的模式。'
    }
  );
})();
