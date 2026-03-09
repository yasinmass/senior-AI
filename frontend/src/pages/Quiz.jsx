import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { t, getQuestions } from '../utils/i18n';
import { getFinalOutput, startReactionTimer, stopReactionTimer, getAverageReactionTime, resetReactionTimer } from '../utils/scoring';
import { apiFetch } from '../utils/api';
import LangSwitcher from '../components/LangSwitcher';

const MEMORY_WORDS = ['Apple', 'Car', 'Tree', 'Book', 'Pen'];

export default function Quiz() {
    const navigate = useNavigate();
    const [lang, setLang] = useState('en');

    // Phase: 'memory_instruction' | 'quiz' | 'saving' | 'done' | 'error'
    const [phase, setPhase] = useState('memory_instruction');
    const [questions, setQuestions] = useState([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [domainCounts, setDomainCounts] = useState({ orientation: 0, memory: 0, executive: 0 });
    const [errorMsg, setErrorMsg] = useState('');
    const [progress, setProgress] = useState(0);
    const [currentQ, setCurrentQ] = useState(null);

    useEffect(() => {
        resetReactionTimer();
        const qs = getQuestions();
        setQuestions(qs);
    }, []);

    function startQuiz() {
        setPhase('quiz');
        const qs = questions.length > 0 ? questions : getQuestions();
        if (qs.length === 0) return;
        setCurrentQ(qs[0]);
        setProgress(((0 + 1) / qs.length) * 100);
        startReactionTimer();
    }

    function handleAnswer(selectedAnswer) {
        stopReactionTimer();
        const q = currentQ;

        const newCounts = { ...domainCounts };
        if (selectedAnswer === q.a) {
            newCounts[q.domain] = (newCounts[q.domain] || 0) + 1;
        }
        setDomainCounts(newCounts);

        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);

        const qs = questions.length > 0 ? questions : getQuestions();
        if (nextStep >= qs.length) {
            finish(newCounts);
        } else {
            setCurrentQ(qs[nextStep]);
            setProgress(((nextStep + 1) / qs.length) * 100);
            startReactionTimer();
        }
    }

    async function finish(counts) {
        setPhase('saving');
        const avgRT = getAverageReactionTime();

        const finalScores = {
            orientation: counts.orientation * 2,
            memory: counts.memory * 2,
            executive: counts.executive * 2,
        };

        const finalResults = getFinalOutput(finalScores, avgRT);

        let voiceBiomarkers = {};
        try {
            const staged = localStorage.getItem('voice_biomarkers');
            if (staged) voiceBiomarkers = JSON.parse(staged);
        } catch { /* noop */ }

        let mlResult = {};
        try {
            const staged = localStorage.getItem('ml_result');
            if (staged) mlResult = JSON.parse(staged);
        } catch { /* noop */ }

        const payload = { ...finalResults, ...voiceBiomarkers, ...mlResult };

        try {
            const res = await apiFetch('/assessment/save/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (data.success) {
                localStorage.removeItem('voice_biomarkers');
                localStorage.removeItem('ml_result');
                setPhase('done');
            } else {
                throw new Error(data.error || 'Save failed');
            }
        } catch (err) {
            setErrorMsg(err.message);
            setPhase('error');
        }
    }

    const qs = questions;
    const domainLabel = currentQ
        ? `${currentQ.domain.charAt(0).toUpperCase() + currentQ.domain.slice(1)} Assessment`
        : '';

    return (
        <div className="bg-gray-50 text-gray-800 min-h-screen flex items-center justify-center p-6">
            <LangSwitcher onChange={setLang} />
            <div className="max-w-3xl w-full bg-white rounded-3xl shadow-xl overflow-hidden">
                {/* Progress bar */}
                <div className="w-full h-2 bg-gray-100">
                    <div
                        id="quiz-progress"
                        className="h-full bg-teal-500 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="p-8 md:p-12">
                    {/* Memory Instruction Phase */}
                    {phase === 'memory_instruction' && (
                        <div id="quiz-container" className="text-center fade-in">
                            <h2 className="text-2xl font-bold mb-6 tracking-tight">{t('quiz_memory_task')}</h2>
                            <p className="text-gray-600 text-lg mb-8">{t('quiz_memory_instruction')}</p>
                            <div className="grid grid-cols-3 gap-4 mb-10">
                                {MEMORY_WORDS.map(word => (
                                    <span key={word} className="px-6 py-5 bg-teal-50 text-teal-700 font-bold text-2xl rounded-2xl border border-teal-100">
                                        {word}
                                    </span>
                                ))}
                            </div>
                            <button
                                id="start-quiz-btn"
                                onClick={startQuiz}
                                className="px-12 py-5 bg-teal-500 text-white font-bold text-xl rounded-xl shadow-lg transition-all active:scale-95 hover:bg-teal-600"
                            >
                                {t('quiz_ready_btn')}
                            </button>
                        </div>
                    )}

                    {/* Quiz Phase */}
                    {phase === 'quiz' && currentQ && (
                        <div className="fade-in">
                            <div className="mb-4 text-xs font-bold text-teal-600 uppercase tracking-widest">
                                {domainLabel}
                            </div>
                            <h3 className="text-2xl font-bold mb-8">{currentQ.q}</h3>
                            <div className="grid gap-4">
                                {currentQ.opts.map(opt => (
                                    <button
                                        key={opt}
                                        className="option-btn p-5 border-2 rounded-2xl text-xl font-bold hover:bg-teal-50 transition-colors text-left"
                                        onClick={() => handleAnswer(opt)}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Saving Phase */}
                    {phase === 'saving' && (
                        <div className="text-center fade-in">
                            <h2 className="text-3xl font-bold mb-4">{t('quiz_saving')}</h2>
                            <p className="text-gray-600">{t('quiz_saving_sub')}</p>
                        </div>
                    )}

                    {/* Done Phase */}
                    {phase === 'done' && (
                        <div className="text-center fade-in">
                            <h2 className="text-3xl font-bold mb-4">{t('quiz_done_title')}</h2>
                            <p className="text-gray-600 mb-8">{t('quiz_done_sub')}</p>
                            <button
                                onClick={() => navigate('/result')}
                                className="px-12 py-5 bg-teal-500 text-white font-bold rounded-2xl shadow-xl hover:bg-teal-600 transition-all"
                            >
                                {t('quiz_view_report')}
                            </button>
                        </div>
                    )}

                    {/* Error Phase */}
                    {phase === 'error' && (
                        <div className="text-center fade-in">
                            <h2 className="text-3xl font-bold mb-4 text-red-500">Save Error</h2>
                            <p className="text-gray-600 mb-4">Could not save to database. Make sure the Django server is running.</p>
                            <p className="text-sm text-red-400">{errorMsg}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
