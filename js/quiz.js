// js/quiz.js — Cognitive quiz engine with Django API integration
import { startReactionTimer, stopReactionTimer, getAverageReactionTime } from '../modules/reaction_time/reaction.js';
import { getFinalOutput } from '../modules/cognitive_scoring/scoring.js';

const API_BASE = 'http://127.0.0.1:8000/api';

const quizContainer = document.getElementById('quiz-container');
const progressBar = document.getElementById('quiz-progress');

let currentStep = 0;
let domainCorrectCounts = {
    orientation: 0,
    memory: 0,
    executive: 0
};

// ── Build questions from i18n dictionary ─────────────────────────────────────
function getQuestions() {
    const lang = (window.i18n && window.i18n.getCurrentLang()) || 'en';
    const dict = (window.i18n && window.i18n.TRANSLATIONS[lang]) || window.i18n.TRANSLATIONS['en'];
    const keys = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10', 'q11', 'q12', 'q13', 'q14'];
    return keys.map(k => {
        const q = { ...dict[k] };
        // Resolve dynamic day/month answers from real date
        if (q.a === null) {
            const now = new Date();
            if (k === 'q1') { const idx = now.getDay() === 0 ? 6 : now.getDay() - 1; q.a = q.opts[idx]; }
            if (k === 'q2') { q.a = q.opts[now.getMonth()]; }
        }
        return q;
    });
}

const questions = getQuestions();

function renderQuestion() {
    if (currentStep >= questions.length) {
        finish();
        return;
    }

    const q = questions[currentStep];
    progressBar.style.width = `${((currentStep + 1) / questions.length) * 100}%`;

    startReactionTimer();

    let html = `<div class="fade-in">
        <div class="mb-4 text-xs font-bold text-teal-600 uppercase tracking-widest">${q.domain} Assessment</div>
        <h3 class="text-2xl font-bold mb-8">${q.q}</h3>
        <div class="grid gap-4">`;

    q.opts.forEach(o => {
        html += `<button class="option-btn p-5 border-2 rounded-2xl text-xl font-bold hover:bg-teal-50 transition-colors" onclick="handleAnswer('${o}')">${o}</button>`;
    });

    quizContainer.innerHTML = html + `</div></div>`;
}

window.handleAnswer = (selectedAnswer) => {
    const q = questions[currentStep];
    stopReactionTimer();

    if (selectedAnswer === q.a) {
        domainCorrectCounts[q.domain]++;
    }

    currentStep++;
    renderQuestion();
};

async function finish() {
    const avgRT = getAverageReactionTime();

    const finalScores = {
        orientation: domainCorrectCounts.orientation * 2,
        memory: domainCorrectCounts.memory * 2,
        executive: domainCorrectCounts.executive * 2
    };

    const finalResults = getFinalOutput(finalScores, avgRT);

    // Merge voice biomarkers from sessionStorage
    let voiceBiomarkers = {};
    try {
        const staged = sessionStorage.getItem('voice_biomarkers');
        if (staged) voiceBiomarkers = JSON.parse(staged);
    } catch (e) {
        console.warn('No voice biomarkers found:', e);
    }

    // Merge ML audio prediction from sessionStorage
    let mlResult = {};
    try {
        const staged = sessionStorage.getItem('ml_result');
        if (staged) mlResult = JSON.parse(staged);
    } catch (e) { console.warn('No ML result found:', e); }

    const payload = {
        ...finalResults,
        ...voiceBiomarkers,
        ...mlResult,
    };

    // Show saving state
    quizContainer.innerHTML = `
        <div class="text-center fade-in">
            <h2 class="text-3xl font-bold mb-4">Saving Results...</h2>
            <p class="text-gray-600">Storing your cognitive profile securely.</p>
        </div>`;

    try {
        // POST to Django API — saves to SQLite3
        const res = await fetch(`${API_BASE}/assessment/save/`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (data.success) {
            sessionStorage.removeItem('voice_biomarkers');
            sessionStorage.removeItem('ml_result');
            quizContainer.innerHTML = `
                <div class="text-center fade-in">
                    <h2 class="text-3xl font-bold mb-4">Assessment Completed ✓</h2>
                    <p class="text-gray-600 mb-8">Your cognitive profile has been saved to the database.</p>
                    <button onclick="window.location.href='/result.html'" class="px-12 py-5 bg-teal-500 text-white font-bold rounded-2xl shadow-xl hover:bg-teal-600 transition-all">View Full AI Report</button>
                </div>`;
        } else {
            throw new Error(data.error || 'Save failed');
        }
    } catch (err) {
        console.error('Failed to save to database:', err);
        quizContainer.innerHTML = `
            <div class="text-center fade-in">
                <h2 class="text-3xl font-bold mb-4 text-red-500">Save Error</h2>
                <p class="text-gray-600 mb-4">Could not save to database. Make sure the Django server is running.</p>
                <p class="text-sm text-red-400">${err.message}</p>
            </div>`;
    }
}

const startBtn = document.getElementById('start-quiz-btn');
if (startBtn) {
    startBtn.addEventListener('click', () => {
        renderQuestion();
    });
}
