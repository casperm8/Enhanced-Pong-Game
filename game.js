class PongGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.gameRunning = false;
        this.gamePaused = false;
        this.difficulty = 'medium';
        this.bounceCount = 0;
        
        // Ball properties
        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            width: 10,
            height: 10,
            speedX: 5,
            speedY: 5,
            maxSpeed: 8,
            radius: 5
        };
        
        // Paddle properties
        this.paddleHeight = 80;
        this.paddleWidth = 10;
        
        this.player = {
            x: 10,
            y: this.canvas.height / 2 - this.paddleHeight / 2,
            width: this.paddleWidth,
            height: this.paddleHeight,
            speed: 6,
            dy: 0
        };
        
        this.computer = {
            x: this.canvas.width - this.paddleWidth - 10,
            y: this.canvas.height / 2 - this.paddleHeight / 2,
            width: this.paddleWidth,
            height: this.paddleHeight,
            speed: 4
        };
        
        // Scores
        this.playerScore = 0;
        this.computerScore = 0;
        
        // Input handling
        this.keys = {};
        this.mouseY = this.canvas.height / 2;
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        this.detectDevice();
        this.attachEventListeners();
        this.setupDifficultyLevels();
    }
    
    detectDevice() {
        const gameMode = document.getElementById('gameMode');
        const isTouchDevice = () => {
            return (('ontouchstart' in window) ||
                    (navigator.maxTouchPoints > 0) ||
                    (navigator.msMaxTouchPoints > 0));
        };
        
        if (isTouchDevice() || this.isMobile) {
            gameMode.textContent = 'Mobile Mode';
            document.querySelector('.mobile-controls').style.display = 'block';
            document.querySelector('.desktop-controls').style.display = 'none';
        } else {
            gameMode.textContent = 'Desktop Mode';
            document.querySelector('.mobile-controls').style.display = 'none';
            document.querySelector('.desktop-controls').style.display = 'block';
        }
    }
    
    setupDifficultyLevels() {
        this.difficultySettings = {
            easy: { computerSpeed: 2.5, ballMaxSpeed: 6, speedIncrease: 0.3 },
            medium: { computerSpeed: 4, ballMaxSpeed: 8, speedIncrease: 0.5 },
            hard: { computerSpeed: 5.5, ballMaxSpeed: 10, speedIncrease: 0.8 },
            insane: { computerSpeed: 7, ballMaxSpeed: 12, speedIncrease: 1 }
        };
    }
    
    attachEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (e.key === ' ') {
                e.preventDefault();
                if (!this.gameRunning) this.startGame();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        // Mouse controls
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseY = e.clientY - rect.top;
        });
        
        // Touch controls
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            this.mouseY = e.touches[0].clientY - rect.top;
        });
        
        // Button controls
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('difficultyBtn').addEventListener('click', () => this.changeDifficulty());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetScore());
    }
    
    startGame() {
        if (!this.gameRunning) {
            this.gameRunning = true;
            this.gamePaused = false;
            document.getElementById('startBtn').disabled = true;
            document.getElementById('pauseBtn').disabled = false;
            document.getElementById('difficultyBtn').disabled = true;
            this.updateStatusMessage('Game Started!');
            this.gameLoop();
        }
    }
    
    togglePause() {
        this.gamePaused = !this.gamePaused;
        const pauseBtn = document.getElementById('pauseBtn');
        pauseBtn.textContent = this.gamePaused ? 'Resume' : 'Pause';
        this.updateStatusMessage(this.gamePaused ? 'Game Paused' : 'Game Resumed');
    }
    
    changeDifficulty() {
        const difficulties = ['easy', 'medium', 'hard', 'insane'];
        const currentIndex = difficulties.indexOf(this.difficulty);
        this.difficulty = difficulties[(currentIndex + 1) % difficulties.length];
        
        const settings = this.difficultySettings[this.difficulty];
        this.computer.speed = settings.computerSpeed;
        this.ball.maxSpeed = settings.ballMaxSpeed;
        
        document.getElementById('difficulty').innerHTML = `Difficulty: <span>${this.difficulty.toUpperCase()}</span>`;
        this.updateStatusMessage(`Difficulty changed to ${this.difficulty.toUpperCase()}`);
    }
    
    resetScore() {
        this.playerScore = 0;
        this.computerScore = 0;
        this.bounceCount = 0;
        this.gameRunning = false;
        this.gamePaused = false;
        document.getElementById('playerScore').textContent = '0';
        document.getElementById('computerScore').textContent = '0';
        document.getElementById('bounceCount').textContent = '0';
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('pauseBtn').textContent = 'Pause';
        document.getElementById('difficultyBtn').disabled = false;
        this.resetBall();
        this.updateStatusMessage('Score reset!');
        this.draw();
    }
    
    resetBall() {
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 2;
        this.ball.speedX = (Math.random() > 0.5 ? 1 : -1) * 5;
        this.ball.speedY = (Math.random() - 0.5) * 5;
    }
    
    updatePlayer() {
        // Keyboard control (Arrow keys)
        if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) {
            this.player.dy = -this.player.speed;
        } else if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) {
            this.player.dy = this.player.speed;
        } else {
            this.player.dy = 0;
        }
        
        // Mouse/Touch control (smoother)
        const targetY = this.mouseY - this.player.height / 2;
        const diff = targetY - this.player.y;
        if (Math.abs(diff) > 5) {
            this.player.y += diff * 0.15; // Smooth interpolation
        }
        
        // Boundary collision
        if (this.player.y < 0) this.player.y = 0;
        if (this.player.y + this.player.height > this.canvas.height) {
            this.player.y = this.canvas.height - this.player.height;
        }
    }
    
    updateComputer() {
        const computerCenter = this.computer.y + this.computer.height / 2;
        const settings = this.difficultySettings[this.difficulty];
        
        // Simple AI with some prediction
        let targetY = this.ball.y;
        
        // Add some "imperfection" for easy mode
        if (this.difficulty === 'easy') {
            targetY += (Math.random() - 0.5) * 100;
        }
        
        // Smooth movement
        if (computerCenter < targetY - 10) {
            this.computer.y += settings.computerSpeed;
        } else if (computerCenter > targetY + 10) {
            this.computer.y -= settings.computerSpeed;
        }
        
        // Boundary collision
        if (this.computer.y < 0) this.computer.y = 0;
        if (this.computer.y + this.computer.height > this.canvas.height) {
            this.computer.y = this.canvas.height - this.computer.height;
        }
    }
    
    updateBall() {
        this.ball.x += this.ball.speedX;
        this.ball.y += this.ball.speedY;
        
        // Top and bottom wall collision
        if (this.ball.y - this.ball.radius < 0 || this.ball.y + this.ball.radius > this.canvas.height) {
            this.ball.speedY *= -1;
            this.ball.y = Math.max(this.ball.radius, Math.min(this.canvas.height - this.ball.radius, this.ball.y));
            this.bounceCount++;
        }
        
        // Paddle collision - Player
        if (this.ball.speedX < 0 &&
            this.ball.x - this.ball.radius < this.player.x + this.player.width &&
            this.ball.y > this.player.y &&
            this.ball.y < this.player.y + this.player.height) {
            
            this.ball.speedX *= -1;
            
            // Add spin based on where ball hits paddle
            const hitPos = (this.ball.y - this.player.y) / this.player.height - 0.5;
            this.ball.speedY += hitPos * 5;
            
            // Increase speed slightly
            const settings = this.difficultySettings[this.difficulty];
            const speedIncrease = settings.speedIncrease;
            const speed = Math.sqrt(this.ball.speedX ** 2 + this.ball.speedY ** 2);
            if (speed < settings.ballMaxSpeed) {
                this.ball.speedX *= 1 + speedIncrease / 100;
                this.ball.speedY *= 1 + speedIncrease / 100;
            }
            
            this.ball.x = this.player.x + this.player.width;
            this.bounceCount++;
        }
        
        // Paddle collision - Computer
        if (this.ball.speedX > 0 &&
            this.ball.x + this.ball.radius > this.computer.x &&
            this.ball.y > this.computer.y &&
            this.ball.y < this.computer.y + this.computer.height) {
            
            this.ball.speedX *= -1;
            
            // Add spin based on where ball hits paddle
            const hitPos = (this.ball.y - this.computer.y) / this.computer.height - 0.5;
            this.ball.speedY += hitPos * 5;
            
            // Increase speed slightly
            const settings = this.difficultySettings[this.difficulty];
            const speedIncrease = settings.speedIncrease;
            const speed = Math.sqrt(this.ball.speedX ** 2 + this.ball.speedY ** 2);
            if (speed < settings.ballMaxSpeed) {
                this.ball.speedX *= 1 + speedIncrease / 100;
                this.ball.speedY *= 1 + speedIncrease / 100;
            }
            
            this.ball.x = this.computer.x - this.ball.radius;
            this.bounceCount++;
        }
        
        // Scoring
        if (this.ball.x < 0) {
            this.computerScore++;
            document.getElementById('computerScore').textContent = this.computerScore;
            this.updateStatusMessage('Computer scores!');
            this.resetBall();
        }
        
        if (this.ball.x > this.canvas.width) {
            this.playerScore++;
            document.getElementById('playerScore').textContent = this.playerScore;
            this.updateStatusMessage('Player scores!');
            this.resetBall();
        }
    }
    
    draw() {
        // Clear canvas with gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#0f2847');
        gradient.addColorStop(1, '#0a1428');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw center line
        this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
        this.ctx.setLineDash([10, 10]);
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Draw paddles
        this.drawPaddle(this.player, '#10b981');
        this.drawPaddle(this.computer, '#ef4444');
        
        // Draw ball
        this.drawBall();
        
        // Draw corner circles
        this.drawCornerDecorations();
    }
    
    drawPaddle(paddle, color) {
        // Main paddle body
        this.ctx.fillStyle = color;
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 15;
        this.ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
        this.ctx.shadowBlur = 0;
        
        // Paddle border/glow
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(paddle.x, paddle.y, paddle.width, paddle.height);
        
        // Highlight
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(paddle.x + 1, paddle.y + 1, paddle.width - 2, paddle.height - 2);
    }
    
    drawBall() {
        // Ball glow
        const gradient = this.ctx.createRadialGradient(
            this.ball.x, this.ball.y, 0,
            this.ball.x, this.ball.y, this.ball.radius * 2.5
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0.3)');
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius * 2.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Ball body
        this.ctx.fillStyle = '#3b82f6';
        this.ctx.shadowColor = '#3b82f6';
        this.ctx.shadowBlur = 20;
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        
        // Ball highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x - 2, this.ball.y - 2, this.ball.radius * 0.4, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawCornerDecorations() {
        const decoration = 20;
        this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
        this.ctx.lineWidth = 2;
        
        // Top-left
        this.ctx.beginPath();
        this.ctx.moveTo(0, decoration);
        this.ctx.lineTo(0, 0);
        this.ctx.lineTo(decoration, 0);
        this.ctx.stroke();
        
        // Top-right
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width - decoration, 0);
        this.ctx.lineTo(this.canvas.width, 0);
        this.ctx.lineTo(this.canvas.width, decoration);
        this.ctx.stroke();
        
        // Bottom-left
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvas.height - decoration);
        this.ctx.lineTo(0, this.canvas.height);
        this.ctx.lineTo(decoration, this.canvas.height);
        this.ctx.stroke();
        
        // Bottom-right
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width - decoration, this.canvas.height);
        this.ctx.lineTo(this.canvas.width, this.canvas.height);
        this.ctx.lineTo(this.canvas.width, this.canvas.height - decoration);
        this.ctx.stroke();
    }
    
    updateStats() {
        const ballSpeed = Math.sqrt(this.ball.speedX ** 2 + this.ball.speedY ** 2).toFixed(1);
        document.getElementById('ballSpeed').textContent = ballSpeed;
        document.getElementById('paddleSpeed').textContent = this.player.speed;
        document.getElementById('bounceCount').textContent = this.bounceCount;
    }
    
    updateStatusMessage(message) {
        const statusElement = document.getElementById('statusMessage');
        statusElement.textContent = message;
        statusElement.style.animation = 'none';
        setTimeout(() => {
            statusElement.style.animation = 'pulse 0.5s ease-in-out';
        }, 10);
    }
    
    gameLoop() {
        if (!this.gamePaused) {
            this.updatePlayer();
            this.updateComputer();
            this.updateBall();
            this.updateStats();
        }
        
        this.draw();
        
        if (this.gameRunning) {
            requestAnimationFrame(() => this.gameLoop());
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new PongGame();
    game.draw(); // Initial draw
});