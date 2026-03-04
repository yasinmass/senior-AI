import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { t } from '../utils/i18n';
import LangSwitcher from '../components/LangSwitcher';

export default function Result() {
    const navigate = useNavigate();
    const [lang, setLang] = useState('en');
    const [assessment, setAssessment] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        loadResults();
    }, []);

    async function loadResults() {
        try {
            const res = await apiFetch('/assessment/latest/');
            if (!res.ok) {
                setError('No assessment data found. Please complete the voice test and quiz first.');
                return;
            }
            const data = await res.json();
            setAssessment(data.assessment);
        } catch {
            setError('Connection error. Make sure Django server is running at http://127.0.0.1:8000');
        }
    }

    // ── ML Diagnosis rendering ──
    function renderMLDiagnosis() {
        if (!assessment) return null;
        const { ml_prediction } = assessment;

        if (ml_prediction === 'dementia') {
            return (
                <div className="bg-red-50 rounded-3xl shadow-xl p-8 mb-6 text-center border-2 border-red-200 transition-all duration-700">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">{t('result_ml_label')}</p>
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-500 text-white text-3xl font-bold">⚠</div>
                    <h2 className="text-3xl font-extrabold mb-2 uppercase tracking-wider text-red-600">{t('result_ml_dementia')}</h2>
                    <p className="text-gray-500 text-sm mb-4">{t('result_ml_dementia_sub')}</p>
                </div>
            );
        } else if (ml_prediction === 'normal') {
            return (
                <div className="bg-teal-50 rounded-3xl shadow-xl p-8 mb-6 text-center border-2 border-teal-200 transition-all duration-700">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">{t('result_ml_label')}</p>
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 bg-teal-500 text-white text-3xl font-bold">✔</div>
                    <h2 className="text-3xl font-extrabold mb-2 uppercase tracking-wider text-teal-700">{t('result_ml_normal')}</h2>
                    <p className="text-gray-500 text-sm mb-4">{t('result_ml_normal_sub')}</p>
                </div>
            );
        } else {
            return (
                <div className="bg-white rounded-3xl shadow-xl p-8 mb-6 text-center border-2 border-gray-100 transition-all duration-700">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">{t('result_ml_label')}</p>
                    <div id="ml-icon" className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-3xl font-bold bg-gray-300">—</div>
                    <h2 className="text-3xl font-extrabold mb-2 uppercase tracking-wider text-gray-400">{t('result_ml_skipped')}</h2>
                    <p className="text-gray-500 text-sm mb-4">{t('result_ml_skipped_sub')}</p>
                </div>
            );
        }
    }

    // ── Final Verdict rendering ──
    function renderFinalVerdict() {
        if (!assessment) return null;
        const { final_risk_level, total_score, ml_prediction, ml_dementia_probability } = assessment;

        const mlLabel = ml_prediction === 'dementia'
            ? `⚠ ${t('result_ml_dementia')} (${ml_dementia_probability}%)`
            : ml_prediction === 'normal'
                ? `✔ ${t('result_ml_normal')}`
                : `— ${t('result_ml_skipped')}`;

        let cardClass, iconClass, iconChar, textContent, textClass, descContent;

        if (final_risk_level === 'Low') {
            cardClass = 'bg-teal-50 rounded-3xl shadow-xl p-10 mb-6 text-center border-2 border-teal-200';
            iconClass = 'w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 bg-teal-500 text-white text-4xl font-bold pulse-ring';
            iconChar = '✔';
            textContent = t('result_normal_verdict');
            textClass = 'text-4xl font-extrabold mb-3 uppercase tracking-wider text-teal-700';
            descContent = t('result_normal_desc');
        } else if (final_risk_level === 'Moderate') {
            cardClass = 'bg-yellow-50 rounded-3xl shadow-xl p-10 mb-6 text-center border-2 border-yellow-200';
            iconClass = 'w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 bg-yellow-400 text-white text-4xl font-bold';
            iconChar = '⚠';
            textContent = t('result_moderate_verdict');
            textClass = 'text-4xl font-extrabold mb-3 uppercase tracking-wider text-yellow-700';
            descContent = t('result_moderate_desc');
        } else {
            cardClass = 'bg-red-50 rounded-3xl shadow-xl p-10 mb-6 text-center border-2 border-red-200';
            iconClass = 'w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 bg-red-500 text-white text-4xl font-bold';
            iconChar = '!';
            textContent = t('result_high_verdict');
            textClass = 'text-4xl font-extrabold mb-3 uppercase tracking-wider text-red-700';
            descContent = t('result_high_desc');
        }

        return (
            <div id="final-verdict-card" className={cardClass}>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">{t('result_final_label')}</p>
                <div id="verdict-icon" className={iconClass}>{iconChar}</div>
                <h2 id="verdict-text" className={textClass}>{textContent}</h2>
                <p id="verdict-description" className="text-gray-600 text-lg max-w-lg mx-auto">{descContent}</p>
                <div id="verdict-summary" className="mt-4 text-sm text-gray-500 italic">
                    {t('result_total')}: {total_score}/30 · {mlLabel}
                </div>

                {/* Hidden registry ID for PDF extraction */}
                <div className="hidden print:block mt-8 pt-6 border-t border-gray-200">
                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-2">Clinical Registry Identification</p>
                    <p className="text-xs font-bold text-gray-900">Name: {sessionStorage.getItem('patient_name')}</p>
                    <p className="text-xs font-mono font-bold text-blue-600">System Registry Email: {sessionStorage.getItem('patient_email')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 text-gray-800 min-h-screen flex items-center justify-center p-6 py-12">
            <LangSwitcher onChange={setLang} />
            <div className="max-w-3xl w-full fade-in">

                {/* Heading */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{t('result_heading')}</h1>
                    <p className="text-gray-500">{t('result_subtitle')}</p>
                </div>

                {error ? (
                    <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
                        <h2 className="text-2xl font-bold text-red-500 mb-2">Error</h2>
                        <p className="text-gray-600">{error}</p>
                    </div>
                ) : !assessment ? (
                    <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
                        <p className="text-teal-600 animate-pulse font-semibold">{t('result_ml_analyzing')}</p>
                    </div>
                ) : (
                    <>
                        {/* ML Diagnosis Card */}
                        {renderMLDiagnosis()}

                        {/* Quiz Scores */}
                        <div className="bg-white rounded-3xl shadow-xl p-8 mb-6">
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">{t('result_quiz_label')}</p>
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="text-center p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                    <p className="text-xs text-blue-600 font-bold uppercase mb-2">{t('result_orientation')}</p>
                                    <div id="orientation-score" className="text-2xl font-extrabold text-blue-700">{assessment.orientation_score ?? '—'}</div>
                                    <div className="text-xs text-blue-400 mt-1">{t('out_of_10')}</div>
                                </div>
                                <div className="text-center p-4 bg-purple-50 rounded-2xl border border-purple-100">
                                    <p className="text-xs text-purple-600 font-bold uppercase mb-2">{t('result_memory')}</p>
                                    <div id="memory-score" className="text-2xl font-extrabold text-purple-700">{assessment.memory_score ?? '—'}</div>
                                    <div className="text-xs text-purple-400 mt-1">{t('out_of_10')}</div>
                                </div>
                                <div className="text-center p-4 bg-orange-50 rounded-2xl border border-orange-100">
                                    <p className="text-xs text-orange-600 font-bold uppercase mb-2">{t('result_executive')}</p>
                                    <div id="executive-score" className="text-2xl font-extrabold text-orange-700">{assessment.executive_score ?? '—'}</div>
                                    <div className="text-xs text-orange-400 mt-1">{t('out_of_10')}</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-4 bg-teal-50 rounded-2xl border border-teal-100">
                                    <p className="text-xs text-teal-600 font-bold uppercase mb-2">{t('result_total')}</p>
                                    <div id="total-score-display" className="text-2xl font-extrabold text-teal-700">{assessment.total_score ?? '—'}</div>
                                    <div className="text-xs text-teal-400 mt-1">{t('out_of_30')}</div>
                                </div>
                                <div className="text-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <p className="text-xs text-gray-500 font-bold uppercase mb-2">{t('result_rt')}</p>
                                    <div id="reaction-time-display" className="text-2xl font-extrabold text-gray-700">
                                        {assessment.average_reaction_time ? `${assessment.average_reaction_time}s` : '—'}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">{t('sec_per_q')}</div>
                                </div>
                            </div>
                        </div>

                        {/* Voice Biomarkers */}
                        <div className="bg-white rounded-3xl shadow-xl p-8 mb-6">
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">{t('result_voice_label')}</p>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center">
                                    <div id="speech-rate" className="text-xl font-extrabold text-gray-700">
                                        {assessment.speech_rate ? `${assessment.speech_rate} WPM` : '—'}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">{t('result_wpm')}</div>
                                </div>
                                <div className="text-center">
                                    <div id="pause-duration" className="text-xl font-extrabold text-gray-700">
                                        {assessment.pause_duration ? `${assessment.pause_duration}s` : '—'}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">{t('result_pause')}</div>
                                </div>
                                <div className="text-center">
                                    <div id="word-count" className="text-xl font-extrabold text-gray-700">
                                        {assessment.word_count || '—'}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">{t('result_words')}</div>
                                </div>
                            </div>
                        </div>

                        {/* Final Verdict */}
                        {renderFinalVerdict()}

                        {/* Action Buttons */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 no-print">
                            <button
                                onClick={() => window.print()}
                                className="w-full py-4 bg-gray-900 hover:bg-black text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95 text-lg flex items-center justify-center gap-2"
                            >
                                📄 Download Official Report
                            </button>
                            <button
                                onClick={() => navigate('/')}
                                className="w-full py-4 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95 text-lg"
                            >
                                {t('return_dashboard')}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
