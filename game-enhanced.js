// ========================================
// SOUND MANAGER MODULE 🔊
// ========================================
const SoundManager = {
  sounds: {},
  enabled: true,
  volume: 0.5,
  
  // Web Audio API context
  audioContext: null,
  
  init() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.loadSettings();
      this.createSounds();
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  },
  
  createSounds() {
    // Simple tone generation for sound effects
    this.sounds = {
      flip: { freq: 440, duration: 0.1 },
      match: { freq: 660, duration: 0.2 },
      mismatch: { freq: 220, duration: 0.15 },
      complete: { freq: 880, duration: 0.5 },
      powerup: { freq: 550, duration: 0.3 },
      combo: { freq: 770, duration: 0.25 }
    };
  },
  
  playSound(soundName) {
    if (!this.enabled || !this.audioContext) return;
    
    const sound = this.sounds[soundName];
    if (!sound) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.value = sound.freq;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + sound.duration);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + sound.duration);
  },
  
  toggle() {
    this.enabled = !this.enabled;
    this.saveSettings();
  },
  
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.saveSettings();
  },
  
  saveSettings() {
    localStorage.setItem('soundSettings', JSON.stringify({
      enabled: this.enabled,
      volume: this.volume
    }));
  },
  
  loadSettings() {
    try {
      const settings = JSON.parse(localStorage.getItem('soundSettings'));
      if (settings) {
        this.enabled = settings.enabled !== false;
        this.volume = settings.volume || 0.5;
      }
    } catch (e) {
      // Use defaults
    }
  }
};

// ========================================
// THEME MANAGER MODULE 🎨
// ========================================
const ThemeManager = {
  currentTheme: 'dark',
  
  themes: {
    dark: {
      name: 'Dark',
      '--primary-color': '#6C63FF',
      '--secondary-color': '#4ECDC4',
      '--bg-primary': '#0F0E17',
      '--bg-secondary': '#1A1825',
      '--bg-card': '#232135',
      '--text-primary': '#FFFFFE',
      '--text-secondary': '#A7A9BE'
    },
    light: {
      name: 'Light',
      '--primary-color': '#5B4FFF',
      '--secondary-color': '#3AB7AE',
      '--bg-primary': '#F8F9FA',
      '--bg-secondary': '#FFFFFF',
      '--bg-card': '#FFFFFF',
      '--text-primary': '#212529',
      '--text-secondary': '#6C757D'
    },
    neon: {
      name: 'Neon',
      '--primary-color': '#FF10F0',
      '--secondary-color': '#00FFFF',
      '--bg-primary': '#0A0E27',
      '--bg-secondary': '#16213E',
      '--bg-card': '#1A1F3A',
      '--text-primary': '#00FFFF',
      '--text-secondary': '#FF10F0'
    },
    nature: {
      name: 'Nature',
      '--primary-color': '#2ECC71',
      '--secondary-color': '#F39C12',
      '--bg-primary': '#1B4332',
      '--bg-secondary': '#2D6A4F',
      '--bg-card': '#40916C',
      '--text-primary': '#F1FAEE',
      '--text-secondary': '#D8F3DC'
    }
  },
  
  init() {
    this.loadTheme();
    this.applyTheme(this.currentTheme);
  },
  
  applyTheme(themeName) {
    const theme = this.themes[themeName];
    if (!theme) return;
    
    const root = document.documentElement;
    Object.keys(theme).forEach(key => {
      if (key.startsWith('--')) {
        root.style.setProperty(key, theme[key]);
      }
    });
    
    this.currentTheme = themeName;
    this.saveTheme();
  },
  
  saveTheme() {
    localStorage.setItem('selectedTheme', this.currentTheme);
  },
  
  loadTheme() {
    const saved = localStorage.getItem('selectedTheme');
    if (saved && this.themes[saved]) {
      this.currentTheme = saved;
    }
  }
};

// ========================================
// COMBO SYSTEM MODULE 🔥
// ========================================
const ComboSystem = {
  currentCombo: 0,
  maxCombo: 0,
  lastMatchTime: 0,
  comboTimeout: null,
  
  reset() {
    this.currentCombo = 0;
    this.maxCombo = 0;
    this.lastMatchTime = 0;
    if (this.comboTimeout) {
      clearTimeout(this.comboTimeout);
    }
  },
  
  recordMatch() {
    const now = Date.now();
    const timeSinceLastMatch = now - this.lastMatchTime;
    
    // Speed bonus: < 3 seconds
    const speedBonus = timeSinceLastMatch < 3000 && this.lastMatchTime > 0;
    
    this.currentCombo++;
    this.maxCombo = Math.max(this.maxCombo, this.currentCombo);
    this.lastMatchTime = now;
    
    // Play combo sound for streaks
    if (this.currentCombo >= 3) {
      SoundManager.playSound('combo');
    }
    
    // Reset combo after 5 seconds of inactivity
    if (this.comboTimeout) {
      clearTimeout(this.comboTimeout);
    }
    this.comboTimeout = setTimeout(() => {
      this.currentCombo = 0;
    }, 5000);
    
    return {
      combo: this.currentCombo,
      speedBonus: speedBonus,
      bonusPoints: this.calculateBonus(speedBonus)
    };
  },
  
  recordMismatch() {
    this.currentCombo = 0;
    if (this.comboTimeout) {
      clearTimeout(this.comboTimeout);
    }
  },
  
  calculateBonus(speedBonus) {
    let bonus = 0;
    
    // Combo multiplier
    if (this.currentCombo >= 3) {
      bonus += (this.currentCombo - 2) * 100;
    }
    
    // Speed bonus
    if (speedBonus) {
      bonus += 200;
    }
    
    return bonus;
  }
};

