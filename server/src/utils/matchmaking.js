const { v4: uuidv4 } = require('uuid');

class MatchmakingQueue {
  constructor() {
    this.queues = new Map();
    this.rooms = new Map();
  }

  addPlayer(player) {
    const { gameMode = 'standard', difficulty = 'medium', elo = 1200 } = player;
    const key = `${gameMode}-${difficulty}`;
    
    if (!this.queues.has(key)) {
      this.queues.set(key, []);
    }
    
    this.queues.get(key).push({ ...player, joinedAt: Date.now() });
  }

  findMatch(player) {
    const { gameMode = 'standard', difficulty = 'medium', elo = 1200, playerId } = player;
    const key = `${gameMode}-${difficulty}`;
    const queue = this.queues.get(key) || [];
    
    const waitTime = Date.now() - player.joinedAt;
    let eloRange = 200; // Initial range
    
    if (waitTime > 100000) eloRange = 500;
    if (waitTime > 300000) eloRange = 9999; // Any opponent
    
    // Find opponent
    const opponent = queue.find(p => 
      p.playerId !== playerId && 
      Math.abs(p.elo - elo) <= eloRange
    );
    
    if (opponent) {
      // Create room
      const roomId = uuidv4();
      const roomCode = this.generateRoomCode();
      
      this.rooms.set(roomId, {
        roomId,
        roomCode,
        player1: player,
        player2: opponent,
        difficulty,
        status: 'playing',
        createdAt: Date.now()
      });
      
      // Remove from queue
      const idx = queue.indexOf(opponent);
      queue.splice(idx, 1);
      
      return { roomId, roomCode, opponent };
    }
    
    return null;
  }

  generateRoomCode() {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
  }

  removePlayer(playerId) {
    for (const queue of this.queues.values()) {
      const idx = queue.findIndex(p => p.playerId === playerId);
      if (idx !== -1) {
        queue.splice(idx, 1);
        break;
      }
    }
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  endRoom(roomId) {
    this.rooms.delete(roomId);
  }

  getStats() {
    let totalQueued = 0;
    for (const queue of this.queues.values()) {
      totalQueued += queue.length;
    }
    return {
      totalQueued,
      activeRooms: this.rooms.size,
      queuesByMode: Object.fromEntries(this.queues)
    };
  }
}

module.exports = MatchmakingQueue;
