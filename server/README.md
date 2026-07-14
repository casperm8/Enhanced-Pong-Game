# Backend Server Setup - Pong Mobile Multiplayer

This directory contains the Node.js backend server for online multiplayer, matchmaking, and leaderboards.

## Prerequisites

- Node.js 14+
- npm or yarn
- MongoDB (local or Atlas cloud)
- Redis (optional, for caching)

## Installation

```bash
npm install
```

## Environment Configuration

Create `.env` file:

```env
NODE_ENV=development
PORT=3001
WS_PORT=8080

# Database
MONGODB_URI=mongodb://localhost:27017/pong
MONGODB_ATLAS=mongodb+srv://user:password@cluster.mongodb.net/pong

# Redis (optional)
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRY=7d

# CORS
CORS_ORIGIN=*

# Environment
DEBUG=true
```

## Project Structure

```
server/
├── src/
│   ├── app.js                 # Express app setup
│   ├── wsServer.js            # WebSocket server
│   ├── routes/
│   │   ├── auth.js            # Authentication
│   │   ├── players.js         # Player profiles
│   │   ├── matches.js         # Match history
│   │   └── leaderboard.js     # Rankings
│   ├── controllers/
│   │   ├── matchmakingCtrl.js # Matchmaking logic
│   │   ├── gameCtrl.js        # Game state management
│   │   └── userCtrl.js        # User management
│   ├── models/
│   │   ├── User.js            # User schema
│   │   ├── Match.js           # Match history
│   │   └── Stats.js           # Player statistics
│   ├── middleware/
│   │   ├── auth.js            # JWT verification
│   │   ├── errorHandler.js    # Error handling
│   │   └── logger.js          # Request logging
│   └── utils/
│       ├── db.js              # Database connection
│       ├── matchmaking.js     # Matchmaking algorithm
│       └── rating.js          # ELO calculation
├── .env
├── package.json
└── server.js                  # Entry point
```

## Running the Server

### Development

```bash
npm run dev
```

Server runs on:
- HTTP: `http://localhost:3001`
- WebSocket: `ws://localhost:8080`

### Production

```bash
npm start
```

## API Endpoints

### Authentication

**POST /api/auth/register**
```json
{
  "username": "player1",
  "email": "player@example.com",
  "password": "secure-password"
}
```
Response:
```json
{
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "username": "player1",
    "email": "player@example.com"
  }
}
```

**POST /api/auth/login**
```json
{
  "email": "player@example.com",
  "password": "secure-password"
}
```

**POST /api/auth/guest**
Create temporary guest account.

### Players

**GET /api/players/:id**
Get player profile.

