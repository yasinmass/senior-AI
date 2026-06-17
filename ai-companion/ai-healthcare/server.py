"""
உங்கள் நண்பன் · Local Server
Serves static files + /tts endpoint for Tamil, English & Hindi TTS.
Priority: Sarvam AI (Indian voices) → gTTS → Piper offline
Run: python server.py
"""

import io
import os
import base64
import urllib.parse
from http.server import HTTPServer, SimpleHTTPRequestHandler
import shutil
import subprocess
import struct

# ── Load .env for Sarvam API key ─────────────────────────────────────────────
_ENV_PATH = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
SARVAM_API_KEY = ''
if os.path.isfile(_ENV_PATH):
    with open(_ENV_PATH, encoding='utf-8') as _f:
        for _line in _f:
            _line = _line.strip()
            if _line.startswith('SARVAM_API_KEY') and '=' in _line:
                SARVAM_API_KEY = _line.split('=', 1)[1].strip()
                break
# Direct env override
SARVAM_API_KEY = os.environ.get('SARVAM_API_KEY', SARVAM_API_KEY)

# Sarvam voice config (bulbul:v2 Indian voices)
SARVAM_CONFIG = {
    'en': ('en-IN', 'anushka'),
    'ta': ('ta-IN', 'arya'),
    'hi': ('hi-IN', 'abhilash'),
}

# Fallback gTTS
try:
    from gtts import gTTS
    HAS_GTTS = True
except ImportError:
    HAS_GTTS = False

try:
    import requests as _req
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False



def find_piper():
    # check in PATH
    piper_path = shutil.which("piper")
    if piper_path:
        return piper_path
    
    # check common locations relative to senior-AI
    candidates = [
        os.path.join("..", "..", "backend", "bhavi_data", "piper", "piper.exe"),
        os.path.join("..", "..", "backend", "bhavi_data", "piper", "piper"),
        os.path.expanduser("~\\AppData\\Roaming\\Python\\Python313\\Scripts\\piper.exe"),
        os.path.expanduser("~\\AppData\\Roaming\\Python\\Python313\\Scripts\\piper"),
    ]
    for p in candidates:
        if os.path.isfile(p):
            return p
    return None

def get_voice_path(lang):
    voice_dir = os.path.join("..", "..", "backend", "bhavi_data", "piper_voices")
    # Voice model ONNX names (defaults)
    voice_names = {
        "en": "en_US-lessac-medium",
        "ta": "",  # Piper Tamil voice if exists
        "hi": ""   # Piper Hindi voice if exists
    }
    voice_name = voice_names.get(lang, "")
    if not voice_name:
        return None
    model_path = os.path.join(voice_dir, f"{voice_name}.onnx")
    if os.path.isfile(model_path):
        return model_path
    model_path = os.path.join(voice_dir, voice_name, f"{voice_name}.onnx")
    if os.path.isfile(model_path):
        return model_path
    return None

def pcm_to_wav(pcm_data, sample_rate=22050, channels=1, sample_width=2):
    data_size = len(pcm_data)
    header = struct.pack(
        '<4sI4s4sIHHIIHH4sI',
        b'RIFF',
        36 + data_size,
        b'WAVE',
        b'fmt ',
        16,                          # chunk size
        1,                           # PCM format
        channels,
        sample_rate,
        sample_rate * channels * sample_width,  # byte rate
        channels * sample_width,     # block align
        sample_width * 8,            # bits per sample
        b'data',
        data_size,
    )
    return header + pcm_data

class CompanionHandler(SimpleHTTPRequestHandler):

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)

        # ── TTS ENDPOINT: /tts?text=...&lang=ta ──────────────────────────────
        if parsed.path == '/tts':
            params = urllib.parse.parse_qs(parsed.query)
            text   = params.get('text', [''])[0].strip()
            lang   = params.get('lang', ['ta'])[0].strip()   # 'ta' or 'en' or 'hi'

            if not text:
                self._send(400, b'No text provided', 'text/plain')
                return

            audio_data = None
            content_type = 'audio/wav'

            # ── 1. Sarvam AI — expressive Indian voices ───────────────────────
            if SARVAM_API_KEY and HAS_REQUESTS:
                try:
                    lang_code, speaker = SARVAM_CONFIG.get(lang, ('en-IN', 'anushka'))
                    resp = _req.post(
                        'https://api.sarvam.ai/text-to-speech',
                        json={
                            'inputs': [text],
                            'target_language_code': lang_code,
                            'speaker': speaker,
                            'model': 'bulbul:v2',
                            'enable_preprocessing': True,
                        },
                        headers={'api-subscription-key': SARVAM_API_KEY},
                        timeout=15,
                    )
                    if resp.status_code == 200:
                        audios = resp.json().get('audios', [])
                        if audios:
                            audio_data = base64.b64decode(audios[0])
                            content_type = 'audio/wav'
                            print(f'[TTS] Sarvam ({lang}/{speaker}): {len(audio_data)} bytes')
                    elif resp.status_code == 429:
                        print('[TTS] Sarvam rate limited — falling back to gTTS')
                    else:
                        print(f'[TTS] Sarvam HTTP {resp.status_code} — falling back')
                except Exception as e:
                    print(f'[TTS] Sarvam error: {e} — falling back to gTTS')

            # ── 2. gTTS — Google TTS online fallback ─────────────────────────
            if not audio_data and HAS_GTTS:
                try:
                    tts = gTTS(text=text, lang=lang, slow=False)
                    buf = io.BytesIO()
                    tts.write_to_fp(buf)
                    audio_data = buf.getvalue()
                    content_type = 'audio/mpeg'
                    print(f'[TTS] gTTS fallback: {len(audio_data)} bytes')
                except Exception as e:
                    print(f'[TTS] gTTS error: {e}')

            # ── 3. Piper — local offline last resort ──────────────────────────
            if not audio_data:
                piper_bin = find_piper()
                voice_path = get_voice_path(lang)
                if piper_bin and voice_path:
                    try:
                        cmd = [
                            piper_bin,
                            "--model", voice_path,
                            "--output-raw",
                            "--length_scale", str(1.0 / 0.85),
                        ]
                        proc = subprocess.run(
                            cmd,
                            input=text.encode("utf-8"),
                            capture_output=True,
                            timeout=30,
                        )
                        if proc.returncode == 0 and proc.stdout:
                            audio_data = pcm_to_wav(proc.stdout)
                            content_type = 'audio/wav'
                            print(f"[TTS] Synthesized offline via Piper: {len(audio_data)} bytes")
                    except Exception as e:
                        print(f'[TTS PIPER ERROR] {e}')

            if not audio_data:
                self._send(500, b'All TTS engines failed (gTTS and Piper unavailable)', 'text/plain')
                return

            self.send_response(200)
            self.send_header('Content-Type',   content_type)
            self.send_header('Content-Length', str(len(audio_data)))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Cache-Control', 'no-cache')
            self.end_headers()
            self.wfile.write(audio_data)

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

    def log_message(self, fmt, *args):
        status = args[1] if len(args) > 1 else '?'
        path   = args[0] if len(args) > 0 else '?'
        if '/tts' in str(path) or str(status).startswith(('4', '5')):
            print(f'[{status}] {path}')


if __name__ == '__main__':
    PORT = 5500
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    server = HTTPServer(('', PORT), CompanionHandler)
    print('')
    print('  ==========================================')
    print(f'      Server running')
    print(f'      http://localhost:{PORT}')
    print(f'      TTS (Piper/gTTS) -> /tts?text=...')
    print('  ==========================================')
    print('')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n  Server stopped.')
