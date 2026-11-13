#!/usr/bin/env python3
"""Serve Atalaia. The default library is the copied video folder; nothing there is deleted."""

import mimetypes
import os
import urllib.parse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
LIBRARY = Path(os.environ.get("BIBLIOTECA", ROOT / "biblioteca"))
EXTS = {".mp4", ".webm", ".mov", ".mkv", ".m4v", ".ogv"}
PORT = int(os.environ.get("PORT", "8765"))


def video_names():
    if not LIBRARY.is_dir():
        return []
    names = [
        path.name
        for path in LIBRARY.iterdir()
        if path.is_file() and path.suffix.lower() in EXTS
    ]
    names.sort()
    return names


def library_file(url_path):
    prefix = "/biblioteca/"
    if not url_path.startswith(prefix):
        return None
    name = urllib.parse.unquote(url_path[len(prefix):])
    if not name or "/" in name or "\\" in name or name in {".", ".."}:
        return None
    if Path(name).suffix.lower() not in EXTS:
        return None
    root = LIBRARY.resolve()
    candidate = (LIBRARY / name).resolve()
    if candidate.parent != root or not candidate.is_file():
        return None
    return candidate


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def send_video(self, path):
        size = path.stat().st_size
        start, end = 0, size - 1
        status = 200
        range_header = self.headers.get("Range")
        if range_header and range_header.startswith("bytes="):
            spec = range_header.split("=", 1)[1].split(",", 1)[0].strip()
            left, _, right = spec.partition("-")
            try:
                if left == "":
                    start = max(0, size - int(right or "0"))
                else:
                    start = int(left)
                    end = int(right) if right else size - 1
            except ValueError:
                self.send_error(416)
                return
            end = min(end, size - 1)
            if start > end or start < 0:
                self.send_error(416)
                return
            status = 206
        length = end - start + 1
        ctype = mimetypes.guess_type(path.name)[0] or "video/mp4"
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-Length", str(length))
        if status == 206:
            self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.end_headers()
        with path.open("rb") as handle:
            handle.seek(start)
            remaining = length
            while remaining:
                chunk = handle.read(min(65536, remaining))
                if not chunk:
                    break
                try:
                    self.wfile.write(chunk)
                except (BrokenPipeError, ConnectionResetError):
                    return
                remaining -= len(chunk)

    def do_GET(self):
        path = urllib.parse.urlsplit(self.path).path
        if path == "/manifest.json":
            body = json_bytes({"videos": video_names()})
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        video = library_file(path)
        if path.startswith("/biblioteca/"):
            if video is None:
                self.send_error(404)
                return
            self.send_video(video)
            return
        return super().do_GET()


def json_bytes(payload):
    import json
    return json.dumps(payload, ensure_ascii=False).encode()


if __name__ == "__main__":
    os.chdir(ROOT)
    server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print(f"Atalaia em http://127.0.0.1:{PORT}  biblioteca={LIBRARY}", flush=True)
    server.serve_forever()
