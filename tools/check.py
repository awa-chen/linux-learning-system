#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Penguin Path 本地校验脚本（零第三方依赖，仅标准库）
用法：
    python3 tools/check.py            # 使用脚本所在项目的根目录
    python3 tools/check.py <根目录>   # 显式指定 linux-learning-system 根目录
作用：
    1) 校验 content/*.md 的 frontmatter 合法性
       - 必须含 key/level/lang/objective/prereq/estimated_min/sandbox 全部字段
       - level ∈ {L1..L12}
       - lang  ∈ {shell,bash,nginx,ansible,prometheus,不限}
       - key 全局唯一且匹配文件名（<key>.md）
       - prereq 必须是 list
       - sandbox 必须是布尔；estimated_min 必须是整数
    2) 校验 content/index.json（若已存在）与 md 一致：
       key/level/title 对应、file 字段指向真实文件
    3) 校验各 partner-workspace/*/steps.js 的 STEPS：
       每个 STEPS 的 key 都能在 content 中找到对应 md（沙盒与图文课联动），
       且存在 checker 字段；联动课程必须为 sandbox:true
退出码：
    0 = 全部通过（供 CI 使用）
    1 = 存在失败项
"""
import json
import os
import re
import sys

VALID_LEVELS = [f"L{i}" for i in range(1, 13)]
VALID_LANGS = {"shell", "bash", "nginx", "ansible", "prometheus", "不限"}
REQUIRED_FM_KEYS = ["key", "level", "lang", "objective", "prereq", "estimated_min", "sandbox"]


class Report:
    """简单的校验结果收集器，按 section 分组记录通过/失败。"""

    def __init__(self):
        self.items = []  # (section, ok, where, msg)

    def add(self, ok, section, where, msg=""):
        self.items.append((section, ok, where, msg))

    def section_ok(self, section):
        return [x for x in self.items if x[0] == section and x[1]]

    def section_fail(self, section):
        return [x for x in self.items if x[0] == section and not x[1]]

    def failures(self):
        return [x for x in self.items if not x[1]]

    def passes(self):
        return [x for x in self.items if x[1]]


report = Report()


def resolve_root(argv):
    if len(argv) > 1 and argv[1]:
        return os.path.abspath(argv[1])
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def parse_frontmatter_with_lines(path):
    """解析 frontmatter，返回 (fm_dict, field_line_dict, error)。

    field_line_dict: 字段名 -> 在文件中的行号（1 起）。
    error 为 None 表示解析成功。
    """
    with open(path, encoding="utf-8-sig") as f:
        lines = f.readlines()
    if not lines or lines[0].strip() != "---":
        return {}, {}, "缺少 frontmatter 起始标记 '---'（必须位于第 1 行）"
    end = None
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            end = i
            break
    if end is None:
        return {}, {}, "frontmatter 未闭合：找不到结束的 '---'"
    fm = {}
    field_lines = {}
    for i in range(1, end):
        raw = lines[i].rstrip("\n")
        if not raw.strip() or ":" not in raw:
            continue
        k, _, v = raw.partition(":")
        k = k.strip()
        v = v.strip()
        if k in field_lines:
            continue
        field_lines[k] = i + 1  # 1-indexed
        fm[k] = v
    return fm, field_lines, None


def parse_list(val):
    """将 '[a, b]' 解析为 list；不是列表返回 None。"""
    v = val.strip()
    if not (v.startswith("[") and v.endswith("]")):
        return None
    inner = v[1:-1].strip()
    if inner == "":
        return []
    return [x.strip().strip("'\"") for x in inner.split(",") if x.strip()]


def extract_top_objects(text):
    """从 steps.js 的 push(...) 中提取所有顶层 {...} 对象文本。

    采用括号配平，可正确处理 checker 箭头函数内部的嵌套 {}，
    并支持同一个 push(...) 内逗号分隔的多个对象。
    """
    objs = []
    n = len(text)
    for m in re.finditer(r"push\s*\(", text):
        # 找到与这个 push( 配平的 ) 区间
        depth = 1
        j = m.end()
        while j < n and depth > 0:
            c = text[j]
            if c == "(":
                depth += 1
            elif c == ")":
                depth -= 1
            j += 1
        if depth != 0:
            continue
        span = text[m.end():j - 1]
        # 在 span 内提取所有 brace 配平的对象
        i = 0
        while i < len(span):
            if span[i] == "{":
                d = 1
                k = i + 1
                buf = ["{"]
                while k < len(span) and d > 0:
                    ch = span[k]
                    if ch == "{":
                        d += 1
                    elif ch == "}":
                        d -= 1
                    buf.append(ch)
                    k += 1
                if d == 0:
                    objs.append("".join(buf))
                    i = k
                    continue
            i += 1
    return objs


def main():
    # Windows 终端默认 cp1252 无法输出中文，强制 UTF-8 避免 UnicodeEncodeError
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:  # noqa
        pass
    try:
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:  # noqa
        pass
    ROOT = resolve_root(sys.argv)
    CONTENT_DIR = os.path.join(ROOT, "content")
    WORKSPACE_DIR = os.path.join(ROOT, "partner-workspace")

    if not os.path.isdir(CONTENT_DIR):
        report.add(False, "环境", "目录", f"找不到 content 目录: {CONTENT_DIR}")
        print_report(ROOT)
        return 1

    # ---------- [1] frontmatter 校验 ----------
    md_files = sorted(f for f in os.listdir(CONTENT_DIR) if f.endswith(".md"))
    content_keys = set()                 # 已见 key
    content_meta = {}                    # key -> {file, level, title, sandbox}

    for fn in md_files:
        path = os.path.join(CONTENT_DIR, fn)
        fm, flines, err = parse_frontmatter_with_lines(path)
        if err:
            report.add(False, "frontmatter", f"{fn}:行1", err)
            continue

        file_ok = True
        for rk in REQUIRED_FM_KEYS:
            if rk not in fm:
                report.add(False, "frontmatter", f"{fn}:行{flines.get(rk, 1)}", f"缺少必填字段 '{rk}'")
                file_ok = False

        key = fm.get("key")
        if key:
            if key + ".md" != fn:
                report.add(False, "frontmatter", f"{fn}:行{flines.get('key', 1)}",
                           f"key({key}) 与文件名不一致，应为 '{key}.md'")
                file_ok = False
            if key in content_keys:
                report.add(False, "frontmatter", f"{fn}:行{flines.get('key', 1)}",
                           f"key 全局重复（已出现在其他文件）")
                file_ok = False
            else:
                content_keys.add(key)

        level = fm.get("level")
        if level and level not in VALID_LEVELS:
            report.add(False, "frontmatter", f"{fn}:行{flines.get('level', 1)}",
                       f"level 非法: {level}（应为 L1~L12）")
            file_ok = False

        lang = fm.get("lang")
        if lang and lang not in VALID_LANGS:
            report.add(False, "frontmatter", f"{fn}:行{flines.get('lang', 1)}",
                       f"lang 非法: {lang}（应为 shell|bash|nginx|ansible|prometheus|不限）")
            file_ok = False

        if "objective" in fm and fm["objective"].strip() == "":
            report.add(False, "frontmatter", f"{fn}:行{flines.get('objective', 1)}", "objective 不能为空")
            file_ok = False

        prereq_list = None
        if "prereq" in fm:
            prereq_list = parse_list(fm["prereq"])
            if prereq_list is None:
                report.add(False, "frontmatter", f"{fn}:行{flines.get('prereq', 1)}",
                           f"prereq 必须是数组(list)，当前值: {fm['prereq']}")
                file_ok = False

        if "estimated_min" in fm and not re.fullmatch(r"\d+", fm["estimated_min"].strip()):
            report.add(False, "frontmatter", f"{fn}:行{flines.get('estimated_min', 1)}",
                       f"estimated_min 必须是正整数，当前: {fm['estimated_min']}")
            file_ok = False

        sandbox_bool = None
        if "sandbox" in fm:
            sb = fm["sandbox"].strip().lower()
            if sb not in ("true", "false"):
                report.add(False, "frontmatter", f"{fn}:行{flines.get('sandbox', 1)}",
                           f"sandbox 必须是布尔 true/false，当前: {fm['sandbox']}")
                file_ok = False
            else:
                sandbox_bool = (sb == "true")

        # 记录元数据供 index / steps 校验使用；仅当无错误且 key 唯一时记录
        if key and file_ok:
            content_meta[key] = {
                "file": fn,
                "level": level,
                "title": fm.get("title", ""),
                "sandbox": sandbox_bool,
            }

        if file_ok:
            report.add(True, "frontmatter", fn, "frontmatter 合法")

    if not md_files:
        report.add(True, "frontmatter", "content/*.md", "（暂无课程文件，跳过）")

    # ---------- [2] index.json 一致性校验 ----------
    index_path = os.path.join(CONTENT_DIR, "index.json")
    if os.path.isfile(index_path):
        try:
            with open(index_path, encoding="utf-8-sig") as f:
                index = json.load(f)
        except Exception as e:  # noqa
            report.add(False, "index", "index.json", f"JSON 解析失败: {e}")
            index = None
        if index is not None:
            for entry in index:
                ek = entry.get("key")
                if ek not in content_meta:
                    report.add(False, "index", f"index.json:entry({ek})",
                               "索引 key 在 content 中找不到对应 md 文件")
                    continue
                meta = content_meta[ek]
                bad = False
                if entry.get("level") != meta["level"]:
                    report.add(False, "index", f"index.json:entry({ek})",
                               f"level 不一致：索引={entry.get('level')} 文件={meta['level']}")
                    bad = True
                if entry.get("title") != meta["title"]:
                    report.add(False, "index", f"index.json:entry({ek})",
                               f"title 不一致：索引='{entry.get('title')}' 文件='{meta['title']}'")
                    bad = True
                fld = entry.get("file")
                if not fld or not os.path.isfile(os.path.join(CONTENT_DIR, fld)):
                    report.add(False, "index", f"index.json:entry({ek})",
                               f"file 字段({fld}) 指向的文件不存在")
                    bad = True
                if not bad:
                    report.add(True, "index", f"index.json:entry({ek})",
                               "索引与 content 一致")
    else:
        report.add(True, "index", "index.json", "（不存在，跳过；将由主 agent 生成）")

    # ---------- [3] steps.js STEPS 联动校验 ----------
    if os.path.isdir(WORKSPACE_DIR):
        for ws in sorted(os.listdir(WORKSPACE_DIR)):
            sp = os.path.join(WORKSPACE_DIR, ws, "steps.js")
            if not os.path.isfile(sp):
                continue
            with open(sp, encoding="utf-8-sig") as f:
                text = f.read()
            objs = extract_top_objects(text)
            if not objs:
                report.add(True, "steps", os.path.relpath(sp, ROOT),
                           "（无 STEPS，sandbox:false 课程，符合契约）")
                continue  # 没有 STEPS 是允许的（sandbox:false 的课程）
            lines = text.splitlines()
            for obj in objs:
                km = re.search(r"key\s*:\s*'([^']+)'", obj)
                if not km:
                    report.add(False, "steps", f"{os.path.relpath(sp, ROOT)}",
                               "STEPS 对象缺少 key 字段")
                    continue
                keyval = km.group(1)
                linum = None
                for idx, line in enumerate(lines, 1):
                    if re.search(r"key\s*:\s*'" + re.escape(keyval) + r"'", line):
                        linum = idx
                        break
                where = f"{os.path.relpath(sp, ROOT)}:行{linum}"
                step_ok = True
                if keyval not in content_meta:
                    report.add(False, "steps", where,
                               f"STEPS key({keyval}) 在 content 中找不到对应 md")
                    step_ok = False
                else:
                    if content_meta[keyval]["sandbox"] is False:
                        report.add(False, "steps", where,
                                   f"STEPS key({keyval}) 对应课程 sandbox:false，不应有沙盒步骤")
                        step_ok = False
                if not re.search(r"checker\s*:", obj):
                    report.add(False, "steps", where,
                               f"STEPS key({keyval}) 缺少 checker 字段（必须提供浏览器纯函数）")
                    step_ok = False
                if step_ok:
                    report.add(True, "steps", where, f"STEPS key({keyval}) 联动校验通过")
    else:
        report.add(True, "steps", "partner-workspace", "（目录不存在，跳过）")

    code = print_report(ROOT)
    return code


def print_report(ROOT):
    print("=" * 56)
    print("Penguin Path 本地校验报告")
    print("项目根目录:", ROOT)
    print("=" * 56)

    sections = ["frontmatter", "index", "steps"]
    labels = {
        "frontmatter": "[1] 课程 frontmatter 校验",
        "index": "[2] 课程索引一致性校验",
        "steps": "[3] 沙盒 STEPS 联动校验",
    }
    for sec in sections:
        ok_items = report.section_ok(sec)
        fail_items = report.section_fail(sec)
        print()
        print(labels[sec])
        print(f"  ✅ 通过 {len(ok_items)} 项")
        print(f"  ❌ 失败 {len(fail_items)} 项")
        for _, _, where, msg in fail_items:
            print(f"     - {where}: {msg}")

    total_ok = len(report.passes())
    total_fail = len(report.failures())
    print()
    print("-" * 56)
    print(f"汇总：通过 {total_ok} / 失败 {total_fail}")
    if total_fail == 0:
        print("结果：全部通过 ✅   （退出码 0）")
        return 0
    print("结果：存在失败 ❌   （退出码 1）")
    return 1


if __name__ == "__main__":
    sys.exit(main())
