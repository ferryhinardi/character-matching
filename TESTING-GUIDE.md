# Memory Match Game - Testing Guide

## 🚀 Quick Start Testing

### 1. Open the Test Suite
```
Open test-suite.html in your browser
```

### 2. Run All Tests
Click the "Run All Tests" button to execute the complete test suite automatically.

### 3. Review Results
- Green = Passed ✓
- Red = Failed ✗
- Orange = Warning ⚠

---

## 🧪 Manual Testing Instructions

### Basic Gameplay Test (5 minutes)

1. **Start Game**
   - Open `index.html` in browser
   - Enter username "TestUser"
   - Click "Start Playing"
   - ✓ Verify: Welcome screen → Level select screen

2. **Play Easy Level**
   - Click "Easy" difficulty
   - ✓ Verify: 4×4 grid (16 cards) displays
   - Flip two cards
   - ✓ Verify: Timer starts on first flip
   - ✓ Verify: Move counter increments
   - Match two pairs
   - ✓ Verify: Matched cards stay face-up with green border
   - Try to click a matched card
   - ✓ Verify: Cannot click matched cards
   - Complete the game
   - ✓ Verify: Timer stops, results screen shows

3. **Check Leaderboard**
   - ✓ Verify: Your score appears in leaderboard
   - ✓ Verify: Score calculation is correct
   - ✓ Verify: Performance message displays

4. **Test Other Difficulties**
   - Play Medium (4×6 = 24 cards)
   - Play Hard (6×6 = 36 cards)
   - ✓ Verify: Each difficulty works correctly

---

## 🔍 Detailed Test Scenarios

### Test Scenario 1: New User Flow
**Objective:** Verify first-time user experience

**Steps:**
1. Clear browser localStorage (DevTools → Application → Clear Storage)
2. Open index.html
3. Enter username "NewPlayer" (2-20 characters)
4. Submit form
5. Select Easy difficulty
6. Play and complete game
7. View leaderboard

**Expected Results:**
- ✓ No "Welcome back" message
- ✓ Username saves to localStorage
- ✓ Game completes successfully
- ✓ Score appears in leaderboard

---

### Test Scenario 2: Returning User
**Objective:** Verify returning user recognition

**Steps:**
1. Open index.html (with existing username in storage)
2. Observe welcome screen

**Expected Results:**
- ✓ "Welcome back, [Username]!" message displays
- ✓ Username input pre-filled
- ✓ Can change username if desired

---

### Test Scenario 3: Score Calculation
**Objective:** Verify score formula accuracy

**Formula:** `Score = 10000 - (moves × 100) - (time × 10)`

**Test Cases:**
| Moves | Time | Expected Score | Notes |
|-------|------|----------------|-------|
| 8 | 30 | 9200 | Perfect game |
| 20 | 60 | 7400 | Average game |
| 50 | 200 | 3000 | Poor game |
| 100 | 100 | 0 | Minimum score |

**Steps:**
1. Play game with controlled moves and time
2. Check final score on results screen
3. Verify calculation matches formula

**Expected Results:**
- ✓ Score matches formula exactly
- ✓ Score never goes below 0

---

### Test Scenario 4: Leaderboard Management
**Objective:** Verify leaderboard sorting and limits

**Steps:**
1. Play Easy difficulty 12 times with varying scores
2. View Easy leaderboard
3. Switch to Medium tab
4. Play Medium difficulty once
5. Switch back to Easy tab
6. Clear leaderboard (with confirmation)

**Expected Results:**
- ✓ Only top 10 scores shown
- ✓ Scores sorted high to low
- ✓ Same scores sorted by date (earliest first)
- ✓ Tab switching works correctly
- ✓ Each difficulty has separate leaderboard
- ✓ Clear requires confirmation
- ✓ All leaderboards cleared

---

### Test Scenario 5: Edge Cases
**Objective:** Test boundary conditions and errors

#### 5.1: Rapid Clicking
**Steps:**
1. Start game
2. Click multiple cards rapidly (3+ cards quickly)

**Expected:**
- ✓ Only 2 cards flip at once
- ✓ No errors in console

#### 5.2: Double Click Same Card
**Steps:**
1. Start game
2. Double-click same card

**Expected:**
- ✓ Card flips only once
- ✓ Cannot flip same card twice

#### 5.3: Click During Animation
**Steps:**
1. Flip two non-matching cards
2. Click another card before they flip back

**Expected:**
- ✓ New card doesn't flip until animation completes
- ✓ Processing lock prevents new clicks

#### 5.4: Username Validation
**Steps:**
1. Try username with 1 character
2. Try username with 21 characters
3. Try empty username
4. Try username with special characters

**Expected:**
- ✓ 1 char rejected (min 2)
- ✓ 21 chars rejected (max 20)
- ✓ Empty rejected (required)
- ✓ Special chars accepted (no sanitization warning)

#### 5.5: localStorage Disabled
**Steps:**
1. Open browser in private/incognito mode with localStorage blocked
2. Try to play game

**Expected:**
- ✗ May not save scores (acceptable)
- ✓ Game should still be playable

---

## 📱 Responsive Testing

### Mobile Testing (< 768px)

**Test on:**
- iPhone SE (320px width)
- iPhone 12 (390px width)
- Pixel 5 (393px width)
- Galaxy S21 (360px width)

**Check:**
- ✓ All buttons are tappable (≥44px)
- ✓ Text is readable
- ✓ Cards fit on screen
- ✓ No horizontal scrolling
- ✓ Portrait and landscape work

**How to Test Without Device:**
1. Open DevTools (F12)
2. Click device toolbar icon
3. Select device or set custom dimensions
4. Test all screens