// ========================================
// POWER-UPS SYSTEM MODULE ⚡
// ========================================
const PowerUpsSystem = {
  hints: 3,
  timeFreezes: 2,
  
  reset() {
    this.hints = 3;
    this.timeFreezes = 2;
  },
  
  useHint() {
    if (this.hints <= 0) return null;
    
    this.hints--;
    SoundManager.playSound('powerup');
    
    // Find two unmatched cards with same emoji
    const unmatchedCards = GameEngine.cards.filter(c => !c.isMatched && !c.isFlipped);
    const emojis = {};
    
    for (const card of unmatchedCards) {
      if (!emojis[card.emoji]) {
        emojis[card.emoji] = [];
      }
      emojis[card.emoji].push(card);
    }
    
    // Find first pair
    for (const emoji in emojis) {
      if (emojis[emoji].length >= 2) {
        return {
          cards: [emojis[emoji][0], emojis[emoji][1]],
          penalty: 500
        };
      }
    }
    
    return null;
  },
  
  useTimeFreeze() {
    if (this.timeFreezes <= 0) return false;
    
    this.timeFreezes--;
    SoundManager.playSound('powerup');
    
    TimerController.freeze(10); // 10 seconds
    return true;
  }
};

// ========================================
// CHALLENGE MODES MODULE 🎯
// ========================================
const ChallengeModes = {
  currentMode: 'classic',
  
  modes: {
    classic: {
      name: 'Classic',
      description: 'Standard gameplay',
      timeLimit: null,
      moveLimit: null,
      flipBackDelay: 1000
    },
    timeAttack: {
      name: 'Time Attack',
      description: 'Beat the clock!',
      timeLimit: { easy: 120, medium: 180, hard: 300 },
      moveLimit: null,
      flipBackDelay: 1000
    },
    limitedMoves: {
      name: 'Limited Moves',
      description: 'Careful with your moves!',
      timeLimit: null,
      moveLimit: { easy: 20, medium: 30, hard: 45 },
      flipBackDelay: 1000
    },
    memoryMaster: {
      name: 'Memory Master',
      description: 'Cards flip back faster!',
      timeLimit: null,
      moveLimit: null,
      flipBackDelay: 500
    }
  },
  
  setMode(modeName) {
    if (this.modes[modeName]) {
      this.currentMode = modeName;
      localStorage.setItem('challengeMode', modeName);
    }
  },
  
  getMode() {
    return this.modes[this.currentMode];
  },
  
  loadMode() {
    const saved = localStorage.getItem('challengeMode');
    if (saved && this.modes[saved]) {
      this.currentMode = saved;
    }
  },
  
  getTimeLimit(difficulty) {
    const mode = this.getMode();
    return mode.timeLimit ? mode.timeLimit[difficulty] : null;
  },
  
  getMoveLimit(difficulty) {
    const mode = this.getMode();
    return mode.moveLimit ? mode.moveLimit[difficulty] : null;
  },
  
  getFlipBackDelay() {
    return this.getMode().flipBackDelay;
  },
  
  checkLimits(moves, time, difficulty) {
    const mode = this.getMode();
    const result = { failed: false, reason: '' };
    
    if (mode.timeLimit && time >= mode.timeLimit[difficulty]) {
      result.failed = true;
      result.reason = 'Time limit exceeded!';
    }
    
    if (mode.moveLimit && moves >= mode.moveLimit[difficulty]) {
      result.failed = true;
      result.reason = 'Move limit exceeded!';
    }
    
    return result;
  }
};

