#!/usr/bin/env python3
"""Local dev server for the portfolio (stdlib only).

Same as `python -m http.server`, plus:
- a bigger connection backlog: the page loads about a dozen ES modules in
  parallel, and the default backlog of 5 makes Windows refuse some of them;
- 404.html for missing paths and gzip for text files, like GitHub Pages.

    python scripts/serve.py            # http://127.0.0.1:8000
    python scripts/serve.py 8765
"""
import functools
import io
import gzip
import http.server
import os
import sys

COMPRESSIBLE = (".html", ".css", ".js", ".mjs", ".json", ".svg", ".xml", ".txt", ".webmanifest")


class Server(http.server.ThreadingHTTPServer):
    request_queue_size = 128


class Handler(http.server.SimpleHTTPRequestHandler):
    """Serves 404.html for missing paths and gzips text, like GitHub Pages does."""

    def send_head(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            path = os.path.join(path, "index.html")
        accepts_gzip = "gzip" in self.headers.get("Accept-Encoding", "")
        if accepts_gzip and path.endswith(COMPRESSIBLE) and os.path.isfile(path):
            with open(path, "rb") as f:
                body = gzip.compress(f.read(), 6)
            self.send_response(200)
            self.send_header("Content-Type", self.guess_type(path))
            self.send_header("Content-Encoding", "gzip")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "max-age=600")  # what GitHub Pages sends
            self.end_headers()
            return io.BytesIO(body)
        return super().send_head()

    def send_error(self, code, message=None, explain=None):
        page = os.path.join(self.directory, "404.html")
        if code == 404 and os.path.isfile(page):
            with open(page, "rb") as f:
                body = f.read()
            self.send_response(404)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            if self.command != "HEAD":
                self.wfile.write(body)
            return
        super().send_error(code, message, explain)


def main() -> None:
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    handler = functools.partial(Handler, directory=root)
    with Server(("127.0.0.1", port), handler) as httpd:
        print(f"serving {root} at http://127.0.0.1:{port}/")
        httpd.serve_forever()


if __name__ == "__main__":
    main()
