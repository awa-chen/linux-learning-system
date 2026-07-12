/**
 * PenguinEmulator —— Penguin Path（企鹅之路）轻量前端 Linux 模拟内核
 * 零依赖 · 纯浏览器原生 JS · 无需后端
 *
 * ============================================================
 * 对外接口
 * ============================================================
 *   // 创建沙盒状态（虚拟文件系统 + 当前目录），每个会话只创建一次并长期持有
 *   const ctx = PenguinEmulator.createContext();
 *
 *   // 执行一条命令，返回结果对象
 *   const res = PenguinEmulator("ls -l", ctx);
 *   res.output  // 字符串：模拟终端输出
 *   res.error   // 布尔：是否出错（出错时 output 为友好中文提示）
 *   res.clear   // 布尔：是否为 clear 命令（沙盒页据此清屏）
 *
 *   ctx 会在多次调用间保持状态：cwd（当前目录）、fs（虚拟文件系统树）、user。
 *
 * ============================================================
 * 命令清单（[cmd]: (args, ctx, stdin) => string）
 * ============================================================
 *   基础：help, ls, pwd, cd, mkdir, touch, cat,
 *         echo(支持 > 和 >> 重定向), cp, mv, rm, chmod,
 *         grep, ps, date, whoami, uname, clear
 *   管道：|  （例如  ls | grep txt 、 cat hello.txt | grep Linux）
 *   进阶（为本系统 L2/L3 课程补齐，非强制但保证沙盒可用）：
 *         find / locate / which（查找），
 *         sed（替换） / awk（字段提取）
 *
 * 出错一律返回友好中文提示，绝不向外抛出异常。
 * ============================================================
 */
