#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Penguin Path 本地服务器（零依赖，仅标准库）

用途：
  浏览器直接双击 index.html 在部分环境（Control UI 预览、沙盒浏览器、
  某些 file:// 限制）下会拦截脚本，导致“模拟终端不存在/页面空白”。
  用本脚本起一个本地 HTTP 服务即可 100% 正常加载。

用法：
  python3 tools/serve.py            # 默认 127.0.0.1:8011
  python3 tools/serve.py 9000       # 自定义端口
  python3 tools/serve.py 0.0.0.0 8080  # 允许局域网访问

然后用浏览器打开提示的地址，例如： http://127.0.0.1:8011/
"""
import http.server
import socketserver
import sys
import os

# Windows 控制台默认 cp1252，无法直接输出 emoji/中文，先尝试把 stdout 设为 UTF-8；
# 失败则降级为纯 ASCII 横幅，避免启动时 UnicodeEncodeError 崩溃。
try:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8011
HOST = sys.argv[2] if len(sys.argv) > 2 else "127.0.0.1"

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

BANNER = (
    "=" * 50 + "\n"
    "[Penguin Path] Linux learning system is running.\n"
    "Open in your browser:\n"
    "    http://{host}:{port}/\n"
    "(Ctrl+C to stop)\n"
    "=" * 50
)


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def end_headers(self):
        # 关闭缓存，避免改完代码还看到旧页面
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def log_message(self, fmt, *args):
        pass  # 静默日志，保持终端干净


class Reusable(socketserver.TCPServer):
    allow_reuse_address = True


if __name__ == "__main__":
    with Reusable((HOST, PORT), Handler) as httpd:
        url = "http://{}:{}/".format(HOST, PORT)
        print(BANNER.format(host=HOST, port=PORT))
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.")
