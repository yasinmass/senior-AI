/* ═══════════════════════════════════════════════════
   உங்கள் நண்பன் · Live
   app.js  |  Tamil & English only  |  Groq llama-3.3-70b
═══════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────
// 1.  USER FILES  (text_1 & text_2)
// ─────────────────────────────────────────────────

const FILE_PROFILE = `
Name: Lakshmi
Age: 72
Location: Chennai, India
Occupation: Retired School Teacher (25 years)
Languages: Tamil, English
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

// ─────────────────────────────────────────────────
// 2.  SYSTEM PROMPT  (Tamil & English ONLY)
// ─────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are "உங்கள் நண்பன்" — a warm, compassionate AI companion for an elderly woman named Lakshmi.

=== PERSONAL FILE ===
${FILE_PROFILE}

=== DIARY / MEMORIES ===
${FILE_DIARY}

══════════════════════════════════════
⚠️  LANGUAGE RULE — READ CAREFULLY  ⚠️
══════════════════════════════════════
Only TWO languages are supported: TAMIL and ENGLISH.

RULE 1: If the user's message contains Tamil script characters (Unicode range 0B80–0BFF, e.g. க, ம, ன, ப, இ, அ, etc.) → reply ENTIRELY in Tamil script.
  - Every single word must be Tamil script.
  - Do NOT include any English words in your response.
  - Example input: "நான் சோர்வாக இருக்கேன்"
  - Example output: "அது கேட்கவே கஷ்டமாக இருக்கிறது. என்ன நடந்தது என்று சொல்ல முடியுமா?"

RULE 2: If the user's message is in English (Latin alphabet, e.g. "I feel lonely", "How are you") → reply ENTIRELY in English.
  - Every single word must be English.
  - Do NOT include any Tamil script or Tamil romanized words.
  - Example input: "I feel so lonely today"
  - Example output: "I'm really sorry to hear that. What happened today that made you feel this way?"

RULE 3: There is no third option. No mixing. No Tanglish.
  - If user writes in Latin letters → that is English → reply in English.
  - If user writes in Tamil script → reply in Tamil script.
  - This rule overrides EVERYTHING else.
══════════════════════════════════════

=== EMOTIONAL SUPPORT RULES ===
1. Acknowledge feelings BEFORE any advice or suggestions.
2. Speak like a caring grandchild — warm, patient, never rushed.
3. When she is sad/lonely → gently reference ONE positive memory from her diary (naturally, not verbatim).
4. NEVER make her feel old, helpless, or a burden.
   - If she doubts herself → remind her: Best Teacher Award 2005, 25 years teaching, lives she shaped.
5. REPLY LENGTH:
   - Write 3-5 complete sentences.
   - ALWAYS finish your last sentence fully. Never end mid-word or mid-sentence.
   - End every reply with one gentle question.
6. If she sounds deeply hopeless → gently suggest calling Meena or Ravi.
7. You are NOT a therapist. You are her warm, caring friend.`;

// ─────────────────────────────────────────────────
// 3.  STATE & SETTINGS
// ─────────────────────────────────────────────────

let GROQ_API_KEY = localStorage.getItem('nanbhan_key') || '';
let AUTO_SPEAK = localStorage.getItem('nanbhan_speak') !== 'false';

// Recognition language: 'ta-IN' for Tamil, 'en-IN' for English
// User toggles this with the TA/EN button on the dock
let RECOG_LANG = localStorage.getItem('nanbhan_recognLang') || 'ta-IN';

let history = [];
let isRecording = false;
let isSpeaking = false;
let recognition = null;
let waveTimer = null;
let wavePhase = 0;

// ─────────────────────────────────────────────────
// 4.  DOM HELPERS
// ─────────────────────────────────────────────────

const $ = id => document.getElementById(id);

// ─────────────────────────────────────────────────
// 5.  LANGUAGE DETECTION  (Tamil or English ONLY)
// ─────────────────────────────────────────────────

function detectLang(text) {
  // If ANY Tamil Unicode character is present → Tamil
  if (/[\u0B80-\u0BFF]/.test(text)) return 'Tamil';
  // Everything else → English
  return 'English';
}

// ─────────────────────────────────────────────────
// 6.  TEXT-TO-SPEECH  (gTTS via local server.py)
//
//  speak(text, lang) calls POST /tts on our Python server.
//  The server uses Google TTS (gTTS) → returns an MP3.
//  We play it with an HTML Audio element.
//  This works on ALL OS (Windows/Mac/Linux) with NO voice pack needed.
//
//  Tamil  → lang='ta'  → perfect Tamil pronunciation
//  English → lang='en' → natural English voice
//
//  Fallback: if server unreachable → Web Speech API
// ─────────────────────────────────────────────────

let _currentAudio = null; // track active Audio element

function speak(text, lang) {
  if (!AUTO_SPEAK) return Promise.resolve();
  if (!text || !text.trim()) return Promise.resolve();

  // Map our lang names to gTTS lang codes
  const gttsLang = (lang === 'Tamil') ? 'ta' : 'en';

  // Show orb animation immediately
  isSpeaking = true;
  setOrbState('speaking');
  startWave('rgba(52,211,153,0.8)');

  return new Promise(resolve => {
    // Build the /tts URL
    const url = `/tts?lang=${gttsLang}&text=${encodeURIComponent(text)}`;

    // Stop any currently playing audio
    if (_currentAudio) {
      _currentAudio.pause();
      _currentAudio = null;
    }

    const audio = new Audio(url);
    _currentAudio = audio;

    audio.oncanplaythrough = () => {
      audio.play().catch(err => {
        console.warn('Audio play() blocked:', err);
        // If autoplay blocked, still resolve so conversation continues
        _done();
      });
    };

    audio.onended = () => _done();

    audio.onerror = (e) => {
      console.warn('gTTS audio error — falling back to Web Speech API', e);
      _done();
      // Fallback: Web Speech API
      speakWebSpeech(text, lang); // fire-and-forget fallback
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

// Web Speech API fallback (used if server.py is not running)
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
// 7.  ORB STATE
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
  const hints = {
    idle: `🎙️ Mic தொடுங்கள் · Currently: ${RECOG_LANG === 'ta-IN' ? '🇮🇳 Tamil' : '🇬🇧 English'}`,
    listening: '⏹ நிறுத்த மீண்டும் Mic தொடுங்கள்',
    thinking: '💭 யோசிக்கிறேன்…',
    speaking: '🔊 பேசுகிறேன்…'
  };
  orbIcon.textContent = icons[state] || '🤍';
  orbLabel.textContent = labels[state] || '';
  dockHint.textContent = hints[state] || '';
  liveLabel.textContent = state === 'idle' ? 'Live' : (labels[state] || 'Live').replace('…', '');
}

// ─────────────────────────────────────────────────
// 8.  WAVE ANIMATION
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

function stopWave() {
  clearInterval(waveTimer);
  const waveWrap = $('waveWrap');
  const wavePath = $('wavePath');
  if (!waveWrap || !wavePath) return;
  waveWrap.classList.remove('active');
  wavePath.setAttribute('d', 'M0,40 Q75,40 150,40 Q225,40 300,40');
}

// ─────────────────────────────────────────────────
// 9.  GROQ API CALL
// ─────────────────────────────────────────────────

async function callGroq(userMessage) {
  if (!GROQ_API_KEY) {
    return 'API key இல்லை. Settings-ல் Groq API key சேர்க்கவும். / Please add your Groq API key in Settings.';
  }

  history.push({ role: 'user', content: userMessage });
  if (history.length > 20) history = history.slice(-20);

  const payload = {
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history
    ],
    temperature: 0.78,
    max_tokens: 600,   // Increased: Tamil sentences need more tokens to complete fully
    stream: false
  };

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('Groq error:', err);
      if (res.status === 401) return 'API key தவறானது. / API key is invalid. Please check Settings.';
      return 'கொஞ்சம் தொந்தரவு. / Having trouble connecting. Please try again.';
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || 'I am here for you. Please tell me more.';
    history.push({ role: 'assistant', content: reply });
    return reply;

  } catch (e) {
    console.error('Fetch error:', e);
    return 'Internet connection issue. Please try again. / இணைப்பில் சிக்கல்.';
  }
}

// ─────────────────────────────────────────────────
// 10.  CHAT BUBBLES
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
// 11.  FULL CONVERSATION TURN
//      TEXT → shows bubble ALWAYS
//      VOICE → speaks reply ALWAYS
// ─────────────────────────────────────────────────

async function processTurn(userText) {
  if (!userText.trim()) return;

  // Detect language from user input
  const userLang = detectLang(userText);

  // ── Speak the greeting on first interaction (browser now allows audio) ──
  if (window._pendingGreeting) {
    const greet = window._pendingGreeting;
    window._pendingGreeting = null;
    await speak(greet, 'English');
  }

  // ① Show user TEXT bubble
  appendMessage('user', userText);
  const tb = $('transcriptBubble');
  const tt = $('transcriptText');
  if (tb) tb.classList.add('hidden');
  if (tt) tt.textContent = '';

  // ② Thinking state
  showThinking();
  setOrbState('thinking');

  // ③ Call Groq
  const reply = await callGroq(userText);
  hideThinking();

  // ④ Show AI reply as TEXT bubble ← ALWAYS
  appendMessage('ai', reply);

  // ⑤ Speak AI reply as VOICE ← ALWAYS (in same language as user)
  await speak(reply, userLang);

  // ⑥ Safety: if hopeless words detected → add a second gentle message (TEXT + VOICE)
  const hopeless = [
    'give up', 'hopeless', 'no reason', 'want to die', 'nobody cares',
    'பொருளில்லை', 'தேவையில்லை', 'போய்விடுவேன்', 'யாரும் இல்லை'
  ];
  if (hopeless.some(w => userText.toLowerCase().includes(w))) {
    await new Promise(r => setTimeout(r, 1400));
    const safetyMsg = userLang === 'Tamil'
      ? '💜 மீனா அம்மாவை ஒரு முறை அழைத்துப் பேசுங்கள். அவர்கள் உங்களை மிகவும் நேசிக்கிறார்கள்.'
      : '💜 It might help to call Meena today. She loves you and would want to hear from you.';
    appendMessage('ai', safetyMsg);
    await speak(safetyMsg, userLang);
  }

  setOrbState('idle');
  stopWave();
}

// ─────────────────────────────────────────────────
// 12.  PUSH-TO-TALK MIC
//      Click mic → recording starts (visualizer active)
//      Click again → stop → Groq processes → AI speaks
// ─────────────────────────────────────────────────

function toggleMic() {
  if (isRecording) {
    recognition?.stop(); // triggers onend → processTurn
  } else {
    startMic();
  }
}

function startMic() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    appendMessage('ai', 'Voice input is not supported in this browser. Please use Google Chrome. / இந்த browser-ல் voice ஆதரிக்கவில்லை. Chrome பயன்படுத்துங்கள்.');
    toggleTextInput();
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = true;   // keeps recording until user clicks Stop
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  // Language is controlled by the TA/EN toggle button on the dock
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
      appendMessage('ai', 'Microphone access denied. Please allow mic in browser settings. / Mic அனுமதி தேவை. Browser settings-ல் allow பண்ணுங்கள்.');
    } else if (e.error === 'language-not-supported') {
      appendMessage('ai', 'This language is not supported for voice input on your device. Please use the keyboard instead.');
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
// 13.  RECOGNITION LANGUAGE TOGGLE (TA ↔ EN)
//      Shown as a button in the dock
// ─────────────────────────────────────────────────

function toggleRecogLang() {
  RECOG_LANG = RECOG_LANG === 'ta-IN' ? 'en-IN' : 'ta-IN';
  localStorage.setItem('nanbhan_recognLang', RECOG_LANG);
  updateLangToggleBtn();
  setOrbState('idle'); // refresh hint text
}

function updateLangToggleBtn() {
  const btn = $('langToggleBtn');
  if (!btn) return;
  if (RECOG_LANG === 'ta-IN') {
    btn.textContent = '🇮🇳 TA';
    btn.title = 'Voice input: Tamil. Click to switch to English';
  } else {
    btn.textContent = '🇬🇧 EN';
    btn.title = 'Voice input: English. Click to switch to Tamil';
  }
}

// ─────────────────────────────────────────────────
// 14.  TEXT INPUT
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
// 15.  SETTINGS PANEL
// ─────────────────────────────────────────────────

function toggleSettings() {
  $('settingsPanel')?.classList.toggle('hidden');
}

function saveKey() {
  const val = $('apiKeyInput')?.value.trim();
  const status = $('keyStatus');
  if (!val) {
    if (status) { status.textContent = '⚠️ Please enter an API key.'; status.className = 's-hint err'; }
    return;
  }
  if (!val.startsWith('gsk_')) {
    if (status) { status.textContent = '⚠️ Groq keys start with gsk_'; status.className = 's-hint err'; }
    return;
  }
  GROQ_API_KEY = val;
  localStorage.setItem('nanbhan_key', val);
  if (status) { status.textContent = '✅ Key saved! Ready.'; status.className = 's-hint ok'; }
}

function saveAutoSpeak() {
  AUTO_SPEAK = $('autoSpeakToggle')?.checked ?? true;
  localStorage.setItem('nanbhan_speak', AUTO_SPEAK.toString());
  if (!AUTO_SPEAK) window.speechSynthesis?.cancel();
}

// ─────────────────────────────────────────────────
// 16.  PROFILE PHOTO UPLOAD
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
// 17.  CLEAR CHAT
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
// 18.  WELCOME GREETING
//      English greeting (since both Tamil & English supported)
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

  // ✅ Always show as TEXT bubble
  appendMessage('ai', msg);

  // ⚠️ Do NOT auto-speak on page load — browsers block audio without a user gesture.
  // Voice will work for all AI replies AFTER the user clicks mic or sends a message.
  // Store greeting so we can speak it on first interaction.
  window._pendingGreeting = msg;
}

// ─────────────────────────────────────────────────
// 19.  INIT
// ─────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // ── Settings UI ──
  const apiInput = $('apiKeyInput');
  const keyStatus = $('keyStatus');
  const toggleChk = $('autoSpeakToggle');

  if (apiInput) apiInput.value = GROQ_API_KEY;
  if (toggleChk) toggleChk.checked = AUTO_SPEAK;

  if (GROQ_API_KEY && keyStatus) {
    keyStatus.textContent = '✅ API key loaded. Ready!';
    keyStatus.className = 's-hint ok';
  }

  // ── Profile photo ──
  const photo = localStorage.getItem('nanbhan_photo');
  if (photo) {
    const pic = $('profilePic');
    const init = $('profileInitials');
    if (pic) { pic.src = photo; pic.classList.remove('hidden'); }
    if (init) { init.style.display = 'none'; }
  }

  // ── Pre-load TTS voices ──
  if ('speechSynthesis' in window) {
    const load = () => window.speechSynthesis.getVoices();
    load();
    window.speechSynthesis.onvoiceschanged = load;
  }

  // ── Language toggle button ──
  updateLangToggleBtn();
  setOrbState('idle');

  // ── Show welcome message ──
  showGreeting();
});
