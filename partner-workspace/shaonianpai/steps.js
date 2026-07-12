/* ============================================================================
 * Penguin Path 沙盒步骤 -- 少年派 (partner-workspace/shaonianpai/steps.js)
 * 把本课 STEPS 推入全局数组 window.__PENGUIN_STEPS，供 sandbox/index.html 加载。
 *
 * 负责范围：L7~L9（中级三角）
 * 说明：L7~L9 多为「配置/架构类」课程（nginx/ansible/prometheus），沙盒交互意义有限，
 *       因此仅对少数「纯文件创建」最易沙盒化的课生成 STEPS：
 *         - l7-docker   (sandbox:true)：练习用 echo 创建 Dockerfile / docker-compose.yml
 *         - l8-ansible  (sandbox:true)：练习用 echo 创建 inventory.ini / site.yml
 *       其余 7 课（l7-nginx / l7-mysql / l8-roles / l8-lamp / l9-node / l9-alert / l9-log）
 *       均为 sandbox:false，不生成 STEPS，沙盒页对该课显示「请在真实环境练习」。
 *
 * 约定：
 *   - id 从 701 起递增，避免与其他伙伴（xiaomage 1xx / yanmishu 4xx / xiaozhengge 1xxx）冲突。
 *   - key 必须与 content/<key>.md 的 frontmatter key 完全一致，沙盒与图文课才能联动。
 *   - checker 必须是浏览器内可执行的纯函数（不依赖 Node API）。
 *   - desc / task / tips 支持 HTML（<code> <strong> 等）。
 * ========================================================================== */
if (!window.__PENGUIN_STEPS) window.__PENGUIN_STEPS = [];
(function () {
  "use strict";
  // 归一化：去首尾空白、合并中间多余空白，便于做宽松匹配
  var n = function (s) { return String(s).trim().replace(/\s+/g, " "); };

  window.__PENGUIN_STEPS.push(

    /* ---------------- L7 服务与Web：Docker（l7-docker, sandbox:true） ---------------- */

    // 701：用 echo 创建基础 Dockerfile
    {
      id: 701,
      key: 'l7-docker',
      icon: '🐳',
      name: 'Docker 镜像',
      title: '第一步：创建 Dockerfile',
      desc: 'Dockerfile 是镜像的「配方」。<br>用 <code>echo "FROM nginx:alpine" &gt; Dockerfile</code> 写入第一行——<code>FROM</code> 指定基础镜像。',
      task: '在终端用 <code>echo "FROM nginx:alpine" &gt; Dockerfile</code> 创建一个最基础的 Dockerfile',
      expectedCmd: 'echo "FROM nginx:alpine" > Dockerfile',
      checker: function (cmd) {
        return /^\s*echo\s+.+\s+>\s*Dockerfile\s*$/.test(n(cmd)) || n(cmd) === 'cat Dockerfile';
      },
      commandHint: 'echo "FROM nginx:alpine" > Dockerfile',
      tips: '写完用 <code>cat Dockerfile</code> 查看；真实环境再 <code>docker build -t my-web:v1 .</code> 构建镜像'
    },

    // 702：用 echo 创建 docker-compose.yml
    {
      id: 702,
      key: 'l7-docker',
      icon: '🐳',
      name: 'Docker 编排',
      title: '第二步：创建 docker-compose.yml',
      desc: 'docker-compose 用 <code>services:</code> 描述「多个容器如何一起跑」。<br>先写入顶层键，真实环境再补 web/db 服务。',
      task: '用 <code>echo "services:" &gt; docker-compose.yml</code> 创建编排文件骨架',
      expectedCmd: 'echo "services:" > docker-compose.yml',
      checker: function (cmd) {
        return /^\s*echo\s+.+\s+>\s*docker-compose\.yml\s*$/.test(n(cmd)) || n(cmd) === 'cat docker-compose.yml';
      },
      commandHint: 'echo "services:" > docker-compose.yml',
      tips: '用 <code>echo "  web:" &gt;&gt; docker-compose.yml</code> 可继续追加服务；真实环境 <code>docker compose up -d</code> 一键拉起'
    },

    /* ---------------- L8 自动化：Ansible（l8-ansible, sandbox:true） ---------------- */

    // 703：用 echo 创建 inventory.ini
    {
      id: 703,
      key: 'l8-ansible',
      icon: '🤖',
      name: 'Ansible 清单',
      title: '第一步：创建 Inventory',
      desc: 'Inventory 描述「管哪些机器、怎么分组」。<br>用 <code>echo "[web]" &gt; inventory.ini</code> 写入第一个分组。',
      task: '用 <code>echo "[web]" &gt; inventory.ini</code> 创建清单并写入 [web] 分组',
      expectedCmd: 'echo "[web]" > inventory.ini',
      checker: function (cmd) {
        return /^\s*echo\s+.+\s+>\s*inventory\.ini\s*$/.test(n(cmd)) || n(cmd) === 'cat inventory.ini';
      },
      commandHint: 'echo "[web]" > inventory.ini',
      tips: '继续用 <code>echo "192.168.1.11" &gt;&gt; inventory.ini</code> 把主机追加进 [web] 组'
    },

    // 704：用 echo 创建第一个 Playbook
    {
      id: 704,
      key: 'l8-ansible',
      icon: '🤖',
      name: 'Ansible 剧本',
      title: '第二步：创建 site.yml',
      desc: 'Playbook 用 YAML 声明目标状态，以 <code>- hosts:</code> 开头指定目标分组。<br>写入第一行即可体会结构。',
      task: '用 <code>echo "- hosts: web" &gt; site.yml</code> 创建第一个 Playbook 的起始行',
      expectedCmd: 'echo "- hosts: web" > site.yml',
      checker: function (cmd) {
        return /^\s*echo\s+.+\s+>\s*site\.yml\s*$/.test(n(cmd)) || n(cmd) === 'cat site.yml';
      },
      commandHint: 'echo "- hosts: web" > site.yml',
      tips: 'YAML 用空格缩进（别用 Tab）；真实环境用 <code>ansible-playbook -i inventory.ini site.yml</code> 执行'
    }
  );
})();
