// Penguin Path（企鹅之路）—— 小政哥 沙盒步骤分片
// 范围：L10 安全加固 + L11 性能调优
// 说明：高级课多为概念/配置类，沙盒交互意义不大，仅对少量适合命令演示的课
//       （l10-sudo、l11-cpu）生成 STEPS；其余课程 sandbox:false 不写 STEPS，
//       沙盒页对该课自动显示"请在真实环境练习"。
// STEPS 的 key 必须与 content/<key>.md 的 frontmatter key 完全一致。
// checker 必须是浏览器内可执行的纯函数。
// id 从 1001 起递增。

if (!window.__PENGUIN_STEPS) window.__PENGUIN_STEPS = [];
window.__PENGUIN_STEPS.push(
  // ---------- L10 安全加固：sudo 精细授权（sandbox:true） ----------
  {
    id: 1001,
    key: 'l10-sudo',
    icon: '🔐',
    name: 'sudo 精细授权',
    title: '第一步：检查 sudoers 语法',
    desc: '在真实环境里用 <code>visudo -c</code> 校验当前 sudoers 配置语法是否合法。',
    task: '输入 <code>sudo visudo -c</code> 检查语法',
    expectedCmd: 'sudo visudo -c',
    checker: (cmd) => cmd.trim() === 'sudo visudo -c',
    commandHint: 'sudo visudo -c',
    tips: '永远用 <code>visudo</code> 校验，避免把 sudoers 写错导致无法提权。'
  },
  {
    id: 1002,
    key: 'l10-sudo',
    icon: '🔐',
    name: 'sudo 精细授权',
    title: '第二步：列出当前用户被允许的命令',
    desc: '用 <code>sudo -l</code> 查看你被授权能以 root 执行哪些命令，验证精细授权是否生效。',
    task: '输入 <code>sudo -l</code> 列出授权',
    expectedCmd: 'sudo -l',
    checker: (cmd) => cmd.trim() === 'sudo -l',
    commandHint: 'sudo -l',
    tips: '如果看到 <code>(root) NOPASSWD: /bin/systemctl restart nginx</code> 说明精细规则已加载。'
  },
  {
    id: 1003,
    key: 'l10-sudo',
    icon: '🔐',
    name: 'sudo 精细授权',
    title: '第三步：执行一条被授权的命令',
    desc: '执行授权范围内的命令（例如重启 nginx），验证最小权限授权可用。',
    task: '输入一条被授权的 sudo 命令，如 <code>sudo systemctl restart nginx</code>',
    expectedCmd: 'sudo systemctl restart nginx',
    checker: (cmd) => cmd.trim().startsWith('sudo systemctl restart nginx'),
    commandHint: 'sudo systemctl restart nginx',
    tips: '未授权的命令（如 <code>sudo reboot</code>）应被拒绝：user is not allowed to execute...'
  },

  // ---------- L11 性能调优：CPU 观测（sandbox:true） ----------
  {
    id: 1004,
    key: 'l11-cpu',
    icon: '📈',
    name: 'CPU 性能观测',
    title: '第一步：查看系统负载',
    desc: '用 <code>uptime</code> 查看 1/5/15 分钟平均负载，load ≈ CPU 核数 即饱和。',
    task: '输入 <code>uptime</code> 查看负载',
    expectedCmd: 'uptime',
    checker: (cmd) => cmd.trim() === 'uptime',
    commandHint: 'uptime',
    tips: '负载看 15 分钟趋势；短时尖峰正常，持续 > 核数 才说明在排队。'
  },
  {
    id: 1005,
    key: 'l11-cpu',
    icon: '📈',
    name: 'CPU 性能观测',
    title: '第二步：逐核利用率',
    desc: '用 <code>mpstat -P ALL</code> 看每个 CPU 核的利用率，排查"单核跑满"。',
    task: '输入 <code>mpstat -P ALL 1 1</code> 采样一次',
    expectedCmd: 'mpstat -P ALL 1 1',
    checker: (cmd) => cmd.trim().startsWith('mpstat'),
    commandHint: 'mpstat -P ALL 1 1',
    tips: '需先 <code>dnf/apt install sysstat</code>；%iowait 高其实是 IO 问题，不是 CPU。'
  },
  {
    id: 1006,
    key: 'l11-cpu',
    icon: '📈',
    name: 'CPU 性能观测',
    title: '第三步：进程级 CPU 占用',
    desc: '用 <code>pidstat -u</code> 看每个进程的 CPU 占用，定位吃 CPU 的进程。',
    task: '输入 <code>pidstat -u 1 1</code> 采样一次',
    expectedCmd: 'pidstat -u 1 1',
    checker: (cmd) => cmd.trim().startsWith('pidstat'),
    commandHint: 'pidstat -u 1 1',
    tips: '<code>top</code> 全局 → <code>mpstat -P ALL</code> 分核 → <code>pidstat -u</code> 分进程，逐级下钻。'
  }
);