(function (global) {
  "use strict";

  /* ---------------- 工具函数 ---------------- */

  function splitPath(p) { return String(p).split("/").filter(Boolean); }

  // 把任意路径（绝对/相对/~/. /..）解析为规范的绝对路径
  function normalize(cwd, p) {
    p = String(p == null ? "" : p);
    if (p === "" ) return cwd;
    if (p === "~" || p.indexOf("~/") === 0) {
      p = "/home/guest" + (p.length === 1 ? "" : p.slice(1));
    }
    if (p.charAt(0) !== "/") {
      var base = cwd.replace(/\/$/, "");
      p = base + "/" + p;
    }
    var parts = [];
    splitPath(p).forEach(function (seg) {
      if (seg === ".") return;
      if (seg === "..") { parts.pop(); return; }
      parts.push(seg);
    });
    return "/" + parts.join("/");
  }

  function getNode(path, fs) {
    if (!path || path === "/") return fs;
    var parts = splitPath(path);
    var node = fs;
    for (var i = 0; i < parts.length; i++) {
      if (!node || node.type !== "dir") return null;
      node = node.children[parts[i]];
      if (!node) return null;
    }
    return node;
  }

  function getParent(path, fs) {
    var parts = splitPath(path);
    var name = parts.length ? parts.pop() : "";
    var parentPath = "/" + parts.join("/");
    var parent = (!parentPath || parentPath === "/") ? fs : getNode(parentPath, fs);
    return { parent: parent, name: name };
  }

  function makeDir(name, perm) {
    return { name: name || "", type: "dir", perm: perm == null ? 0o755 : perm,
             owner: "guest", group: "guest", mtime: new Date(), children: {} };
  }
  function makeFile(name, content, perm) {
    return { name: name || "", type: "file", perm: perm == null ? 0o644 : perm,
             owner: "guest", group: "guest", mtime: new Date(), content: content || "", children: null };
  }
  function cloneNode(n) {
    if (n.type === "file") return makeFile(n.name, n.content, n.perm);
    var d = makeDir(n.name, n.perm);
    Object.keys(n.children).forEach(function (k) { d.children[k] = cloneNode(n.children[k]); });
    return d;
  }

  function escapeRegExp(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  // 权限数字 -> rwx 字符串
  function permToString(perm) {
    function t(b) { return (b & 4 ? "r" : "-") + (b & 2 ? "w" : "-") + (b & 1 ? "x" : "-"); }
    return t((perm >> 6) & 7) + t((perm >> 3) & 7) + t(perm & 7);
  }

  function formatDate(d) {
    var mm = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    function p2(n) { return String(n).padStart(2, "0"); }
    return mm[d.getMonth()] + " " + p2(d.getDate()) + " " + p2(d.getHours()) + ":" + p2(d.getMinutes());
  }

  function formatLong(name, node) {
    var d = node.type === "dir" ? "d" : "-";
    var size = node.type === "file" ? (node.content ? node.content.length : 0) : 4096;
    return d + permToString(node.perm) + " 1 " + node.owner + " " + node.group +
           " " + String(size).padStart(6) + " " + formatDate(node.mtime) + " " + name;
  }

  // 通配符 -> 正则（用于 find -name）
  function globToRegex(glob) {
    var re = "";
    for (var i = 0; i < glob.length; i++) {
      var c = glob[i];
      if (c === "*") re += ".*";
      else if (c === "?") re += ".";
      else if (".+^${}()|[]\\".indexOf(c) >= 0) re += "\\" + c;
      else re += c;
    }
    return new RegExp("^" + re + "$");
  }

  // 递归遍历目录
  function walk(node, path, cb) {
    if (!node || node.type !== "dir") return;
    Object.keys(node.children).forEach(function (name) {
      var child = node.children[name];
      var cpath = path === "/" ? "/" + name : path + "/" + name;
      cb(child, cpath, name);
      if (child.type === "dir") walk(child, cpath, cb);
    });
  }

  // chmod 符号法：u+x / go-w / a=rwx / 755 等
  function applySymbolic(perm, expr) {
    var m = /^([ugoa]*)([+\-=])([rwx]*)$/.exec(expr);
    if (!m) return null;
    var who = m[1] || "a", op = m[2], perms = m[3];
    var bits = 0;
    if (perms.indexOf("r") >= 0) bits |= 4;
    if (perms.indexOf("w") >= 0) bits |= 2;
    if (perms.indexOf("x") >= 0) bits |= 1;
    var cats = [];
    if (who.indexOf("u") >= 0) cats.push(6);
    if (who.indexOf("g") >= 0) cats.push(3);
    if (who.indexOf("o") >= 0) cats.push(0);
    if (who.indexOf("a") >= 0 || who === "") { cats.push(6); cats.push(3); cats.push(0); }
    var nperm = perm & 0o777;
    cats.forEach(function (shift) {
      var cur = (nperm >> shift) & 7, nv;
      if (op === "+") nv = cur | bits;
      else if (op === "-") nv = cur & ~bits;
      else nv = bits;
      nperm = (nperm & ~(7 << shift)) | (nv << shift);
    });
    return nperm & 0o777;
  }

  /* ---------------- 命令实现（函数表） ---------------- */

  function cmd_help() {
    return [
      "Penguin Path 模拟终端 — 可用命令：",
      "  help                 显示本帮助",
      "  ls [-l -a]           列出目录内容",
      "  pwd                  显示当前所在目录",
      "  cd [目录]            切换目录（cd ~ 回家目录，cd .. 回上级）",
      "  mkdir [-p] 目录      创建目录",
      "  touch 文件           创建空文件 / 更新修改时间",
      "  cat 文件             查看文件内容",
      "  echo 文本 [> 文件]   输出文本，支持 > 覆盖与 >> 追加",
      "  cp [-r] 源 目标      复制文件或目录",
      "  mv 源 目标           移动 / 重命名",
      "  rm [-r -f] 目标      删除文件或目录",
      "  chmod 模式 文件      修改权限（数字 755 或符号 +x）",
      "  grep [-inr] 模式 [文件]  在文本中搜索",
      "  find 路径 -name 模式 按名称查找文件",
      "  which 命令           查找命令所在位置",
      "  locate 模式          快速查找（同 find /）",
      "  sed s/旧/新/ 文件    流编辑：替换文本",
      "  awk '{print $1}' 文件  提取字段",
      "  ps / date / whoami / uname   系统信息",
      "  clear                清屏",
      "  命令1 | 命令2        管道，如  ls | grep txt"
    ].join("\n");
  }

  function cmd_ls(args, ctx) {
    var longF = false, allF = false, targets = [];
    args.forEach(function (a) {
      if (a.charAt(0) === "-") { if (a.indexOf("l") >= 0) longF = true; if (a.indexOf("a") >= 0) allF = true; }
      else targets.push(a);
    });
    if (targets.length === 0) targets = ["."];
    var lines = [];
    targets.forEach(function (t) {
      var abs = normalize(ctx.cwd, t);
      var node = getNode(abs, ctx.fs);
      if (!node) { lines.push("ls: 无法访问 " + t + "：没有那个文件或目录"); return; }
      if (node.type === "file") { lines.push(longF ? formatLong(t.split("/").pop(), node) : t.split("/").pop()); return; }
      var names = Object.keys(node.children);
      if (allF) names = [".", ".."].concat(names);
      names.sort();
      names.forEach(function (name) {
        if (!allF && name.charAt(0) === ".") return;
        var child;
        if (name === ".") child = node;
        else if (name === "..") child = (getParent(abs, ctx.fs).parent || node);
        else child = node.children[name];
        lines.push(longF ? formatLong(name, child) : name);
      });
    });
    return lines.join("\n");
  }

  function cmd_pwd(args, ctx) { return ctx.cwd; }

  function cmd_cd(args, ctx) {
    var target = args[0] ? args[0] : "/home/guest";
    var abs = normalize(ctx.cwd, target);
    var node = getNode(abs, ctx.fs);
    if (!node) return "cd: " + target + "：没有那个文件或目录";
    if (node.type !== "dir") return "cd: " + target + "：不是目录";
    ctx.cwd = abs;
    return "";
  }

  function cmd_mkdir(args, ctx) {
    var p = false, dirs = [];
    args.forEach(function (a) { if (a === "-p") p = true; else dirs.push(a); });
    var out = [];
    dirs.forEach(function (d) {
      var abs = normalize(ctx.cwd, d);
      if (getNode(abs, ctx.fs)) { out.push('mkdir: 无法创建目录 “' + d + '”：文件已存在'); return; }
      var parts = splitPath(abs), cur = ctx.fs, path = "";
      for (var i = 0; i < parts.length; i++) {
        path = path === "/" ? "/" + parts[i] : path + "/" + parts[i];
        if (cur.children[parts[i]]) {
          if (cur.children[parts[i]].type !== "dir") { out.push('mkdir: 无法创建目录 “' + d + '”：不是目录'); return; }
          cur = cur.children[parts[i]];
        } else {
          if (i < parts.length - 1 && !p) { out.push('mkdir: 无法创建目录 “' + d + '”：没有那个文件或目录'); return; }
          var nd = makeDir(parts[i]); cur.children[parts[i]] = nd; cur = nd;
        }
      }
    });
    return out.join("\n");
  }

  function cmd_touch(args, ctx) {
    var out = [];
    args.forEach(function (f) {
      var abs = normalize(ctx.cwd, f);
      var node = getNode(abs, ctx.fs);
      if (node) { node.mtime = new Date(); return; }
      var parent = getParent(abs, ctx.fs);
      if (!parent.parent || parent.parent.type !== "dir") {
        out.push("touch: 无法创建 “" + f + "”：没有那个文件或目录"); return;
      }
      parent.parent.children[parent.name] = makeFile(parent.name, "");
    });
    return out.join("\n");
  }

  function cmd_cat(args, ctx) {
    var out = [];
    args.forEach(function (f) {
      var node = getNode(normalize(ctx.cwd, f), ctx.fs);
      if (!node) { out.push("cat: " + f + "：没有那个文件或目录"); return; }
      if (node.type === "dir") { out.push("cat: " + f + "：是一个目录"); return; }
      out.push(node.content);
    });
    return out.join("\n");
  }

  function cmd_echo(args) { return args.join(" "); }

  function cmd_cp(args, ctx) {
    var r = false;
    var items = args.filter(function (a) {
      if (a === "-r" || a === "-R") { r = true; return false; }
      return true;
    });
    if (items.length < 2) return "用法：cp [-r] 源 目标";
    var src = items[0], dst = items[1];
    var srcNode = getNode(normalize(ctx.cwd, src), ctx.fs);
    if (!srcNode) return "cp: 无法获取 " + src + "：没有那个文件或目录";
    if (srcNode.type === "dir" && !r) return "cp: -r 未指定，略过目录 " + src;
    var dstAbs = normalize(ctx.cwd, dst);
    var dstNode = getNode(dstAbs, ctx.fs);
    if (dstNode && dstNode.type === "dir") {
      dstAbs = dstAbs.replace(/\/$/, "") + "/" + splitPath(normalize(ctx.cwd, src)).pop();
    }
    var parent = getParent(dstAbs, ctx.fs);
    if (!parent.parent || parent.parent.type !== "dir") return "cp: 无法创建 " + dst + "：没有那个文件或目录";
    parent.parent.children[parent.name] = cloneNode(srcNode);
    return "";
  }

  function cmd_mv(args, ctx) {
    if (args.length < 2) return "用法：mv 源 目标";
    var src = args[0], dst = args[1];
    var srcAbs = normalize(ctx.cwd, src);
    var srcNode = getNode(srcAbs, ctx.fs);
    if (!srcNode) return "mv: 无法获取 " + src + "：没有那个文件或目录";
    var dstAbs = normalize(ctx.cwd, dst);
    var dstNode = getNode(dstAbs, ctx.fs);
    var finalAbs;
    if (dstNode && dstNode.type === "dir") finalAbs = dstAbs.replace(/\/$/, "") + "/" + splitPath(srcAbs).pop();
    else finalAbs = dstAbs;
    var dstParent = getParent(finalAbs, ctx.fs);
    if (!dstParent.parent || dstParent.parent.type !== "dir") return "mv: 无法创建 " + dst + "：没有那个文件或目录";
    var srcParent = getParent(srcAbs, ctx.fs);
    if (srcParent.parent) delete srcParent.parent.children[srcParent.name];
    dstParent.parent.children[dstParent.name] = srcNode;
    return "";
  }

  function cmd_rm(args, ctx) {
    var r = false, f = false;
    var items = args.filter(function (a) {
      if (a === "-r" || a === "-R") { r = true; return false; }
      if (a === "-f") { f = true; return false; }
      return true;
    });
    var out = [];
    items.forEach(function (t) {
      var abs = normalize(ctx.cwd, t);
      var node = getNode(abs, ctx.fs);
      if (!node) { if (!f) out.push("rm: 无法删除 " + t + "：没有那个文件或目录"); return; }
      if (node.type === "dir" && !r) { if (!f) out.push("rm: 无法删除 " + t + "：是一个目录"); return; }
      var parent = getParent(abs, ctx.fs);
      if (parent.parent) delete parent.parent.children[parent.name];
    });
    return out.join("\n");
  }

  function cmd_chmod(args, ctx) {
    if (args.length < 2) return "用法：chmod [模式] 文件";
    var mode = args[0], out = [];
    args.slice(1).forEach(function (file) {
      var abs = normalize(ctx.cwd, file);
      var node = getNode(abs, ctx.fs);
      if (!node) { out.push("chmod: 无法访问 " + file + "：没有那个文件或目录"); return; }
      var np;
      if (/^[0-7]{3}$/.test(mode)) np = parseInt(mode, 8);
      else { np = applySymbolic(node.perm, mode); if (np === null) { out.push("chmod: 无效模式：" + mode); return; } }
      node.perm = np;
    });
    return out.join("\n");
  }

  function cmd_grep(args, ctx, stdin) {
    var flags = "", pattern = null, file = null, recursive = false;
    args.forEach(function (a) {
      if (a.charAt(0) === "-") {
        if (a.indexOf("i") >= 0) flags += "i";
        if (a.indexOf("r") >= 0 || a.indexOf("R") >= 0) recursive = true;
      } else if (!pattern) pattern = a;
      else file = a;
    });
    if (!pattern) return "用法：grep [选项] 模式 [文件]（可用 -i 忽略大小写、-n 显示行号）";
    var re;
    try { re = new RegExp(pattern, flags); } catch (e) { re = new RegExp(escapeRegExp(pattern), flags); }
    function matchText(text) {
      var lines = text.split("\n"), out = [];
      lines.forEach(function (line, idx) {
        if (re.test(line)) out.push(flags.indexOf("n") >= 0 ? (idx + 1) + ":" + line : line);
      });
      return out.join("\n");
    }
    if (file) {
      var node = getNode(normalize(ctx.cwd, file), ctx.fs);
      if (!node) return "grep: " + file + "：没有那个文件或目录";
      if (node.type === "file") return matchText(node.content);
      if (node.type === "dir") {
        if (!recursive) return "grep: " + file + "：是一个目录";
        var res = [];
        walk(node, normalize(ctx.cwd, file), function (child, cpath) {
          if (child.type === "file") { var m = matchText(child.content); if (m) res.push(cpath + ":\n" + m); }
        });
        return res.join("\n");
      }
    }
    return matchText(stdin || "");
  }

  function cmd_find(args, ctx) {
    var start = ".", namePat = null, typePat = null;
    for (var i = 0; i < args.length; i++) {
      if (args[i] === "-name") namePat = args[++i];
      else if (args[i] === "-type") typePat = args[++i];
      else if (args[i].charAt(0) !== "-") start = args[i];
    }
    var absStart = normalize(ctx.cwd, start);
    var node = getNode(absStart, ctx.fs);
    if (!node || node.type !== "dir") return "find: " + start + "：没有那个文件或目录";
    var rx = namePat ? globToRegex(namePat) : null;
    var lines = [];
    walk(node, absStart, function (child, cpath, name) {
      if (rx && !rx.test(name)) return;
      if (typePat) { if (typePat === "f" && child.type !== "file") return; if (typePat === "d" && child.type !== "dir") return; }
      lines.push(cpath);
    });
    return lines.join("\n");
  }

  function cmd_which(args, ctx) {
    var out = [];
    args.forEach(function (c) {
      out.push(COMMANDS[c] ? "/usr/bin/" + c : "which: no " + c + " in (/usr/bin:/bin)");
    });
    return out.join("\n");
  }

  function cmd_locate(args, ctx) {
    if (!args.length) return "用法：locate 名称";
    return cmd_find(["/", "-name", args[args.length - 1]], ctx);
  }

  function cmd_sed(args, ctx, stdin) {
    var prog = null, file = null;
    args.forEach(function (a) {
      if (!prog && a.indexOf("s/") === 0) prog = a;
      else if (a.charAt(0) !== "-") file = a;
    });
    if (!prog) return "sed: 缺少脚本（例如 s/旧/新/）";
    var m = /^s\/(.*)\/(.*)\/([g]*)$/.exec(prog);
    if (!m) return "sed: 无法解析脚本：" + prog;
    var from = m[1], to = m[2], g = m[3].indexOf("g") >= 0;
    var re;
    try { re = new RegExp(from, g ? "g" : ""); } catch (e) { re = new RegExp(escapeRegExp(from), g ? "g" : ""); }
    var text;
    if (file) {
      var n = getNode(normalize(ctx.cwd, file), ctx.fs);
      if (!n) return "sed: 无法读取 " + file;
      if (n.type !== "file") return "sed: " + file + "：是一个目录";
      text = n.content;
    } else text = stdin || "";
    return text.split("\n").map(function (line) { return line.replace(re, to); }).join("\n");
  }

  function cmd_awk(args, ctx, stdin) {
    var prog = null, file = null, fs2 = null;
    for (var i = 0; i < args.length; i++) {
      if (args[i] === "-F") fs2 = args[i + 1];
      else if (!prog && args[i].charAt(0) === "{") prog = args[i];
      else if (args[i].charAt(0) !== "-" && !file) file = args[i];
    }
    var pm = /print\s+([^}]*)/.exec(prog || "");
    if (!pm) return "awk: 本模拟器仅支持 print 语句，如 awk '{print $1}'";
    var exprs = pm[1].split(",").map(function (s) { return s.trim(); });
    var text;
    if (file) {
      var n = getNode(normalize(ctx.cwd, file), ctx.fs);
      if (!n) return "awk: 无法读取 " + file;
      if (n.type !== "file") return "awk: " + file + "：是一个目录";
      text = n.content;
    } else text = stdin || "";
    var sep = fs2 ? new RegExp(escapeRegExp(fs2)) : /\s+/;
    return text.split("\n").filter(function (l) { return l.length; }).map(function (line) {
      var fields = line.split(sep);
      return exprs.map(function (e) {
        if (e === "$0") return line;
        var mm = /^\$(\w+)$/.exec(e);
        if (mm) { if (mm[1] === "NF") return String(fields.length); return fields[parseInt(mm[1], 10) - 1] || ""; }
        var qm = /^["'](.*)["']$/.exec(e); if (qm) return qm[1];
        return e;
      }).join(" ");
    }).join("\n");
  }

  function cmd_ps() {
    return [
      "  PID TTY          TIME CMD",
      " 1001 pts/0    00:00:00 bash",
      " 1088 pts/0    00:00:00 PenguinEmulator"
    ].join("\n");
  }
  function cmd_date() { return new Date().toLocaleString("zh-CN", { hour12: false }) + " (模拟)"; }
  function cmd_whoami(ctx) { return ctx.user || "guest"; }
  function cmd_uname(args) {
    if (args.indexOf("-a") >= 0) return "Linux penguin 6.1.0-penguin #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux";
    if (args.indexOf("-r") >= 0) return "6.1.0-penguin";
    if (args.indexOf("-s") >= 0) return "Linux";
    return "Linux";
  }

  var COMMANDS = {
    help: cmd_help, ls: cmd_ls, pwd: cmd_pwd, cd: cmd_cd, mkdir: cmd_mkdir,
    touch: cmd_touch, cat: cmd_cat, echo: cmd_echo, cp: cmd_cp, mv: cmd_mv,
    rm: cmd_rm, chmod: cmd_chmod, grep: cmd_grep, ps: cmd_ps, date: cmd_date,
    whoami: cmd_whoami, uname: cmd_uname, clear: function () { return ""; },
    find: cmd_find, which: cmd_which, locate: cmd_locate,
    sed: cmd_sed, awk: cmd_awk
  };

  /* ---------------- 词法 / 解析 ---------------- */

  // 处理引号、|、> 、>> 的极简 tokenizer
  function tokenize(str) {
    var tokens = [], i = 0, cur = "", q = null;
    while (i < str.length) {
      var c = str[i];
      if (q) {
        if (c === q) { q = null; tokens.push(cur); cur = ""; }
        else cur += c;
        i++; continue;
      }
      if (c === '"' || c === "'") { q = c; i++; continue; }
      if (c === " " || c === "\t") { if (cur) { tokens.push(cur); cur = ""; } i++; continue; }
      if (c === "|") { if (cur) { tokens.push(cur); cur = ""; } tokens.push("|"); i++; continue; }
      if (c === ">") {
        if (cur) { tokens.push(cur); cur = ""; }
        if (str[i + 1] === ">") { tokens.push(">>"); i += 2; } else { tokens.push(">"); i++; }
        continue;
      }
      if (c === "<") { if (cur) { tokens.push(cur); cur = ""; } tokens.push("<"); i++; continue; }
      cur += c; i++;
    }
    if (cur) tokens.push(cur);
    return tokens;
  }

  function parseSegment(tokens) {
    var redir = null, args = [];
    for (var i = 0; i < tokens.length; i++) {
      if (tokens[i] === ">" || tokens[i] === ">>") { redir = { op: tokens[i], target: tokens[i + 1] }; i++; continue; }
      args.push(tokens[i]);
    }
    var cmd = args.shift();
    return { cmd: cmd, args: args, redir: redir };
  }

  function writeRedirect(redir, text, ctx) {
    if (!redir || !redir.target) return "语法错误：缺少重定向目标文件";
    var abs = normalize(ctx.cwd, redir.target);
    var parent = getParent(abs, ctx.fs);
    if (!parent.parent || parent.parent.type !== "dir") return "无法写入 " + redir.target + "：目录不存在";
    if (redir.op === ">>") {
      var ex = parent.parent.children[parent.name];
      if (ex) {
        if (ex.type !== "file") return ">>: " + redir.target + " 不是文件";
        ex.content = (ex.content || "") + text;
      } else parent.parent.children[parent.name] = makeFile(parent.name, text);
    } else {
      parent.parent.children[parent.name] = makeFile(parent.name, text);
    }
    return null;
  }

  /* ---------------- 初始虚拟文件系统 ---------------- */

  function createContext() {
    var fs = makeDir("/", 0o755);

    var guest = makeDir("guest", 0o755);
    guest.children["hello.txt"] = makeFile("hello.txt",
      "Hello from Penguin Path!\nLinux 是这套学习系统的内核代号。\n每天敲几行命令，你会越来越熟。\n");
    guest.children["notes.txt"] = makeFile("notes.txt",
      "学习笔记：\n- 终端不可怕\n- 多敲 help\n- 路径用 / 分隔\n");
    guest.children["todo.txt"] = makeFile("todo.txt",
      "1. 学会 help\n2. 学会 ls 和 pwd\n3. 学会 cd\n4. 学会 grep\n");
    guest.children["script.sh"] = makeFile("script.sh",
      "#!/bin/bash\necho \"Hello Linux\"\n", 0o755);
    var projects = makeDir("projects", 0o755);
    projects.children["readme.txt"] = makeFile("readme.txt",
      "这是一个示例项目目录。\n你可以在这里练习 mkdir / touch / rm。\n");
    guest.children["projects"] = projects;

    var home = makeDir("home", 0o755);
    home.children["guest"] = guest;

    var etc = makeDir("etc", 0o755);
    etc.children["hostname"] = makeFile("hostname", "penguin\n");

    fs.children["home"] = home;
    fs.children["etc"] = etc;
    fs.children["tmp"] = makeDir("tmp", 0o777);

    return { cwd: "/home/guest", fs: fs, user: "guest" };
  }

  /* ---------------- 主入口 ---------------- */

  // 按 && / ; 拆分语句（尊重引号与转义），供 PenguinEmulator 串联执行
  function splitStatements(input) {
    var res = [], cur = "", quote = null, sep = ";";
    var push = function () { res.push({ text: cur.trim(), sep: sep }); cur = ""; sep = ";"; };
    for (var i = 0; i < input.length; i++) {
      var ch = input[i];
      if (quote) { cur += ch; if (ch === quote) quote = null; continue; }
      if (ch === "'" || ch === '"') { quote = ch; cur += ch; continue; }
      if (ch === "&" && input[i + 1] === "&") { push(); sep = "&&"; i++; continue; }
      if (ch === ";") { push(); continue; }
      cur += ch;
    }
    push();
    return res;
  }

  // 执行单条语句（支持管道与重定向），返回 {output, error, clear}
  function runOne(stmt, ctx) {
    var tokens = tokenize(stmt);
    if (tokens.length === 0) return { output: "", error: false, clear: false };
    var segments = [], cur = [];
    tokens.forEach(function (t) {
      if (t === "|") { segments.push(cur); cur = []; } else cur.push(t);
    });
    segments.push(cur);
    var stdin = "", result = "", isError = false;
    for (var i = 0; i < segments.length; i++) {
      var parsed = parseSegment(segments[i]);
      if (!parsed.cmd) continue;
      var handler = COMMANDS[parsed.cmd];
      if (!handler) {
        isError = true;
        result = "未找到命令：" + parsed.cmd + "。输入 help 查看可用命令。";
        break;
      }
      var out = handler(parsed.args, ctx, stdin) || "";
      if (parsed.redir) {
        var werr = writeRedirect(parsed.redir, out, ctx);
        if (werr) { isError = true; result = werr; break; }
        stdin = "";
      } else {
        stdin = out;
        result = out;
      }
    }
    return { output: result, error: isError, clear: false };
  }

  function PenguinEmulator(input, ctx) {
    try {
      if (typeof input !== "string") input = String(input == null ? "" : input);
      var trimmed = input.trim();
      if (trimmed === "") return { output: "", error: false, clear: false };
      if (trimmed === "clear") return { output: "", error: false, clear: true };
      if (!ctx || !ctx.fs) ctx = createContext();

      // 支持 && / ; 串联执行（尊重引号内的 && ; )
      var statements = splitStatements(input);
      var allOut = [], isError = false, cleared = false;
      for (var s = 0; s < statements.length; s++) {
        var st = statements[s];
        if (st.text === "") continue;
        if (st.text === "clear") { allOut = []; cleared = true; continue; }
        var r = runOne(st.text, ctx);
        if (r.clear) { allOut = []; cleared = true; continue; }
        if (r.output) allOut.push(r.output);
        if (r.error) { isError = true; if (st.sep === "&&") break; }
      }
      return { output: allOut.join("\n"), error: isError, clear: cleared };
    } catch (e) {
      return { output: "出错了：" + (e && e.message ? e.message : e), error: true, clear: false };
    }
  }

  PenguinEmulator.createContext = createContext;
  PenguinEmulator.version = "1.0.0";

  global.PenguinEmulator = PenguinEmulator;
  if (typeof module !== "undefined" && module.exports) module.exports = PenguinEmulator;
})(typeof window !== "undefined" ? window : this);