Response:
```json
{
  "id": "user-id",
  "username": "player1",
  "elo": 1200,
  "wins": 10,
  "losses": 5,
  "winRate": 0.667,
  "totalMatches": 15,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**PUT /api/players/:id**
Update player profile.

### Leaderboard

**GET /api/leaderboard**
Get global leaderboard.

Query parameters:
- `limit` (default: 50)
- `offset` (default: 0)
- `period` (week|month|alltime, default: alltime)

Response:
```json
{
  "players": [
    {
      "rank": 1,
      "username": "ProPlayer",
      "elo": 1850,
      "wins": 120,
      "losses": 30
    },
    ...
  ],
  "total": 5000
}
```

**GET /api/leaderboard/regional/:region**
Regional leaderboard.

### Matches

**GET /api/matches/:id**
Get match details.

Response:
```json
{
  "id": "match-id",
  "player1": { "id": "user1", "username": "player1", "score": 7 },
  "player2": { "id": "user2", "username": "player2", "score": 5 },
  "winner": "user1",
  "duration": 180,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**GET /api/players/:id/matches**
Get player match history.

## WebSocket Events

### Client → Server

**matchmaking:find**
```json
{
  "type": "matchmaking:find",
  "playerId": "user-id",
  "gameMode": "standard",
  "difficulty": "medium"
}
```

**room:create**
```json
{
  "type": "room:create",
  "playerId": "user-id",
  "difficulty": "medium",
  "isPrivate": true
}
```

**room:join**
```json
{
  "type": "room:join",
  "playerId": "user-id",
  "roomId": "room-123"
}
```

**game:sync**
```json
{
  "type": "game:sync",
  "playerId": "user-id",
  "roomId": "room-123",
  "playerY": 150,
  "paddleSpeed": 6,
  "timestamp": 1234567890
}
```

### Server → Client

**matchmaking:found**
```json
{
  "type": "matchmaking:found",
  "roomId": "room-123",
  "opponentId": "user-2",
  "opponentUsername": "player2",
  "startTime": 1234567890
}
```

**room:created**
```json
{
  "type": "room:created",
  "roomId": "room-123",
  "roomCode": "ABCDEF",
  "shareUrl": "pong://join/ABCDEF"
}
```

**game:start**
```json
{
  "type": "game:start",
  "roomId": "room-123",
  "player1": { "id": "user-1", "username": "player1" },
  "player2": { "id": "user-2", "username": "player2" },
  "startTime": 1234567890
}
```

**opponentMove**
```json
{
  "type": "game:sync",
  "playerId": "user-2",
  "playerY": 175,
  "timestamp": 1234567890
}
```

**game:ended**
```json
{
  "type": "game:ended",
  "winner": "user-1",
  "loser": "user-2",
  "player1Score": 7,
  "player2Score": 5,
  "duration": 180,
  "eloGain": 15,
  "eloLoss": -15
}
```

## Database Schema

### User
```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  passwordHash: String,
  profile: {
    avatar: String,
    bio: String,
    region: String
  },
  stats: {
    elo: Number (default: 1200),
    wins: Number (default: 0),
    losses: Number (default: 0),
    totalMatches: Number,
    winRate: Number,
    streak: Number
  },
  settings: {
    controlMode: String,
    defaultDifficulty: String,
    hapticsEnabled: Boolean,
    soundEnabled: Boolean
  },
  createdAt: Date,
  updatedAt: Date,
  lastLogin: Date
}
```

### Match
```javascript
{
  _id: ObjectId,
  roomId: String,
  player1Id: ObjectId,
  player2Id: ObjectId,
  player1Score: Number,
  player2Score: Number,
  winner: ObjectId,
  loser: ObjectId,
  duration: Number,
  gameMode: String,
  difficulty: String,
  eloGain: Number,
  eloLoss: Number,
  createdAt: Date
}
```

### Room
```javascript
{
  _id: ObjectId,
  roomCode: String,
  host: ObjectId,
  guest: ObjectId,
  difficulty: String,
  isPrivate: Boolean,
  status: String (waiting|playing|ended),
  createdAt: Date,
  expiresAt: Date
}
```

## ELO Rating System

ELO calculation based on:
- Player ratings
- Match duration
- Score differential
- K-factor (default: 32)

```
Expected Score = 1 / (1 + 10^((opponent elo - player elo) / 400))
ELO Change = K * (actual score - expected score)
```

Minimum gain/loss: ±1
Maximum gain/loss: ±64

## Matchmaking Algorithm

1. Players queue with skill preference
2. Server finds opponents within ELO range:
   - 0-100 seconds: ±200 ELO
   - 100-300 seconds: ±500 ELO
   - 300+ seconds: any opponent
3. Creates room and starts game
4. Updates stats on match end

## Deployment

### Docker

```bash
docker build -t pong-server .
docker run -p 3001:3001 -p 8080:8080 pong-server
```

### Heroku

```bash
heroku create pong-game
git push heroku main
heroku config:set MONGODB_URI=...
```

### AWS/GCP/Azure

See deployment guides in `/docs` folder.

## Monitoring

- Logs: `pm2 logs`
- Dashboard: `pm2 monit`
- Error tracking: Sentry integration
- Performance: New Relic/DataDog

## Security

- JWT authentication
- Rate limiting (100 req/min per IP)
- CORS enabled for mobile domains
- Input validation & sanitization
- SQL injection protection
- XSS prevention

## Troubleshooting

**Connection refused**
- Check MongoDB is running
- Verify network connectivity

**Matchmaking timeout**
- Check player queue size
- Verify WebSocket server is healthy

**High latency**
- Monitor server resources
- Consider adding geo-distributed servers

## License

GNU General Public License v3.0
