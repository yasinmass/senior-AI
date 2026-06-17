/* ═══════════════════════════════════════════════════
   உங்கள் நண்பன் · Live
   app.js  |  Local / Offline Local Companion with Hindi Support
   Routes requests through Django Local Backend.
   Uses local Piper TTS / gTTS fallback.
   All processing is offline and private.
   No API keys required.
 ═══════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────
// 1.  USER FILES  (text_1 & text_2)
// ─────────────────────────────────────────────────

const FILE_PROFILE = `
Name: Lakshmi
Age: 72
Location: Chennai, India
Occupation: Retired School Teacher (25 years)
Languages: Tamil, English, Hindi
Family:
  - Daughter: Meena (Bangalore, IT)
  - Son: Ravi (Singapore)
  - Husband: Raghavan (passed away 2018)
Personality: Calm, kind, thoughtful. Loves talking about teaching career and students.
Daily Routine: Wakes 6 AM, coffee + old Tamil songs, reads newspaper, TV afternoon, evening park walks.
Health: Mild arthritis, occasional sleep trouble. Doctor advised regular walking.
`;

const FILE_DIARY = `
=== Life Memories ===
25 years as a school teacher — teaching was her greatest passion.
Received "Best Teacher Award" in 2005 at the school annual function.
Loved organizing cultural events: student dances, dramas, annual days.

=== Emotional Patterns ===
Happiest when talking about students and teaching years.
Feels lonely evenings when children are far away.
Deepavali reminds her of husband Raghavan — she misses him deeply.

=== What Comforts Her ===
Old Tamil songs, talking about teaching, speaking with daughter Meena, student stories.

=== What Makes Her Sad ===
Long silences, feeling like a burden, spending festivals alone.

=== Life Values ===
Helping students grow into good people was her biggest gift to society.
`;

const SYSTEM_PROMPT = `You are "உங்கள் நண்பன்" — a warm, compassionate AI companion for an elderly woman named Lakshmi.

=== PERSONAL FILE ===
${FILE_PROFILE}

=== DIARY / MEMORIES ===
${FILE_DIARY}

══════════════════════════════════════
⚠️  LANGUAGE RULE — READ CAREFULLY  ⚠️
══════════════════════════════════════
Three languages are supported: TAMIL, ENGLISH, and HINDI.

RULE 1: If the user's message contains Tamil script characters (Unicode range 0B80–0BFF) → reply ENTIRELY in Tamil script.
RULE 2: If the user's message contains Hindi/Devanagari script characters (Unicode range 0900–097F) → reply ENTIRELY in Hindi.
RULE 3: If the user's message is in English (Latin alphabet) → reply ENTIRELY in English.

No mixing. No Tanglish. Reply completely in the detected language.
══════════════════════════════════════

=== EMOTIONAL SUPPORT RULES ===
1. Acknowledge feelings BEFORE any advice or suggestions.
2. Speak like a caring grandchild — warm, patient, never rushed.
3. When she is sad/lonely → gently reference ONE positive memory from her diary.
4. NEVER make her feel old, helpless, or a burden.
5. REPLY LENGTH: 3-5 complete sentences. End with one gentle question.
6. If she sounds deeply hopeless → gently suggest calling Meena, Ravi, or a loved one.
7. You are NOT a therapist. You are her warm, caring friend.`;

// ─────────────────────────────────────────────────
// 2.  STATE & SETTINGS
// ─────────────────────────────────────────────────

const BACKEND_URL = 'http://127.0.0.1:8000';
let AUTO_SPEAK = localStorage.getItem('nanbhan_speak') !== 'false';

// Recognition language cycle: ta-IN (Tamil) -> en-IN (English) -> hi-IN (Hindi)
const LANGS = [
  { code: 'ta-IN', api: 'ta', label: '🇮🇳 TA', title: 'Tamil' },
  { code: 'en-IN', api: 'en', label: '🇬🇧 EN', title: 'English' },
  { code: 'hi-IN', api: 'hi', label: 'hi', title: 'Hindi' }
];

let RECOG_LANG = localStorage.getItem('nanbhan_recognLang') || 'ta-IN';
let LANG_IDX = LANGS.findIndex(l => l.code === RECOG_LANG);
if (LANG_IDX === -1) {
  LANG_IDX = 0;
  RECOG_LANG = LANGS[LANG_IDX].code;
}

let history = [];
let isRecording = false;
let isSpeaking = false;
let recognition = null;
let waveTimer = null;
let wavePhase = 0;

// ─────────────────────────────────────────────────
// 3.  DOM HELPERS
// ─────────────────────────────────────────────────

const $ = id => document.getElementById(id);

// ─────────────────────────────────────────────────
// 4.  LANGUAGE DETECTION
// ─────────────────────────────────────────────────

function detectLang(text) {
  if (/[\u0B80-\u0BFF]/.test(text)) return 'Tamil';
  if (/[\u0900-\u097F]/.test(text)) return 'Hindi';
  return 'English';
}

// ─────────────────────────────────────────────────
// 5.  TEXT-TO-SPEECH (via local server.py)
// ─────────────────────────────────────────────────

let _currentAudio = null; // track active Audio element

function speak(text, lang) {
  if (!AUTO_SPEAK) return Promise.resolve();
  if (!text || !text.trim()) return Promise.resolve();

  // Map to server lang codes
  let ttsLang = 'en';
  if (lang === 'Tamil') ttsLang = 'ta';
  else if (lang === 'Hindi') ttsLang = 'hi';

  // Show orb animation immediately
  isSpeaking = true;
  setOrbState('speaking');
  startWave('rgba(52,211,153,0.8)');

  return new Promise(resolve => {
    // Build the local server.py /tts URL
    const url = `/tts?lang=${ttsLang}&text=${encodeURIComponent(text)}`;

    if (_currentAudio) {
      _currentAudio.pause();
      _currentAudio = null;
    }

    const audio = new Audio(url);
    _currentAudio = audio;

    audio.oncanplaythrough = () => {
      audio.play().catch(err => {
        console.warn('Audio play() blocked:', err);
        _done();
      });
    };

    audio.onended = () => _done();

    audio.onerror = (e) => {
      console.warn('Local TTS audio error — falling back to Web Speech API', e);
      _done();
      speakWebSpeech(text, lang); // Fallback to browser
    };

    function _done() {
      isSpeaking = false;
      stopWave();
      setOrbState('idle');
      _currentAudio = null;
      resolve();
    }
  });
}

// Web Speech API fallback
function speakWebSpeech(text, lang) {
  if (!('speechSynthesis' in window)) return Promise.resolve();
  window.speechSynthesis.cancel();

  return new Promise(resolve => {
    setTimeout(() => {
      const voices = window.speechSynthesis.getVoices();
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = 0.84;
      utt.pitch = 1.05;
      utt.volume = 1;

      if (lang === 'Tamil') {
        utt.lang = 'ta-IN';
        const v = voices.find(v => v.lang === 'ta-IN')
          || voices.find(v => v.lang.startsWith('ta'))
          || voices.find(v => v.default)
          || voices[0] || null;
        if (v) utt.voice = v;
      } else if (lang === 'Hindi') {
        utt.lang = 'hi-IN';
        const v = voices.find(v => v.lang === 'hi-IN')
          || voices.find(v => v.lang.startsWith('hi'))
          || voices.find(v => v.default)
          || voices[0] || null;
        if (v) utt.voice = v;
      } else {
        utt.lang = 'en-IN';
        const v = voices.find(v => v.lang === 'en-IN')
          || voices.find(v => v.lang === 'en-US')
          || voices.find(v => v.lang.startsWith('en'))
          || voices.find(v => v.default)
          || voices[0] || null;
        if (v) utt.voice = v;
      }

      utt.onstart = () => { isSpeaking = true; setOrbState('speaking'); startWave('rgba(52,211,153,0.8)'); };
      utt.onend = () => { isSpeaking = false; stopWave(); setOrbState('idle'); resolve(); };
      utt.onerror = () => { isSpeaking = false; stopWave(); setOrbState('idle'); resolve(); };
      window.speechSynthesis.speak(utt);
    }, 150);
  });
}

// Pre-load Web Speech voices
if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}

// ─────────────────────────────────────────────────
// 6.  ORB STATE
// ─────────────────────────────────────────────────

function setOrbState(state) {
  const orbCore = $('orbCore');
  const orbIcon = $('orbIcon');
  const orbLabel = $('orbLabel');
  const dockHint = $('dockHint');
  const liveLabel = $('liveLabel');

  if (!orbCore) return;

  orbCore.className = `orb-core ${state}`;

  const icons = { idle: '🤍', listening: '🎙️', thinking: '💭', speaking: '🔊' };
  const labels = { idle: 'உங்கள் நண்பன்', listening: 'கேட்கிறேன்…', thinking: 'யோசிக்கிறேன்…', speaking: 'பேசுகிறேன்…' };
  
  const currentLangLabel = LANGS[LANG_IDX].title;
  const hints = {
    idle: `🎙️ Mic தொடுங்கள் · Language: 🇮🇳 ${currentLangLabel}`,
    listening: '⏹ நிறுத்த மீண்டும் Mic தொடுங்கள்',
    thinking: '💭 யோசிக்கிறேன்…',
    speaking: '🔊 பேசுகிறேன்…'
  };
  orbIcon.textContent = icons[state] || '🤍';
  orbLabel.textContent = labels[state] || '';
  dockHint.textContent = hints[state] || '';
  liveLabel.textContent = state === 'idle' ? 'Bhavi AI ❤️' : (labels[state] || 'Bhavi AI ❤️').replace('…', '');

}

// ─────────────────────────────────────────────────
// 7.  WAVE ANIMATION
// ─────────────────────────────────────────────────

function startWave(color = 'rgba(96,165,250,0.8)') {
  const waveWrap = $('waveWrap');
  const wavePath = $('wavePath');
  if (!waveWrap || !wavePath) return;
  waveWrap.classList.add('active');
  wavePath.setAttribute('stroke', color);
  clearInterval(waveTimer);
  waveTimer = setInterval(() => {
    wavePhase += 0.18;
    const amp = 16 + Math.random() * 12;
    const d = `M0,40 Q37.5,${40 - amp * Math.sin(wavePhase)} 75,40 Q112.5,${40 + amp * Math.sin(wavePhase + 1)} 150,40 Q187.5,${40 - amp * Math.sin(wavePhase + 2)} 225,40 Q262.5,${40 + amp * Math.sin(wavePhase + 3)} 300,40`;
    wavePath.setAttribute('d', d);
  }, 60);
}

// Stop wave visualizer
function stopWave() {
  clearInterval(waveTimer);
  const waveWrap = $('waveWrap');
  const wavePath = $('wavePath');
  if (!waveWrap || !wavePath) return;
  waveWrap.classList.remove('active');
  wavePath.setAttribute('d', 'M0,40 Q75,40 150,40 Q225,40 300,40');
}

// ─────────────────────────────────────────────────
// 8.  BHAVI LOCAL BACKEND CALL (replaces direct Groq)
// ─────────────────────────────────────────────────

async function callGroq(userMessage) {
  history.push({ role: 'user', content: userMessage });
  if (history.length > 20) history = history.slice(-20);

  const payload = {
    text: userMessage,
    preferred_lang: LANGS[LANG_IDX].api
  };

  try {
    // Post to the local Django companion chat endpoint
    const res = await fetch(`${BACKEND_URL}/api/companion/chat/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      console.error('Django local backend error:', res.statusText);
      return 'கொஞ்சம் தொந்தரவு. / Having trouble connecting to Bhavi local server. Please make sure the Django server is running.';
    }

    const data = await res.json();

    // Django returns flat format: { success: true, ai_response: "...", emotion: {...} }
    // Legacy format also supported: { status: "success", data: { ai_response: "..." } }
    let reply = null;
    let emotionObj = null;

    if (data.success === true && data.ai_response) {
      // ✅ Actual Django format
      reply = data.ai_response;
      emotionObj = data.emotion || null;
    } else if (data.status === 'success' && data.data && data.data.ai_response) {
      // Legacy nested format
      reply = data.data.ai_response;
      emotionObj = data.data.emotion || null;
    }

    if (reply) {
      history.push({ role: 'assistant', content: reply });

      // Update UI with detected emotion
      if (emotionObj && emotionObj.detected) {
        console.log(`Emotion detected: ${emotionObj.detected} (score: ${emotionObj.mood_score})`);
        const statusEl = $('keyStatus');
        if (statusEl) {
          statusEl.innerHTML = `Detected Emotion: <strong>${emotionObj.detected.toUpperCase()}</strong> (Mood: ${emotionObj.mood_score}/10)`;
          statusEl.className = 's-hint ok';
        }
      }
      return reply;
    } else {
      console.error('Unexpected response format:', data);
      return 'கொஞ்சம் தொந்தரவு. மறுபடியும் முயற்சிக்கவும். / Please try again in a moment.';
    }


  } catch (e) {
    console.error('Fetch error:', e);
    return 'Could not connect to Bhavi local server. Please start the Django server.';
  }
}

// ─────────────────────────────────────────────────
// 9.  CHAT BUBBLES
// ─────────────────────────────────────────────────

function getTime() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function appendMessage(role, text) {
  const area = $('messagesArea');
  if (!area) return;

  const row = document.createElement('div');
  row.className = `msg-row ${role}`;

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = role === 'ai' ? '🤍' : '👩';

  const inner = document.createElement('div');

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.textContent = text;

  const time = document.createElement('div');
  time.className = 'msg-time';
  time.textContent = getTime();

  inner.appendChild(bubble);
  inner.appendChild(time);
  row.appendChild(avatar);
  row.appendChild(inner);
  area.appendChild(row);
  area.scrollTop = area.scrollHeight;
}

function showThinking() {
  const area = $('messagesArea');
  if (!area) return;
  const row = document.createElement('div');
  row.id = 'thinkingRow';
  row.className = 'msg-row ai';
  const av = document.createElement('div');
  av.className = 'msg-avatar';
  av.textContent = '🤍';
  const dots = document.createElement('div');
  dots.className = 'thinking-dots';
  dots.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
  row.appendChild(av);
  row.appendChild(dots);
  area.appendChild(row);
  area.scrollTop = area.scrollHeight;
}

function hideThinking() { $('thinkingRow')?.remove(); }

// ─────────────────────────────────────────────────
// 10.  FULL CONVERSATION TURN
// ─────────────────────────────────────────────────

async function processTurn(userText) {
  if (!userText.trim()) return;

  const userLang = detectLang(userText);

  // Speak greeting if pending
  if (window._pendingGreeting) {
    const greet = window._pendingGreeting;
    window._pendingGreeting = null;
    await speak(greet, 'English');
  }

  // ① Show user bubble
  appendMessage('user', userText);
  const tb = $('transcriptBubble');
  const tt = $('transcriptText');
  if (tb) tb.classList.add('hidden');
  if (tt) tt.textContent = '';

  // ② Thinking visual state
  showThinking();
  setOrbState('thinking');

  // ③ Call local backend
  const reply = await callGroq(userText);
  hideThinking();

  // ④ Show AI response
  appendMessage('ai', reply);

  // ⑤ Speak response
  await speak(reply, userLang);

  // ⑥ Safety check
  const hopeless = [
    'give up', 'hopeless', 'no reason', 'want to die', 'nobody cares',
    'பொருளில்லை', 'தேவையில்லை', 'போய்விடுவேன்', 'யாரும் இல்லை',
    'बेकार है', 'मरना', 'कोई नहीं', 'अकेला', 'निराश'
  ];
  if (hopeless.some(w => userText.toLowerCase().includes(w))) {
    await new Promise(r => setTimeout(r, 1400));
    let safetyMsg = '';
    if (userLang === 'Tamil') {
      safetyMsg = '💜 மீனா அம்மாவை ஒரு முறை அழைத்துப் பேசுங்கள். அவர்கள் உங்களை மிகவும் நேசிக்கிறார்கள்.';
    } else if (userLang === 'Hindi') {
      safetyMsg = '💜 कृपया अपनी बेटी मीना को एक बार फ़ोन करें। वह आपसे बहुत प्यार करती है।';
    } else {
      safetyMsg = '💜 It might help to call Meena today. She loves you and would want to hear from you.';
    }
    appendMessage('ai', safetyMsg);
    await speak(safetyMsg, userLang);
  }

  setOrbState('idle');
  stopWave();
}

// ─────────────────────────────────────────────────
// 11.  PUSH-TO-TALK MIC
// ─────────────────────────────────────────────────

function toggleMic() {
  if (isRecording) {
    recognition?.stop();
  } else {
    startMic();
  }
}

function startMic() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    appendMessage('ai', 'Voice input is not supported in this browser. Please use Google Chrome. / Chrome பயன்படுத்தவும்.');
    toggleTextInput();
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  recognition.lang = RECOG_LANG;

  let finalText = '';

  recognition.onstart = () => {
    isRecording = true;
    finalText = '';
    const micBtn = $('micBtn');
    if (micBtn) {
      micBtn.classList.add('recording');
      micBtn.querySelector('.mic-on')?.classList.add('hidden');
      micBtn.querySelector('.mic-stop')?.classList.remove('hidden');
    }
    setOrbState('listening');
    startWave('rgba(239,68,68,0.8)');
    const tb = $('transcriptBubble');
    const tt = $('transcriptText');
    if (tb) tb.classList.remove('hidden');
    if (tt) tt.textContent = '…';
  };

  recognition.onresult = e => {
    let interim = '';
    finalText = '';
    for (let i = 0; i < e.results.length; i++) {
      if (e.results[i].isFinal) finalText += e.results[i][0].transcript;
      else interim += e.results[i][0].transcript;
    }
    const tt = $('transcriptText');
    if (tt) tt.textContent = `"${finalText || interim}"`;
  };

  recognition.onend = () => {
    stopMicUI();
    if (finalText.trim()) {
      processTurn(finalText.trim());
    } else {
      const tb = $('transcriptBubble');
      if (tb) tb.classList.add('hidden');
      setOrbState('idle');
      stopWave();
    }
  };

  recognition.onerror = e => {
    console.error('Speech recognition error:', e.error);
    stopMicUI();
    if (e.error === 'not-allowed') {
      appendMessage('ai', 'Microphone access denied. Please allow mic in browser settings.');
    } else if (e.error === 'language-not-supported') {
      appendMessage('ai', 'Voice recognition language is not supported on this device.');
    }
    setOrbState('idle');
    stopWave();
  };

  recognition.start();
}

function stopMicUI() {
  isRecording = false;
  const micBtn = $('micBtn');
  if (micBtn) {
    micBtn.classList.remove('recording');
    micBtn.querySelector('.mic-on')?.classList.remove('hidden');
    micBtn.querySelector('.mic-stop')?.classList.add('hidden');
  }
}

// ─────────────────────────────────────────────────
// 12.  RECOGNITION LANGUAGE TOGGLE (TA -> EN -> HI)
// ─────────────────────────────────────────────────

function toggleRecogLang() {
  LANG_IDX = (LANG_IDX + 1) % LANGS.length;
  RECOG_LANG = LANGS[LANG_IDX].code;
  localStorage.setItem('nanbhan_recognLang', RECOG_LANG);
  localStorage.setItem('bhavi_lang_idx', LANG_IDX.toString());
  updateLangToggleBtn();
  setOrbState('idle');
}

function updateLangToggleBtn() {
  const btn = $('langToggleBtn');
  if (!btn) return;
  const current = LANGS[LANG_IDX];
  btn.textContent = current.label;
  btn.title = `Voice input: ${current.title}. Click to switch language`;
}

// ─────────────────────────────────────────────────
// 13.  TEXT INPUT
// ─────────────────────────────────────────────────

function toggleTextInput() {
  const row = $('textInputRow');
  if (!row) return;
  row.classList.toggle('hidden');
  if (!row.classList.contains('hidden')) $('textInput')?.focus();
}

function handleTextKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendTextMessage();
  }
}

function sendTextMessage() {
  const input = $('textInput');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  input.style.height = 'auto';
  processTurn(text);
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

// ─────────────────────────────────────────────────
// 14.  SETTINGS PANEL
// ─────────────────────────────────────────────────

function toggleSettings() {
  $('settingsPanel')?.classList.toggle('hidden');
}

function saveKey() {
  // Dummy function for local companion compat
  const status = $('keyStatus');
  if (status) {
    status.textContent = '🔒 Local companion is active. Settings saved.';
    status.className = 's-hint ok';
  }
}

function saveAutoSpeak() {
  AUTO_SPEAK = $('autoSpeakToggle')?.checked ?? true;
  localStorage.setItem('nanbhan_speak', AUTO_SPEAK.toString());
  if (!AUTO_SPEAK) window.speechSynthesis?.cancel();
}

// ─────────────────────────────────────────────────
// 15.  PROFILE PHOTO UPLOAD
// ─────────────────────────────────────────────────

function triggerPhotoUpload() { $('photoFileInput')?.click(); }

function handlePhotoUpload(e) {
  const file = e.target?.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = evt => {
    const url = evt.target.result;
    const pic = $('profilePic');
    const init = $('profileInitials');
    if (pic) { pic.src = url; pic.classList.remove('hidden'); }
    if (init) { init.style.display = 'none'; }
    localStorage.setItem('nanbhan_photo', url);
  };
  reader.readAsDataURL(file);
}

// ─────────────────────────────────────────────────
// 16.  CLEAR CHAT
// ─────────────────────────────────────────────────

function clearConversation() {
  history = [];
  const area = $('messagesArea');
  if (area) area.innerHTML = '';
  window.speechSynthesis?.cancel();
  setOrbState('idle');
  stopWave();
  showGreeting();
}

// ─────────────────────────────────────────────────
// 17.  WELCOME GREETING
// ─────────────────────────────────────────────────

async function showGreeting() {
  const hour = new Date().getHours();
  const time = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  const greetings = [
    `Good ${time}, Lakshmi! 🌸 It's so lovely to see you. How are you feeling today?`,
    `Good ${time}! I'm so happy you're here. Would you like to talk about your day? 😊`,
    `Welcome back, Lakshmi! 💛 How has your ${time} been?`
  ];
  const msg = greetings[Math.floor(Math.random() * greetings.length)];

  appendMessage('ai', msg);
  window._pendingGreeting = msg;
}

// ─────────────────────────────────────────────────
// 18.  INIT
// ─────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const apiInput = $('apiKeyInput');
  const keyStatus = $('keyStatus');
  const toggleChk = $('autoSpeakToggle');

  // Hide or disable API key input since it's local
  if (apiInput) {
    apiInput.value = 'Local Offline Companion Active';
    apiInput.disabled = true;
  }
  if (toggleChk) toggleChk.checked = AUTO_SPEAK;

  if (keyStatus) {
    keyStatus.textContent = '🔒 Local Offline Companion Active';
    keyStatus.className = 's-hint ok';
  }

  // Profile photo
  const photo = localStorage.getItem('nanbhan_photo');
  if (photo) {
    const pic = $('profilePic');
    const init = $('profileInitials');
    if (pic) { pic.src = photo; pic.classList.remove('hidden'); }
    if (init) { init.style.display = 'none'; }
  }

  updateLangToggleBtn();
  setOrbState('idle');
  showGreeting();
});
