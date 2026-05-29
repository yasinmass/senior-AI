// client/modules/cognitive_scoring/scoring.js

/**
 * Calculates domain scores (Orientation, Memory, Executive).
 * Each domain has 5 questions, each worth 2 marks.
 */

export function calculateOrientationScore(correctCount) {
    return correctCount * 2; // max 10
}

export function calculateMemoryScore(correctCount) {
    return correctCount * 2; // max 10
}

export function calculateExecutiveScore(correctCount) {
    return correctCount * 2; // max 10
}

export function calculateTotalScore(orientation, memory, executive) {
    return orientation + memory + executive; // max 30
}

/**
 * Determines risk level based on total score and average reaction time.
 * @param {number} totalScore 
 * @param {number} avgReactionTime 
 * @returns {string} Risk Level (Low, Moderate, High)
 */
export function determineRiskLevel(totalScore, avgReactionTime) {
    let risk = "Low";

    if (totalScore >= 25) {
        risk = "Low";
    } else if (totalScore >= 15) {
        risk = "Moderate";
    } else {
        risk = "High";
    }

    // Adjust risk based on reaction time
    if (avgReactionTime > 3) {
        if (risk === "Low") {
            risk = "Moderate";
        } else if (risk === "Moderate") {
            risk = "High";
        }
        // If already High, it stays High
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
        final_risk_level: risk
    };
}
