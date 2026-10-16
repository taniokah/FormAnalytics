#!/usr/bin/env python3
"""Serve private source only to this computer over loopback, no cloud upload."""
import http.server
from functools import partial
from pathlib import Path
HOST,PORT='127.0.0.1',8765
class NoStore(http.server.SimpleHTTPRequestHandler):
  def end_headers(self):
    self.send_header('Cache-Control','no-store')
    self.send_header('X-Content-Type-Options','nosniff')
    super().end_headers()
  def log_message(self,fmt,*args):
    print('[local] '+fmt%args)
with http.server.ThreadingHTTPServer((HOST,PORT),partial(NoStore,directory=str(Path(__file__).resolve().parent))) as srv:
  print(f'FORM ANALYSIS PRIVATE: http://{HOST}:{PORT}/')
  print('Same-origin-only assets in /vendor/; no external CDNs are used by the application.')
  print('127.0.0.1 only — not accessible to other devices. Ctrl+C to stop.')
  srv.serve_forever()
