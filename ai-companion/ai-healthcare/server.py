"""
உங்கள் நண்பன் · Local Server
Serves static files + /tts endpoint for Tamil & English TTS using gTTS (Google TTS).
Run: python server.py
"""

import io
import os
import urllib.parse
from http.server import HTTPServer, SimpleHTTPRequestHandler
from gtts import gTTS


class CompanionHandler(SimpleHTTPRequestHandler):

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)

        # ── TTS ENDPOINT: /tts?text=...&lang=ta ──────────────────────────────
        if parsed.path == '/tts':
            params = urllib.parse.parse_qs(parsed.query)
            text   = params.get('text', [''])[0].strip()
            lang   = params.get('lang', ['ta'])[0].strip()   # 'ta' or 'en'

            if not text:
                self._send(400, b'No text provided', 'text/plain')
                return

            try:
                tts        = gTTS(text=text, lang=lang, slow=False)
                buf        = io.BytesIO()
                tts.write_to_fp(buf)
                audio_data = buf.getvalue()

                self.send_response(200)
                self.send_header('Content-Type',   'audio/mpeg')
                self.send_header('Content-Length', str(len(audio_data)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Cache-Control', 'no-cache')
                self.end_headers()
                self.wfile.write(audio_data)

            except Exception as e:
                print(f'[TTS ERROR] {e}')
                self._send(500, str(e).encode(), 'text/plain')

        # ── STATIC FILES (HTML / CSS / JS etc.) ──────────────────────────────
        else:
            super().do_GET()

    def _send(self, code, body, content_type='text/plain'):
        self.send_response(code)
        self.send_header('Content-Type', content_type)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    # Silence access logs (optional: comment out to see requests)
    def log_message(self, fmt, *args):
        status = args[1] if len(args) > 1 else '?'
        path   = args[0] if len(args) > 0 else '?'
        # Only print TTS calls and errors
        if '/tts' in str(path) or str(status).startswith(('4', '5')):
            print(f'[{status}] {path}')


if __name__ == '__main__':
    PORT = 5500
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    server = HTTPServer(('', PORT), CompanionHandler)
    print(f'')
    print(f'  ╔══════════════════════════════════════════╗')
    print(f'  ║   உங்கள் நண்பன் · Server running        ║')
    print(f'  ║   http://localhost:{PORT}                   ║')
    print(f'  ║   Tamil TTS  →  /tts?text=...&lang=ta   ║')
    print(f'  ║   English TTS → /tts?text=...&lang=en   ║')
    print(f'  ╚══════════════════════════════════════════╝')
    print(f'')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n  Server stopped.')
