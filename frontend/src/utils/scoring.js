// Cognitive scoring — ported from modules/cognitive_scoring/scoring.js

export function calculateTotalScore(orientation, memory, executive) {
    return orientation + memory + executive;
}

export function determineRiskLevel(totalScore, avgReactionTime) {
    let risk = 'Low';
    if (totalScore >= 25) risk = 'Low';
    else if (totalScore >= 15) risk = 'Moderate';
    else risk = 'High';

    if (avgReactionTime > 3) {
        if (risk === 'Low') risk = 'Moderate';
        else if (risk === 'Moderate') risk = 'High';
    }
    return risk;
}

export function getFinalOutput(scores, avgRT) {
    const total = calculateTotalScore(scores.orientation, scores.memory, scores.executive);
    const risk = determineRiskLevel(total, avgRT);
    return {
        orientation_score: scores.orientation,
        memory_score: scores.memory,
        executive_score: scores.executive,
        total_score: total,
        average_reaction_time: avgRT,
        final_risk_level: risk,
    };
}

// Reaction time tracker (module-level state)
let reactionTimes = [];
let questionStartTime = 0;

export function startReactionTimer() {
    questionStartTime = Date.now();
}

export function stopReactionTimer() {
    if (questionStartTime === 0) return 0;
    const timeTaken = (Date.now() - questionStartTime) / 1000;
    reactionTimes.push(timeTaken);
    questionStartTime = 0;
    return timeTaken;
}

export function getAverageReactionTime() {
    if (reactionTimes.length === 0) return 0;
    const sum = reactionTimes.reduce((a, b) => a + b, 0);
    return parseFloat((sum / reactionTimes.length).toFixed(2));
}

export function resetReactionTimer() {
    reactionTimes = [];
    questionStartTime = 0;
}
