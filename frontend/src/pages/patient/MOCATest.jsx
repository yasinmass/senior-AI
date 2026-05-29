import { useState, useEffect, useRef, useCallback } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { apiFetch } from '../../utils/api';



// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SectionHeader({ num, title, marks }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>{num}</div>
            <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--gray-800)', margin: 0 }}>{title}</h3>
                <span style={{ fontSize: 12, color: 'var(--gray-400)', fontWeight: 600 }}>{marks} marks</span>
            </div>
        </div>
    );
}

function ScoreBadge({ score, max }) {
    const pct = score / max;
    const color = pct === 1 ? 'var(--success)' : pct >= 0.5 ? 'var(--warning)' : 'var(--danger)';
    return <span style={{ background: color, color: '#fff', borderRadius: 20, padding: '4px 12px', fontWeight: 800, fontSize: 13 }}>{score}/{max}</span>;
}

// â”€â”€ ANIMAL IMAGE BANK â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Predefined animal images from MOCA protocol: Lion, Rhinoceros, Camel
const ANIMAL_IMAGES = [
    { url: '/assets/moca/lion.png', answer: 'lion', hints: ['lion', 'big cat', 'panthera leo'] },
    { url: '/assets/moca/rhino.png', answer: 'rhinoceros', hints: ['rhino', 'rhinoceros', 'rhinocheros'] },
    { url: '/assets/moca/camel.png', answer: 'camel', hints: ['camel', 'dromedary', 'bactrian'] },
];

// â”€â”€ SECTION 1: Visuospatial â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function VisuospatialSection({ onScore }) {
    const [selected, setSelected] = useState([]);
    const [done, setDone] = useState(false);
    const correctOrder = ['1', 'A', '2', 'B', '3', 'C', '4', 'D', '5', 'E'];
    const nodes = [
        { id: '1', x: 70, y: 200 }, { id: 'A', x: 170, y: 80 }, { id: '2', x: 290, y: 100 },
        { id: 'B', x: 210, y: 200 }, { id: '3', x: 330, y: 230 }, { id: 'C', x: 230, y: 320 },
        { id: '4', x: 110, y: 320 }, { id: 'D', x: 60, y: 310 }, { id: '5', x: 160, y: 380 }, { id: 'E', x: 290, y: 370 },
    ];
    const getNode = id => nodes.find(n => n.id === id);

    function handleClick(id) {
        if (done) return;
        if (selected.includes(id)) return;
        const next = [...selected, id];
        setSelected(next);
        if (next.length === correctOrder.length) {
            setDone(true);
            // Check if order matches
            const correct = next.every((v, i) => v === correctOrder[i]);
            onScore(correct ? 3 : next.filter((v, i) => v === correctOrder[i]).length >= 7 ? 2 : next.filter((v, i) => v === correctOrder[i]).length >= 4 ? 1 : 0);
        }
    }

    return (
        <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-body">
                <SectionHeader num={1} title="Visuospatial / Trail Making" marks={3} />
                <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 12 }}>
                    Connect the dots in the correct alternating order:
                </p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
                    {['1', 'A', '2', 'B', '3', 'C', '4', 'D', '5', 'E'].map((node, i, arr) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{
                                background: 'var(--primary-pale)', color: 'var(--primary)',
                                padding: '4px 10px', borderRadius: 6, fontWeight: 800, fontSize: 14
                            }}>{node}</span>
                            {i < arr.length - 1 && <span style={{ color: 'var(--gray-300)', fontWeight: 800 }}>→</span>}
                        </div>
                    ))}
                </div>
                <div style={{ position: 'relative', width: 400, height: 430, border: '1px solid var(--gray-200)', borderRadius: 8, margin: '0 auto', background: 'var(--gray-50)' }}>
                    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                        {selected.slice(0, -1).map((id, i) => {
                            const a = getNode(id), b = getNode(selected[i + 1]);
                            return b ? <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--primary)" strokeWidth={2} /> : null;
                        })}
                    </svg>
                    {nodes.map(n => (
                        <button key={n.id} onClick={() => handleClick(n.id)}
                            style={{
                                position: 'absolute', left: n.x - 20, top: n.y - 20,
                                width: 40, height: 40, borderRadius: '50%',
                                border: selected.includes(n.id) ? '2px solid var(--primary)' : '2px solid var(--gray-400)',
                                background: selected.includes(n.id) ? 'var(--primary)' : '#fff',
                                color: selected.includes(n.id) ? '#fff' : 'var(--gray-700)',
                                fontWeight: 800, fontSize: 13, cursor: done ? 'default' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>{n.id}</button>
                    ))}
                </div>
                {done && <p style={{ textAlign: 'center', marginTop: 12, color: 'var(--success)', fontWeight: 700 }}>✓ Pattern complete! Moving to order section...</p>}
                {!done && <p style={{ textAlign: 'center', marginTop: 8, fontSize: 13, color: 'var(--gray-400)' }}>Selected: {selected.join(' → ') || 'none'}</p>}
            </div>
        </div>
    );
}

