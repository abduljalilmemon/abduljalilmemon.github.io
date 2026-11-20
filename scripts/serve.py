#!/usr/bin/env python3
"""Local dev server for the portfolio (stdlib only).

Same as `python -m http.server`, but with a bigger connection backlog: the
page loads about a dozen ES modules in parallel, and the default backlog of 5
makes Windows refuse some of those connections, leaving a half-loaded page.

    python scripts/serve.py            # http://127.0.0.1:8000
    python scripts/serve.py 8765
"""
import functools
import http.server
import os
import sys


class Server(http.server.ThreadingHTTPServer):
    request_queue_size = 128


def main() -> None:
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=root)
    with Server(("127.0.0.1", port), handler) as httpd:
        print(f"serving {root} at http://127.0.0.1:{port}/")
        httpd.serve_forever()


if __name__ == "__main__":
    main()
