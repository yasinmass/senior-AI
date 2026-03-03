import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from '../utils/i18n';
import { blobToWavBlob } from '../utils/audioUtils';
import { apiFetch } from '../utils/api';
import LangSwitcher from '../components/LangSwitcher';

const MAX_DURATION = 60;
const MIN_DURATION = 10;
const CIRCUMFERENCE = 2 * Math.PI * 88;

export default function Audio() {
    const navigate = useNavigate();
    const [lang, setLang] = useState('en');

    // Warning notice state
    const [showNotice, setShowNotice] = useState(true);
    const [noticeLeaving, setNoticeLeaving] = useState(false);
    const [showTest, setShowTest] = useState(false);
    const [testVisible, setTestVisible] = useState(false);

    // Recording state
    const [isRecording, setIsRecording] = useState(false);
    const [secondsElapsed, setSecondsElapsed] = useState(0);
    const [statusText, setStatusText] = useState('');
    const [statusClass, setStatusClass] = useState('text-teal-600 font-semibold mb-8 h-6');
    const [nextEnabled, setNextEnabled] = useState(false);

    // Refs for recording logic
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const silenceStartRef = useRef(0);
    const totalSilenceRef = useRef(0);
    const recognitionRef = useRef(null);
    const transcriptRef = useRef('');
    const wordCountRef = useRef(0);
    const secondsRef = useRef(0);
    const isRecordingRef = useRef(false);

    useEffect(() => {
        setStatusText(t('audio_ready'));
    }, [lang]);

    function dismissWarning() {
        setNoticeLeaving(true);
        setTimeout(() => {
            setShowNotice(false);
            setShowTest(true);
            setTimeout(() => setTestVisible(true), 10);
        }, 400);
    }

    function updateTimer() {
        secondsRef.current++;
        setSecondsElapsed(secondsRef.current);
        if (secondsRef.current >= MAX_DURATION) {
            stopRecording();
        }
    }

    async function startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Web Speech API for word counting
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.onresult = (event) => {
                    let currentTranscript = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        currentTranscript += event.results[i][0].transcript;
                    }
                    transcriptRef.current = currentTranscript;
                    wordCountRef.current = currentTranscript.trim().split(/\s+/).filter(w => w.length > 0).length;
                };
                recognition.start();
                recognitionRef.current = recognition;
            }

            // AudioContext for silence detection
            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 512;
            source.connect(analyser);
            audioContextRef.current = audioContext;
            analyserRef.current = analyser;

            const dataArr = new Uint8Array(analyser.frequencyBinCount);
            const checkSilence = () => {
                if (!isRecordingRef.current) return;
                analyser.getByteFrequencyData(dataArr);
                const volume = dataArr.reduce((a, b) => a + b) / dataArr.length;
                if (volume < 3) {
                    if (!silenceStartRef.current) silenceStartRef.current = Date.now();
                } else {
                    if (silenceStartRef.current) {
                        const pauseDuration = (Date.now() - silenceStartRef.current) / 1000;
                        if (pauseDuration > 0.5) totalSilenceRef.current += pauseDuration;
                        silenceStartRef.current = 0;
                    }
                }
                requestAnimationFrame(checkSilence);
            };

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);

            mediaRecorder.onstop = async () => {
                const duration = secondsRef.current;
                const finalWordCount = wordCountRef.current;
                const speechRate = duration > 0 ? (finalWordCount / (duration / 60)).toFixed(2) : 0;

                sessionStorage.setItem('voice_biomarkers', JSON.stringify({
                    pause_duration: parseFloat(totalSilenceRef.current.toFixed(2)),
                    word_count: finalWordCount,
                    speech_rate: parseFloat(speechRate),
                    recording_duration: duration,
                }));

                if (duration >= MIN_DURATION) {
                    setStatusText('Analyzing voice biomarkers with AI model...');
                    setStatusClass('text-teal-600 font-semibold mb-8 h-6');
                    try {
                        const rawBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
                        const wavBlob = await blobToWavBlob(rawBlob);
                        const formData = new FormData();
                        formData.append('audio', wavBlob, 'recording.wav');
                        const res = await apiFetch('/audio/analyze/', {
                            method: 'POST',
                            body: formData,
                        });
                        const mlResult = await res.json();
                        if (mlResult.success) {
                            sessionStorage.setItem('ml_result', JSON.stringify({
                                ml_prediction: mlResult.ml_prediction,
                                ml_dementia_probability: mlResult.ml_dementia_probability,
                                ml_normal_probability: mlResult.ml_normal_probability,
                            }));
                            setStatusClass(mlResult.ml_prediction === 'dementia'
                                ? 'text-orange-500 font-semibold mb-8 h-8 text-sm'
                                : 'text-teal-600 font-semibold mb-8 h-8 text-sm');
                        } else {
                            setStatusText('Recording saved. Voice AI analysis unavailable.');
                        }
                    } catch {
                        setStatusText('Recording saved. Proceeding to quiz.');
                    }
                    setNextEnabled(true);
                } else {
                    setStatusText('Recording too short. Please record at least 10 seconds.');
                    setStatusClass('text-red-500 font-semibold mb-8 h-6');
                }
                setIsRecording(false);
                isRecordingRef.current = false;
            };

            // Reset
            audioChunksRef.current = [];
            totalSilenceRef.current = 0;
            silenceStartRef.current = 0;
            transcriptRef.current = '';
            wordCountRef.current = 0;
            secondsRef.current = 0;
            setSecondsElapsed(0);

            mediaRecorder.start();
            mediaRecorderRef.current = mediaRecorder;
            isRecordingRef.current = true;
            setIsRecording(true);
            timerRef.current = setInterval(updateTimer, 1000);
            checkSilence();

            setStatusText('Recording... speak about your day');

        } catch (err) {
            console.error('Mic access error:', err);
            setStatusText('Microphone denied or not found.');
            setStatusClass('text-red-500 font-semibold mb-8 h-6');
        }
    }

    function stopRecording() {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
        }
        if (recognitionRef.current) recognitionRef.current.stop();
        if (audioContextRef.current) audioContextRef.current.close();
        clearInterval(timerRef.current);
        isRecordingRef.current = false;
        setIsRecording(false);
    }

    function handleRecordBtn() {
        if (isRecording) stopRecording();
        else startRecording();
    }

    const minutes = Math.floor(secondsElapsed / 60);
    const seconds = secondsElapsed % 60;
    const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    const strokeOffset = CIRCUMFERENCE - (secondsElapsed / MAX_DURATION * CIRCUMFERENCE);

    return (
        <div className="bg-gray-50 text-gray-800 min-h-screen flex flex-col items-center justify-center p-6 gap-6">
            <LangSwitcher onChange={setLang} />

            {/* Warning Notice */}
            {showNotice && (
                <div
                    className={`max-w-2xl w-full bg-amber-50 border-2 border-amber-300 rounded-3xl p-7 shadow-lg ${noticeLeaving ? 'fade-out' : 'slide-down'}`}
                >
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-11 h-11 bg-amber-400 rounded-xl flex items-center justify-center shadow">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h2 className="text-amber-800 font-extrabold text-base mb-3 tracking-tight">
                                {t('audio_notice_title')}
                            </h2>
                            <p className="text-amber-900 text-sm leading-7">
                                <span>{t('audio_notice_line1')}</span><br />
                                <span>{t('audio_notice_line2')}</span><br />
                                <span>{t('audio_notice_line3')}</span>
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 mt-5">
                                <button
                                    onClick={dismissWarning}
                                    className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all active:scale-95 text-sm shadow"
                                >
                                    {t('audio_notice_proceed')}
                                </button>
                                <button
                                    onClick={() => navigate('/')}
                                    className="flex-1 py-3 bg-white hover:bg-amber-50 text-amber-700 border-2 border-amber-300 font-bold rounded-xl transition-all text-sm"
                                >
                                    {t('audio_notice_back')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Voice Test Card */}
            {showTest && (
                <div
                    className="max-w-2xl w-full bg-white rounded-3xl shadow-xl p-8 md:p-12 text-center"
                    style={{
                        opacity: testVisible ? 1 : 0,
                        transform: testVisible ? 'translateY(0)' : 'translateY(20px)',
                        transition: 'opacity 0.5s ease, transform 0.5s ease',
                    }}
                >
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('audio_title')}</h1>
                    <p className="text-gray-600 mb-8">{t('audio_subtitle')}</p>

                    {/* Circular progress */}
                    <div className="relative flex items-center justify-center mb-10">
                        <svg className="w-48 h-48 transform -rotate-90">
                            <circle cx="96" cy="96" r="88" stroke="#f3f4f6" strokeWidth="8" fill="transparent" />
                            <circle
                                cx="96" cy="96" r="88" stroke="#14b8a6" strokeWidth="8" fill="transparent"
                                strokeDasharray={CIRCUMFERENCE}
                                strokeDashoffset={strokeOffset}
                                strokeLinecap="round"
                                style={{ transition: 'stroke-dashoffset 1s linear' }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div
                                id="mic-container"
                                onClick={handleRecordBtn}
                                className={`w-20 h-20 bg-teal-500 rounded-full flex items-center justify-center mb-2 shadow-lg shadow-teal-100 cursor-pointer ${isRecording ? 'pulse-animation' : ''}`}
                            >
                                {!isRecording ? (
                                    <svg id="mic-icon" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    </svg>
                                ) : (
                                    <svg id="stop-icon" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
                                    </svg>
                                )}
                            </div>
                            <div id="elapsed-time" className="text-2xl font-bold">{timeStr}</div>
                        </div>
                    </div>

                    <div id="status-text" className={statusClass}>{statusText || t('audio_ready')}</div>

                    <div className="flex flex-col gap-4">
                        <button
                            id="record-btn"
                            onClick={handleRecordBtn}
                            className="w-full py-4 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95"
                        >
                            {isRecording ? t('audio_stop_btn') : t('audio_start_btn')}
                        </button>
                        <button
                            id="next-btn"
                            disabled={!nextEnabled}
                            onClick={() => navigate('/quiz')}
                            className={`w-full py-4 font-bold rounded-xl transition-all ${nextEnabled
                                ? 'bg-teal-500 hover:bg-teal-600 text-white cursor-pointer active:scale-95'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            {t('audio_next_btn')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