// â”€â”€ SECTION 2: Naming â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function NamingSection({ onScore }) {
    const [answer, setAnswer] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [done, setDone] = useState(false);
    const animal = ANIMAL_IMAGES[currentIndex];

    function levenshtein(a, b) {
        const m = a.length, n = b.length;
        const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0));
        for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
            dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        return dp[m][n];
    }

    function checkAnswer(ans, animalRef) {
        const a = ans.trim().toLowerCase();
        if (animalRef.hints.some(h => a.includes(h))) return 1;
        if (animalRef.hints.some(h => levenshtein(a, h) <= 2)) return 0.5; // Half mark for near miss or misspelling
        return 0;
    }

    function submit() {
        if (!answer.trim()) return;
        const score = checkAnswer(answer, animal);
        const newAnswers = [...answers, { animal: animal.answer, input: answer, score }];
        setAnswers(newAnswers);
        setAnswer('');

        if (currentIndex < ANIMAL_IMAGES.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            setDone(true);
            const totalScore = newAnswers.reduce((sum, curr) => sum + curr.score, 0);
            onScore(Math.round(totalScore)); // Round to nearest int as MOCA usually uses whole numbers
        }
    }

    return (
        <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-body">
                <SectionHeader num={2} title="Naming" marks={3} />
                {!done ? (
                    <>
                        <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 16 }}>
                            Look at animal {currentIndex + 1} of 3 and type its name.
                        </p>
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <img
                                src={animal.url}
                                alt={`Animal ${currentIndex + 1}`}
                                style={{ maxWidth: 280, maxHeight: 220, objectFit: 'contain', borderRadius: 12, border: '2px solid var(--gray-100)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                                onError={e => { e.target.src = '/assets/moca/placeholder.png'; }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <input
                                className="form-control"
                                value={answer}
                                onChange={e => setAnswer(e.target.value)}
                                placeholder="What is this animal?"
                                onKeyDown={e => e.key === 'Enter' && answer.trim() && submit()}
                                autoFocus
                            />
                            <button className="btn btn-primary" onClick={submit} disabled={!answer.trim()}>
                                {currentIndex < 2 ? 'Next' : 'Finish Naming'}
                            </button>
                        </div>
                        <div style={{ marginTop: 12, height: 4, background: 'var(--gray-100)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ width: `${((currentIndex) / 3) * 100}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.3s ease' }} />
                        </div>
                    </>
                ) : (
                    <div style={{ padding: 16, background: 'var(--success-light)', borderRadius: 12, border: '1px solid var(--success-pale)' }}>
                        <p style={{ fontWeight: 800, color: 'var(--success)', marginBottom: 12, fontSize: 16 }}>âœ“ Naming section complete!</p>
                        <div style={{ display: 'grid', gap: 8 }}>
                            {answers.map((ans, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, background: 'rgba(255,255,255,0.5)', padding: '8px 12px', borderRadius: 8 }}>
                                    <span>Animal {i + 1}: <strong>{ans.input}</strong> (Correct: {ans.animal})</span>
                                    <span style={{ fontWeight: 800, color: ans.score === 1 ? 'var(--success)' : ans.score > 0 ? 'var(--warning)' : 'var(--danger)' }}>
                                        {ans.score === 1 ? '+1' : ans.score > 0 ? '+0.5' : '0'}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: 16, borderTop: '1px solid var(--success-pale)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: 11, letterSpacing: 1, color: 'var(--success)' }}>Total Marks</span>
                            <ScoreBadge score={answers.reduce((sum, curr) => sum + curr.score, 0)} max={3} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// â”€â”€ SECTION 3: Memory (immediate recall) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const MOCA_WORDS = ['FACE', 'VELVET', 'CHURCH', 'DAISY', 'RED'];

function MemorySection({ onScore, onWordsReady }) {
    const [phase, setPhase] = useState('show'); // show | trial1 | trial2
    const [trial1, setTrial1] = useState(Array(5).fill(''));
    const [trial2, setTrial2] = useState(Array(5).fill(''));

    function submitTrials() {
        // Score immediate recall: just record — memory recalled later in delayed section
        onWordsReady({ trial1, trial2 });
        onScore(3); // Full marks for immediate — delayed will adjust
    }

    return (
        <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-body">
                <SectionHeader num={3} title="Memory — Immediate Recall" marks={3} />
                {phase === 'show' && (
                    <>
                        <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 16 }}>Memorize these 5 words. You'll be asked to recall them twice now, then again in 30 seconds.</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
                            {MOCA_WORDS.map(w => <span key={w} style={{ background: 'var(--primary-pale)', color: 'var(--primary)', borderRadius: 8, padding: '10px 20px', fontWeight: 800, fontSize: 18 }}>{w}</span>)}
                        </div>
                        <button className="btn btn-primary" onClick={() => setPhase('trial1')}>I've Memorized Them →</button>
                    </>
                )}
                {phase === 'trial1' && (
                    <>
                        <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 16 }}><strong>Trial 1:</strong> Type all 5 words you remember (any order):</p>
                        {MOCA_WORDS.map((_, i) => (
                            <input key={i} className="form-control" style={{ marginBottom: 8 }} value={trial1[i]} placeholder={`Word ${i + 1}`}
                                onChange={e => { const a = [...trial1]; a[i] = e.target.value; setTrial1(a); }} />
                        ))}
                        <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => setPhase('trial2')}>Order Trial →</button>
                    </>
                )}
                {phase === 'trial2' && (
                    <>
                        <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 16 }}><strong>Trial 2:</strong> Type all 5 words again:</p>
                        {MOCA_WORDS.map((_, i) => (
                            <input key={i} className="form-control" style={{ marginBottom: 8 }} value={trial2[i]} placeholder={`Word ${i + 1}`}
                                onChange={e => { const a = [...trial2]; a[i] = e.target.value; setTrial2(a); }} />
                        ))}
                        <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={submitTrials}>Done — Start 30-second Order →</button>
                    </>
                )}
            </div>
        </div>
    );
}