---

### Tablet Testing (768px - 1023px)

**Test on:**
- iPad (768px width)
- iPad Pro (1024px width)

**Check:**
- ✓ 3-column layout for level cards
- ✓ Appropriate card sizes
- ✓ Stats panel centered
- ✓ Comfortable touch targets

---

### Desktop Testing (1024px+)

**Test on:**
- 1366×768 (common laptop)
- 1920×1080 (Full HD)
- 2560×1440 (2K)

**Check:**
- ✓ Content centered
- ✓ Max-width prevents over-stretching
- ✓ Hover effects work
- ✓ Large cards are visible

---

## 🌐 Browser Testing

### Chrome/Edge (Chromium)
```
✓ ES6 support
✓ CSS Grid
✓ CSS Variables
✓ Flexbox
✓ localStorage
✓ Smooth animations
```

### Firefox
```
✓ ES6 support
✓ CSS Grid
✓ CSS Variables
✓ Flexbox
✓ localStorage
✓ Smooth animations
```

### Safari
```
✓ ES6 support
✓ CSS Grid
✓ CSS Variables (with -webkit- prefix)
✓ Flexbox
✓ localStorage
✓ Smooth animations
```

---

## ⚡ Performance Testing

### Load Time Test
1. Open DevTools → Network tab
2. Hard refresh (Ctrl+Shift+R)
3. Check load times

**Expected:**
- ✓ HTML: < 50ms
- ✓ CSS: < 100ms
- ✓ JS: < 100ms
- ✓ Total: < 500ms

### Animation Performance Test
1. Open DevTools → Performance tab
2. Start recording
3. Flip multiple cards
4. Stop recording
5. Check frame rate

**Expected:**
- ✓ Consistent 60fps
- ✓ No dropped frames
- ✓ No long tasks (>50ms)

### Memory Leak Test
1. Open DevTools → Memory tab
2. Take heap snapshot
3. Play 5 complete games
4. Take another snapshot
5. Compare memory usage

**Expected:**
- ✓ Memory increases < 5MB
- ✓ Timer intervals cleared
- ✓ No detached DOM nodes

---

## ♿ Accessibility Testing

### Keyboard Navigation Test
**Keys to Test:**
- `Tab` - Navigate through elements
- `Enter` - Activate buttons
- `Escape` - Exit screens

**Expected:**
- ✓ Can navigate with keyboard
- ✓ Focus indicators visible
- ✓ Logical tab order

### Screen Reader Test
**Screen Readers:**
- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (Mac/iOS)
- TalkBack (Android)

**Check:**
- Headings announced correctly
- Buttons have accessible names
- Form inputs have labels
- Game events announced

### Color Blindness Test
Use browser extensions:
- ColorBlindly
- Colorblinding

**Check:**
- Information not conveyed by color alone
- Sufficient contrast
- Patterns/text supplement color

---

## 🐛 Bug Reporting Template

When you find a bug, report it using this template:

```markdown
## Bug Report

**Title:** [Short description]

**Priority:** Critical / High / Medium / Low

**Environment:**
- Browser: [Chrome 119, Firefox 120, etc.]
- OS: [Windows 11, macOS 14, etc.]
- Device: [Desktop, iPhone 12, etc.]
- Screen Size: [1920×1080, 390×844, etc.]

**Steps to Reproduce:**
1. [First step]
2. [Second step]
3. [Third step]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Screenshots/Video:**
[Attach if available]

**Console Errors:**
[Copy any errors from browser console]

**Additional Context:**
[Any other relevant information]
```

---

## 📊 Test Results Template

```markdown
## Test Execution Report

**Tester:** [Your Name]
**Date:** [Date]
**Duration:** [Time taken]
**Browser:** [Browser and version]

### Summary
- Total Tests: [Number]
- Passed: [Number]
- Failed: [Number]
- Blocked: [Number]

### Failed Tests
1. [Test name] - [Reason]
2. [Test name] - [Reason]

### Notes
[Any additional observations]
```

---

## 🔧 Debugging Tips

### Check Console
Always have DevTools console open:
```javascript
// Look for errors (red)
// Look for warnings (yellow)
// Check network requests
```

### Inspect localStorage
```javascript
// View stored data
console.log(localStorage.getItem('memoryMatchGame'));

// Clear if corrupted
localStorage.removeItem('memoryMatchGame');
```

### Test Specific Functions
```javascript
// In console, access game modules
StorageManager.getLeaderboard('easy');
ScoreCalculator.calculateScore(20, 60);
TimerController.formatTime(125);
```

### Force Edge Cases
```javascript
// Manually set game state for testing
GameEngine.moves = 100;
TimerController.seconds = 500;
// Then check score calculation
```

---

## ✅ Pre-Deployment Checklist

Before deploying to production:

- [ ] All automated tests pass
- [ ] Manual testing completed on all features
- [ ] Tested on Chrome, Firefox, Safari, Edge
- [ ] Tested on mobile devices (real devices preferred)
- [ ] Responsive design verified (320px - 1920px)
- [ ] No console errors or warnings
- [ ] Performance is acceptable (60fps animations)
- [ ] localStorage works correctly
- [ ] Cross-browser compatibility verified
- [ ] Accessibility basics checked
- [ ] Code reviewed and commented
- [ ] Documentation updated
- [ ] Test results documented

---

## 📞 Support

If you find issues during testing:

1. Check TEST-DOCUMENTATION.md for known issues
2. Try clearing browser cache and localStorage
3. Test in different browser
4. Create bug report using template above
5. Document steps to reproduce

---

**Happy Testing! 🎮**
