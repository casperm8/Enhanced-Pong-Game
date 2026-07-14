import { DeviceMotion } from '@capacitor/device-motion';
import { Haptics } from '@capacitor/haptics';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { GameSystem } from './game-system.js';
import { NetworkManager } from './network-manager.js';
import { UIManager } from './ui-manager.js';

class EnhancedPongGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Initialize core systems
        this.gameSystem = new GameSystem(this.canvas);
        this.uiManager = new UIManager();
        this.networkManager = null;
        
        // Control state
        this.controlMode = 'touch';
        this.mouseY = this.canvas.height / 2;
        this.tiltX = 0;
        this.keys = {};
        
        this.initialize();
    }
    
    async initialize() {
        await ScreenOrientation.lock({ orientation: 'landscape' });
        this.attachEventListeners();
        this.startAccelerometerListening();
        this.handleCanvasResize();
        window.addEventListener('resize', () => this.handleCanvasResize());
        
        // Show main menu
        this.showMainMenu();
        this.draw();
    }
    
    handleCanvasResize() {
        const maxWidth = window.innerWidth * 0.95;
        const maxHeight = window.innerHeight * 0.65;
        
        const scale = Math.min(
            maxWidth / this.canvas.width,
            maxHeight / this.canvas.height,
            1
        );
        
        this.canvas.style.width = (this.canvas.width * scale) + 'px';
        this.canvas.style.height = (this.canvas.height * scale) + 'px';
    }
    
    async startAccelerometerListening() {
        try {
            await DeviceMotion.addListener('acceleration', (event) => {
                this.tiltX = event.acceleration.x || 0;
            });
        } catch (error) {
            console.log('Accelerometer not available');
        }
    }
    
    attachEventListeners() {
        // Keyboard
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (e.key === ' ' && !this.gameSystem.gameRunning) {
                e.preventDefault();
                this.startGame();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        // Touch
        this.canvas.addEventListener('touchmove', (e) => {
            if (this.controlMode === 'touch') {
                e.preventDefault();
                const rect = this.canvas.getBoundingClientRect();
                this.mouseY = e.touches[0].clientY - rect.top;
            }
        });
        
        // Mouse
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.controlMode === 'touch') {
                const rect = this.canvas.getBoundingClientRect();
                this.mouseY = e.clientY - rect.top;
            }
        });
        
        // UI Events
        document.addEventListener('startQuickplay', () => this.startQuickplay());
        document.addEventListener('startCampaignLevel', (e) => this.startCampaign(e.detail.level));
        document.addEventListener('matchFound', (e) => this.startOnlineGame(e.detail));
    }
    
    showMainMenu() {
        const html = `
            <div class="main-menu">
                <h1>🎮 PONG</h1>
                <div class="menu-buttons">
                    <button class="menu-btn" onclick="window.dispatchEvent(new CustomEvent('startQuickplay'))">⚡ Quick Play</button>
                    <button class="menu-btn" onclick="window.dispatchEvent(new CustomEvent('showCampaign'))">🎯 Campaign</button>
                    <button class="menu-btn" onclick="window.dispatchEvent(new CustomEvent('showOnline'))">🌐 Online PvP</button>
                    <button class="menu-btn" onclick="window.dispatchEvent(new CustomEvent('showSettings'))">⚙️ Settings</button>
                </div>
            </div>
        `;
        this.uiManager.renderScreen(html);
    }
    
    startQuickplay() {
        this.gameSystem.gameMode = 'quickplay';
        this.gameSystem.difficulty = 'medium';
        this.gameSystem.resetGame();
        this.gameSystem.gameRunning = true;
        this.gameLoop();
    }
    
    startCampaign(level) {
        const config = this.gameSystem.startCampaignLevel(level);
        this.uiManager.showCampaignLevelScreen(level, config.targetScore);
        this.gameSystem.gameRunning = true;
        this.gameLoop();
    }
    
    async startOnlineGame() {
        if (!this.networkManager) {
            this.networkManager = new NetworkManager();
            try {
                await this.networkManager.connect();
            } catch (error) {
                this.updateStatusMessage('Connection failed');
                return;
            }
        }
        
        this.gameSystem.gameMode = 'online';
        this.gameSystem.resetGame();
        this.gameSystem.gameRunning = true;
        this.gameLoop();
    }
    
    startGame() {
        if (!this.gameSystem.gameRunning) {
            this.gameSystem.gameRunning = true;
            this.triggerHaptic('medium');
            this.gameLoop();
        }
    }
    
    async triggerHaptic(intensity = 'light') {
        try {
            await Haptics.impact({ style: intensity });
        } catch (error) {
            // Haptics not available
        }
    }
    
    updatePlayer() {
        if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) {
            this.gameSystem.player.dy = -this.gameSystem.player.speed;
        } else if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) {
            this.gameSystem.player.dy = this.gameSystem.player.speed;
        } else {
            this.gameSystem.player.dy = 0;
        }
        
        if (this.controlMode === 'touch') {
            this.gameSystem.updatePlayerPaddle(this.mouseY);
        } else {
            // Tilt control
            const tiltSensitivity = 0.5;
            const targetY = this.canvas.height / 2 + (this.tiltX * tiltSensitivity * 20) - this.gameSystem.player.height / 2;
            const diff = targetY - this.gameSystem.player.y;
            if (Math.abs(diff) > 2) {
                this.gameSystem.player.y += diff * 0.2;
            }
            this.gameSystem.player.y = Math.max(0, Math.min(this.canvas.height - this.gameSystem.player.height, this.gameSystem.player.y));
        }
    }
    
    updateGame() {
        this.updatePlayer();
        
        if (this.gameSystem.gameMode === 'online' && this.networkManager?.connected) {
            this.networkManager.syncGameState(
                this.gameSystem.player.y,
                this.gameSystem.player.speed
            );
        } else {
            this.gameSystem.updateOpponentPaddle();
        }
        
        const event = this.gameSystem.updateBall();
        
        if (event.type === 'wallHit') {
            this.triggerHaptic('light');
        } else if (event.type === 'paddleHit') {
            this.triggerHaptic('medium');
        } else if (event.type === 'score') {
            this.triggerHaptic('heavy');
            
            // Campaign level check
            if (this.gameSystem.gameMode === 'campaign') {
                const targetScore = this.gameSystem.getCampaignLevelTarget(this.gameSystem.campaignLevel);
                if (this.gameSystem.playerScore >= targetScore) {
                    const result = this.gameSystem.completeCampaignLevel();
                    if (result.completed) {
                        this.gameSystem.gameRunning = false;
                        this.uiManager.showGameResult({
                            playerScore: this.gameSystem.playerScore,
                            opponentScore: this.gameSystem.opponentScore,
                            bounceCount: this.gameSystem.bounceCount,
                            duration: 'N/A',
                            victory: true
                        });
                    }
                }
            }
        }
        
        this.updateUI();
    }
    
    updateUI() {
        const state = this.gameSystem.getGameState();
        document.getElementById('playerScore').textContent = this.gameSystem.playerScore;
        document.getElementById('computerScore').textContent = this.gameSystem.opponentScore;
        document.getElementById('ballSpeed').textContent = state.ballSpeed;
        document.getElementById('bounceCount').textContent = state.bounceCount;
    }
    
    draw() {
        const g = this.gameSystem;
        
        // Background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#0f2847');
        gradient.addColorStop(1, '#0a1428');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Center line
        this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
        this.ctx.setLineDash([10, 10]);
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Paddles
        this.drawPaddle(g.player, '#10b981');
        this.drawPaddle(g.opponent, '#ef4444');
        
        // Ball
        this.drawBall(g.ball);
        
        // Corner decorations
        this.drawCornerDecorations();
    }
    
    drawPaddle(paddle, color) {
        this.ctx.fillStyle = color;
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 15;
        this.ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
        this.ctx.shadowBlur = 0;
        
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(paddle.x, paddle.y, paddle.width, paddle.height);
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(paddle.x + 1, paddle.y + 1, paddle.width - 2, paddle.height - 2);
    }
    
    drawBall(ball) {
        const gradient = this.ctx.createRadialGradient(
            ball.x, ball.y, 0,
            ball.x, ball.y, ball.radius * 2.5
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0.3)');
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(ball.x, ball.y, ball.radius * 2.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#3b82f6';
        this.ctx.shadowColor = '#3b82f6';
        this.ctx.shadowBlur = 20;
        this.ctx.beginPath();
        this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.beginPath();
        this.ctx.arc(ball.x - 2, ball.y - 2, ball.radius * 0.4, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawCornerDecorations() {
        const decoration = 20;
        this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
        this.ctx.lineWidth = 2;
        
        const corners = [
            [[0, decoration], [0, 0], [decoration, 0]],
            [[this.canvas.width - decoration, 0], [this.canvas.width, 0], [this.canvas.width, decoration]],
            [[0, this.canvas.height - decoration], [0, this.canvas.height], [decoration, this.canvas.height]],
            [[this.canvas.width - decoration, this.canvas.height], [this.canvas.width, this.canvas.height], [this.canvas.width, this.canvas.height - decoration]]
        ];
        
        corners.forEach(corner => {
            this.ctx.beginPath();
            this.ctx.moveTo(...corner[0]);
            this.ctx.lineTo(...corner[1]);
            this.ctx.lineTo(...corner[2]);
            this.ctx.stroke();
        });
    }
    
    updateStatusMessage(message) {
        const el = document.getElementById('statusMessage');
        if (el) {
            el.textContent = message;
            el.classList.remove('pulse');
            setTimeout(() => el.classList.add('pulse'), 10);
        }
    }
    
    gameLoop() {
        if (this.gameSystem.gameRunning) {
            this.updateGame();
        }
        
        this.draw();
        
        if (this.gameSystem.gameRunning) {
            requestAnimationFrame(() => this.gameLoop());
        }
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    new EnhancedPongGame();
});