// ========================================
// STATISTICS MANAGER MODULE 📊
// ========================================
const StatisticsManager = {
  initializeStats() {
    const data = StorageManager.getData();
    if (data && !data.statistics) {
      data.statistics = {
        gamesPlayed: 0,
        gamesWon: 0,
        totalMoves: 0,
        totalTime: 0,
        bestScores: { easy: 0, medium: 0, hard: 0 },
        achievements: [],
        maxCombo: 0,
        perfectGames: 0
      };
      StorageManager.saveData(data);
    }
  },
  
  recordGame(difficulty, won, moves, time, score, combo) {
    const data = StorageManager.getData();
    if (!data || !data.statistics) return;
    
    const stats = data.statistics;
    stats.gamesPlayed++;
    if (won) stats.gamesWon++;
    stats.totalMoves += moves;
    stats.totalTime += time;
    stats.maxCombo = Math.max(stats.maxCombo, combo);
    
    if (score > stats.bestScores[difficulty]) {
      stats.bestScores[difficulty] = score;
    }
    
    // Check for perfect game
    const config = GameEngine.difficultyConfig[difficulty];
    if (moves === config.pairs && won) {
      stats.perfectGames++;
      this.unlockAchievement('perfect_game');
    }
    
    StorageManager.saveData(data);
  },
  
  getStatistics() {
    const data = StorageManager.getData();
    return data && data.statistics ? data.statistics : null;
  },
  
  unlockAchievement(achievementId) {
    const data = StorageManager.getData();
    if (!data || !data.statistics) return;
    
    if (!data.statistics.achievements.includes(achievementId)) {
      data.statistics.achievements.push(achievementId);
      StorageManager.saveData(data);
      return true;
    }
    return false;
  },
  
  getWinRate() {
    const stats = this.getStatistics();
    if (!stats || stats.gamesPlayed === 0) return 0;
    return ((stats.gamesWon / stats.gamesPlayed) * 100).toFixed(1);
  },
  
  getAverageScore() {
    const stats = this.getStatistics();
    const leaderboards = StorageManager.getData()?.leaderboards;
    if (!leaderboards) return 0;
    
    let total = 0;
    let count = 0;
    
    ['easy', 'medium', 'hard'].forEach(diff => {
      leaderboards[diff].forEach(entry => {
        total += entry.score;
        count++;
      });
    });
    
    return count > 0 ? Math.round(total / count) : 0;
  }
};

// ========================================
// STORAGE MANAGER MODULE (Enhanced)
// ========================================
const StorageManager = {
  STORAGE_KEY: 'memoryMatchGame',
  
  initializeStorage() {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      
      const existingData = localStorage.getItem(this.STORAGE_KEY);
      
      if (!existingData) {
        const initialData = {
          username: '',
          leaderboards: {
            easy: [],
            medium: [],
            hard: []
          },
          statistics: {
            gamesPlayed: 0,
            gamesWon: 0,
            totalMoves: 0,
            totalTime: 0,
            bestScores: { easy: 0, medium: 0, hard: 0 },
            achievements: [],
            maxCombo: 0,
            perfectGames: 0
          },
          settings: {
            theme: 'dark',
            soundEnabled: true,
            volume: 0.5
          }
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(initialData));
      } else {
        // Migrate old data
        const data = JSON.parse(existingData);
        if (!data.statistics) {
          StatisticsManager.initializeStats();
        }
      }
      
      return true;
    } catch (error) {
      console.warn('localStorage not available:', error);
      return false;
    }
  },
  
  getData() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },
  
  saveData(data) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  },
  
  saveUsername(username) {
    const data = this.getData();
    if (data) {
      data.username = username;
      return this.saveData(data);
    }
    return false;
  },
  
  getUsername() {
    const data = this.getData();
    return data ? data.username : '';
  },
  
  saveScore(difficulty, scoreData) {
    const data = this.getData();
    if (data) {
      if (!data.leaderboards[difficulty]) {
        data.leaderboards[difficulty] = [];
      }
      data.leaderboards[difficulty].push(scoreData);
      
      data.leaderboards[difficulty].sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return new Date(a.date) - new Date(b.date);
      });
      
      data.leaderboards[difficulty] = data.leaderboards[difficulty].slice(0, 10);
      
      return this.saveData(data);
    }
    return false;
  },
  
  getLeaderboard(difficulty) {
    const data = this.getData();
    return data && data.leaderboards[difficulty] ? data.leaderboards[difficulty] : [];
  },
  
  clearLeaderboard() {
    const data = this.getData();
    if (data) {
      data.leaderboards = {
        easy: [],
        medium: [],
        hard: []
      };
      return this.saveData(data);
    }
    return false;
  },
  
  isTopScore(difficulty, score) {
    const leaderboard = this.getLeaderboard(difficulty);
    if (leaderboard.length < 10) {
      return true;
    }
    return score > leaderboard[leaderboard.length - 1].score;
  }
};

