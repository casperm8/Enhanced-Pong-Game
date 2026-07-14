/**
 * Network Manager - Handles online multiplayer via WebSockets
 * Manages connection, synchronization, and matchmaking
 */

export class NetworkManager {
    constructor(config = {}) {
        this.serverUrl = config.serverUrl || 'wss://pong-server.example.com';
        this.ws = null;
        this.connected = false;
        this.playerId = null;
        this.roomId = null;
        this.opponentId = null;
        this.lastSyncTime = 0;
        this.syncInterval = 50; // ms between sync packets
        
        this.listeners = {};
    }
    
    connect() {
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(this.serverUrl);
                
                this.ws.onopen = () => {
                    this.connected = true;
                    this.playerId = this.generatePlayerId();
                    this.emit('connected', { playerId: this.playerId });
                    resolve(this.playerId);
                };
                
                this.ws.onmessage = (event) => {
                    this.handleMessage(JSON.parse(event.data));
                };
                
                this.ws.onerror = (error) => {
                    this.connected = false;
                    this.emit('error', error);
                    reject(error);
                };
                
                this.ws.onclose = () => {
                    this.connected = false;
                    this.emit('disconnected');
                };
            } catch (error) {
                reject(error);
            }
        });
    }
    
    generatePlayerId() {
        return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Matchmaking
    findMatch(gameMode = 'standard') {
        if (!this.connected) throw new Error('Not connected to server');
        
        this.send({
            type: 'matchmaking:find',
            playerId: this.playerId,
            gameMode,
            difficulty: 'medium'
        });
    }
    
    createPrivateRoom(difficulty = 'medium') {
        if (!this.connected) throw new Error('Not connected to server');
        
        this.send({
            type: 'room:create',
            playerId: this.playerId,
            difficulty,
            isPrivate: true
        });
    }
    
    joinRoom(roomId) {
        if (!this.connected) throw new Error('Not connected to server');
        
        this.roomId = roomId;
        this.send({
            type: 'room:join',
            playerId: this.playerId,
            roomId
        });
    }
    
    // Game synchronization
    syncGameState(playerY, paddleSpeed) {
        if (!this.connected || !this.roomId) return;
        
        const now = Date.now();
        if (now - this.lastSyncTime < this.syncInterval) return;
        
        this.lastSyncTime = now;
        this.send({
            type: 'game:sync',
            playerId: this.playerId,
            roomId: this.roomId,
            playerY,
            paddleSpeed,
            timestamp: now
        });
    }
    
    // Message handling
    handleMessage(data) {
        const { type } = data;
        
        switch (type) {
            case 'matchmaking:found':
                this.roomId = data.roomId;
                this.opponentId = data.opponentId;
                this.emit('matchFound', data);
                break;
            
            case 'room:created':
                this.roomId = data.roomId;
                this.emit('roomCreated', data);
                break;
            
            case 'room:joined':
                this.opponentId = data.opponentId;
                this.emit('opponentJoined', data);
                break;
            
            case 'game:start':
                this.emit('gameStart', data);
                break;
            
            case 'game:sync':
                this.emit('opponentMove', {
                    playerId: data.playerId,
                    playerY: data.playerY,
                    timestamp: data.timestamp
                });
                break;
            
            case 'game:ended':
                this.emit('gameEnded', data);
                break;
            
            case 'error':
                this.emit('networkError', data);
                break;
        }
    }
    
    send(data) {
        if (this.connected && this.ws) {
            this.ws.send(JSON.stringify(data));
        }
    }
    
    // Event system
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }
    
    off(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }
    
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }
    
    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }
}
