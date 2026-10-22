// ========================================
// STORAGE MANAGER MODULE
// ========================================
const StorageManager = {
  STORAGE_KEY: 'memoryMatchGame',
  
  initializeStorage() {
    try {
      // Test localStorage availability
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      
      // Get existing data or create new structure
      const existingData = localStorage.getItem(this.STORAGE_KEY);
      
      if (!existingData) {
        const initialData = {
          username: '',
          leaderboards: {
            easy: [],
            medium: [],
            hard: []
          }
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(initialData));
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
      
      // Sort and keep top 10
      data.leaderboards[difficulty].sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score; // Higher score first
        }
        return new Date(a.date) - new Date(b.date); // Earlier date first
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
// GAME ENGINE MODULE
// ========================================
const GameEngine = {
  difficulty: '',
  cards: [],
  flippedCards: [],
  matchedPairs: 0,
  moves: 0,
  isProcessing: false,
  
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
    // Fisher-Yates shuffle algorithm
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  },
  
  flipCard(cardId) {
    if (this.isProcessing) return false;
    
    const card = this.cards.find(c => c.id === cardId);
    
    if (!card || card.isFlipped || card.isMatched) {
      return false;
    }
    
    card.isFlipped = true;
    this.flippedCards.push(card);
    
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
      
      return {
        match: true,
        cards: [card1, card2],
        gameComplete: this.checkGameComplete()
      };
    } else {
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
  },
  
  checkGameComplete() {
    const totalPairs = this.difficultyConfig[this.difficulty].pairs;
    return this.matchedPairs === totalPairs;
  }
};

// ========================================
// TIMER CONTROLLER MODULE
// ========================================
const TimerController = {
  seconds: 0,
  intervalId: null,
  isRunning: false,
  
  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.intervalId = setInterval(() => {
        this.seconds++;
        UIController.updateTimer(this.seconds);
      }, 1000);
    }
  },
  
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
    }
  },
  
  reset() {
    this.stop();
    this.seconds = 0;
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
// SCORE CALCULATOR MODULE
// ========================================
const ScoreCalculator = {
  calculateScore(moves, time) {
    const baseScore = 10000;
    const movePenalty = moves * 100;
    const timePenalty = time * 10;
    const finalScore = Math.max(0, baseScore - movePenalty - timePenalty);
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

// ========================================
// UI CONTROLLER MODULE
// ========================================
const UIController = {
  currentScreen: 'welcome-screen',
  currentDifficulty: '',
  firstCardFlipped: false,
  
  showScreen(screenId) {
    // Hide current screen
    const currentScreen = document.querySelector('.screen.active');
    if (currentScreen) {
      currentScreen.classList.remove('active');
    }
    
    // Show new screen
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
      
      if (result.gameComplete) {
        this.handleGameComplete();
      }
    } else {
      result.cards.forEach(card => {
        const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
        cardElement.classList.remove('flipped');
      });
      GameEngine.resetFlippedCards();
    }
    
    this.updateStats();
  },
  
  handleGameComplete() {
    TimerController.stop();
    
    const moves = GameEngine.moves;
    const time = TimerController.getElapsedTime();
    const score = ScoreCalculator.calculateScore(moves, time);
    const username = StorageManager.getUsername();
    
    // Save score
    const scoreData = {
      username: username,
      score: score,
      moves: moves,
      time: time,
      date: new Date().toISOString()
    };
    
    StorageManager.saveScore(GameEngine.difficulty, scoreData);
    
    // Show results
    setTimeout(() => {
      this.showResults({
        difficulty: GameEngine.difficulty,
        score: score,
        moves: moves,
        time: time,
        isTopScore: StorageManager.isTopScore(GameEngine.difficulty, score)
      });
    }, 1000);
  },
  
  updateStats() {
    const moves = GameEngine.moves;
    const time = TimerController.getElapsedTime();
    const score = ScoreCalculator.calculateScore(moves, time);
    
    document.getElementById('moves-count').textContent = moves;
    document.getElementById('score-display').textContent = score;
  },
  
  updateTimer(seconds) {
    const formattedTime = TimerController.formatTime(seconds);
    document.getElementById('time-display').textContent = formattedTime;
    this.updateStats(); // Update score as time changes
  },
  
  showResults(gameData) {
    document.getElementById('result-difficulty').textContent = 
      gameData.difficulty.charAt(0).toUpperCase() + gameData.difficulty.slice(1);
    document.getElementById('result-score').textContent = gameData.score;
    document.getElementById('result-moves').textContent = gameData.moves;
    document.getElementById('result-time').textContent = TimerController.formatTime(gameData.time);
    
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
  
  renderLeaderboard(difficulty) {
    const leaderboard = StorageManager.getLeaderboard(difficulty);
    const tbody = document.getElementById('leaderboard-body');
    const currentUsername = StorageManager.getUsername();
    
    tbody.innerHTML = '';
    
    if (leaderboard.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="no-scores">No scores yet. Be the first!</td></tr>';
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
      `;
      
      tbody.appendChild(row);
    });
  },
  
  initializeLevelSelect() {
    const difficultyDisplay = document.getElementById('difficulty-display');
    difficultyDisplay.textContent = 
      this.currentDifficulty.charAt(0).toUpperCase() + this.currentDifficulty.slice(1);
  }
};

// ========================================
// LEADERBOARD MANAGER MODULE
// ========================================
const LeaderboardManager = {
  currentDifficulty: 'easy',
  
  switchDifficulty(difficulty) {
    this.currentDifficulty = difficulty;
    
    // Update tab buttons
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
  // Initialize storage
  StorageManager.initializeStorage();
  
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
      
      // Reset timer and stats
      TimerController.reset();
      UIController.firstCardFlipped = false;
      document.getElementById('moves-count').textContent = '0';
      document.getElementById('time-display').textContent = '00:00';
      document.getElementById('score-display').textContent = '10000';
      
      UIController.showScreen('game-screen');
    });
  });
  
  // Back to levels button
  document.getElementById('back-to-levels').addEventListener('click', () => {
    TimerController.stop();
    UIController.showScreen('level-select-screen');
  });
  
  // View leaderboard button (from level select)
  document.getElementById('view-leaderboard-btn').addEventListener('click', () => {
    LeaderboardManager.switchDifficulty('easy');
    UIController.showScreen('leaderboard-screen');
  });
  
  // Results screen buttons
  document.getElementById('play-again-btn').addEventListener('click', () => {
    const difficulty = UIController.currentDifficulty;
    const gameData = GameEngine.initializeGame(difficulty);
    UIController.renderCards(gameData.cards, gameData.gridClass);
    
    // Reset timer and stats
    TimerController.reset();
    UIController.firstCardFlipped = false;
    document.getElementById('moves-count').textContent = '0';
    document.getElementById('time-display').textContent = '00:00';
    document.getElementById('score-display').textContent = '10000';
    
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
        TimerController.stop();
        UIController.showScreen('level-select-screen');
      } else if (UIController.currentScreen === 'leaderboard-screen') {
        UIController.showScreen('level-select-screen');
      }
    }
  });
});
