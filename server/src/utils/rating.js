/**
 * ELO Rating Calculator
 * Implements standard chess ELO rating system
 */

const K_FACTOR = 32; // Rating factor
const MIN_CHANGE = 1;
const MAX_CHANGE = 64;

function calculateExpectedScore(playerElo, opponentElo) {
  const diff = opponentElo - playerElo;
  return 1 / (1 + Math.pow(10, diff / 400));
}

function calculateEloChange(playerElo, opponentElo, actualScore, matchDuration) {
  const expectedScore = calculateExpectedScore(playerElo, opponentElo);
  let eloChange = K_FACTOR * (actualScore - expectedScore);
  
  // Adjust based on match duration (shorter matches = less change)
  const durationFactor = Math.min(matchDuration / 300, 1); // Max 5 minutes
  eloChange *= durationFactor;
  
  // Clamp between min and max
  eloChange = Math.max(MIN_CHANGE, Math.min(MAX_CHANGE, eloChange));
  
  return Math.round(eloChange);
}

function calculateMatchResult(player1, player2, player1Score, player2Score, duration) {
  const player1Won = player1Score > player2Score;
  const actualScore = player1Won ? 1 : 0;
  
  const player1EloChange = calculateEloChange(
    player1.elo,
    player2.elo,
    actualScore,
    duration
  );
  
  const player2EloChange = calculateEloChange(
    player2.elo,
    player1.elo,
    1 - actualScore,
    duration
  );
  
  return {
    player1: {
      eloChange: player1EloChange,
      newElo: player1.elo + player1EloChange,
      won: player1Won
    },
    player2: {
      eloChange: player2EloChange,
      newElo: player2.elo + player2EloChange,
      won: !player1Won
    }
  };
}

module.exports = {
  calculateExpectedScore,
  calculateEloChange,
  calculateMatchResult
};
