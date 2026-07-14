const WebSocket = require('ws');
const MatchmakingQueue = require('./utils/matchmaking');
const { calculateMatchResult } = require('./utils/rating');

const matchmakingQueue = new MatchmakingQueue();
const playerConnections = new Map(); // playerId -> ws
const roomStates = new Map(); // roomId -> gameState

function setupWebSocket(wss) {
  wss.on('connection', (ws) => {
    let playerId = null;
    let roomId = null;

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data);
        console.log(`[WS] ${message.type} from ${playerId}`);

        switch (message.type) {
          case 'auth':
            playerId = message.playerId;
            playerConnections.set(playerId, ws);
            ws.send(JSON.stringify({ type: 'auth:success', playerId }));
            break;

          case 'matchmaking:find':
            handleMatchmakingFind(ws, message, playerId);
            break;

          case 'room:create':
            handleCreateRoom(ws, message, playerId);
            break;

          case 'room:join':
            handleJoinRoom(ws, message, playerId);
            break;

          case 'game:sync':
            handleGameSync(message, roomId);
            break;

          case 'game:end':
            handleGameEnd(message, playerId);
            break;

          case 'game:disconnect':
            handleGameDisconnect(playerId, roomId);
            break;
        }
      } catch (error) {
        console.error('[WS] Error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: error.message
        }));
      }
    });

    ws.on('close', () => {
      if (playerId) {
        playerConnections.delete(playerId);
        matchmakingQueue.removePlayer(playerId);
      }
    });
  });
}

function handleMatchmakingFind(ws, message, playerId) {
  matchmakingQueue.addPlayer({
    playerId,
    gameMode: message.gameMode,
    difficulty: message.difficulty,
    elo: message.elo || 1200,
    joinedAt: Date.now()
  });

  // Attempt to find match
  const matchCheckInterval = setInterval(() => {
    const player = {
      playerId,
      gameMode: message.gameMode,
      difficulty: message.difficulty,
      elo: message.elo || 1200,
      joinedAt: Date.now()
    };

    const match = matchmakingQueue.findMatch(player);
    if (match) {
      clearInterval(matchCheckInterval);
      
      // Notify both players
      const opponentWs = playerConnections.get(match.opponent.playerId);
      const roomId = match.roomId;
      
      ws.send(JSON.stringify({
        type: 'matchmaking:found',
        roomId: match.roomId,
        roomCode: match.roomCode,
        opponentId: match.opponent.playerId,
        startTime: Date.now()
      }));
      
      if (opponentWs) {
        opponentWs.send(JSON.stringify({
          type: 'matchmaking:found',
          roomId: match.roomId,
          roomCode: match.roomCode,
          opponentId: playerId,
          startTime: Date.now()
        }));
      }

      // Initialize room state
      roomStates.set(roomId, {
        roomId,
        player1: { id: playerId, score: 0 },
        player2: { id: match.opponent.playerId, score: 0 },
        startTime: Date.now()
      });
    }
  }, 1000);

  // Timeout after 5 minutes
  setTimeout(() => {
    clearInterval(matchCheckInterval);
    matchmakingQueue.removePlayer(playerId);
  }, 300000);
}

function handleCreateRoom(ws, message, playerId) {
  const roomId = require('uuid').v4();
  const roomCode = Math.random().toString(36).substr(2, 6).toUpperCase();

  roomStates.set(roomId, {
    roomId,
    roomCode,
    host: playerId,
    guest: null,
    difficulty: message.difficulty,
    isPrivate: message.isPrivate,
    status: 'waiting',
    createdAt: Date.now()
  });

  ws.send(JSON.stringify({
    type: 'room:created',
    roomId,
    roomCode,
    shareUrl: `pong://join/${roomCode}`
  }));
}

function handleJoinRoom(ws, message, playerId) {
  const room = roomStates.get(message.roomId);
  
  if (!room) {
    ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
    return;
  }

  room.guest = playerId;
  room.status = 'playing';

  // Notify both players
  const hostWs = playerConnections.get(room.host);
  const startTime = Date.now();

  ws.send(JSON.stringify({
    type: 'game:start',
    roomId: message.roomId,
    player1: { id: room.host },
    player2: { id: playerId },
    startTime
  }));

  if (hostWs) {
    hostWs.send(JSON.stringify({
      type: 'game:start',
      roomId: message.roomId,
      player1: { id: room.host },
      player2: { id: playerId },
      startTime
    }));
  }

  roomStates.set(message.roomId, room);
}

function handleGameSync(message, roomId) {
  const room = roomStates.get(message.roomId);
  if (!room) return;

  const opponent = message.playerId === room.player1?.id ? room.player2?.id : room.player1?.id;
  const opponentWs = playerConnections.get(opponent);

  if (opponentWs) {
    opponentWs.send(JSON.stringify({
      type: 'game:sync',
      playerId: message.playerId,
      playerY: message.playerY,
      timestamp: message.timestamp
    }));
  }
}

function handleGameEnd(message, playerId) {
  const room = roomStates.get(message.roomId);
  if (!room) return;

  const winner = message.winner === message.playerId;
  const opponentId = message.playerId === room.player1?.id ? room.player2?.id : room.player1?.id;
  const opponentWs = playerConnections.get(opponentId);

  if (opponentWs) {
    opponentWs.send(JSON.stringify({
      type: 'game:ended',
      winner: message.winner,
      loser: message.loser,
      player1Score: message.player1Score,
      player2Score: message.player2Score,
      duration: message.duration,
      eloGain: message.eloGain,
      eloLoss: message.eloLoss
    }));
  }

  roomStates.delete(message.roomId);
}

function handleGameDisconnect(playerId, roomId) {
  if (roomId) {
    roomStates.delete(roomId);
  }
  playerConnections.delete(playerId);
}

module.exports = setupWebSocket;
