// client/modules/reaction_time/reaction.js

let reactionTimes = [];
let questionStartTime = 0;

/**
 * Marks the start time for a question.
 */
export function startReactionTimer() {
    questionStartTime = Date.now();
}

/**
 * Calculates and stores the reaction time for the current question.
 * @returns {number} The reaction time in seconds.
 */
export function stopReactionTimer() {
    if (questionStartTime === 0) return 0;
    const timeTaken = (Date.now() - questionStartTime) / 1000;
    reactionTimes.push(timeTaken);
    questionStartTime = 0; // Reset for next question
    return timeTaken;
}

/**
 * Calculates the average reaction time from all stored measurements.
 * @returns {number} Average reaction time in seconds.
 */
export function getAverageReactionTime() {
    if (reactionTimes.length === 0) return 0;
    const sum = reactionTimes.reduce((a, b) => a + b, 0);
    return parseFloat((sum / reactionTimes.length).toFixed(2));
}

/**
 * Resets the reaction time records.
 */
export function resetReactionTimer() {
    reactionTimes = [];
    questionStartTime = 0;
}
