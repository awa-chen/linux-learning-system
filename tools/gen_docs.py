# -*- coding: utf-8 -*-
"""
Penguin Path · 文档数据源生成器（零依赖，仅标准库）

把 docs/*.md 内联为 content/docs.js（window.__DOCS__ = { key: markdown }），
供主页「参考文档」阅读区使用（与课程正文同一渲染器，在正文主区域呈现，
不跳离主页、不弹右边小框）。

用法：python3 tools/gen_docs.py
"""
import io
import os
import sys

try:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS_DIR = os.path.join(ROOT, "docs")
DOC_KEYS = ["roadmap", "setup-env", "resources", "team-case"]


def main():
    data = {}
    for k in DOC_KEYS:
        p = os.path.join(DOCS_DIR, k + ".md")
        if not os.path.exists(p):
            print("[WARN] 缺失 %s，跳过" % p)
            continue
        with io.open(p, "r", encoding="utf-8") as f:
            data[k] = f.read()
    out = os.path.join(ROOT, "content", "docs.js")
    with io.open(out, "w", encoding="utf-8") as f:
        f.write("// 自动生成，请勿手改；来源 docs/*.md。运行 tools/gen_docs.py 重建\n")
        f.write("window.__DOCS__ = ")
        f.write(__import__("json").dumps(data, ensure_ascii=False, indent=2))
        f.write(";\n")
    print("[OK] 生成 content/docs.js（%d 个文档）" % len(data))


if __name__ == "__main__":
    main()
