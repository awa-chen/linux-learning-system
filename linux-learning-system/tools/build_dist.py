#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Penguin Path · 单文件构建器（零依赖，仅标准库）

为什么需要它：
  部分查看环境（Control UI 预览、受限/沙盒浏览器）会拦截外部 <script src>，
  导致 emulator.js / steps.js / app.js 加载失败 —— 页面框架在，但“终端不存在”、
  路线图空白。把 CSS / JS / 数据全部内联进一个 HTML 文件后，不再依赖任何外部
  请求，即使脚本外链被禁也能正常运行。

产物：
  dist/index.html    自包含主页（路线图 + 进度 + 雷达 + 课程阅读）
  dist/sandbox.html  自包含交互沙盒（模拟终端 + 引导练习）

用法：
  python3 tools/build_dist.py
"""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, "dist")

PARTNERS = ["xiaomage", "yanmishu", "shaonianpai", "xiaozhengge"]


def read(p):
    with open(os.path.join(ROOT, p), "r", encoding="utf-8") as f:
        return f.read()


def read_bytes(p):
    with open(os.path.join(ROOT, p), "rb") as f:
        return f.read()


def inline_script(rel_path):
    return "<script>\n/* === inlined: %s === */\n%s\n</script>" % (rel_path, read(rel_path))


def inline_style(rel_path):
    return "<style>\n/* === inlined: %s === */\n%s\n</style>" % (rel_path, read(rel_path))


def build_home():
    css = inline_style("assets/css/style.css")
    boot = inline_script("assets/js/boot-check.js")
    steps = "\n".join(inline_script("partner-workspace/%s/steps.js" % a) for a in PARTNERS)
    idx = inline_script("content/index.js")
    courses = inline_script("content/courses.js")
    docs = inline_script("content/docs.js")
    app = inline_script("assets/js/app.js")

    html = read("index.html")
    html = html.replace('<link rel="stylesheet" href="assets/css/style.css">', css)
    # 用 lambda 作为替换函数，避免内联代码中的反斜杠被当成正则转义
    html = re.sub(r'<script src="assets/js/boot-check.js"></script>', lambda m: boot, html)
    html = re.sub(r'<script src="partner-workspace/[^\"]*"></script>', lambda m: steps, html)
    html = re.sub(r'<script src="content/index.js"></script>', lambda m: idx, html)
    html = re.sub(r'<script src="content/courses.js"></script>', lambda m: courses, html)
    html = re.sub(r'<script src="content/docs.js"></script>', lambda m: docs, html)
    html = re.sub(r'<script src="assets/js/app.js"></script>', lambda m: app, html)
    return html


def build_sandbox():
    css = inline_style("assets/css/style.css")
    boot = inline_script("assets/js/boot-check.js")
    emu = inline_script("assets/js/emulator.js")
    steps = "\n".join(inline_script("partner-workspace/%s/steps.js" % a) for a in PARTNERS)
    sb = inline_script("assets/js/sandbox.js")

    html = read("sandbox/index.html")
    html = html.replace('<link rel="stylesheet" href="../assets/css/style.css">', css)
    html = re.sub(r'<script src="../assets/js/boot-check.js"></script>', lambda m: boot, html)
    html = re.sub(r'<script src="../assets/js/emulator.js"></script>', lambda m: emu, html)
    html = re.sub(r'<script src="../partner-workspace/[^\"]*"></script>', lambda m: steps, html)
    html = re.sub(r'<script src="../assets/js/sandbox.js"></script>', lambda m: sb, html)
    # 单文件版里“返回主页”跳到同级 index.html
    html = html.replace('href="../index.html"', 'href="index.html"')
    return html


def main():
    os.makedirs(DIST, exist_ok=True)
    home = build_home()
    sand = build_sandbox()
    with open(os.path.join(DIST, "index.html"), "w", encoding="utf-8") as f:
        f.write(home)
    with open(os.path.join(DIST, "sandbox.html"), "w", encoding="utf-8") as f:
        f.write(sand)
    print("OK -> dist/index.html  (%d bytes)" % len(home.encode("utf-8")))
    print("OK -> dist/sandbox.html (%d bytes)" % len(sand.encode("utf-8")))
    # 自检：确认没有残留外部 script src / link
    for name, doc in (("index.html", home), ("sandbox.html", sand)):
        bad = re.findall(r'<script src=|href="[^"]*\.css"', doc)
        if bad:
            print("WARN %s still has external refs: %s" % (name, bad))
        else:
            print("SELF-CONTAINED %s [OK]" % name)


if __name__ == "__main__":
    main()
