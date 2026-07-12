/* Penguin Path 主页逻辑（零依赖，原生 JS）
   读取：window.__COURSE_INDEX__ / window.__COURSES__ / window.__PENGUIN_STEPS__
   职责：渲染路线图、进度看板、能力雷达图、课程阅读面板
*/
(function () {
  "use strict";

  var LEVELS = ["L1","L2","L3","L4","L5","L6","L7","L8","L9","L10","L11","L12"];
  var STAGE = {
    L1:"入门", L2:"入门", L3:"入门", L4:"初级", L5:"初级", L6:"初级",
    L7:"中级", L8:"中级", L9:"中级", L10:"高级", L11:"高级", L12:"高级"
  };
  var DONE_KEY = "penguin_path_done_v1";
  var stepsByKey = {};

  function loadDone() {
    try { return JSON.parse(localStorage.getItem(DONE_KEY) || "{}"); }
    catch (e) { return {}; }
  }
  function saveDone(obj) { localStorage.setItem(DONE_KEY, JSON.stringify(obj)); }

  function initSteps() {
    var arr = (window.__PENGUIN_STEPS__ || window.__PENGUIN_STEPS || []);
    arr.forEach(function (s) { if (s.key) stepsByKey[s.key] = s; });
  }

  // ---- 极简 Markdown 渲染 ----
  function escapeHtml(s) {
    return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }
  // ---- 极简 Markdown 渲染（课程 + 文档通用：标题/列表/代码/表格/引用/分隔线/链接/图片）----
  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function inline(s) {
    s = escapeHtml(s);
    // 图片占位，避免被下方 code/strong 规则破坏
    var imgs = [];
    s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, function (_, alt, src) {
      imgs.push('<img src="' + src + '" alt="' + alt + '" style="max-width:100%">' );
      return "\u0000IMG" + (imgs.length - 1) + "\u0000";
    });
    s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (_, t, href) {
      return '<a href="' + href + '" target="_blank" rel="noopener">' + t + "</a>";
    });
    s = s.replace(/\u0000IMG(\d+)\u0000/g, function (_, i) { return imgs[+i]; });
    return s;
  }
  function splitRow(line) {
    var raw = line.replace(/^\s*\|/, "").replace(/\|\s*$/, "");
    return raw.split("|").map(function (c) { return c.trim(); });
  }
  function isSepRow(line) {
    return /^\s*\|?\s*:?-{2,}:?(\s*\|\s*:?-{2,}:?)+\s*\|?\s*$/.test(line);
  }
  function mdToHtml(md) {
    var lines = md.split(/\r?\n/);
    var html = [], i = 0, inCode = false, codeBuf = [];
    function flushCode() {
      html.push('<pre class="code-block"><code>' + escapeHtml(codeBuf.join("\n")) + "</code></pre>");
      codeBuf = [];
    }
    while (i < lines.length) {
      var line = lines[i];
      if (/^```/.test(line)) {
        if (inCode) { flushCode(); inCode = false; }
        else { inCode = true; }
        i++; continue;
      }
      if (inCode) { codeBuf.push(line); i++; continue; }
      // 表格（| 开头，且下一行是分隔行）
      if (/^\s*\|/.test(line) && i + 1 < lines.length && isSepRow(lines[i + 1])) {
        var heads = splitRow(line);
        i += 2;
        var rows = [];
        while (i < lines.length && /^\s*\|/.test(lines[i])) {
          rows.push(splitRow(lines[i])); i++;
        }
        var thead = "<thead><tr>" + heads.map(function (h) {
          return "<th>" + inline(h) + "</th>";
        }).join("") + "</tr></thead>";
        var tbody = "<tbody>" + rows.map(function (r) {
          return "<tr>" + r.map(function (c) { return "<td>" + inline(c) + "</td>"; }).join("") + "</tr>";
        }).join("") + "</tbody>";
        html.push('<div class="table-wrap"><table class="md-table">' + thead + tbody + "</table></div>");
        continue;
      }
      if (/^#{1,6}\s/.test(line)) {
        var m = line.match(/^(#{1,6})\s+(.*)$/);
        var lvl = m[1].length;
        var txt = m[2].trim();
        var id = txt.replace(/[^\w\u4e00-\u9fa5-]+/g, "-").toLowerCase();
        html.push("<h" + lvl + ' id="' + id + '">' + inline(txt) + "</h" + lvl + ">");
      } else if (/^\s*>{1,}\s?/.test(line)) {
        var q = [];
        while (i < lines.length && /^\s*>{1,}\s?/.test(lines[i])) {
          q.push(inline(lines[i].replace(/^\s*>{1,}\s?/, ""))); i++;
        }
        html.push('<blockquote>' + q.map(function (x) { return "<p>" + x + "</p>"; }).join("") + "</blockquote>");
        continue;
      } else if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
        html.push("<hr>");
      } else if (/^\s*[-*]\s+/.test(line)) {
        var list = [];
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
          list.push("<li>" + inline(lines[i].replace(/^\s*[-*]\s+/, "")) + "</li>");
          i++;
        }
        html.push("<ul>" + list.join("") + "</ul>");
        continue;
      } else if (/^\s*\d+\.\s+/.test(line)) {
        var olist = [];
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
          olist.push("<li>" + inline(lines[i].replace(/^\s*\d+\.\s+/, "")) + "</li>");
          i++;
        }
        html.push("<ol>" + olist.join("") + "</ol>");
        continue;
      } else if (line.trim() === "") {
        // skip empty
      } else {
        html.push("<p>" + inline(line) + "</p>");
      }
      i++;
    }
    if (inCode) flushCode();
    return html.join("\n");
  }

  // ---- 渲染：路线图 ----
  function renderRoadmap(index, done) {
    var byLevel = {};
    index.forEach(function (r) {
      (byLevel[r.level] = byLevel[r.level] || []).push(r);
    });
    var html = "";
    LEVELS.forEach(function (lv) {
      var courses = byLevel[lv] || [];
      var total = courses.length;
      var doneCount = courses.filter(function (c) { return done[c.key]; }).length;
      var stage = STAGE[lv];
      var stageClass = "stage-" + stage;
      var items = courses.map(function (c) {
        var cls = "course-item" + (done[c.key] ? " done" : "");
        return '<div class="' + cls + '" data-key="' + c.key + '">' +
          '<span class="ci-check">' + (done[c.key] ? "✓" : "○") + '</span>' +
          '<span class="ci-title">' + escapeHtml(c.title) + '</span>' +
          '<span class="ci-meta">' + c.lang + ' · ' + c.estimated_min + 'min' +
          (c.sandbox ? ' · <span class="tag">沙盒</span>' : '') + '</span>' +
          '</div>';
      }).join("");
      html += '<div class="level-col ' + stageClass + '">' +
        '<div class="level-head"><span class="level-badge">' + lv + '</span>' +
        '<span class="level-stage">' + stage + '</span>' +
        '<span class="level-prog">' + doneCount + '/' + total + '</span></div>' +
        '<div class="course-list">' + (items || '<div class="course-item empty">（待补充）</div>') + '</div>' +
        '</div>';
    });
    document.getElementById("roadmap").innerHTML = html;

    // 绑定点击
    Array.prototype.forEach.call(document.querySelectorAll(".course-item[data-key]"), function (el) {
      el.addEventListener("click", function () { openCourse(el.getAttribute("data-key")); });
    });
  }

  // ---- 渲染：进度看板 + 雷达 ----
  function renderProgress(index, done) {
    var total = index.length;
    var doneCount = index.filter(function (c) { return done[c.key]; }).length;
    var pct = total ? Math.round((doneCount / total) * 100) : 0;
    document.getElementById("progress-bar").style.width = pct + "%";
    document.getElementById("progress-text").textContent = doneCount + " / " + total + " 课 · " + pct + "%";

    // 各级进度
    var byLevel = {};
    index.forEach(function (r) { (byLevel[r.level] = byLevel[r.level] || []).push(r); });
    var labels = [], vals = [];
    LEVELS.forEach(function (lv) {
      var cs = byLevel[lv] || [];
      var d = cs.filter(function (c) { return done[c.key]; }).length;
      labels.push(lv);
      vals.push(cs.length ? Math.round((d / cs.length) * 100) : 0);
    });
    drawRadar(labels, vals);
  }

  function drawRadar(labels, vals) {
    var canvas = document.getElementById("radar");
    var ctx = canvas.getContext("2d");
    var W = canvas.width, H = canvas.height;
    var cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 30;
    ctx.clearRect(0, 0, W, H);
    var n = labels.length;
    // 网格
    for (var g = 1; g <= 4; g++) {
      ctx.beginPath();
      for (var i = 0; i <= n; i++) {
        var ang = (Math.PI * 2 * i / n) - Math.PI / 2;
        var r = R * g / 4;
        var x = cx + r * Math.cos(ang), y = cy + r * Math.sin(ang);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "rgba(120,140,170,0.18)";
      ctx.stroke();
    }
    // 轴线 + 标签
    ctx.fillStyle = "#8b9dc3";
    ctx.font = "11px monospace";
    for (var j = 0; j < n; j++) {
      var a = (Math.PI * 2 * j / n) - Math.PI / 2;
      var lx = cx + (R + 14) * Math.cos(a), ly = cy + (R + 14) * Math.sin(a);
      ctx.strokeStyle = "rgba(120,140,170,0.18)";
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a)); ctx.stroke();
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(labels[j], lx, ly);
    }
    // 数据多边形
    ctx.beginPath();
    for (var k = 0; k <= n; k++) {
      var idx = k % n;
      var ang2 = (Math.PI * 2 * idx / n) - Math.PI / 2;
      var rr = R * vals[idx] / 100;
      var px = cx + rr * Math.cos(ang2), py = cy + rr * Math.sin(ang2);
      if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(57,201,129,0.22)";
    ctx.strokeStyle = "#39c981";
    ctx.lineWidth = 2;
    ctx.fill(); ctx.stroke();
  }

  // ---- 课程阅读面板 ----
  function openCourse(key) {
    var rec = (window.__COURSE_INDEX__ || []).filter(function (r) { return r.key === key; })[0];
    var body = (window.__COURSES__ || {})[key] || "（内容缺失）";
    var done = loadDone();
    var panel = document.getElementById("reader");
    panel.innerHTML =
      '<div class="reader-head">' +
        '<button class="btn" id="reader-back">← 返回路线</button>' +
        '<h2>' + escapeHtml(rec ? rec.title : key) + '</h2>' +
        '<button class="btn btn-primary" id="reader-done">' +
          (done[key] ? "✔ 已掌握（点击取消）" : "标记已掌握") + '</button>' +
      '</div>' +
      '<div class="reader-body">' + mdToHtml(body) + '</div>' +
      (stepsByKey[key] ? '<div class="reader-sandbox"><button class="btn btn-primary" id="go-sandbox">▶ 进入交互沙盒</button></div>' : '');

    document.getElementById("reader-back").addEventListener("click", function () {
      panel.classList.remove("open"); panel.innerHTML = "";
    });
    document.getElementById("reader-done").addEventListener("click", function () {
      var d = loadDone(); d[key] = !d[key]; saveDone(d);
      refresh();
      openCourse(key);
    });
    var gs = document.getElementById("go-sandbox");
    if (gs) gs.addEventListener("click", function () {
      window.location.href = "sandbox/index.html?course=" + encodeURIComponent(key);
    });
    panel.classList.add("open");
    panel.scrollTop = 0;
  }

  // ---- 参考文档阅读区（方案 A：在主页正文主区域呈现，不跳离、不弹右边小框）----
  var DOC_TITLES = { "roadmap": "📘 12 级总纲", "setup-env": "🔧 环境搭建", "resources": "📚 学习资源", "team-case": "🧩 团队案例" };
    // ---- 主页视图切换（路线/看板 与 文档阅读区/交互沙盒 互斥显示）----
  // 修复 BUG：点完文档/沙盒后 home 区块被 hidden，顶部导航 scrollIntoView 一个隐藏元素无反应。
  function showView(target) {
    var all = ["#progress-sec", "#roadmap-sec", "#doc-sec", "#sandbox-sec"];
    Array.prototype.forEach.call(all, function (sel) {
      var el = document.querySelector(sel);
      if (el) el.hidden = true;
    });
    if (target === "home") {
      ["#progress-sec", "#roadmap-sec"].forEach(function (sel) {
        var el = document.querySelector(sel);
        if (el) el.hidden = false;
      });
    } else {
      var el = document.querySelector(target);
      if (el) el.hidden = false;
    }
  }

  // ---- 参考文档阅读区（方案 A：在主页正文主区域呈现，不跳离、不弹右边小框）----
  var DOC_TITLES = { "roadmap": "📘 12 级总纲", "setup-env": "🔧 环境搭建", "resources": "📚 学习资源", "team-case": "🧩 团队案例" };
  function openDoc(key) {
    var md = (window.__DOCS__ || {})[key];
    if (md == null) return;
    var reader = document.getElementById("reader");
    if (reader) { reader.classList.remove("open"); reader.innerHTML = ""; }
    document.getElementById("doc-title").textContent = DOC_TITLES[key] || key;
    document.getElementById("doc-body").innerHTML = mdToHtml(md);
    if (location.hash !== "#doc=" + key) history.replaceState(null, "", "#doc=" + key);
  }

function refresh() {
    var done = loadDone();
    renderRoadmap(window.__COURSE_INDEX__ || [], done);
    renderProgress(window.__COURSE_INDEX__ || [], done);
  }

    document.addEventListener("DOMContentLoaded", function () {
    initSteps();
    refresh();
    // 导航高亮：点击后给当前项加 .active，清除其它项
    function setActive(elm) {
      Array.prototype.forEach.call(document.querySelectorAll(".side-nav a"), function (n) {
        n.classList.remove("active");
      });
      if (elm) elm.classList.add("active");
    }
    // 顶部导航：先恢复主页视图，再平滑滚动（修复 hidden 元素无反应的 BUG）
    var navLinks = document.querySelectorAll("[data-nav]");
    Array.prototype.forEach.call(navLinks, function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        showView("home");
        setActive(a);
        var t = a.getAttribute("data-nav");
        var el = document.getElementById(t);
        if (el) el.scrollIntoView({ behavior: "smooth" });
        if (location.hash.indexOf("#doc=") === 0) history.replaceState(null, "", "#");
      });
    });
    // 侧边栏参考文档：在主页正文区打开（不跳离）
    var docLinks = document.querySelectorAll("[data-doc]");
    Array.prototype.forEach.call(docLinks, function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        showView("#doc-sec");
        setActive(a);
        openDoc(a.getAttribute("data-doc"));
      });
    });
    // 侧边栏交互沙盒：在主页正文区打开（与文档区同款 in-page 样式）
    var sandboxLink = document.querySelector('[data-view="sandbox"]');
    if (sandboxLink) {
      sandboxLink.addEventListener("click", function (e) {
        e.preventDefault();
        showView("#sandbox-sec");
        setActive(sandboxLink);
        var sec = document.getElementById("sandbox-sec");
        if (sec) sec.scrollIntoView({ behavior: "smooth" });
      });
    }
    // 深链：#doc=roadmap 直接进入文档阅读区
    if (location.hash.indexOf("#doc=") === 0) {
      showView("#doc-sec");
      openDoc(decodeURIComponent(location.hash.slice(5)));
    }
  });
})();