// â”€â”€ SECTION 4: Attention 1 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Attention1Section({ onScore }) {
    const [fwd, setFwd] = useState('');
    const [bwd, setBwd] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(null);
    const CORRECT_FWD = '21854';
    const CORRECT_BWD = '247'; // Reversed order of 7-4-2

    function submit() {
        let s = 0;
        if (fwd.replace(/\s/g, '') === CORRECT_FWD) s += 1;
        if (bwd.replace(/\s/g, '') === CORRECT_BWD) s += 2;
        setScore(s);
        setSubmitted(true);
        onScore(s);
    }

    return (
        <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-body">
                <SectionHeader num={4} title="Attention — Digit Sequences" marks={3} />
                <div style={{ background: 'var(--gray-50)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                    <p style={{ fontWeight: 700, marginBottom: 4 }}>Forward (read once, then type): <span style={{ fontFamily: 'monospace', fontSize: 18, letterSpacing: 4 }}>2 1 8 5 4</span></p>
                    <input className="form-control" value={fwd} onChange={e => setFwd(e.target.value)} placeholder="Type digits in order..." disabled={submitted} />
                </div>
                <div style={{ background: 'var(--gray-50)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                    <p style={{ fontWeight: 700, marginBottom: 4 }}>Backward (reverse of 7 4 2): Type in reverse order</p>
                    <input className="form-control" value={bwd} onChange={e => setBwd(e.target.value)} placeholder="Type digits in reverse..." disabled={submitted} />
                </div>
                <button className="btn btn-primary" onClick={submit} disabled={submitted || (!fwd && !bwd)}>Submit</button>
                {submitted && (
                    <div style={{ marginTop: 12, padding: 12, background: 'var(--primary-light)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600 }}>Forward: {fwd === CORRECT_FWD ? '✓' : '✗'} | Backward: {bwd === CORRECT_BWD ? '✓' : '✗'}</span>
                        <ScoreBadge score={score} max={3} />
                    </div>
                )}
            </div>
        </div>
    );
}

// â”€â”€ SECTION 5: Attention 2 — Tap on A â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const LETTER_SEQ = 'FBACMNAAAJKLBAFAKDEAAAJAMOFAAB'.split('');

function Attention2Section({ onScore }) {
    const [idx, setIdx] = useState(-1);
    const [taps, setTaps] = useState([]); // {letter, correct}
    const [running, setRunning] = useState(false);
    const [done, setDone] = useState(false);
    const [currentLetter, setCurrentLetter] = useState('');
    const timerRef = useRef(null);
    const idxRef = useRef(-1);
    const tapsRef = useRef([]);

    const speak = useCallback(letter => {
        if ('speechSynthesis' in window) {
            const u = new SpeechSynthesisUtterance(letter);
            u.rate = 0.9; window.speechSynthesis.speak(u);
        }
    }, []);

    function start() {
        setRunning(true); setIdx(0); idxRef.current = 0;
        timerRef.current = setInterval(() => {
            const i = idxRef.current;
            if (i >= LETTER_SEQ.length) { clearInterval(timerRef.current); finish(); return; }
            setCurrentLetter(LETTER_SEQ[i]);
            speak(LETTER_SEQ[i]);
            setIdx(i + 1); idxRef.current = i + 1;
        }, 1500);
    }

    function handleTap() {
        if (!running) return;
        const letter = LETTER_SEQ[idxRef.current - 1] || '';
        const correct = letter === 'A';
        const t = { letter, correct };
        tapsRef.current = [...tapsRef.current, t];
        setTaps([...tapsRef.current]);
    }

    function finish() {
        setRunning(false); setDone(true);
        const correctTaps = tapsRef.current.filter(t => t.correct).length;
        const wrongTaps = tapsRef.current.filter(t => !t.correct).length;
        const totalAs = LETTER_SEQ.filter(l => l === 'A').length;
        const missed = totalAs - correctTaps;
        const errors = wrongTaps + missed;
        const s = errors === 0 ? 3 : errors === 1 ? 2 : errors <= 3 ? 1 : 0;
        onScore(s);
    }

    return (
        <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-body">
                <SectionHeader num={5} title="Attention — Tap on Letter A" marks={3} />
                <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 16 }}>Letters will play every 1.5 seconds. <strong>Click the button each time you hear "A"</strong>.</p>
                {!running && !done && (
                    <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={start}>â–¶ Start Letter Sequence</button>
                )}
                {running && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 72, fontWeight: 900, color: 'var(--primary)', marginBottom: 16, fontFamily: 'monospace' }}>{currentLetter}</div>
                        <button className="btn btn-primary btn-lg" style={{ width: '100%', padding: 32, fontSize: 20 }} onClick={handleTap}>
                            TAP — I heard "A"
                        </button>
                        <p style={{ marginTop: 12, color: 'var(--gray-400)', fontSize: 13 }}>{idxRef.current}/{LETTER_SEQ.length} letters played</p>
                    </div>
                )}
                {done && (
                    <div style={{ padding: 16, background: 'var(--success-light)', borderRadius: 8 }}>
                        <p style={{ fontWeight: 700, color: 'var(--success)' }}>✓ Complete! Correct taps: {taps.filter(t => t.correct).length} | Wrong taps: {taps.filter(t => !t.correct).length}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// â”€â”€ SECTION 6: Attention 3 — Serial 7 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SERIAL7_ANSWERS = [93, 86, 79, 72, 65];

function Attention3Section({ onScore }) {
    const [inputs, setInputs] = useState(['', '', '', '', '']);
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(null);
    const [current, setCurrent] = useState(100);
    const [step, setStep] = useState(0);

    function handleInput(val) {
        const n = parseInt(val, 10);
        if (isNaN(n)) return;
        const newInputs = [...inputs]; newInputs[step] = val; setInputs(newInputs);
        const next = step + 1;
        if (next >= 5) { submit(newInputs); return; }
        setStep(next); setCurrent(SERIAL7_ANSWERS[step]);
    }

    function submit(finalInputs) {
        const correct = finalInputs.filter((v, i) => parseInt(v) === SERIAL7_ANSWERS[i]).length;
        const s = correct >= 4 ? 3 : correct >= 2 ? 2 : correct >= 1 ? 1 : 0;
        setScore(s); setSubmitted(true); onScore(s);
    }

    return (
        <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-body">
                <SectionHeader num={6} title="Attention — Serial Subtraction" marks={3} />
                <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 16 }}>
                    Start at <strong>100</strong> and keep subtracting. Type your answer and press Enter.
                </p>
                {!submitted && (
                    <>
                        <div style={{ fontSize: 40, fontWeight: 900, color: 'var(--primary)', textAlign: 'center', marginBottom: 16 }}>{current}</div>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--gray-500)' }}>âˆ’7 =</span>
                            <input className="form-control" type="number" placeholder="Your answer" style={{ fontSize: 20, fontWeight: 700, maxWidth: 160 }}
                                key={step}
                                onKeyDown={e => e.key === 'Enter' && e.target.value && handleInput(e.target.value)}
                                autoFocus />
                        </div>
                        <p style={{ marginTop: 8, color: 'var(--gray-400)', fontSize: 13 }}>Step {step + 1} of 5 — press Enter after each answer</p>
                    </>
                )}
                {submitted && (
                    <div style={{ padding: 16, background: 'var(--primary-light)', borderRadius: 8 }}>
                        <p style={{ fontWeight: 700, marginBottom: 8 }}>Your answers: {inputs.join(', ')}</p>
                        <p style={{ color: 'var(--gray-600)', marginBottom: 8 }}>Correct: {SERIAL7_ANSWERS.join(', ')}</p>
                        <ScoreBadge score={score} max={3} />
                    </div>
                )}
            </div>
        </div>
    );
}

// â”€â”€ SECTION 7: Language Fluency â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function LanguageSection({ onScore }) {
    const [phase, setPhase] = useState('permission'); // permission | listening | done
    const [micError, setMicError] = useState('');
    const [words, setWords] = useState([]);
    const [seconds, setSeconds] = useState(30);
    const [score, setScore] = useState(null);
    const recognitionRef = useRef(null);
    const timerRef = useRef(null);
    const seenRootsRef = useRef(new Set());
    const done = phase === 'done';
    const listening = phase === 'listening';

    const FORBIDDEN_PATTERN = /^[A-Z]|^\d|^(the|a|an|is|are|was|were)$/i;

    function processWords(transcript) {
        const raw = transcript.toLowerCase().trim().split(/[\s,]+/).filter(w => w.length > 1);
        const valid = [];
        const seen = new Set();
        for (const w of raw) {
            if (seen.has(w)) continue;
            if (FORBIDDEN_PATTERN.test(w)) continue;
            if (!w.startsWith('f')) continue; // Must start with 'F'
            // Crude stemming: strip common suffixes
            const root = w.replace(/(ing|ed|er|s|es|ly)$/, '');
            if (seenRootsRef.current.has(root)) continue;
            seenRootsRef.current.add(root);
            seen.add(w);
            valid.push(w);
        }
        return valid;
    }

    async function requestMic() {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            setMicError('');
            start();
        } catch {
            setMicError('Microphone access denied. Please allow microphone in your browser settings and try again.');
        }
    }

    function start() {
        seenRootsRef.current = new Set();
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) { setMicError('Speech recognition not supported. Please use Chrome or Edge.'); return; }
        const r = new SR(); r.continuous = true; r.interimResults = false;
        let allTranscript = '';
        r.onresult = e => {
            for (let i = e.resultIndex; i < e.results.length; i++) allTranscript += ' ' + e.results[i][0].transcript;
            setWords(processWords(allTranscript));
        };
        r.onerror = () => { };
        r.start(); recognitionRef.current = r;
        setPhase('listening');
        let s = 30;
        timerRef.current = setInterval(() => {
            s--; setSeconds(s);
            if (s <= 0) { clearInterval(timerRef.current); try { r.stop(); } catch { } finishLanguage(); }
        }, 1000);
    }

    function finishLanguage() {
        setWords(prev => {
            const sc = prev.length >= 8 ? 3 : prev.length >= 6 ? 2 : prev.length >= 4 ? 1 : 0;
            setScore(sc); onScore(sc);
            return prev;
        });
        setPhase('done');
    }

    return (
        <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-body">
                <SectionHeader num={7} title="Language - Word Fluency" marks={3} />
                <p style={{ fontSize: 14, color: 'var(--gray-600)', marginBottom: 4 }}>Say as many words starting with the letter <strong>"F"</strong> as you can in 30 seconds.</p>
                <p style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 16 }}>Rules: No proper names, no numbers, no variations of the same word.</p>

                {phase === 'permission' && (
                    <div style={{ textAlign: 'center', padding: 28, background: 'var(--gray-50)', borderRadius: 12, border: '2px dashed var(--gray-200)' }}>
                        <div style={{ fontSize: 48, marginBottom: 12 }}>🎙️</div>
                        <h4 style={{ fontWeight: 700, marginBottom: 8 }}>Enable Microphone First</h4>
                        <p style={{ color: 'var(--gray-500)', fontSize: 14, marginBottom: 20 }}>Click below to allow mic access, then speak as many "F" words as you can in 30 seconds.</p>
                        {micError && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12, fontWeight: 600 }}>{micError}</p>}
                        <button className="btn btn-primary btn-lg" style={{ minWidth: 240 }} onClick={requestMic}>
                            🎙️ Allow Mic &amp; Start Speaking
                        </button>
                    </div>
                )}

                {phase === 'listening' && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 64, fontWeight: 900, color: seconds <= 10 ? 'var(--danger)' : 'var(--primary)', lineHeight: 1.1, marginBottom: 6 }}>{seconds}s</div>
                        <p style={{ color: 'var(--gray-500)', marginBottom: 16, fontWeight: 600 }}>🎙️ Listening... speak words starting with "F" now!</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', minHeight: 44 }}>
                            {words.map((w, i) => <span key={i} style={{ background: 'var(--success-light)', color: 'var(--success)', padding: '6px 14px', borderRadius: 20, fontWeight: 700, fontSize: 14 }}>{w}</span>)}
                        </div>
                        {words.length > 0 && <p style={{ marginTop: 12, color: 'var(--gray-600)', fontSize: 13, fontWeight: 600 }}>Detected {words.length} word(s)</p>}
                        <button className="btn btn-secondary btn-sm" style={{ marginTop: 16 }} onClick={() => { clearInterval(timerRef.current); try { recognitionRef.current?.stop(); } catch (e) { } finishLanguage(); }}>Stop Early</button>
                    </div>
                )}

                {phase === 'done' && (
                    <div style={{ padding: 16, background: 'var(--success-light)', borderRadius: 8 }}>
                        <p style={{ fontWeight: 700, marginBottom: 8 }}>✓ Complete! "F" words named ({words.length}): {words.join(', ') || 'none'}</p>
                        <ScoreBadge score={score} max={3} />
                    </div>
                )}
            </div>
        </div>
    );
}
// â”€â”€ SECTION 8: Abstraction â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ABSTRACT_QUESTIONS = [
    { q: 'What do a train and a bicycle have in common?', keywords: ['transport', 'vehicle', 'travel', 'move', 'wheels', 'ride', 'go', 'carry'] },
    { q: 'What do a watch and a ruler have in common?', keywords: ['measure', 'tool', 'numeric', 'count', 'instrument', 'gauge'] },
];

