#!/usr/bin/env python3
"""Lightweight zero-dependency web server for Huffman Text & File Compressor.
Serves the web UI and provides optional REST API endpoints for compression/decompression.
"""

import os
import sys
import mimetypes
from http.server import HTTPServer, BaseHTTPRequestHandler
import huffman

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
WEB_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'web')


class HuffmanHTTPRequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        req_path = self.path.split('?')[0]
        if req_path in ('/', ''):
            req_path = '/index.html'

        file_path = os.path.normpath(os.path.join(WEB_DIR, req_path.lstrip('/')))

        # Security check: Ensure requested path is within WEB_DIR
        if not file_path.startswith(WEB_DIR):
            self.send_error(403, "Forbidden")
            return

        if os.path.isfile(file_path):
            self.send_response(200)
            mime_type, _ = mimetypes.guess_type(file_path)
            self.send_header('Content-Type', mime_type or 'application/octet-stream')
            self.send_header('Content-Length', str(os.path.getsize(file_path)))
            self.end_headers()
            with open(file_path, 'rb') as f:
                self.wfile.write(f.read())
        else:
            self.send_error(404, "File Not Found")

    def do_POST(self):
        req_path = self.path.split('?')[0]
        content_length = int(self.headers.get('Content-Length', 0))

        if content_length <= 0:
            self.send_error(400, "Empty payload")
            return

        payload = self.rfile.read(content_length)

        if req_path == '/api/compress':
            try:
                compressed = huffman.compress(payload)
                self.send_response(200)
                self.send_header('Content-Type', 'application/octet-stream')
                self.send_header('Content-Disposition', 'attachment; filename="compressed.bin"')
                self.send_header('Content-Length', str(len(compressed)))
                self.end_headers()
                self.wfile.write(compressed)
            except Exception as e:
                self.send_error(500, f"Compression error: {str(e)}")

        elif req_path == '/api/decompress':
            try:
                decompressed = huffman.decompress(payload)
                self.send_response(200)
                self.send_header('Content-Type', 'application/octet-stream')
                self.send_header('Content-Disposition', 'attachment; filename="output.txt"')
                self.send_header('Content-Length', str(len(decompressed)))
                self.end_headers()
                self.wfile.write(decompressed)
            except Exception as e:
                self.send_error(500, f"Decompression error: {str(e)}")
        else:
            self.send_error(404, "API endpoint not found")

    def log_message(self, format, *args):
        # Clean console log
        sys.stderr.write(f"[{self.log_date_time_string()}] {self.address_string()} - {format % args}\n")


def run_server():
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, HuffmanHTTPRequestHandler)
    print("=" * 60)
    print(f"🗜️  Huffman Web App is running!")
    print(f"👉 Local URL: http://localhost:{PORT}")
    print(f"👉 Static UI Directory: {WEB_DIR}")
    print("=" * 60)
    print("Press Ctrl+C to stop.\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        httpd.server_close()


if __name__ == '__main__':
    run_server()
