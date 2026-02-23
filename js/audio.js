// js/audio.js — Voice biomarker recording + ML analysis

const API_BASE = 'http://127.0.0.1:8000/api';

let mediaRecorder; let audioChunks = []; let timerInterval;
let audioContext; let analyser; let silenceStart = 0; let totalSilence = 0;
let recognition; let transcript = ""; let wordCount = 0;
const maxDuration = 60; const minDuration = 10;
const recordBtn = document.getElementById('record-btn');
const nextBtn = document.getElementById('next-btn');
const elapsedTimeDisplay = document.getElementById('elapsed-time');
const progressRing = document.getElementById('progress-ring');
const micContainer = document.getElementById('mic-container');
const micIcon = document.getElementById('mic-icon');
const stopIcon = document.getElementById('stop-icon');
const statusText = document.getElementById('status-text');
const circumference = 2 * Math.PI * 88;
let isRecording = false; let secondsElapsed = 0;

// ─── WAV Encoder (client-side conversion from AudioBuffer) ──────────────────

function audioBufferToWav(buffer) {
    const numChannels = 1; // mono
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    const samples = buffer.getChannelData(0);
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = samples.length * bytesPerSample;
    const bufferOut = new ArrayBuffer(44 + dataSize);
    const view = new DataView(bufferOut);

    function writeString(offset, str) {
        for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    }

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, samples[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return bufferOut;
}

async function blobToWavBlob(blob) {
    const arrayBuffer = await blob.arrayBuffer();
    const ctx = new AudioContext();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    const wavBuffer = audioBufferToWav(audioBuffer);
    await ctx.close();
    return new Blob([wavBuffer], { type: 'audio/wav' });
}

// ─── Timer & Ring ────────────────────────────────────────────────────────────

function updateTimer() {
    secondsElapsed++;
    const minutes = Math.floor(secondsElapsed / 60);
    const seconds = secondsElapsed % 60;
    elapsedTimeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    progressRing.style.strokeDashoffset = circumference - (secondsElapsed / maxDuration * circumference);
    if (secondsElapsed >= maxDuration) stopRecording();
}

// ─── Recording ───────────────────────────────────────────────────────────────

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // Web Speech API for word counting
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.onresult = (event) => {
                let currentTranscript = "";
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    currentTranscript += event.results[i][0].transcript;
                }
                transcript = currentTranscript;
                wordCount = transcript.trim().split(/\s+/).filter(w => w.length > 0).length;
            };
            recognition.start();
        }

        // AudioContext for silence/pause detection
        audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);

        const dataArr = new Uint8Array(analyser.frequencyBinCount);
        const checkSilence = () => {
            if (!isRecording) return;
            analyser.getByteFrequencyData(dataArr);
            const volume = dataArr.reduce((a, b) => a + b) / dataArr.length;
            if (volume < 3) {
                if (!silenceStart) silenceStart = Date.now();
            } else {
                if (silenceStart) {
                    const pauseDuration = (Date.now() - silenceStart) / 1000;
                    if (pauseDuration > 0.5) totalSilence += pauseDuration;
                    silenceStart = 0;
                }
            }
            requestAnimationFrame(checkSilence);
        };

        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);

        mediaRecorder.onstop = async () => {
            const duration = secondsElapsed;
            const finalWordCount = wordCount;
            const speechRate = duration > 0 ? (finalWordCount / (duration / 60)).toFixed(2) : 0;

            // Stage voice biomarkers
            sessionStorage.setItem('voice_biomarkers', JSON.stringify({
                pause_duration: parseFloat(totalSilence.toFixed(2)),
                word_count: finalWordCount,
                speech_rate: parseFloat(speechRate),
                recording_duration: duration,
            }));

            micContainer.classList.remove('pulse-animation');
            micIcon.classList.remove('hidden');
            stopIcon.classList.add('hidden');

            if (duration >= minDuration) {
                // ── Send audio to Django for ML MFCC analysis ──
                statusText.textContent = 'Analyzing voice biomarkers with AI model...';
                statusText.className = 'text-teal-600 font-semibold mb-8 h-6';

                try {
                    const rawBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
                    const wavBlob = await blobToWavBlob(rawBlob);

                    const formData = new FormData();
                    formData.append('audio', wavBlob, 'recording.wav');

                    const res = await fetch(`${API_BASE}/audio/analyze/`, {
                        method: 'POST',
                        credentials: 'include',
                        body: formData
                    });
                    const mlResult = await res.json();

                    if (mlResult.success) {
                        sessionStorage.setItem('ml_result', JSON.stringify({
                            ml_prediction: mlResult.ml_prediction,
                            ml_dementia_probability: mlResult.ml_dementia_probability,
                            ml_normal_probability: mlResult.ml_normal_probability,
                        }));
                        //statusText.textContent = `AI Analysis: ${mlResult.ml_prediction === 'dementia' ? '⚠ Cognitive markers detected' : '✔ Voice patterns normal'} (confidence: ${Math.round(Math.max(mlResult.ml_dementia_probability, mlResult.ml_normal_probability))}%)`;
                        statusText.className = mlResult.ml_prediction === 'dementia'
                            ? 'text-orange-500 font-semibold mb-8 h-8 text-sm'
                            : 'text-teal-600 font-semibold mb-8 h-8 text-sm';
                    } else {
                        statusText.textContent = 'Recording saved. Voice AI analysis unavailable.';
                    }
                } catch (err) {
                    console.warn('ML analysis failed:', err);
                    statusText.textContent = 'Recording saved. Proceeding to quiz.';
                }

                // Enable next button
                nextBtn.disabled = false;
                nextBtn.classList.replace('bg-gray-100', 'bg-teal-500');
                nextBtn.classList.replace('text-gray-400', 'text-white');
                nextBtn.classList.remove('cursor-not-allowed');
            } else {
                statusText.textContent = 'Recording too short. Please record at least 10 seconds.';
                statusText.className = 'text-red-500 font-semibold mb-8 h-6';
            }

            recordBtn.textContent = 'Start Recording';
        };

        audioChunks = []; totalSilence = 0; silenceStart = 0; transcript = ""; wordCount = 0;
        mediaRecorder.start(); isRecording = true; secondsElapsed = 0;
        timerInterval = setInterval(updateTimer, 1000);
        checkSilence();

        recordBtn.textContent = 'Stop Recording';
        statusText.textContent = 'Recording... speak about your day';
        micContainer.classList.add('pulse-animation');
        micIcon.classList.add('hidden');
        stopIcon.classList.remove('hidden');

    } catch (err) {
        console.error("Mic access error:", err);
        if (statusText) {
            statusText.textContent = 'Microphone denied or not found.';
            statusText.classList.add('text-red-500');
        }
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(t => t.stop());
    }
    if (recognition) recognition.stop();
    if (audioContext) audioContext.close();
    clearInterval(timerInterval);
    isRecording = false;
}

recordBtn.addEventListener('click', () => isRecording ? stopRecording() : startRecording());
nextBtn.addEventListener('click', () => window.location.href = '/quiz.html');