function AbstractionSection({ onScore }) {
    const [qIdx] = useState(() => Math.floor(Math.random() * ABSTRACT_QUESTIONS.length));
    const q = ABSTRACT_QUESTIONS[qIdx];
    const [answer, setAnswer] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(null);

    function submit() {
        const a = answer.toLowerCase();
        const match = q.keywords.some(k => a.includes(k));
        const s = match ? 3 : 0;
        setScore(s); setSubmitted(true); onScore(s);
    }

    return (
        <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-body">
                <SectionHeader num={8} title="Abstraction — Similarity" marks={3} />
                <div style={{ background: 'var(--primary-pale)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                    <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--primary)' }}>{q.q}</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <input className="form-control" value={answer} onChange={e => setAnswer(e.target.value)}
                        placeholder="Type your answer..." disabled={submitted}
                        onKeyDown={e => e.key === 'Enter' && !submitted && submit()} />
                    <button className="btn btn-primary" onClick={submit} disabled={submitted || !answer.trim()}>Submit</button>
                </div>
                {submitted && (
                    <div style={{ marginTop: 12, padding: 12, background: score > 0 ? 'var(--success-light)' : 'var(--danger-light)', borderRadius: 8, display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600 }}>{score > 0 ? '✓ Good! They are both related to the same category.' : '✗ Look for what purpose/category connects them.'}</span>
                        <ScoreBadge score={score} max={3} />
                    </div>
                )}
            </div>
        </div>
    );
}

