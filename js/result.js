// js/result.js — Loads and renders full assessment results from Django API

const API_BASE = 'http://127.0.0.1:8000/api';

// Thin wrapper: use i18n engine if loaded, else fall back to English
function t(key) {
    return (window.i18n && window.i18n.t(key)) || key;
}

async function loadResults() {
    try {
        const res = await fetch(`${API_BASE}/assessment/latest/`, { credentials: 'include' });

        if (!res.ok) {
            showError('No assessment data found. Please complete the voice test and quiz first.');
            return;
        }

        const data = await res.json();
        const a = data.assessment;

        // ── Quiz Scores ──
        setText('orientation-score', a.orientation_score);
        setText('memory-score', a.memory_score);
        setText('executive-score', a.executive_score);
        setText('total-score-display', a.total_score);
        setText('reaction-time-display', `${a.average_reaction_time}s`);

        // ── Voice Biomarkers ──
        setText('speech-rate', a.speech_rate ? `${a.speech_rate} WPM` : '—');
        setText('pause-duration', a.pause_duration ? `${a.pause_duration}s` : '—');
        setText('word-count', a.word_count || '—');

        // ── ML Model Diagnosis ──
        renderMLDiagnosis(a.ml_prediction, a.ml_dementia_probability, a.ml_normal_probability);

        // ── Final Combined Verdict ──
        renderFinalVerdict(a.final_risk_level, a.total_score, a.ml_prediction, a.ml_dementia_probability);

        console.log('Assessment loaded:', a);

    } catch (err) {
        console.error('Error loading results:', err);
        showError('Connection error. Make sure Django server is running at http://127.0.0.1:8000');
    }
}

// ─── ML Diagnosis Card ─────────────────────────────────────────────────────

function renderMLDiagnosis(prediction, demProb, normProb) {
    const card = document.getElementById('ml-diagnosis-card');
    const icon = document.getElementById('ml-icon');
    const text = document.getElementById('ml-prediction-text');
    const sub = document.getElementById('ml-subtitle');

    if (prediction === 'dementia') {
        card.className = 'bg-red-50 rounded-3xl shadow-xl p-8 mb-6 text-center border-2 border-red-200 transition-all duration-700';
        icon.className = 'w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-500 text-white text-3xl font-bold';
        icon.textContent = '⚠';
        text.textContent = t('result_ml_dementia');
        text.className = 'text-3xl font-extrabold mb-2 uppercase tracking-wider text-red-600';
        sub.textContent = t('result_ml_dementia_sub');
    } else if (prediction === 'normal') {
        card.className = 'bg-teal-50 rounded-3xl shadow-xl p-8 mb-6 text-center border-2 border-teal-200 transition-all duration-700';
        icon.className = 'w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 bg-teal-500 text-white text-3xl font-bold';
        icon.textContent = '✔';
        text.textContent = t('result_ml_normal');
        text.className = 'text-3xl font-extrabold mb-2 uppercase tracking-wider text-teal-700';
        sub.textContent = t('result_ml_normal_sub');
    } else {
        icon.textContent = '—';
        text.textContent = t('result_ml_skipped');
        text.className = 'text-3xl font-extrabold mb-2 uppercase tracking-wider text-gray-400';
        sub.textContent = t('result_ml_skipped_sub');
    }
}

// ─── Final Combined Verdict Card ───────────────────────────────────────────

function renderFinalVerdict(riskLevel, totalScore, mlPrediction, mlDemProb) {
    const card = document.getElementById('final-verdict-card');
    const icon = document.getElementById('verdict-icon');
    const text = document.getElementById('verdict-text');
    const desc = document.getElementById('verdict-description');
    const summ = document.getElementById('verdict-summary');

    const mlLabel = mlPrediction === 'dementia'
        ? `⚠ ${t('result_ml_dementia')} (${mlDemProb}%)`
        : mlPrediction === 'normal'
            ? `✔ ${t('result_ml_normal')}`
            : `— ${t('result_ml_skipped')}`;

    if (riskLevel === 'Low') {
        card.className = 'bg-teal-50 rounded-3xl shadow-xl p-10 mb-6 text-center border-2 border-teal-200 transition-all duration-700';
        icon.className = 'w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 bg-teal-500 text-white text-4xl font-bold pulse-ring';
        icon.textContent = '✔';
        text.textContent = t('result_normal_verdict');
        text.className = 'text-4xl font-extrabold mb-3 uppercase tracking-wider text-teal-700';
        desc.textContent = t('result_normal_desc');
    } else if (riskLevel === 'Moderate') {
        card.className = 'bg-yellow-50 rounded-3xl shadow-xl p-10 mb-6 text-center border-2 border-yellow-200 transition-all duration-700';
        icon.className = 'w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 bg-yellow-400 text-white text-4xl font-bold';
        icon.textContent = '⚠';
        text.textContent = t('result_moderate_verdict');
        text.className = 'text-4xl font-extrabold mb-3 uppercase tracking-wider text-yellow-700';
        desc.textContent = t('result_moderate_desc');
    } else {
        card.className = 'bg-red-50 rounded-3xl shadow-xl p-10 mb-6 text-center border-2 border-red-200 transition-all duration-700';
        icon.className = 'w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 bg-red-500 text-white text-4xl font-bold';
        icon.textContent = '!';
        text.textContent = t('result_high_verdict');
        text.className = 'text-4xl font-extrabold mb-3 uppercase tracking-wider text-red-700';
        desc.textContent = t('result_high_desc');
    }

    summ.textContent = `${t('result_total')}: ${totalScore}/30 · ${mlLabel}`;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value ?? '—';
}

function showError(msg) {
    const verdict = document.getElementById('verdict-text');
    const desc = document.getElementById('verdict-description');
    if (verdict) { verdict.textContent = 'Error'; verdict.className = 'text-2xl font-bold text-red-500'; }
    if (desc) desc.textContent = msg;
}

document.addEventListener('DOMContentLoaded', loadResults);
