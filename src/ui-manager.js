/**
 * UI Manager - Handles menu navigation, campaign UI, and game overlays
 */

export class UIManager {
    constructor() {
        this.currentScreen = 'menu';
        this.campaignData = null;
        this.initializeUI();
    }
    
    initializeUI() {
        this.setupMenuListeners();
        this.setupCampaignListeners();
        this.setupGameListeners();
    }
    
    setupMenuListeners() {
        // Main menu buttons will be added to HTML
        document.addEventListener('menuButtonClick', (e) => {
            const { button } = e.detail;
            this.handleMenuAction(button);
        });
    }
    
    setupCampaignListeners() {
        document.addEventListener('campaignLevelClick', (e) => {
            const { level } = e.detail;
            this.emit('startCampaignLevel', { level });
        });
    }
    
    setupGameListeners() {
        // Game-specific UI events
    }
    
    handleMenuAction(action) {
        switch (action) {
            case 'quickplay':
                this.emit('startQuickplay');
                break;
            case 'campaign':
                this.showCampaignSelect();
                break;
            case 'online':
                this.showOnlineMenu();
                break;
            case 'settings':
                this.showSettings();
                break;
        }
    }
    
    showCampaignSelect() {
        this.currentScreen = 'campaign-select';
        const html = `
            <div class="screen campaign-select">
                <h2>🎮 Campaign Mode</h2>
                <div class="campaign-levels">
                    ${this.renderCampaignLevels()}
                </div>
                <button onclick="menuButtonClick('back')">← Back</button>
            </div>
        `;
        this.renderScreen(html);
    }
    
    renderCampaignLevels() {
        let html = '';
        for (let i = 1; i <= 10; i++) {
            const locked = i > (this.campaignData?.highestLevel || 1) + 1;
            const completed = i <= (this.campaignData?.completedLevels || 0);
            
            html += `
                <div class="level-card ${completed ? 'completed' : ''} ${locked ? 'locked' : ''}">
                    <div class="level-number">Level ${i}</div>
                    <div class="level-info">
                        ${this.getDifficultyEmoji(i)} ${this.getDifficultyName(i)}
                    </div>
                    ${completed ? '<div class="badge">✓ Complete</div>' : ''}
                    ${locked ? '<div class="badge">🔒 Locked</div>' : ''}
                    <button onclick="campaignLevelClick(${i})" ${locked ? 'disabled' : ''}>
                        Play
                    </button>
                </div>
            `;
        }
        return html;
    }
    
    getDifficultyName(level) {
        if (level <= 2) return 'Easy';
        if (level <= 4) return 'Medium';
        if (level <= 7) return 'Hard';
        return 'Insane';
    }
    
    getDifficultyEmoji(level) {
        if (level <= 2) return '🟢';
        if (level <= 4) return '🟡';
        if (level <= 7) return '🔴';
        return '🔵';
    }
    
    showOnlineMenu() {
        this.currentScreen = 'online-menu';
        const html = `
            <div class="screen online-menu">
                <h2>🌐 Online Multiplayer</h2>
                <div class="online-options">
                    <button class="online-btn" onclick="menuButtonClick('quickmatch')">
                        ⚡ Quick Match
                        <span class="desc">Find random opponent</span>
                    </button>
                    <button class="online-btn" onclick="menuButtonClick('create-room')">
                        ➕ Create Room
                        <span class="desc">Invite friends</span>
                    </button>
                    <button class="online-btn" onclick="menuButtonClick('join-room')">
                        🔗 Join Room
                        <span class="desc">Enter room code</span>
                    </button>
                    <button class="online-btn" onclick="menuButtonClick('leaderboard')">
                        🏆 Leaderboard
                        <span class="desc">View rankings</span>
                    </button>
                </div>
                <button onclick="menuButtonClick('back')">← Back</button>
            </div>
        `;
        this.renderScreen(html);
    }
    
    showCampaignLevelScreen(level, targetScore) {
        this.currentScreen = 'campaign-game';
        const html = `
            <div class="campaign-hud">
                <div class="campaign-header">
                    <div class="level-info">Level ${level}</div>
                    <div class="target-info">
                        <span>Target:</span>
                        <span class="target-score">${targetScore}</span>
                    </div>
                </div>
            </div>
        `;
        this.appendToScreen(html, 'campaign-hud');
    }
    
    showGameResult(result) {
        const isVictory = result.playerScore > result.opponentScore;
        const html = `
            <div class="game-result ${isVictory ? 'victory' : 'defeat'}">
                <div class="result-header">
                    ${isVictory ? '🎉 Victory!' : '💔 Defeat'}
                </div>
                <div class="final-score">
                    <div class="player-score">${result.playerScore}</div>
                    <div class="vs">vs</div>
                    <div class="opponent-score">${result.opponentScore}</div>
                </div>
                <div class="result-stats">
                    <div class="stat">
                        <span>Bounces:</span>
                        <span>${result.bounceCount}</span>
                    </div>
                    <div class="stat">
                        <span>Duration:</span>
                        <span>${result.duration}s</span>
                    </div>
                </div>
                <div class="result-buttons">
                    <button onclick="menuButtonClick('retry')">🔄 Retry</button>
                    <button onclick="menuButtonClick('menu')">🏠 Menu</button>
                </div>
            </div>
        `;
        this.renderOverlay(html);
    }
    
    showLeaderboard(players) {
        const html = `
            <div class="screen leaderboard">
                <h2>🏆 Leaderboard</h2>
                <div class="leaderboard-list">
                    ${players.map((p, i) => `
                        <div class="leaderboard-entry">
                            <div class="rank">#${i + 1}</div>
                            <div class="player-name">${p.name}</div>
                            <div class="player-elo">${p.elo} ELO</div>
                            <div class="player-wins">${p.wins}W</div>
                        </div>
                    `).join('')}
                </div>
                <button onclick="menuButtonClick('back')">← Back</button>
            </div>
        `;
        this.renderScreen(html);
    }
    
    renderScreen(html) {
        const screenContainer = document.getElementById('screenContainer');
        if (screenContainer) {
            screenContainer.innerHTML = html;
        }
    }
    
    appendToScreen(html, containerId) {
        const container = document.getElementById(containerId) || document.createElement('div');
        container.id = containerId;
        container.innerHTML = html;
        document.body.appendChild(container);
    }
    
    renderOverlay(html) {
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        overlay.innerHTML = html;
        document.body.appendChild(overlay);
    }
    
    // Event system
    emit(event, data) {
        const customEvent = new CustomEvent(event, { detail: data });
        document.dispatchEvent(customEvent);
    }
}
