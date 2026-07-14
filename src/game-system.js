/**
 * Game System - Core game engine with campaign and multiplayer support
 * Handles game state, physics, AI, networking
 */

export class GameSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Game state
        this.gameMode = 'menu'; // menu, quickplay, campaign, online
        this.gameRunning = false;
        this.gamePaused = false;
        this.difficulty = 'medium';
        
        // Campaign state
        this.campaignLevel = 1;
        this.campaignProgress = 0;
        this.campaignStats = {
            wins: 0,
            losses: 0,
            highestLevel: 1,
            totalScore: 0
        };
        
        // Game entities
        this.ball = null;
        this.player = null;
        this.opponent = null;
        this.bounceCount = 0;
        
        // Scores
        this.playerScore = 0;
        this.opponentScore = 0;
        
        this.initializeGame();
        this.loadCampaignProgress();
    }
    
    initializeGame() {
        // Initialize ball
        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            speedX: 5,
            speedY: 5,
            maxSpeed: 8,
            radius: 5
        };
        
        // Initialize paddles
        const paddleHeight = 80;
        const paddleWidth = 10;
        
        this.player = {
            x: 10,
            y: this.canvas.height / 2 - paddleHeight / 2,
            width: paddleWidth,
            height: paddleHeight,
            speed: 6,
            dy: 0
        };
        
        this.opponent = {
            x: this.canvas.width - paddleWidth - 10,
            y: this.canvas.height / 2 - paddleHeight / 2,
            width: paddleWidth,
            height: paddleHeight,
            speed: 4
        };
        
        this.setupDifficultyLevels();
    }
    
    setupDifficultyLevels() {
        this.difficultySettings = {
            easy: { computerSpeed: 2.5, ballMaxSpeed: 6, speedIncrease: 0.3 },
            medium: { computerSpeed: 4, ballMaxSpeed: 8, speedIncrease: 0.5 },
            hard: { computerSpeed: 5.5, ballMaxSpeed: 10, speedIncrease: 0.8 },
            insane: { computerSpeed: 7, ballMaxSpeed: 12, speedIncrease: 1 }
        };
    }
    
    // Campaign methods
    loadCampaignProgress() {
        const saved = localStorage.getItem('pongCampaignProgress');
        if (saved) {
            const data = JSON.parse(saved);
            this.campaignStats = data.stats || this.campaignStats;
            this.campaignLevel = data.level || 1;
        }
    }
    
    saveCampaignProgress() {
        const data = {
            stats: this.campaignStats,
            level: this.campaignLevel,
            timestamp: Date.now()
        };
        localStorage.setItem('pongCampaignProgress', JSON.stringify(data));
    }
    
    getCampaignLevelDifficulty(level) {
        // Difficulty progression across 10 levels
        if (level <= 2) return 'easy';
        if (level <= 4) return 'medium';
        if (level <= 7) return 'hard';
        return 'insane';
    }
    
    getCampaignLevelTarget(level) {
        // Score needed to beat each level
        return 5 + (level * 2);
    }
    
    startCampaignLevel(level = 1) {
        this.gameMode = 'campaign';
        this.campaignLevel = level;
        this.difficulty = this.getCampaignLevelDifficulty(level);
        
        const settings = this.difficultySettings[this.difficulty];
        this.opponent.speed = settings.computerSpeed;
        this.ball.maxSpeed = settings.ballMaxSpeed;
        
        this.resetGame();
        this.gameRunning = true;
        
        return {
            level,
            difficulty: this.difficulty.toUpperCase(),
            targetScore: this.getCampaignLevelTarget(level),
            message: `Campaign Level ${level} - Beat the target score!`
        };
    }
    
    completeCampaignLevel() {
        this.campaignStats.wins++;
        this.campaignStats.totalScore += this.playerScore;
        
        if (this.campaignLevel > this.campaignStats.highestLevel) {
            this.campaignStats.highestLevel = this.campaignLevel;
        }
        
        // Move to next level or show completion
        if (this.campaignLevel >= 10) {
            const result = {
                completed: true,
                message: '🏆 Campaign Complete! You beat all levels!',
                stats: this.campaignStats
            };
            this.saveCampaignProgress();
            return result;
        } else {
            this.campaignLevel++;
            this.saveCampaignProgress();
            return {
                nextLevel: this.campaignLevel,
                message: `Level ${this.campaignLevel} Unlocked!`
            };
        }
    }
    
    failCampaignLevel() {
        this.campaignStats.losses++;
        this.saveCampaignProgress();
        
        return {
            failed: true,
            message: `Level ${this.campaignLevel} Failed. Try Again!`,
            retries: true
        };
    }
    
    // Game mechanics
    resetGame() {
        this.playerScore = 0;
        this.opponentScore = 0;
        this.bounceCount = 0;
        this.resetBall();
    }
    
    resetBall() {
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 2;
        this.ball.speedX = (Math.random() > 0.5 ? 1 : -1) * 5;
        this.ball.speedY = (Math.random() - 0.5) * 5;
    }
    
    updatePlayerPaddle(mouseY) {
        const targetY = mouseY - this.player.height / 2;
        const diff = targetY - this.player.y;
        
        if (Math.abs(diff) > 5) {
            this.player.y += diff * 0.15;
        }
        
        if (this.player.y < 0) this.player.y = 0;
        if (this.player.y + this.player.height > this.canvas.height) {
            this.player.y = this.canvas.height - this.player.height;
        }
    }
    
    updateOpponentPaddle() {
        const opponentCenter = this.opponent.y + this.opponent.height / 2;
        const settings = this.difficultySettings[this.difficulty];
        
        let targetY = this.ball.y;
        
        if (this.difficulty === 'easy') {
            targetY += (Math.random() - 0.5) * 100;
        }
        
        if (opponentCenter < targetY - 10) {
            this.opponent.y += settings.computerSpeed;
        } else if (opponentCenter > targetY + 10) {
            this.opponent.y -= settings.computerSpeed;
        }
        
        if (this.opponent.y < 0) this.opponent.y = 0;
        if (this.opponent.y + this.opponent.height > this.canvas.height) {
            this.opponent.y = this.canvas.height - this.opponent.height;
        }
    }
    
    updateBall() {
        this.ball.x += this.ball.speedX;
        this.ball.y += this.ball.speedY;
        
        // Wall collisions
        if (this.ball.y - this.ball.radius < 0 || this.ball.y + this.ball.radius > this.canvas.height) {
            this.ball.speedY *= -1;
            this.ball.y = Math.max(this.ball.radius, Math.min(this.canvas.height - this.ball.radius, this.ball.y));
            this.bounceCount++;
            return { type: 'wallHit' };
        }
        
        // Player paddle collision
        if (this.ball.speedX < 0 &&
            this.ball.x - this.ball.radius < this.player.x + this.player.width &&
            this.ball.y > this.player.y &&
            this.ball.y < this.player.y + this.player.height) {
            
            this.ball.speedX *= -1;
            
            const hitPos = (this.ball.y - this.player.y) / this.player.height - 0.5;
            this.ball.speedY += hitPos * 5;
            
            const settings = this.difficultySettings[this.difficulty];
            const speed = Math.sqrt(this.ball.speedX ** 2 + this.ball.speedY ** 2);
            if (speed < settings.ballMaxSpeed) {
                this.ball.speedX *= 1 + settings.speedIncrease / 100;
                this.ball.speedY *= 1 + settings.speedIncrease / 100;
            }
            
            this.ball.x = this.player.x + this.player.width;
            this.bounceCount++;
            return { type: 'paddleHit', player: true };
        }
        
        // Opponent paddle collision
        if (this.ball.speedX > 0 &&
            this.ball.x + this.ball.radius > this.opponent.x &&
            this.ball.y > this.opponent.y &&
            this.ball.y < this.opponent.y + this.opponent.height) {
            
            this.ball.speedX *= -1;
            
            const hitPos = (this.ball.y - this.opponent.y) / this.opponent.height - 0.5;
            this.ball.speedY += hitPos * 5;
            
            const settings = this.difficultySettings[this.difficulty];
            const speed = Math.sqrt(this.ball.speedX ** 2 + this.ball.speedY ** 2);
            if (speed < settings.ballMaxSpeed) {
                this.ball.speedX *= 1 + settings.speedIncrease / 100;
                this.ball.speedY *= 1 + settings.speedIncrease / 100;
            }
            
            this.ball.x = this.opponent.x - this.ball.radius;
            this.bounceCount++;
            return { type: 'paddleHit', player: false };
        }
        
        // Scoring
        if (this.ball.x < 0) {
            this.opponentScore++;
            this.resetBall();
            return { type: 'score', player: false };
        }
        
        if (this.ball.x > this.canvas.width) {
            this.playerScore++;
            this.resetBall();
            return { type: 'score', player: true };
        }
        
        return { type: 'none' };
    }
    
    getGameState() {
        return {
            playerScore: this.playerScore,
            opponentScore: this.opponentScore,
            bounceCount: this.bounceCount,
            ballSpeed: Math.sqrt(this.ball.speedX ** 2 + this.ball.speedY ** 2).toFixed(1),
            difficulty: this.difficulty
        };
    }
}
