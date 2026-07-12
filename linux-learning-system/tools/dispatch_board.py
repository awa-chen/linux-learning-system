#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
伙伴派发看板生成器（零第三方依赖）
扫描 partner-workspace/<id>/status.json，聚合成实时派发看板：
  - 打印到 stdout（中文，UTF-8）
  - 写入 DISPATCH-BOARD.md（供阅读/沉淀）

每个伙伴应在干活时按需更新自己的 status.json：
  {
    "agent": "xiaomage", "display": "🛠️ 小码哥",
    "task": "沙盒内核 + L1~L3 入门课",
    "status": "in_progress",          # pending | in_progress | done | error
    "started_ms": 1783816785474,      # 开始 epoch 毫秒
    "ended_ms": null,                 # 完成时填，否则 null
    "progress_pct": 60,
    "steps": ["步骤1", "步骤2"],       # 全部计划步骤
    "current_step": "正在写 L2",
    "deliverables": ["文件1", "文件2"]
  }
主 agent 可在派发后用本脚本随时查看伙伴活动状态（弥补子 Agent 无 UI 进度条的断点）。
"""
import json
import os
import sys

try:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WS_DIR = os.path.join(ROOT, "partner-workspace")
OUT_MD = os.path.join(ROOT, "DISPATCH-BOARD.md")

STATUS_ICON = {"pending": "⏳", "in_progress": "🔄", "done": "✅", "error": "❌"}
STATUS_LABEL = {"pending": "待开始", "in_progress": "进行中", "done": "已完成", "error": "出错"}


def fmt_duration(ms):
    if not ms:
        return "—"
    s = int(ms / 1000)
    m, s = divmod(s, 60)
    h, m = divmod(m, 60)
    if h:
        return f"{h}h{m:02d}m"
    return f"{m}m{s:02d}s"


def fmt_time(ms):
    if not ms:
        return "—"
    import datetime
    return datetime.datetime.fromtimestamp(ms / 1000).strftime("%H:%M:%S")


def load_all():
    records = []
    if not os.path.isdir(WS_DIR):
        return records
    for name in sorted(os.listdir(WS_DIR)):
        p = os.path.join(WS_DIR, name, "status.json")
        if not os.path.isfile(p):
            continue
        try:
            with open(p, encoding="utf-8") as f:
                rec = json.load(f)
        except Exception as e:
            rec = {"agent": name, "display": name, "status": "error", "current_step": f"status.json 解析失败: {e}"}
        rec.setdefault("display", rec.get("agent", name))
        rec.setdefault("status", "pending")
        rec.setdefault("steps", [])
        rec.setdefault("deliverables", [])
        records.append(rec)
    return records


def render(records):
    lines = []
    lines.append("# 伙伴派发看板（实时）\n")
    lines.append("> 由 `tools/dispatch_board.py` 生成，扫描各伙伴 `partner-workspace/<id>/status.json`。\n")
    total = len(records)
    done = sum(1 for r in records if r["status"] == "done")
    lines.append(f"**总览**：{done}/{total} 伙伴已完成\n")

    # 总表
    lines.append("| 伙伴 | 任务 | 状态 | 进度 | 开始 | 结束 | 用时 |")
    lines.append("|------|------|------|------|------|------|------|")
    for r in sorted(records, key=lambda x: x.get("started_ms") or 0):
        dur = (r.get("ended_ms") or 0) - (r.get("started_ms") or 0)
        lines.append(
            f"| {r['display']} | {r.get('task','')} | "
            f"{STATUS_ICON.get(r['status'],'⏳')}{STATUS_LABEL.get(r['status'],r['status'])} | "
            f"{r.get('progress_pct',0)}% | {fmt_time(r.get('started_ms'))} | "
            f"{fmt_time(r.get('ended_ms'))} | {fmt_duration(dur)} |"
        )
    lines.append("")

    # 每个伙伴明细
    for r in sorted(records, key=lambda x: x.get("started_ms") or 0):
        lines.append(f"## {r['display']} · {r.get('task','')}")
        lines.append(f"- 状态：{STATUS_ICON.get(r['status'],'⏳')} {STATUS_LABEL.get(r['status'],r['status'])}")
        lines.append(f"- 当前：{r.get('current_step','—')}")
        if r.get("steps"):
            lines.append("- 步骤清单：")
            for i, s in enumerate(r["steps"], 1):
                lines.append(f"  {i}. {s}")
        if r.get("deliverables"):
            lines.append("- 交付物：")
            for d in r["deliverables"]:
                lines.append(f"  - `{d}`")
        lines.append("")
    return "\n".join(lines)


def main():
    records = load_all()
    md = render(records)
    # stdout
    print(md)
    # 写文件
    with open(OUT_MD, "w", encoding="utf-8") as f:
        f.write(md)
    print(f"\n[OK] 看板已写入 {os.path.relpath(OUT_MD, ROOT)}")


if __name__ == "__main__":
    main()