// â”€â”€ SECTION 9: Orientation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function OrientationSection({ onScore }) {
    const now = new Date();
    const fields = [
        { label: 'Today\'s Date (day)', correct: String(now.getDate()) },
        { label: 'Day of Week', correct: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()] },
        { label: 'Month', correct: ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'][now.getMonth()] },
        { label: 'Year', correct: String(now.getFullYear()) },
        { label: 'City / Location', correct: null }, // Free input — any non-empty answer gets credit
    ];
    const [answers, setAnswers] = useState(Array(5).fill(''));
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(null);

    function submit() {
        let correct = 0;
        for (let i = 0; i < fields.length; i++) {
            const a = answers[i].toLowerCase().trim();
            if (!a) continue;
            if (fields[i].correct === null) { correct++; continue; } // location = free credit
            if (a === fields[i].correct || a === fields[i].correct.slice(0, 3)) correct++;
        }
        const s = correct >= 5 ? 3 : correct >= 3 ? 2 : correct >= 1 ? 1 : 0;
        setScore(s); setSubmitted(true); onScore(s);
    }

    return (
        <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-body">
                <SectionHeader num={9} title="Orientation" marks={3} />
                <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 16 }}>Answer the following questions about today:</p>
                {fields.map((f, i) => (
                    <div key={i} className="form-group">
                        <label className="form-label">{f.label}</label>
                        <input className="form-control" value={answers[i]} disabled={submitted}
                            onChange={e => { const a = [...answers]; a[i] = e.target.value; setAnswers(a); }} />
                    </div>
                ))}
                <button className="btn btn-primary" onClick={submit} disabled={submitted}>Submit</button>
                {submitted && (
                    <div style={{ marginTop: 12, padding: 12, background: 'var(--primary-light)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600 }}>Orientation score:</span>
                        <ScoreBadge score={score} max={3} />
                    </div>
                )}
            </div>
        </div>
    );
}

