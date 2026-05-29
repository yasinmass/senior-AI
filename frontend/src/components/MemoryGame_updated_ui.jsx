import { useState, useEffect, useRef } from "react";
import { useTranslate } from "../hooks/useTranslate";


// ── DATA ────────────────────────────────────────────────────
const CARD_PAIRS = [
  { id: 1, emoji: "🍎" },
  { id: 2, emoji: "🌸" },
  { id: 3, emoji: "🌙" },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createDeck() {
  return shuffle([
    ...CARD_PAIRS.map((c) => ({ ...c, uid: `${c.id}-a` })),
    ...CARD_PAIRS.map((c) => ({ ...c, uid: `${c.id}-b` })),
  ]);
}

function formatTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function calcScore(moves, time) {
  return Math.max(10, 100 - Math.max(0, (moves - 6) * 5) - Math.floor(time * 0.5));
}

// ── CSS VARS (matches NeuroScan palette) ───────────────────
const C = {
  teal: "#14bdac",
  tealLight: "#e6f9f7",
  tealBorder: "#a7f3d0",
  navy: "#1a3a4a",
  navyDark: "#0f2535",
  bg: "#f0f6f9",
  white: "#ffffff",
  border: "#d8eaf2",
  muted: "#7da8bb",
  textBody: "#2c5364",
  green: "#065f46",
  greenLight: "#f0fdf9",
  greenBorder: "#a7f3d0",
  red: "#ef4444",
  amber: "#f59e0b",
};

// ── SHARED STYLES ──────────────────────────────────────────
const S = {
  page: {
    background: C.bg,
    minHeight: "100vh",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  topBar: {
    background: C.navyDark,
    padding: "13px 32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topBarTitle: {
    fontFamily: "'Arial Black', Impact, sans-serif",
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 3,
    color: C.white,
    textTransform: "uppercase",
  },
  topBarBadge: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 2,
    color: C.teal,
    textTransform: "uppercase",
  },
  content: {
    padding: "24px 28px",
    maxWidth: 860,
  },
  sectionHeading: {
    fontFamily: "'Arial Black', Impact, sans-serif",
    fontSize: 16,
    fontWeight: 900,
    letterSpacing: 1,
    color: C.navy,
    textTransform: "uppercase",
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  accent: {
    color: C.teal,
    fontStyle: "italic",
  },
  card: {
    background: C.white,
    border: `1.5px solid ${C.border}`,
    borderRadius: 16,
    padding: "24px 28px",
    boxShadow: "0 2px 10px rgba(20,189,172,0.05)",
    marginBottom: 18,
  },
  label: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 2,
    color: C.muted,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  btnPrimary: {
    background: C.teal,
    color: C.white,
    border: "none",
    borderRadius: 10,
    padding: "13px 32px",
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 1,
    cursor: "pointer",
    textTransform: "uppercase",
    boxShadow: "0 4px 14px rgba(20,189,172,0.3)",
  },
  btnSecondary: {
    background: C.white,
    color: C.navy,
    border: `1.5px solid ${C.border}`,
    borderRadius: 10,
    padding: "13px 24px",
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 1,
    cursor: "pointer",
    textTransform: "uppercase",
  },
};

// ── WEEK ROW (identical to dashboard) ─────────────────────
function WeekRow({ scores }) {
  const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const today = new Date().getDay(); // 0=Sun,1=Mon...
  const todayIdx = today === 0 ? 6 : today - 1;
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 24, overflowX: "auto", paddingBottom: 4 }}>
      {days.map((d, i) => {
        const isToday = i === todayIdx;
        const val = scores?.[i] ?? 0;
        return (
          <div key={d} style={{
            flex: 1, minWidth: 80, textAlign: "center",
            background: isToday ? C.teal : C.white,
            border: `1.5px solid ${isToday ? C.teal : C.border}`,
            borderRadius: 14,
            padding: "14px 8px",
            boxShadow: isToday ? "0 4px 16px rgba(20,189,172,0.25)" : "none",
            transition: "all 0.2s",
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: 2,
              color: isToday ? "rgba(255,255,255,0.8)" : C.muted,
              marginBottom: 6,
            }}>{d}</div>
            <div style={{
              fontSize: 20, fontWeight: 800,
              color: isToday ? C.white : (val > 0 ? C.navy : C.muted),
            }}>{val > 0 ? val : "—"}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── STAT PILL ──────────────────────────────────────────────
function StatPill({ label, value, accent }) {
  return (
    <div style={{
      background: C.white,
      border: `1.5px solid ${C.border}`,
      borderRadius: 12,
      padding: "12px 20px",
      textAlign: "center",
      minWidth: 90,
      boxShadow: "0 1px 6px rgba(20,189,172,0.05)",
    }}>
      <div style={{ ...S.label, marginBottom: 4 }}>{label}</div>
      <div style={{
        fontSize: 24, fontWeight: 800,
        color: accent ? C.teal : C.navy,
        fontFamily: "'Arial Black', sans-serif",
      }}>{value}</div>
    </div>
  );
}

// ── GAME CARD (playing card) ───────────────────────────────
function GameCard({ card, isFlipped, isMatched, onClick, disabled }) {
  const front = {
    position: "absolute", inset: 0,
    backfaceVisibility: "hidden",
    borderRadius: 14,
    background: isMatched
      ? `linear-gradient(135deg, ${C.tealLight} 0%, #ccf5ef 100%)`
      : `linear-gradient(135deg, #eaf6fb 0%, #d8eef7 100%)`,
    border: `2px solid ${isMatched ? C.teal : "#9dd4e8"}`,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 44,
    boxShadow: isMatched ? `0 4px 14px rgba(20,189,172,0.3)` : "0 2px 8px rgba(20,189,172,0.07)",
    transform: "rotateY(180deg)",
    transition: "all 0.3s",
  };
  const back = {
    position: "absolute", inset: 0,
    backfaceVisibility: "hidden",
    borderRadius: 14,
    background: "linear-gradient(135deg, #e2eff5 0%, #cde4ef 100%)",
    border: `2px solid ${C.border}`,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 28, color: C.muted,
    boxShadow: "0 2px 8px rgba(20,189,172,0.07)",
    cursor: disabled || isFlipped || isMatched ? "default" : "pointer",
  };
  return (
    <div
      onClick={() => !disabled && !isFlipped && !isMatched && onClick(card)}
      style={{ width: 108, height: 108, perspective: 700, userSelect: "none" }}
    >
      <div style={{
        width: "100%", height: "100%",
        position: "relative", transformStyle: "preserve-3d",
        transition: "transform 0.45s cubic-bezier(.4,2,.55,1)",
        transform: isFlipped || isMatched ? "rotateY(180deg)" : "rotateY(0deg)",
      }}>
        <div style={back}>?</div>
        <div style={front}>{card.emoji}</div>
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ─────────────────────────────────────────
export default function MemoryGame({ onScoreSave }) {
  const t = useTranslate({
    games_title: 'Memory Match Game',
    games_subtitle: 'Cognitive Training',
    games_how_to_play: 'How to Play',
    games_start: 'Start Game',
    games_play_again: 'Play Again',
    games_quit: 'Quit Game',
    games_moves: 'Moves',
    games_time: 'Time',
    games_pairs: 'Pairs',
    games_progress: 'Progress',
    games_find_pairs: 'Find the Pairs',
    games_tap_to_flip: 'Tap to Flip',
    games_complete: 'Game Complete',
    games_score_saved: 'Score saved to your report',
    games_tip: 'Tip: Remember where each card is!',
    games_clinical_note: 'This exercise supports short-term memory and cognitive health tracking.',
    games_excellent: 'Excellent',
    games_good_work: 'Good Work',
    games_keep_trying: 'Keep Trying',
  });
  const [screen, setScreen] = useState("start");

  const [deck, setDeck] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [locked, setLocked] = useState(false);
  const [score, setScore] = useState(0);
  const [shake, setShake] = useState(null);
  const [weekScores, setWeekScores] = useState([0, 0, 0, 0, 0, 0, 0]);
  const timerRef = useRef(null);

  useEffect(() => {
    if (screen === "playing") {
      timerRef.current = setInterval(() => setTime(t => t + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [screen]);

  useEffect(() => {
    if (matched.length === 6 && screen === "playing") {
      clearInterval(timerRef.current);
      const s = calcScore(moves, time);
      setScore(s);
      // update today's week score
      const today = new Date().getDay();
      const idx = today === 0 ? 6 : today - 1;
      setWeekScores(prev => {
        const n = [...prev]; n[idx] = s; return n;
      });
      setTimeout(() => {
        setScreen("result");
        onScoreSave?.({ game_name: "memory_match", score: s, moves, time_taken: time });
      }, 600);
    }
  }, [matched]);

  function startGame() {
    setDeck(createDeck());
    setFlipped([]); setMatched([]);
    setMoves(0); setTime(0);
    setLocked(false); setShake(null);
    setScreen("playing");
  }

  function handleClick(card) {
    if (locked) return;
    if (flipped.find(c => c.uid === card.uid)) return;
    const nf = [...flipped, card];
    setFlipped(nf);
    if (nf.length === 2) {
      setMoves(m => m + 1);
      setLocked(true);
      const [a, b] = nf;
      if (a.id === b.id) {
        setMatched(p => [...p, a.uid, b.uid]);
        setFlipped([]); setLocked(false);
      } else {
        setShake(a.uid);
        setTimeout(() => { setFlipped([]); setLocked(false); setShake(null); }, 900);
      }
    }
  }

  const isFlipped = c => !!(flipped.find(f => f.uid === c.uid) || matched.includes(c.uid));
  const isMatched = c => matched.includes(c.uid);
  const pairsFound = matched.length / 2;

  const resultMsg =
    score >= 90 ? `${t.games_excellent}! Outstanding memory.` :
      score >= 70 ? `${t.games_good_work}! Keep it up.` :
        score >= 50 ? "Well done! Practice more." :
          `${t.games_keep_trying}!`;

  const scoreColor = score >= 80 ? C.teal : score >= 50 ? C.amber : C.red;

  // ── START SCREEN ─────────────────────────────────────────
  if (screen === "start") return (
    <div style={S.page}>
      <div style={S.topBar}>
        <span style={S.topBarTitle}>{t.games_title}</span>
        <span style={S.topBarBadge}>{t.games_subtitle}</span>
      </div>

      <div style={S.content}>

        <WeekRow scores={weekScores} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={S.sectionHeading}>
            COGNITIVE TRAINING —&nbsp;<span style={S.accent}>MEMORY MATCH</span>
          </div>
          <span style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>
            3 PAIRS
          </span>
        </div>

        {/* How to play */}
        <div style={S.card}>
          <div style={S.label}>{t.games_how_to_play}</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12, marginBottom: 20 }}>
            {[
              ["🃏", "6 cards, 3 matching pairs"],
              ["👆", "Tap two cards to flip them"],
              ["✅", "Match all pairs to win"],
              ["⚡", "Fewer moves = higher score"],
            ].map(([icon, text]) => (
              <div key={text} style={{
                display: "flex", alignItems: "center", gap: 10,
                background: "#f4fafd", borderRadius: 10,
                padding: "10px 14px", border: `1px solid ${C.border}`,
              }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                <span style={{ fontSize: 13, color: C.textBody, fontWeight: 500 }}>{text}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button style={S.btnPrimary} onClick={startGame}>🎮 {t.games_start}</button>

            <span style={{ fontSize: 12, color: C.muted, fontStyle: "italic" }}>
              ~2 minutes to complete
            </span>
          </div>
        </div>

        {/* Clinical note */}
        <div style={{
          background: C.greenLight, border: `1.5px solid ${C.greenBorder}`,
          borderRadius: 12, padding: "12px 18px",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <span style={{ fontSize: 20 }}>🧠</span>
          <span style={{ fontSize: 13, color: C.green, fontWeight: 500 }}>
            {t.games_clinical_note}
          </span>

        </div>
      </div>
    </div>
  );

  // ── RESULT SCREEN ─────────────────────────────────────────
  if (screen === "result") return (
    <div style={S.page}>
      <div style={S.topBar}>
        <span style={S.topBarTitle}>{t.games_title} — Results</span>
        <span style={S.topBarBadge}>{t.games_complete}</span>
      </div>

      <div style={S.content}>

        <WeekRow scores={weekScores} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={S.sectionHeading}>
            GAME COMPLETE —&nbsp;
            <span style={{ ...S.accent, color: scoreColor }}>
              {score >= 80 ? t.games_excellent.toUpperCase() : score >= 60 ? t.games_good_work.toUpperCase() : t.games_keep_trying.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Score card */}
        <div style={{ ...S.card, textAlign: "center" }}>
          <div style={{ fontSize: 52, marginBottom: 8 }}>
            {score >= 80 ? "🏆" : score >= 60 ? "🌟" : "💪"}
          </div>
          <div style={{
            fontSize: 76, fontWeight: 900,
            fontFamily: "'Arial Black', sans-serif",
            color: scoreColor, lineHeight: 1, marginBottom: 4,
          }}>{score}</div>
          <div style={{ ...S.label, textAlign: "center", marginBottom: 12 }}>Score out of 100</div>
          <div style={{
            fontSize: 15, color: C.textBody, fontWeight: 500, marginBottom: 24,
          }}>{resultMsg}</div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 20 }}>
            <StatPill label={t.games_moves} value={moves} />
            <StatPill label={t.games_time} value={formatTime(time)} />
            <StatPill label="Pairs" value="3 / 3" accent />
          </div>

          {/* Saved note */}
          <div style={{
            background: C.greenLight, border: `1.5px solid ${C.greenBorder}`,
            borderRadius: 10, padding: "10px 16px",
            fontSize: 13, color: C.green, marginBottom: 20,
            display: "flex", alignItems: "center", gap: 8, justifyContent: "center",
          }}>
            ✅ {t('games_score_saved')}

          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button style={S.btnPrimary} onClick={startGame}>🔄 {t.games_play_again}</button>
            <button style={S.btnSecondary} onClick={() => setScreen("start")}>🏠 Home</button>

          </div>
        </div>
      </div>
    </div>
  );

  // ── PLAYING SCREEN ────────────────────────────────────────
  return (
    <div style={S.page}>
      <div style={S.topBar}>
        <span style={S.topBarTitle}>{t.games_title} — Playing</span>
        <span style={S.topBarBadge}>{pairsFound} / 3 {t.games_pairs}</span>
      </div>

      <div style={S.content}>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <StatPill label={t.games_moves} value={moves} />
          <StatPill label={t.games_time} value={formatTime(time)} accent={time > 60} />

          {/* Progress bar pill */}
          <div style={{
            flex: 1, background: C.white,
            border: `1.5px solid ${C.border}`,
            borderRadius: 12, padding: "12px 20px",
            boxShadow: "0 1px 6px rgba(20,189,172,0.05)",
          }}>
            <div style={{ ...S.label, marginBottom: 8 }}>{t.games_progress}</div>

            <div style={{ height: 8, background: "#e2eff5", borderRadius: 999, overflow: "hidden", marginBottom: 8 }}>
              <div style={{
                height: "100%", borderRadius: 999,
                width: `${(matched.length / 6) * 100}%`,
                background: `linear-gradient(90deg, ${C.teal}, #34d399)`,
                transition: "width 0.5s ease",
              }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 13, height: 13, borderRadius: "50%",
                  background: pairsFound > i ? C.teal : "#e2eff5",
                  border: `2px solid ${pairsFound > i ? C.teal : C.border}`,
                  boxShadow: pairsFound > i ? `0 0 6px rgba(20,189,172,0.5)` : "none",
                  transition: "all 0.3s",
                }} />
              ))}
            </div>
          </div>
        </div>

        {/* Section heading */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={S.sectionHeading}>
            {t.games_find_pairs} —&nbsp;<span style={S.accent}>{t.games_tap_to_flip}</span>
          </div>

          <span style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: 2 }}>
            {6 - matched.length} CARDS LEFT
          </span>
        </div>

        {/* Cards */}
        <div style={S.card}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 108px)",
            gap: 16,
            justifyContent: "center",
            marginBottom: 20,
          }}>
            {deck.map(card => (
              <div key={card.uid} style={{
                animation: shake === card.uid ? "shake 0.4s ease" : "none",
              }}>
                <GameCard
                  card={card}
                  isFlipped={isFlipped(card)}
                  isMatched={isMatched(card)}
                  onClick={handleClick}
                  disabled={locked}
                />
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center" }}>
            <button
              style={{ ...S.btnSecondary, fontSize: 12, padding: "8px 18px", color: C.muted }}
              onClick={() => { clearInterval(timerRef.current); setScreen("start"); }}
            >
              ✕ {t.games_quit}

            </button>
          </div>
        </div>

        <div style={{ fontSize: 12, color: C.muted, textAlign: "center", fontStyle: "italic" }}>
          {t.games_tip}
        </div>

      </div>

      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-6px)}
          40%{transform:translateX(6px)}
          60%{transform:translateX(-4px)}
          80%{transform:translateX(4px)}
        }
      `}</style>
    </div>
  );
}