// ========================================
// GAME ENGINE MODULE (Enhanced)
// ========================================
const GameEngine = {
  difficulty: '',
  cards: [],
  flippedCards: [],
  matchedPairs: 0,
  moves: 0,
  isProcessing: false,
  isPaused: false,
  hintCardsRevealed: [],
  
  emojiPool: [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
    '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
    '🦄', '🐝', '🦋', '🐌', '🐞', '🦆', '🦅', '🦉'
  ],
  
  difficultyConfig: {
    easy: { pairs: 8, gridClass: 'easy' },
    medium: { pairs: 12, gridClass: 'medium' },
    hard: { pairs: 18, gridClass: 'hard' }
  },
  
  initializeGame(difficulty) {
    this.difficulty = difficulty;
    this.cards = [];
    this.flippedCards = [];
    this.matchedPairs = 0;
    this.moves = 0;
    this.isProcessing = false;
    this.isPaused = false;
    this.hintCardsRevealed = [];
    
    ComboSystem.reset();
    PowerUpsSystem.reset();
    
    const config = this.difficultyConfig[difficulty];
    this.generateCards(config.pairs);
    this.shuffleCards();
    
    return {
      cards: this.cards,
      gridClass: config.gridClass
    };
  },
  
  generateCards(pairs) {
    const selectedEmojis = this.emojiPool.slice(0, pairs);
    let id = 0;
    
    selectedEmojis.forEach(emoji => {
      this.cards.push({
        id: id++,
        emoji: emoji,
        isFlipped: false,
        isMatched: false
      });
      this.cards.push({
        id: id++,
        emoji: emoji,
        isFlipped: false,
        isMatched: false
      });
    });
  },
  
  shuffleCards() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  },
  
  flipCard(cardId) {
    if (this.isProcessing || this.isPaused) return false;
    
    const card = this.cards.find(c => c.id === cardId);
    
    if (!card || card.isFlipped || card.isMatched) {
      return false;
    }
    
    card.isFlipped = true;
    this.flippedCards.push(card);
    SoundManager.playSound('flip');
    
    if (this.flippedCards.length === 2) {
      this.isProcessing = true;
      this.incrementMoves();
      return this.checkMatch();
    }
    
    return { flipped: true, card };
  },
  
  checkMatch() {
    const [card1, card2] = this.flippedCards;
    const isMatch = card1.emoji === card2.emoji;
    
    if (isMatch) {
      card1.isMatched = true;
      card2.isMatched = true;
      this.matchedPairs++;
      this.flippedCards = [];
      this.isProcessing = false;
      
      SoundManager.playSound('match');
      const comboData = ComboSystem.recordMatch();
      
      return {
        match: true,
        cards: [card1, card2],
        gameComplete: this.checkGameComplete(),
        comboData: comboData
      };
    } else {
      ComboSystem.recordMismatch();
      SoundManager.playSound('mismatch');
      
      return {
        match: false,
        cards: [card1, card2]
      };
    }
  },
  
  resetFlippedCards() {
    this.flippedCards.forEach(card => {
      card.isFlipped = false;
    });
    this.flippedCards = [];
    this.isProcessing = false;
  },
  
  incrementMoves() {
    this.moves++;
    
    // Check challenge mode limits
    const limitCheck = ChallengeModes.checkLimits(
      this.moves,
      TimerController.getElapsedTime(),
      this.difficulty
    );
    
    if (limitCheck.failed) {
      setTimeout(() => {
        UIController.showGameOver(limitCheck.reason);
      }, 1000);
    }
  },
  
  checkGameComplete() {
    const totalPairs = this.difficultyConfig[this.difficulty].pairs;
    return this.matchedPairs === totalPairs;
  },
  
  togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      TimerController.pause();
    } else {
      TimerController.resume();
    }
    return this.isPaused;
  }
};

// ========================================
// TIMER CONTROLLER MODULE (Enhanced)
// ========================================
const TimerController = {
  seconds: 0,
  intervalId: null,
  isRunning: false,
  isPaused: false,
  frozenTime: 0,
  
  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.isPaused = false;
      this.intervalId = setInterval(() => {
        if (!this.isPaused && this.frozenTime <= 0) {
          this.seconds++;
          UIController.updateTimer(this.seconds);
          
          // Check time limit
          const timeLimit = ChallengeModes.getTimeLimit(GameEngine.difficulty);
          if (timeLimit && this.seconds >= timeLimit) {
            GameEngine.incrementMoves(); // Trigger limit check
          }
        }
        
        if (this.frozenTime > 0) {
          this.frozenTime--;
          UIController.updateFreezeIndicator(this.frozenTime);
        }
      }, 1000);
    }
  },
  
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      this.isPaused = false;
    }
  },
  
  pause() {
    this.isPaused = true;
  },
  
  resume() {
    this.isPaused = false;
  },
  
  freeze(duration) {
    this.frozenTime = duration;
  },
  
  reset() {
    this.stop();
    this.seconds = 0;
    this.frozenTime = 0;
  },
  
  getElapsedTime() {
    return this.seconds;
  },
  
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
};

// ========================================
// SCORE CALCULATOR MODULE (Enhanced)
// ========================================
const ScoreCalculator = {
  calculateScore(moves, time, comboBonus = 0) {
    const baseScore = 10000;
    const movePenalty = moves * 100;
    const timePenalty = time * 10;
    const powerupPenalty = (3 - PowerUpsSystem.hints) * 500 + (2 - PowerUpsSystem.timeFreezes) * 300;
    
    const finalScore = Math.max(0, baseScore - movePenalty - timePenalty - powerupPenalty + comboBonus);
    return finalScore;
  },
  
  getPerformanceMessage(score) {
    if (score >= 9000) return "Outstanding! 🏆";
    if (score >= 8000) return "Excellent! 🌟";
    if (score >= 7000) return "Great job! 👏";
    if (score >= 6000) return "Good work! 👍";
    return "Keep practicing! 💪";
  }
};