// â”€â”€ SECTION 10: Delayed Recall â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function DelayedRecallSection({ onScore, timerReady }) {
    const [inputs, setInputs] = useState(['', '', '', '', '']);
    const [done, setDone] = useState(false);
    const [score, setScore] = useState(null);

    function submit() {
        const text = inputs.join(' ').toLowerCase();
        const recalled = MOCA_WORDS.filter(w => text.includes(w.toLowerCase())).length;
        const s = recalled >= 5 ? 3 : recalled >= 3 ? 2 : recalled >= 1 ? 1 : 0;
        setScore(s); setDone(true); onScore(s);
    }

    return (
        <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-body">
                <SectionHeader num={10} title="Delayed Memory Recall" marks={3} />
                {!timerReady ? (
                    <div style={{ textAlign: 'center', padding: 32 }}>
                        <div style={{ fontSize: 48 }}>⌛</div>
                        <p style={{ color: 'var(--gray-500)', marginTop: 8 }}>Waiting for 5-minute timer to complete...</p>
                    </div>
                ) : !done ? (
                    <>
                        <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 16 }}>
                            Recall all 5 words shown earlier and type them below (any order):
                        </p>
                        <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
                            {MOCA_WORDS.map((_, i) => (
                                <input key={i} className="form-control" placeholder={`Word ${i + 1}`}
                                    value={inputs[i]} onChange={e => {
                                        const n = [...inputs]; n[i] = e.target.value; setInputs(n);
                                    }} />
                            ))}
                        </div>
                        <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={submit}>Submit Recall</button>
                    </>
                ) : (
                    <div style={{ padding: 16, background: 'var(--success-light)', borderRadius: 8 }}>
                        <p style={{ fontWeight: 700, color: 'var(--success)', marginBottom: 12 }}>✓ Recall entries submitted!</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                            {inputs.map((val, i) => val && <div key={i} style={{ fontSize: 13 }}>Entry {i + 1}: <strong>{val}</strong></div>)}
                        </div>
                        <div style={{ borderTop: '1px solid var(--success-pale)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, color: 'var(--success)' }}>Delayed Recall Score</span>
                            <ScoreBadge score={score} max={3} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// â”€â”€ Progress Steps â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function MOCASteps({ current }) {
    const steps = ['Visuospatial', 'Naming', 'Memory', 'Attention 1', 'Attention 2', 'Serial 7', 'Language', 'Abstraction', 'Orientation', 'Delayed Recall'];
    return (
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, flexWrap: 'wrap' }}>
            {steps.map((s, i) => (
                <div key={i} style={{
                    flex: 1, minWidth: 60, height: 6, borderRadius: 99,
                    background: i < current ? 'var(--success)' : i === current ? 'var(--primary)' : 'var(--gray-200)',
                    transition: 'background .3s',
                    title: s,
                }} title={`${i + 1}. ${s}`} />
            ))}
        </div>
    );
}

