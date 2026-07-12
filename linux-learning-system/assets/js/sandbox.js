/* Penguin Path 沙盒控制器（零依赖）
   依赖（由其它文件提供）：
     window.PenguinEmulator(input, ctx) -> {output, error}   （emulator.js）
     window.__PENGUIN_STEPS__  (array of step)               （各伙伴 steps.js 分片）
   功能：引导式逐步骤练习 + 自由终端。
*/
(function () {
  "use strict";

  var STEPS = (window.__PENGUIN_STEPS__ || window.__PENGUIN_STEPS || []).slice();
  var emulator = window.PenguinEmulator;
  var ctx = null; // 沙盒状态，由 emulator 初始化
  var current = null;      // 当前 lesson key
  var stepIndex = 0;
  var solved = {};         // key -> 已完成步骤集合

  function $(id) { return document.getElementById(id); }

  function printLine(text, cls) {
    var out = $("term-output");
    var div = document.createElement("div");
    div.className = "line " + (cls || "");
    div.innerHTML = text;
    out.appendChild(div);
    out.scrollTop = out.scrollHeight;
  }

  function printCmd(cmd) {
    printLine('<span class="prompt">guest@penguin:~$</span> ' + escapeHtml(cmd));
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }

  function runCommand(raw) {
    if (!emulator) {
      printLine("⚠️ 模拟器内核未加载（emulator.js）。请联系主 agent 检查。", "err");
      return;
    }
    var res = emulator(raw, ctx);
    if (res && typeof res.output === "string") {
      res.output.split("\n").forEach(function (l) {
        if (l.length) printLine(escapeHtml(l), res.error ? "err" : "");
      });
    }
    // 引导式校验
    if (current && STEPS_STEP()) {
      var step = STEPS_STEP();
      try {
        if (typeof step.checker === "function" && step.checker(raw)) {
          if (!solved[current]) solved[current] = {};
          solved[current][step.id] = true;
          printLine("✅ 完成：" + step.title, "ok");
          stepIndex++;
          renderGuide();
        }
      } catch (e) { /* checker 异常不影响终端 */ }
    }
  }

  function STEPS_STEP() {
    var list = stepsFor(current);
    return list[stepIndex] || null;
  }

  function stepsFor(key) {
    return STEPS.filter(function (s) { return s.key === key; });
  }

  function renderGuide() {
    var guide = $("guide");
    if (!current) {
      guide.innerHTML = '<div class="guide-empty">选择左侧课程进入引导式练习。</div>';
      return;
    }
    var list = stepsFor(current);
    var html = '<div class="guide-title">' + escapeHtml(current) + ' · 引导练习</div>';
    if (!list.length) {
      html += '<div class="guide-note">本课以真实环境练习为主，无沙盒步骤。你可以在右侧终端自由输入命令体验。</div>';
      guide.innerHTML = html;
      return;
    }
    list.forEach(function (s, i) {
      var cls = "step";
      if (i < stepIndex) cls += " done";
      else if (i === stepIndex) cls += " active";
      html += '<div class="' + cls + '">' +
        '<div class="step-no">' + (i < stepIndex ? "✓" : (i + 1)) + '</div>' +
        '<div class="step-body"><div class="step-title">' + escapeHtml(s.title) + '</div>' +
        '<div class="step-task">' + (s.task || "") + '</div>' +
        (s.tips ? '<div class="step-tips">' + s.tips + '</div>' : '') +
        (i === stepIndex && s.commandHint ? '<button class="btn mini" data-hint="' + escapeHtml(s.commandHint) + '">填入提示命令</button>' : '') +
        '</div></div>';
    });
    guide.innerHTML = html;
    var hintBtn = guide.querySelector("[data-hint]");
    if (hintBtn) {
      hintBtn.addEventListener("click", function () {
        $("term-input").value = hintBtn.getAttribute("data-hint");
        $("term-input").focus();
      });
    }
  }

  function selectLesson(key) {
    current = key;
    stepIndex = 0;
    renderGuide();
    var list = stepsFor(key);
    if (list.length) {
      printLine("📚 已加载课程：" + escapeHtml(key) + "（共 " + list.length + " 步）", "info");
      printLine("👉 " + list[0].title, "info");
    } else {
      printLine("📚 已加载课程：" + escapeHtml(key) + "（自由练习模式）", "info");
    }
  }

  function populateSelect() {
    var sel = $("lesson-select");
    var keys = [];
    STEPS.forEach(function (s) { if (keys.indexOf(s.key) < 0) keys.push(s.key); });
    keys.sort();
    sel.innerHTML = '<option value="">— 选择引导课程 —</option>' +
      keys.map(function (k) { return '<option value="' + k + '">' + k + '</option>'; }).join("");
    sel.addEventListener("change", function () {
      if (sel.value) selectLesson(sel.value);
    });
    // URL ?course=key
    var params = new URLSearchParams(location.search);
    var c = params.get("course");
    if (c && keys.indexOf(c) >= 0) { sel.value = c; selectLesson(c); }
  }

  function bindTerminal() {
    var input = $("term-input");
    $("terminal").addEventListener("click", function () { input.focus(); });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        var v = input.value;
        input.value = "";
        if (v.trim() === "clear") { $("term-output").innerHTML = ""; return; }
        printCmd(v);
        runCommand(v);
      }
    });
    $("reset-btn").addEventListener("click", function () {
      if (emulator && emulator.createContext) ctx = emulator.createContext();
      $("term-output").innerHTML = "";
      stepIndex = 0;
      printLine("🔄 环境已重置。", "info");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!emulator) {
      printLine("⚠️ 模拟器内核未加载（emulator.js）。请联系主 agent 检查。", "err");
    } else if (emulator.createContext) {
      ctx = emulator.createContext();
    }
    populateSelect();
    bindTerminal();
    renderGuide();
    printLine("🐧 Penguin Path 模拟终端已就绪。输入 <code>help</code> 查看可用命令。", "info");
  });
})();