// Continue in next part...

// ========================================
// UI CONTROLLER MODULE (Enhanced)
// ========================================
const UIController = {
  currentScreen: 'welcome-screen',
  currentDifficulty: '',
  firstCardFlipped: false,
  
  showScreen(screenId) {
    const currentScreen = document.querySelector('.screen.active');
    if (currentScreen) {
      currentScreen.classList.remove('active');
    }
    
    const newScreen = document.getElementById(screenId);
    if (newScreen) {
      newScreen.classList.add('active');
      this.currentScreen = screenId;
    }
  },
  
  hideScreen(screenId) {
    const screen = document.getElementById(screenId);
    if (screen) {
      screen.classList.remove('active');
    }
  },
  
  renderCards(cards, gridClass) {
    const gameBoard = document.getElementById('game-board');
    gameBoard.innerHTML = '';
    gameBoard.className = `game-board ${gridClass}`;
    
    cards.forEach(card => {
      const cardElement = this.createCardElement(card);
      gameBoard.appendChild(cardElement);
    });
  },
  
  createCardElement(card) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    cardDiv.dataset.cardId = card.id;
    
    cardDiv.innerHTML = `
      <div class="card-inner">
        <div class="card-back"></div>
        <div class="card-front">${card.emoji}</div>
      </div>
    `;
    
    cardDiv.addEventListener('click', () => this.handleCardClick(card.id));
    
    return cardDiv;
  },
  
  handleCardClick(cardId) {
    if (!this.firstCardFlipped) {
      this.firstCardFlipped = true;
      TimerController.start();
    }
    
    const result = GameEngine.flipCard(cardId);
    
    if (result) {
      const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
      cardElement.classList.add('flipped');
      
      if (result.match !== undefined) {
        const delay = ChallengeModes.getFlipBackDelay();
        setTimeout(() => {
          this.handleMatchResult(result);
        }, 600);
      }
    }
  },
  
  handleMatchResult(result) {
    if (result.match) {
      result.cards.forEach(card => {
        const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
        cardElement.classList.add('matched');
      });
      
      // Show combo notification
      if (result.comboData && result.comboData.combo >= 3) {
        this.showComboNotification(result.comboData);
      }
      
      if (result.gameComplete) {
        this.handleGameComplete();
      }
    } else {
      const delay = ChallengeModes.getFlipBackDelay();
      setTimeout(() => {
        result.cards.forEach(card => {
          const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
          cardElement.classList.remove('flipped');
        });
        GameEngine.resetFlippedCards();
      }, delay);
    }
    
    this.updateStats();
  },
  
  showComboNotification(comboData) {
    const notification = document.createElement('div');
    notification.className = 'combo-notification';
    notification.innerHTML = `
      <div class="combo-text">
        <span class="combo-number">${comboData.combo}x COMBO!</span>
        ${comboData.speedBonus ? '<span class="speed-bonus">⚡ Speed Bonus!</span>' : ''}
        <span class="combo-points">+${comboData.bonusPoints}</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 500);
    }, 2000);
  },
  
  handleGameComplete() {
    TimerController.stop();
    SoundManager.playSound('complete');
    
    const moves = GameEngine.moves;
    const time = TimerController.getElapsedTime();
    const comboBonus = ComboSystem.calculateBonus(false) * ComboSystem.maxCombo;
    const score = ScoreCalculator.calculateScore(moves, time, comboBonus);
    const username = StorageManager.getUsername();
    
    // Record statistics
    StatisticsManager.recordGame(
      GameEngine.difficulty,
      true,
      moves,
      time,
      score,
      ComboSystem.maxCombo
    );
    
    const scoreData = {
      username: username,
      score: score,
      moves: moves,
      time: time,
      combo: ComboSystem.maxCombo,
      mode: ChallengeModes.currentMode,
      date: new Date().toISOString()
    };
    
    StorageManager.saveScore(GameEngine.difficulty, scoreData);
    
    setTimeout(() => {
      this.showResults({
        difficulty: GameEngine.difficulty,
        score: score,
        moves: moves,
        time: time,
        combo: ComboSystem.maxCombo,
        comboBonus: comboBonus,
        isTopScore: StorageManager.isTopScore(GameEngine.difficulty, score)
      });
    }, 1000);
  },
  
  updateStats() {
    const moves = GameEngine.moves;
    const time = TimerController.getElapsedTime();
    const comboBonus = ComboSystem.calculateBonus(false) * ComboSystem.currentCombo;
    const score = ScoreCalculator.calculateScore(moves, time, comboBonus);
    
    document.getElementById('moves-count').textContent = moves;
    document.getElementById('score-display').textContent = score;
    document.getElementById('combo-display').textContent = 
      ComboSystem.currentCombo > 0 ? `${ComboSystem.currentCombo}x` : '-';
    
    // Update power-ups display
    document.getElementById('hints-count').textContent = PowerUpsSystem.hints;
    document.getElementById('freeze-count').textContent = PowerUpsSystem.timeFreezes;
    
    // Show limits
    const moveLimit = ChallengeModes.getMoveLimit(GameEngine.difficulty);
    const timeLimit = ChallengeModes.getTimeLimit(GameEngine.difficulty);
    
    if (moveLimit) {
      document.getElementById('move-limit').textContent = ` / ${moveLimit}`;
    }
    if (timeLimit) {
      const remaining = timeLimit - time;
      document.getElementById('time-display').style.color = 
        remaining < 30 ? 'var(--danger-color)' : 'var(--primary-color)';
    }
  },
  
  updateTimer(seconds) {
    const formattedTime = TimerController.formatTime(seconds);
    document.getElementById('time-display').textContent = formattedTime;
    this.updateStats();
  },
  
  updateFreezeIndicator(seconds) {
    const indicator = document.getElementById('freeze-indicator');
    if (seconds > 0) {
      indicator.textContent = `❄️ ${seconds}s`;
      indicator.style.display = 'inline';
    } else {
      indicator.style.display = 'none';
    }
  },
  
  showResults(gameData) {
    document.getElementById('result-difficulty').textContent = 
      gameData.difficulty.charAt(0).toUpperCase() + gameData.difficulty.slice(1);
    document.getElementById('result-score').textContent = gameData.score;
    document.getElementById('result-moves').textContent = gameData.moves;
    document.getElementById('result-time').textContent = TimerController.formatTime(gameData.time);
    document.getElementById('result-combo').textContent = 
      gameData.combo > 0 ? `${gameData.combo}x (Bonus: ${gameData.comboBonus})` : 'None';
    
    const performanceMsg = ScoreCalculator.getPerformanceMessage(gameData.score);
    document.getElementById('performance-message').textContent = performanceMsg;
    
    const leaderboardMsg = document.getElementById('leaderboard-message');
    if (gameData.isTopScore) {
      leaderboardMsg.textContent = "🎉 You made it to the Top 10!";
      leaderboardMsg.style.color = 'var(--success-color)';
    } else {
      leaderboardMsg.textContent = "Keep playing to reach the Top 10!";
      leaderboardMsg.style.color = 'var(--text-secondary)';
    }
    
    this.showScreen('results-screen');
  },
  
  showGameOver(reason) {
    TimerController.stop();
    
    const modal = document.createElement('div');
    modal.className = 'game-over-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h2>Game Over</h2>
        <p>${reason}</p>
        <div class="modal-actions">
          <button onclick="UIController.retryGame()">Try Again</button>
          <button class="secondary-btn" onclick="UIController.exitToLevels()">Exit</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
  },
  
  retryGame() {
    document.querySelector('.game-over-modal')?.remove();
    const difficulty = this.currentDifficulty;
    const gameData = GameEngine.initializeGame(difficulty);
    this.renderCards(gameData.cards, gameData.gridClass);
    TimerController.reset();
    this.firstCardFlipped = false;
    this.updateStats();
  },
  
  exitToLevels() {
    document.querySelector('.game-over-modal')?.remove();
    this.showScreen('level-select-screen');
  },
  
  showPauseMenu() {
    const menu = document.createElement('div');
    menu.id = 'pause-menu';
    menu.className = 'pause-menu';
    menu.innerHTML = `
      <div class="pause-content">
        <h2>Game Paused</h2>
        <button onclick="UIController.resumeGame()">Resume</button>
        <button class="secondary-btn" onclick="UIController.showSettings()">Settings</button>
        <button class="secondary-btn" onclick="UIController.exitToLevels()">Exit to Menu</button>
      </div>
    `;
    
    document.body.appendChild(menu);
    setTimeout(() => menu.classList.add('show'), 10);
  },
  
  resumeGame() {
    GameEngine.togglePause();
    document.getElementById('pause-menu')?.remove();
  },
  
  showSettings() {
    const settings = document.createElement('div');
    settings.id = 'settings-panel';
    settings.className = 'settings-panel';
    settings.innerHTML = `
      <div class="settings-content">
        <h3>Settings</h3>
        
        <div class="setting-group">
          <label>Sound Effects</label>
          <button onclick="UIController.toggleSound()" id="sound-toggle">
            ${SoundManager.enabled ? '🔊 ON' : '🔇 OFF'}
          </button>
        </div>
        
        <div class="setting-group">
          <label>Volume</label>
          <input type="range" min="0" max="100" value="${SoundManager.volume * 100}" 
                 oninput="UIController.setVolume(this.value)">
        </div>
        
        <div class="setting-group">
          <label>Theme</label>
          <select onchange="UIController.changeTheme(this.value)" id="theme-select">
            <option value="dark" ${ThemeManager.currentTheme === 'dark' ? 'selected' : ''}>Dark</option>
            <option value="light" ${ThemeManager.currentTheme === 'light' ? 'selected' : ''}>Light</option>
            <option value="neon" ${ThemeManager.currentTheme === 'neon' ? 'selected' : ''}>Neon</option>
            <option value="nature" ${ThemeManager.currentTheme === 'nature' ? 'selected' : ''}>Nature</option>
          </select>
        </div>
        
        <button onclick="UIController.closeSettings()">Close</button>
      </div>
    `;
    
    document.body.appendChild(settings);
    setTimeout(() => settings.classList.add('show'), 10);
  },
  
  closeSettings() {
    document.getElementById('settings-panel')?.remove();
  },
  
  toggleSound() {
    SoundManager.toggle();
    document.getElementById('sound-toggle').textContent = 
      SoundManager.enabled ? '🔊 ON' : '🔇 OFF';
  },
  
  setVolume(value) {
    SoundManager.setVolume(value / 100);
  },
  
  changeTheme(theme) {
    ThemeManager.applyTheme(theme);
  },
  
  useHint() {
    const hintData = PowerUpsSystem.useHint();
    if (!hintData) {
      alert('No hints remaining!');
      return;
    }
    
    // Briefly reveal the two matching cards
    hintData.cards.forEach(card => {
      const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
      cardElement.classList.add('hint-reveal');
    });
    
    setTimeout(() => {
      hintData.cards.forEach(card => {
        const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
        cardElement.classList.remove('hint-reveal');
      });
    }, 2000);
    
    this.updateStats();
  },
  
  useTimeFreeze() {
    const success = PowerUpsSystem.useTimeFreeze();
    if (!success) {
      alert('No time freezes remaining!');
      return;
    }
    
    this.updateStats();
  },
  
  renderLeaderboard(difficulty) {
    const leaderboard = StorageManager.getLeaderboard(difficulty);
    const tbody = document.getElementById('leaderboard-body');
    const currentUsername = StorageManager.getUsername();
    
    tbody.innerHTML = '';
    
    if (leaderboard.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="no-scores">No scores yet. Be the first!</td></tr>';
      return;
    }
    
    leaderboard.forEach((entry, index) => {
      const row = document.createElement('tr');
      if (entry.username === currentUsername) {
        row.classList.add('current-player');
      }
      
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${entry.username}</td>
        <td>${entry.score}</td>
        <td>${entry.moves}</td>
        <td>${TimerController.formatTime(entry.time)}</td>
        <td>${entry.combo || 0}x</td>
      `;
      
      tbody.appendChild(row);
    });
  },
  
  showStatistics() {
    const stats = StatisticsManager.getStatistics();
    if (!stats) return;
    
    const modal = document.createElement('div');
    modal.className = 'stats-modal';
    modal.innerHTML = `
      <div class="modal-content stats-content">
        <h2>📊 Your Statistics</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${stats.gamesPlayed}</div>
            <div class="stat-label">Games Played</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.gamesWon}</div>
            <div class="stat-label">Games Won</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${StatisticsManager.getWinRate()}%</div>
            <div class="stat-label">Win Rate</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${StatisticsManager.getAverageScore()}</div>
            <div class="stat-label">Avg Score</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.maxCombo}x</div>
            <div class="stat-label">Max Combo</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.perfectGames}</div>
            <div class="stat-label">Perfect Games</div>
          </div>
        </div>
        
        <div class="best-scores">
          <h3>Best Scores</h3>
          <p>Easy: ${stats.bestScores.easy}</p>
          <p>Medium: ${stats.bestScores.medium}</p>
          <p>Hard: ${stats.bestScores.hard}</p>
        </div>
        
        <button onclick="UIController.closeStats()">Close</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
  },
  
  closeStats() {
    document.querySelector('.stats-modal')?.remove();
  },
  
  initializeLevelSelect() {
    const difficultyDisplay = document.getElementById('difficulty-display');
    difficultyDisplay.textContent = 
      this.currentDifficulty.charAt(0).toUpperCase() + this.currentDifficulty.slice(1);
    
    // Show current mode
    const modeDisplay = document.getElementById('mode-display');
    if (modeDisplay) {
      const mode = ChallengeModes.getMode();
      modeDisplay.textContent = mode.name;
    }
  }
};

// ========================================
// LEADERBOARD MANAGER MODULE (Enhanced)
// ========================================
const LeaderboardManager = {
  currentDifficulty: 'easy',
  
  switchDifficulty(difficulty) {
    this.currentDifficulty = difficulty;
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.difficulty === difficulty) {
        btn.classList.add('active');
      }
    });
    
    UIController.renderLeaderboard(difficulty);
  },
  
  clearLeaderboard() {
    const confirmed = confirm('Are you sure you want to clear all leaderboards? This cannot be undone.');
    
    if (confirmed) {
      StorageManager.clearLeaderboard();
      UIController.renderLeaderboard(this.currentDifficulty);
    }
  }
};

// ========================================
// EVENT LISTENERS & INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  // Initialize all systems
  StorageManager.initializeStorage();
  StatisticsManager.initializeStats();
  SoundManager.init();
  ThemeManager.init();
  ChallengeModes.loadMode();
  
  // Check for existing username
  const existingUsername = StorageManager.getUsername();
  if (existingUsername) {
    const welcomeMsg = document.getElementById('welcome-message');
    welcomeMsg.textContent = `Welcome back, ${existingUsername}!`;
    document.getElementById('username-input').value = existingUsername;
  }
  
  // Username form submission
  document.getElementById('username-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username-input').value.trim();
    
    if (username.length >= 2 && username.length <= 20) {
      StorageManager.saveUsername(username);
      UIController.showScreen('level-select-screen');
    }
  });
  
  // Level card selection
  document.querySelectorAll('.level-card').forEach(card => {
    card.addEventListener('click', () => {
      const difficulty = card.dataset.difficulty;
      UIController.currentDifficulty = difficulty;
      
      const gameData = GameEngine.initializeGame(difficulty);
      UIController.renderCards(gameData.cards, gameData.gridClass);
      UIController.initializeLevelSelect();
      
      TimerController.reset();
      UIController.firstCardFlipped = false;
      document.getElementById('moves-count').textContent = '0';
      document.getElementById('time-display').textContent = '00:00';
      document.getElementById('score-display').textContent = '10000';
      document.getElementById('combo-display').textContent = '-';
      document.getElementById('move-limit').textContent = '';
      document.getElementById('freeze-indicator').style.display = 'none';
      
      UIController.showScreen('game-screen');
    });
  });
  
  // Back to levels button
  document.getElementById('back-to-levels').addEventListener('click', () => {
    TimerController.stop();
    UIController.showScreen('level-select-screen');
  });
  
  // Pause button
  document.getElementById('pause-btn')?.addEventListener('click', () => {
    GameEngine.togglePause();
    UIController.showPauseMenu();
  });
  
  // Power-up buttons
  document.getElementById('hint-btn')?.addEventListener('click', () => {
    UIController.useHint();
  });
  
  document.getElementById('freeze-btn')?.addEventListener('click', () => {
    UIController.useTimeFreeze();
  });
  
  // View statistics button
  document.getElementById('view-stats-btn')?.addEventListener('click', () => {
    UIController.showStatistics();
  });
  
  // View leaderboard button (from level select)
  document.getElementById('view-leaderboard-btn').addEventListener('click', () => {
    LeaderboardManager.switchDifficulty('easy');
    UIController.showScreen('leaderboard-screen');
  });
  
  // Challenge mode selector
  document.getElementById('mode-selector')?.addEventListener('change', (e) => {
    ChallengeModes.setMode(e.target.value);
  });
  
  // Results screen buttons
  document.getElementById('play-again-btn').addEventListener('click', () => {
    const difficulty = UIController.currentDifficulty;
    const gameData = GameEngine.initializeGame(difficulty);
    UIController.renderCards(gameData.cards, gameData.gridClass);
    
    TimerController.reset();
    UIController.firstCardFlipped = false;
    document.getElementById('moves-count').textContent = '0';
    document.getElementById('time-display').textContent = '00:00';
    document.getElementById('score-display').textContent = '10000';
    document.getElementById('combo-display').textContent = '-';
    
    UIController.showScreen('game-screen');
  });
  
  document.getElementById('choose-level-btn').addEventListener('click', () => {
    UIController.showScreen('level-select-screen');
  });
  
  document.getElementById('view-results-leaderboard').addEventListener('click', () => {
    LeaderboardManager.switchDifficulty(UIController.currentDifficulty);
    UIController.showScreen('leaderboard-screen');
  });
  
  // Leaderboard screen buttons
  document.getElementById('back-from-leaderboard').addEventListener('click', () => {
    UIController.showScreen('level-select-screen');
  });
  
  document.getElementById('clear-leaderboard').addEventListener('click', () => {
    LeaderboardManager.clearLeaderboard();
  });
  
  // Difficulty tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const difficulty = btn.dataset.difficulty;
      LeaderboardManager.switchDifficulty(difficulty);
    });
  });
  
  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (UIController.currentScreen === 'game-screen') {
        if (!GameEngine.isPaused) {
          GameEngine.togglePause();
          UIController.showPauseMenu();
        }
      } else if (UIController.currentScreen === 'leaderboard-screen') {
        UIController.showScreen('level-select-screen');
      } else if (document.getElementById('pause-menu')) {
        UIController.resumeGame();
      } else if (document.getElementById('settings-panel')) {
        UIController.closeSettings();
      }
    } else if (e.key === 'p' || e.key === 'P') {
      if (UIController.currentScreen === 'game-screen') {
        GameEngine.togglePause();
        if (GameEngine.isPaused) {
          UIController.showPauseMenu();
        } else {
          document.getElementById('pause-menu')?.remove();
        }
      }
    } else if (e.key === 'h' || e.key === 'H') {
      if (UIController.currentScreen === 'game-screen' && !GameEngine.isPaused) {
        UIController.useHint();
      }
    } else if (e.key === 'f' || e.key === 'F') {
      if (UIController.currentScreen === 'game-screen' && !GameEngine.isPaused) {
        UIController.useTimeFreeze();
      }
    }
  });
});
