#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Penguin Path 索引生成器（零第三方依赖，仅标准库）
用法：
    python3 tools/gen_index.py
作用：
    扫描 content/*.md，解析 frontmatter，生成三个浏览器/工具友好产物：
      - content/index.json   机器可读索引（供 check.py 与 CI 使用）
      - content/index.js     设置 window.__COURSE_INDEX__（主页读取，避免 file:// 的 fetch/CORS 问题）
      - content/courses.js   设置 window.__COURSES__ = { key: 正文markdown }（主页按需渲染，零依赖）
"""
import json
import os
import re
import sys

# Windows 控制台默认 cp1252，打印中文会崩溃；强制 stdout 为 UTF-8。
try:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT_DIR = os.path.join(ROOT, "content")

VALID_LEVELS = [f"L{i}" for i in range(1, 13)]
VALID_LANGS = {"shell", "bash", "nginx", "ansible", "prometheus", "不限"}

def _int_or_none(v):
    if v in (None, ""):
        return None
    try:
        return int(str(v).strip())
    except ValueError:
        return None


FM_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)


def parse_frontmatter(text):
    m = FM_RE.match(text)
    if not m:
        return None, text
    fm_raw = m.group(1)
    body = text[m.end():]
    fm = {}
    for line in fm_raw.splitlines():
        line = line.rstrip()
        if not line or ":" not in line:
            continue
        key, _, val = line.partition(":")
        key = key.strip()
        val = val.strip()
        # 处理数组（prereq: [a, b]）
        if val.startswith("[") and val.endswith("]"):
            inner = val[1:-1].strip()
            if inner == "":
                fm[key] = []
            else:
                fm[key] = [x.strip().strip("'\"") for x in inner.split(",") if x.strip()]
        elif val.lower() in ("true", "false"):
            fm[key] = val.lower() == "true"
        else:
            fm[key] = val.strip("'\"")
    return fm, body


def main():
    if not os.path.isdir(CONTENT_DIR):
        print(f"[错误] 找不到目录: {CONTENT_DIR}")
        sys.exit(1)

    records = []
    courses = {}
    errors = []

    for fn in sorted(os.listdir(CONTENT_DIR)):
        if not fn.endswith(".md"):
            continue
        path = os.path.join(CONTENT_DIR, fn)
        with open(path, encoding="utf-8") as f:
            text = f.read()
        fm, body = parse_frontmatter(text)
        if fm is None:
            errors.append(f"{fn}: 缺少 frontmatter")
            continue
        key = fm.get("key")
        if not key:
            errors.append(f"{fn}: 缺少 key")
            continue
        if key + ".md" != fn:
            errors.append(f"{fn}: key({key}) 与文件名不一致")
        level = fm.get("level")
        if level not in VALID_LEVELS:
            errors.append(f"{fn}: level 非法 ({level})")
        lang = fm.get("lang")
        if lang not in VALID_LANGS:
            errors.append(f"{fn}: lang 非法 ({lang})")
        for req in fm.get("prereq", []) or []:
            # prereq 引用检查推迟到全部扫描完
            pass
        rec = {
            "key": key,
            "level": level,
            "title": fm.get("title", key),
            "lang": lang,
            "objective": fm.get("objective", ""),
            "prereq": fm.get("prereq", []) or [],
            "estimated_min": int(fm.get("estimated_min", 0) or 0),
            "order": _int_or_none(fm.get("order")),
            "sandbox": bool(fm.get("sandbox", False)),
            "file": fn,
            "done": False,
        }
        records.append(rec)
        courses[key] = body.strip()

    # prereq 存在性校验
    keyset = {r["key"] for r in records}
    for r in records:
        for p in r["prereq"]:
            if p not in keyset:
                errors.append(f"{r['file']}: prereq 引用不存在的课 ({p})")

    # 等级内按 prereq 拓扑序排列（先修在前），同层稳定按 key，保证顺序统一可复现
    from collections import defaultdict
    import bisect
    by_level = defaultdict(list)
    for r in records:
        by_level[r["level"]].append(r)

    def topo_order(courses):
        keys = [c["key"] for c in courses]
        kset = set(keys)
        indeg = {c["key"]: 0 for c in courses}
        adj = {c["key"]: [] for c in courses}
        for c in courses:
            for p in c["prereq"]:
                if p in kset:  # 跨等级的先修视为已满足，不引入边
                    adj[p].append(c["key"])
                    indeg[c["key"]] += 1
        avail = sorted([k for k in keys if indeg[k] == 0])
        order = []
        while avail:
            n = avail.pop(0)
            order.append(n)
            for m in adj[n]:
                indeg[m] -= 1
                if indeg[m] == 0:
                    bisect.insort(avail, m)
        # 兜底：若存在环，剩余按 key 追加
        ordered = set(order)
        for k in sorted(keys):
            if k not in ordered:
                order.append(k)
        return order

    sorted_records = []
    for lv in VALID_LEVELS:
        cs = by_level.get(lv, [])
        # 课程若带显式 order 字段（即原课程编排的课程序号，如 L1-L3 的第1~9课），
        # 优先按 order 排，直接体现文档里的学习顺序；无 order 的等级仍走 prereq 拓扑序。
        if any(c.get("order") is not None for c in cs):
            sorted_records.extend(sorted(cs, key=lambda c: (c["order"] if c["order"] is not None else 9999, c["key"])))
        else:
            pos = {k: i for i, k in enumerate(topo_order(cs))}
            sorted_records.extend(sorted(cs, key=lambda c: pos[c["key"]]))
    records = sorted_records

    # 写 index.json
    with open(os.path.join(CONTENT_DIR, "index.json"), "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)

    # 写 index.js
    with open(os.path.join(CONTENT_DIR, "index.js"), "w", encoding="utf-8") as f:
        f.write("// 自动生成，勿手改。由 tools/gen_index.py 生成\n")
        f.write("window.__COURSE_INDEX__ = ")
        f.write(json.dumps(records, ensure_ascii=False, indent=2))
        f.write(";\n")

    # 写 courses.js
    with open(os.path.join(CONTENT_DIR, "courses.js"), "w", encoding="utf-8") as f:
        f.write("// 自动生成，勿手改。由 tools/gen_index.py 生成\n")
        f.write("window.__COURSES__ = ")
        f.write(json.dumps(courses, ensure_ascii=False, indent=2))
        f.write(";\n")

    print(f"[OK] 解析 {len(records)} 个课程文件")
    print(f"      -> content/index.json")
    print(f"      -> content/index.js  (window.__COURSE_INDEX__)")
    print(f"      -> content/courses.js (window.__COURSES__)")
    if errors:
        print("\n[警告] 发现以下问题：")
        for e in errors:
            print("  - " + e)
        sys.exit(1)
    print("[OK] 无契约错误")


if __name__ == "__main__":
    main()
