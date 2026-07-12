/* Penguin Path · 启动自检（零依赖）
   作用：若核心脚本未能正常加载，在页面顶部显示明确错误，
   而不是让用户看到一个“空白/没有终端”的页面而误以为系统坏了。
   两个页面都在主逻辑脚本之前引入本文件。 */
(function () {
  "use strict";
  function showError(msg) {
    if (!document.getElementById("boot-error")) {
      var d = document.createElement("div");
      d.id = "boot-error";
      d.style.cssText = "position:fixed;left:0;right:0;top:0;z-index:9999;" +
        "background:#2a0d12;color:#ff9b9b;border-bottom:2px solid #ff6b6b;" +
        "padding:12px 16px;font:13px/1.6 monospace;white-space:pre-wrap;";
      d.textContent = "⚠️ 加载异常：" + msg +
        "\n建议：用本地服务器打开（python3 tools/serve.py），不要直接双击 file:// 预览。";
      document.body.appendChild(d);
    }
  }
  window.__PENGUIN_BOOT_ERROR__ = showError;
  // 页面加载完成后统一检查（此时所有脚本应已执行）
  window.addEventListener("load", function () {
    var isSandbox = location.pathname.indexOf("/sandbox/") >= 0 || location.pathname.endsWith("/sandbox");
    if (isSandbox) {
      if (typeof window.PenguinEmulator !== "function") {
        showError("模拟器内核 emulator.js 未加载（PenguinEmulator 不存在）。");
      }
      if (!(window.__PENGUIN_STEPS__ || window.__PENGUIN_STEPS) || (window.__PENGUIN_STEPS__ || window.__PENGUIN_STEPS).length === 0) {
        showError("步骤数据 steps.js 未加载（__PENGUIN_STEPS 为空）。");
      }
    } else {
      if (!(window.__COURSE_INDEX__ && window.__COURSE_INDEX__.length) ||
          !(window.__COURSES__ && Object.keys(window.__COURSES__).length)) {
        showError("课程数据未加载（content/index.js 或 content/courses.js 失败）。");
      }
    }
  });
})();
