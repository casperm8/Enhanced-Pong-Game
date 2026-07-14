require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

// Import routes
const authRoutes = require('./src/routes/auth');
const playerRoutes = require('./src/routes/players');
const leaderboardRoutes = require('./src/routes/leaderboard');
const matchRoutes = require('./src/routes/matches');

// Import WebSocket handler
const setupWebSocket = require('./src/wsServer');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;
const WS_PORT = process.env.WS_PORT || 8080;

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later'
});
app.use('/api/', limiter);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pong')
  .then(() => console.log('✓ MongoDB connected'))
  .catch(err => {
    console.error('✗ MongoDB connection failed:', err);
    process.exit(1);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/matches', matchRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// WebSocket server
const wss = new WebSocket.Server({ noServer: true });
setupWebSocket(wss);

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message,
      status: err.status || 500
    }
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`\n🎮 Pong Server Running`);
  console.log(`   HTTP: http://localhost:${PORT}`);
  console.log(`   WS:   ws://localhost:${WS_PORT}`);
  console.log(`   Mode: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