// â”€â”€ Main MOCA Test Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function MOCATest({ embedded = false, onComplete }) {
    const [section, setSection] = useState(0); // 0-9 = sections, 10 = results
    const [scores, setScores] = useState({
        visuospatial: null, naming: null, memory: null,
        attention1: null, attention2: null, attention3: null,
        language: null, abstraction: null, orientation: null, delayed_recall: null
    });
    const [memoryWords, setMemoryWords] = useState(null);
    const [delayedReady, setDelayedReady] = useState(false);
    const [delayTimer, setDelayTimer] = useState(30); // 30 seconds only
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const delayIntervalRef = useRef(null);
    const answersRef = useRef({});

    const scoreKeys = ['visuospatial', 'naming', 'memory', 'attention1', 'attention2', 'attention3', 'language', 'abstraction', 'orientation', 'delayed_recall'];

    function recordScore(key, val) {
        setScores(prev => ({ ...prev, [key]: val }));
        answersRef.current[key] = val;
    }

    function advanceSection() {
        setSection(prev => prev + 1);
    }

    // Start 5-min delay timer when section 3 (memory) is done
    useEffect(() => {
        if (section >= 3 && !delayedReady && !delayIntervalRef.current) {
            delayIntervalRef.current = setInterval(() => {
                setDelayTimer(prev => {
                    if (prev <= 1) {
                        clearInterval(delayIntervalRef.current);
                        setDelayReady(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
    }, [section, delayedReady]);

    function setDelayReady(val) { setDelayedReady(val); }

    async function saveResults() {
        setSaving(true);
        const s = {
            visuospatial_score: scores.visuospatial ?? 0,
            naming_score: scores.naming ?? 0,
            memory_score: scores.memory ?? 0,
            attention1_score: scores.attention1 ?? 0,
            attention2_score: scores.attention2 ?? 0,
            attention3_score: scores.attention3 ?? 0,
            language_score: scores.language ?? 0,
            abstraction_score: scores.abstraction ?? 0,
            orientation_score: scores.orientation ?? 0,
            delayed_recall_score: scores.delayed_recall ?? 0,
            answers_json: answersRef.current,
        };
        try {
            const res = await apiFetch('/moca/save/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s) });
            const data = await res.json();
            if (data.success) {
                const finalTotal = scoreKeys.reduce((acc, k) => acc + (scores[k] ?? 0), 0);
                if (embedded && onComplete) {
                    onComplete(finalTotal); // Tell PatientTest we're done
                } else {
                    setSection(10);
                }
            }
            else throw new Error(data.error || 'Save failed');
        } catch (e) { setSaveError(e.message); }
        setSaving(false);
    }

    const total = scoreKeys.reduce((acc, k) => acc + (scores[k] ?? 0), 0);
    const mins = Math.floor(delayTimer / 60), secs = delayTimer % 60;

    // â”€â”€ Results Screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const pct = Math.round((total / 30) * 100);
    const classification = pct > 85
        ? { label: 'Cognitive Status: Normal Range', bg: '#f0fdfa', border: '#b2f5ea', color: '#0f766e', icon: '✅', desc: 'Patient demonstrates normal cognitive functioning on the MOCA scale. No indicators of impairment found at this time.', badge: 'NORMAL' }
        : pct >= 45
            ? { label: 'Mild Cognitive Impairment (MCI)', bg: '#fffbeb', border: '#fef3c7', color: '#b45309', icon: '⚠️', desc: 'Potential mild cognitive impairment detected. Scores suggest inconsistencies in neuro-cognitive domains. Follow-up diagnostic required.', badge: 'MCI INDICATED' }
            : { label: 'Significant Cognitive Indicator', bg: '#fef2f2', border: '#fee2e2', color: '#b91c1c', icon: '🚨', desc: 'Significant neuro-cognitive deficits detected. Clinical intervention and formal neurological review strongly advised for diagnostic confirmation.', badge: 'CLINICAL FOLLOW-UP' };
    if (section === 10) {
        const resultsContent = (
            <div style={{ maxWidth: 680, margin: '0 auto' }}>
                <div style={{ background: classification.bg, border: `2px solid ${classification.border}`, borderRadius: 16, padding: 36, textAlign: 'center', marginBottom: 24, color: classification.color }}>
                    <div style={{ fontSize: 56, marginBottom: 8 }}>{classification.icon}</div>
                    <div style={{ display: 'inline-block', background: classification.border, borderRadius: 20, padding: '4px 16px', fontSize: 11, fontWeight: 900, letterSpacing: 1, marginBottom: 12, color: classification.color }}>{classification.badge}</div>
                    <h2 style={{ fontWeight: 900, fontSize: 24, marginBottom: 12 }}>{classification.label}</h2>
                    <p style={{ opacity: 0.9, fontSize: 15, lineHeight: 1.6, maxWidth: 480, margin: '0 auto 20px' }}>{classification.desc}</p>
                    <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, background: classification.border, borderRadius: 12, padding: '12px 28px' }}>
                        <span style={{ fontSize: 52, fontWeight: 900 }}>{total}</span>
                        <span style={{ fontSize: 18, opacity: 0.7 }}>/30</span>
                        <span style={{ fontSize: 15, marginLeft: 8, opacity: 0.85 }}>({pct}%)</span>
                    </div>
                </div>
                <div className="card" style={{ marginBottom: 24 }}>
                    <div className="card-header"><h3>Section Breakdown</h3></div>
                    <div className="card-body">
                        {scoreKeys.map(k => (
                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
                                <span style={{ fontSize: 14, fontWeight: 600, textTransform: 'capitalize', color: 'var(--gray-700)' }}>{k.replace(/_/g, ' ')}</span>
                                <ScoreBadge score={scores[k] ?? 0} max={3} />
                            </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', marginTop: 4 }}>
                            <strong style={{ color: 'var(--primary)' }}>Total MOCA Score</strong>
                            <strong style={{ fontSize: 20, color: 'var(--primary)' }}>{total}/30</strong>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <button className="btn btn-outline btn-lg" onClick={() => window.location.href = '/patient/results'}>â† View All Results</button>
                    <button className="btn btn-primary btn-lg" onClick={() => window.print()}>📄 Download Report</button>
                </div>
            </div>
        );

        return embedded ? resultsContent : <DashboardLayout role="patient" title="MOCA Results">{resultsContent}</DashboardLayout>;
    }

    const sectionDone = key => scores[key] !== null;

    // The main test content (same whether embedded or standalone)
    const testContent = (
        <div>
            <div className="page-header">
                <h2>Montreal Cognitive Assessment (MOCA)</h2>
                <p>Complete all 10 sections — 3 marks each — Total: 30 marks</p>
            </div>

            <MOCASteps current={section} />

            {section >= 3 && !delayedReady && (
                <div style={{ background: 'var(--warning-light)', border: '1px solid var(--warning)', borderRadius: 8, padding: '10px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 20 }}>â±ï¸</span>
                    <span style={{ fontWeight: 700, color: '#92400E' }}>Delayed Recall Timer: {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')} remaining</span>
                </div>
            )}

            {section === 0 && <VisuospatialSection onScore={s => { recordScore('visuospatial', s); setTimeout(advanceSection, 1500); }} />}

            {section === 1 && (<>
                <NamingSection onScore={s => recordScore('naming', s)} />
                {sectionDone('naming') && <button className="btn btn-primary btn-lg" onClick={advanceSection} style={{ width: '100%', marginTop: 8 }}>Order Section →</button>}
            </>)}

            {section === 2 && (<>
                <MemorySection onScore={s => recordScore('memory', s)} onWordsReady={w => setMemoryWords(w)} />
                {sectionDone('memory') && <button className="btn btn-primary btn-lg" onClick={advanceSection} style={{ width: '100%', marginTop: 8 }}>Order Section →</button>}
            </>)}

            {section === 3 && (<>
                <Attention1Section onScore={s => recordScore('attention1', s)} />
                {sectionDone('attention1') && <button className="btn btn-primary btn-lg" onClick={advanceSection} style={{ width: '100%', marginTop: 8 }}>Order Section →</button>}
            </>)}

            {section === 4 && (<>
                <Attention2Section onScore={s => recordScore('attention2', s)} />
                {sectionDone('attention2') && <button className="btn btn-primary btn-lg" onClick={advanceSection} style={{ width: '100%', marginTop: 8 }}>Order Section →</button>}
            </>)}

            {section === 5 && (<>
                <Attention3Section onScore={s => recordScore('attention3', s)} />
                {sectionDone('attention3') && <button className="btn btn-primary btn-lg" onClick={advanceSection} style={{ width: '100%', marginTop: 8 }}>Order Section →</button>}
            </>)}

            {section === 6 && (<>
                <LanguageSection onScore={s => recordScore('language', s)} />
                {sectionDone('language') && <button className="btn btn-primary btn-lg" onClick={advanceSection} style={{ width: '100%', marginTop: 8 }}>Order Section →</button>}
            </>)}

            {section === 7 && (<>
                <AbstractionSection onScore={s => recordScore('abstraction', s)} />
                {sectionDone('abstraction') && <button className="btn btn-primary btn-lg" onClick={advanceSection} style={{ width: '100%', marginTop: 8 }}>Order Section →</button>}
            </>)}

            {section === 8 && (<>
                <OrientationSection onScore={s => recordScore('orientation', s)} />
                {sectionDone('orientation') && <button className="btn btn-primary btn-lg" onClick={advanceSection} style={{ width: '100%', marginTop: 8 }}>Order: Delayed Recall →</button>}
            </>)}

            {section === 9 && (<>
                <DelayedRecallSection onScore={s => recordScore('delayed_recall', s)} timerReady={delayedReady} />
                {sectionDone('delayed_recall') && (
                    <div style={{ marginTop: 20 }}>
                        {saveError && <p style={{ color: 'var(--danger)', marginBottom: 8, fontWeight: 600 }}>{saveError}</p>}
                        <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={saveResults} disabled={saving}>
                            {saving ? 'âŸ³ Saving Results...' : '✓ Submit MOCA Test →'}
                        </button>
                    </div>
                )}
            </>)}

            {/* score box removed */}
        </div>
    );

    return embedded ? testContent : <DashboardLayout role="patient" title="MOCA Test">{testContent}</DashboardLayout>;
}
