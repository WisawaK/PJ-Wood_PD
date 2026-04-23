<template>
  <div class="arcade-master">

    <div v-if="appState === 'MENU'" class="menu-container">
      <h1 class="main-title">ARCADE CENTER 🕹️</h1>
      <p class="subtitle">Ultimate Survival Edition (Widescreen)</p>
      
      <button v-if="hasSaveFile" class="action-btn retry save-btn" @click="loadGameData">
        💾 โหลดเซฟเกมที่เล่นค้างไว้
      </button>

      <div class="game-select-grid">
        <div class="game-card snake-card" @click="launchGame('SNAKE')">
          <div class="card-icon">🐍</div>
          <h2>Snake Game</h2>
          <p>เกมงูคลาสสิก จอกว้าง เลี้ยวซ้ายขวากินอาหาร</p>
        </div>
        <div class="game-card rogue-card" @click="launchGame('ROGUE')">
          <div class="card-icon">🛡️</div>
          <h2>Rogue Survivor</h2>
          <p>เอาชีวิตรอด 6 คลาส จอกว้าง มีระบบสกิล E (กดค้างยิงได้)</p>
        </div>
      </div>
    </div>

    <div v-if="appState === 'SNAKE'" class="game-area snake-area">
      <button class="top-btn back-btn" @click="backToMenu">⬅️ ออกไปหน้าเมนู</button>
      <button class="top-btn pause-btn" v-if="['PLAYING', 'PAUSED'].includes(s_gameState)" @click="s_togglePause">
        {{ s_gameState === 'PAUSED' ? '▶️ เล่นต่อ' : '⏸️ พักเกม' }}
      </button>

      <h1>เกมงู (Snake Game) 🐍</h1>
      <div class="snake-score-board">คะแนน: <strong>{{ s_score }}</strong> | สายพันธุ์: {{ s_snakeName }}</div>

      <div class="snake-board-wrapper">
        <div class="snake-game-board" :style="s_boardStyle">
          <div class="s-food" :style="s_getStyle(s_food)"></div>
          <div v-for="(segment, index) in s_snake" :key="index" class="s-snake-segment" :class="[s_snakeType, { 's-snake-head': index === 0 }]" :style="s_getStyle(segment)"></div>

          <div v-if="s_gameState === 'SELECT_SNAKE'" class="game-overlay">
            <h2>เลือกสายพันธุ์งู 🐍</h2>
            <div class="r-char-selection-grid snake-selection">
              <div class="r-char-card" @click="s_selectSnake('python', 220, 'งูหลาม')"><div class="sprite preview s-python"></div><h3>งูหลาม</h3><p>สปีด: ช้ามาก</p></div>
              <div class="r-char-card" @click="s_selectSnake('green', 140, 'งูเขียว')"><div class="sprite preview s-green"></div><h3>งูเขียว</h3><p>สปีด: ปานกลาง</p></div>
              <div class="r-char-card" @click="s_selectSnake('cobra', 80, 'งูเห่า')"><div class="sprite preview s-cobra"></div><h3>งูเห่า</h3><p>สปีด: เร็วมาก</p></div>
            </div>
          </div>
          <div v-if="s_gameState === 'READY'" class="game-overlay"><h2>พร้อมไหม? 😎</h2><button class="action-btn start" @click="s_startGame">เริ่มเกม!</button></div>
          <div v-if="s_gameState === 'PAUSED'" class="game-overlay"><h2>⏸️ พักเกม</h2><button class="action-btn start" @click="s_togglePause">เล่นต่อ</button></div>
          <div v-if="s_gameState === 'GAMEOVER'" class="game-overlay"><h2>จบเกม! 💥</h2><p>คะแนน: {{ s_score }}</p><button class="action-btn retry" @click="s_gameState = 'SELECT_SNAKE'">เลือกงูใหม่</button></div>
        </div>
      </div>
      <p class="controls-hint" v-if="s_gameState !== 'SELECT_SNAKE'">⌨️ กดลูกศร/WASD เพื่อเดิน | กด P หรือ ESC เพื่อพักเกม</p>
    </div>

    <div v-if="appState === 'ROGUE'" class="game-area rogue-area">
      <button class="top-btn back-btn" @click="backToMenu">⬅️ กลับเมนู (เซฟอัตโนมัติ)</button>
      <button class="top-btn pause-btn" v-if="['PLAYING', 'PAUSED'].includes(r_gameState)" @click="r_togglePause">
        {{ r_gameState === 'PAUSED' ? '▶️ เล่นต่อ' : '⏸️ พักเกม' }}
      </button>

      <div class="r-ui-panel" v-if="r_gameState !== 'SLOTS'">
        <div class="r-stats-row">
          <span>LV: {{ r_player.level }} | คลาส: {{ r_player.className }}</span>
          <span>❤️ HP: {{ Math.ceil(r_player.hp) }}/{{ r_player.maxHp }}</span>
          <span class="r-gold-text">💰 {{ r_gold }}</span>
        </div>
        <div class="r-exp-bar-bg"><div class="r-exp-bar-fill" :style="{ width: r_expPercent + '%' }"></div></div>
        <div class="r-stats-row skill-row">
          <div class="r-timer">Wave: {{ r_wave }} | Time: {{ r_timeLeft }}s ⏳</div>
          <div class="skill-status" :class="{ 'ready': r_player.skillReady, 'cooldown': !r_player.skillReady }">
            [E] {{ r_player.skillName }} ({{ r_player.skillReady ? 'READY' : r_player.skillCDTimer + 's' }})
          </div>
        </div>
      </div>

      <div 
        class="r-game-world" 
        ref="rogueWorld"
        @mousemove="r_onMouseMove"
        @mousedown.prevent="r_onMouseDown"
        @mouseup.prevent="r_onMouseUp"
        @mouseleave="r_onMouseLeave"
        @contextmenu.prevent
      >
        <div v-if="r_isAiming" class="r-crosshair" :style="{ left: r_mouseX + 'px', top: r_mouseY + 'px' }">🎯</div>
        
        <div v-if="r_gameState !== 'SLOTS'" class="sprite r-player" :class="[r_player.charId, { 'flip': r_player.facingLeft }]" :style="r_objectStyle(r_player)">
          <div class="r-hp-bar-mini"><div class="r-hp-fill-mini" :style="{ width: (r_player.hp/r_player.maxHp)*100 + '%' }"></div></div>
        </div>
        
        <div v-for="s in r_slashes" :key="'sl'+s.id" class="r-slash" :style="r_slashStyle(s)"></div>
        <div v-for="e in r_enemies" :key="'e'+e.id" class="sprite r-enemy" :class="[e.type, { 'flip': e.facingLeft }]" :style="r_objectStyle(e)">
           <div class="r-hp-bar-mini" v-if="e.isBoss"><div class="r-hp-fill-mini" :style="{ width: (e.hp/e.maxHp)*100 + '%' }"></div></div>
        </div>
        
        <div v-for="b in r_bullets" :key="'b'+b.id" class="r-bullet" :style="r_objectStyle(b)"></div>
        <div v-for="eb in r_enemyBullets" :key="'eb'+eb.id" class="r-bullet enemy-bullet" :style="r_objectStyle(eb)"></div>
        
        <div v-for="g in r_gems" :key="'g'+g.id" class="r-gem" :style="r_objectStyle(g)"></div>
        <div v-for="c in r_coins" :key="'c'+c.id" class="r-coin" :style="r_objectStyle(c)"></div>
        
        <div v-for="t in r_floatingTexts" :key="'t'+t.id" class="r-floating-text" :style="{ left: t.x + 'px', top: t.y + 'px', opacity: t.life / 30, color: t.color || '#ff6b6b' }">{{ t.text }}</div>

        <div v-if="r_gameState === 'SLOTS'" class="game-overlay">
          <h2>เลือกสล็อตเซฟเกม 💾</h2>
          <div class="slots-container">
            <div v-for="(slot, i) in r_saveSlots" :key="i" class="slot-card">
              <div v-if="slot">
                <h3>สล็อต {{ i + 1 }}</h3>
                <p>คลาส: {{ slot.r_player.className }} LV.{{ slot.r_player.level }}</p>
                <p>Wave: {{ slot.r_wave }} | เงิน: 💰{{ slot.r_gold }}</p>
                <div class="slot-actions">
                  <button class="action-btn start" @click="r_loadSlot(i)">▶️ เล่นต่อ</button>
                  <button class="action-btn retry" @click="r_newGameSlot(i)">ทับเซฟใหม่</button>
                </div>
              </div>
              <div v-else class="empty-slot">
                <h3>สล็อต {{ i + 1 }}</h3>
                <p>-- ช่องว่างเปล่า --</p>
                <button class="action-btn start" @click="r_newGameSlot(i)">➕ เริ่มเกมใหม่</button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="r_gameState === 'SELECT_CHAR'" class="game-overlay">
          <h2>เลือกคลาสฮีโร่ของคุณ 🛡️ (สกิล E)</h2>
          <div class="r-char-selection-grid">
            <div class="r-char-card" @click="r_selectChar('m1')"><div class="sprite preview m-knight"></div><h3>นักรบดำ (ช)</h3><p>ดาบใหญ่/กระโดดสับ</p></div>
            <div class="r-char-card" @click="r_selectChar('m2')"><div class="sprite preview m-hunter"></div><h3>นายพราน (ช)</h3><p>ธนูคู่/ม้วนตัวหลบ</p></div>
            <div class="r-char-card" @click="r_selectChar('m3')"><div class="sprite preview m-sorcerer"></div><h3>นักเวทย์พรต (ช)</h3><p>คาถา/ระเบิดพลังไฟ</p></div>
            <div class="r-char-card" @click="r_selectChar('f1')"><div class="sprite preview f-assassin"></div><h3>นินจาสาว (ญ)</h3><p>มีดสั้น/เทเลพอร์ต</p></div>
            <div class="r-char-card" @click="r_selectChar('f2')"><div class="sprite preview f-priestess"></div><h3>นักบวชหญิง (ญ)</h3><p>คทาพลังแสง/ฟื้น HP</p></div>
            <div class="r-char-card" @click="r_selectChar('f3')"><div class="sprite preview f-gunner"></div><h3>นักล่าปืน (ญ)</h3><p>ปืนลูกซอง/กราดยิง</p></div>
          </div>
        </div>

        <div v-if="r_gameState === 'PAUSED'" class="game-overlay"><h2>⏸️ พักเกม</h2><button class="action-btn start" @click="r_togglePause">เล่นต่อ</button></div>

        <div v-if="r_gameState === 'LEVEL_UP'" class="game-overlay">
          <h2>LEVEL UP! ✨ เลเวล {{ r_player.level }}</h2>
          <p>คุณจะได้รับสิทธิ์อัปเกรดทุกๆ 5 เลเวล</p>
          <div class="r-upgrade-list">
            <button v-for="u in r_upgradeOptions" :key="u.name" class="r-upgrade-item" @click="r_applyUpgrade(u)">{{ u.label }}</button>
          </div>
        </div>

        <div v-if="r_gameState === 'SHOP'" class="game-overlay">
          <h2>ร้านค้าอาวุธ 🛒 (จบเวฟ {{ r_wave }})</h2>
          <p>สถานะ: 💾 เซฟเกมอัตโนมัติลงสล็อต {{ r_currentSlot + 1 }} แล้ว</p>
          <p>คุณมีเงิน: <span class="r-gold-text">💰 {{ r_gold }}</span></p>
          <div class="r-shop-grid">
            <button v-for="(s, key) in r_shopItems" :key="key" class="r-shop-item" :disabled="r_gold < s.cost" @click="r_buyItem(key)">
              {{ s.label }}<br>💰{{ s.cost }}
            </button>
          </div>
          <button class="action-btn start" @click="r_startNextWave">ลุยเวฟ {{ r_wave + 1 }} ต่อ ⚔️</button>
        </div>

        <div v-if="r_gameState === 'GAMEOVER'" class="game-overlay">
          <h2>ภารกิจล้มเหลว! 💀</h2><p>เวฟ: {{ r_wave }} | คลาส: {{ r_player.className }} LV.{{ r_player.level }}</p>
          <button class="action-btn retry" @click="r_gameState = 'SLOTS'">กลับไปหน้าเลือกสล็อต</button>
        </div>
      </div>
      
      <div class="controls-hint-box" v-if="r_gameState !== 'SLOTS'">
        <p>⌨️ <strong>WASD</strong> เดิน | <strong>[Spacebar] / [คลิกซ้าย] กดค้าง</strong> โจมตีต่อเนื่อง | <strong>E</strong> ใช้สกิล | <strong>P</strong> พัก</p>
        <p>🖱️ <strong>[คลิกขวาค้าง]</strong> = เล็งยิงเอง | <strong>[ปล่อย]</strong> = ออโต้ล็อคเป้าใกล้สุด</p>
      </div>
    </div>

  </div>
</template>

<script>
export default {
  name: 'GameOnlyAdmin',
  data() {
    return {
      appState: 'MENU',
      hasSaveFile: false,
      globalKeys: {},
      
      // --- Snake Game ---
      s_gameState: 'SELECT_SNAKE', s_snakeType: 'green', s_snakeName: 'ยังไม่เลือก', s_baseSpeed: 150,
      s_gridCols: 30, s_gridRows: 20, s_cellSize: 20, s_snake: [], s_food: { x: 0, y: 0 },
      s_dir: { x: 0, y: -1 }, s_nextDir: { x: 0, y: -1 }, s_score: 0, s_interval: null, s_speed: 150,

      // --- Rogue Survivor ---
      r_gameState: 'SLOTS', r_saveSlots: [null, null, null], r_currentSlot: -1,
      r_mouseX: 0, r_mouseY: 0, r_isAiming: false, 
      r_isAttacking: false, // ตัวแปรเช็คการกดโจมตีค้าง
      
      r_player: { 
        x: 400, y: 300, r: 15, charId: '', className: '', speed: 3, hp: 100, maxHp: 100, 
        level: 1, exp: 0, nextExp: 100, atkSpeed: 500, damage: 20, facingLeft: false, weaponType: 'melee', attackRange: 50,
        skillName: '', skillReady: true, skillCD: 10, skillCDTimer: 0, lastSkillUse: 0,
      },
      r_enemies: [], r_bullets: [], r_enemyBullets: [], r_gems: [], r_coins: [], r_floatingTexts: [], r_slashes: [],
      r_gold: 0, r_wave: 1, r_timeLeft: 30, r_lastShot: 0,
      r_enemyId: 0, r_bulletId: 0, r_gemId: 0, r_coinId: 0, r_textId: 0, r_slashId: 0,
      r_gameLoop: null, r_spawnTimer: null, r_waveTimer: null,
      r_upgradeOptions: [],
      r_shopItems: {
        maxHp: { label: '❤️ Max HP +50', cost: 50, run: () => { this.r_player.maxHp += 50; this.r_player.hp += 50; } },
        damage: { label: '⚔️ พลังโจมตี +15', cost: 40, run: () => { this.r_player.damage += 15; } },
        atkSpeed: { label: '🔥 โจมตีรัวขึ้น 10%', cost: 60, run: () => { this.r_player.atkSpeed *= 0.9; } },
        heal: { label: '🩹 ฟื้นฟูเลือดเต็ม', cost: 30, run: () => { this.r_player.hp = this.r_player.maxHp; } },
        skillCD: { label: '🌀 สกิลคูลดาวน์เร็วขึ้น 20%', cost: 80, run: () => { this.r_player.skillCD *= 0.8; } },
      }
    };
  },
  computed: {
    s_boardStyle() { return { width: `${this.s_gridCols * this.s_cellSize}px`, height: `${this.s_gridRows * this.s_cellSize}px` }; },
    r_expPercent() { return Math.min((this.r_player.exp / this.r_player.nextExp) * 100, 100); }
  },
  created() { this.checkSaveData(); },
  mounted() {
    window.addEventListener('keydown', this.handleKeydown);
    window.addEventListener('keyup', this.handleKeyup);
  },
  beforeDestroy() {
    window.removeEventListener('keydown', this.handleKeydown);
    window.removeEventListener('keyup', this.handleKeyup);
    this.clearAllIntervals();
    this.saveGameData();
  },
  methods: {
    // === Save System ===
    checkSaveData() {
      const saved = localStorage.getItem('arcade_rogue_slots');
      if (saved) { try { this.r_saveSlots = JSON.parse(saved); } catch (e) { this.r_saveSlots = [null, null, null]; } } 
      else { this.r_saveSlots = [null, null, null]; }
      this.hasSaveFile = this.r_saveSlots.some(slot => slot !== null);
    },
    saveGameData() {
      if (this.appState === 'ROGUE' && ['PLAYING', 'PAUSED', 'SHOP', 'LEVEL_UP'].includes(this.r_gameState) && this.r_currentSlot !== -1) {
        const saveObj = {
          r_gameState: this.r_gameState === 'PLAYING' ? 'PAUSED' : this.r_gameState,
          r_player: this.r_player, r_gold: this.r_gold, r_wave: this.r_wave, r_timeLeft: this.r_timeLeft,
          r_enemies: this.r_enemies, r_bullets: this.r_bullets, r_enemyBullets: this.r_enemyBullets, 
          r_gems: this.r_gems, r_coins: this.r_coins,
          r_enemyId: this.r_enemyId, r_bulletId: this.r_bulletId, r_gemId: this.r_gemId, r_coinId: this.r_coinId, r_textId: this.r_textId
        };
        this.r_saveSlots[this.r_currentSlot] = saveObj;
        localStorage.setItem('arcade_rogue_slots', JSON.stringify(this.r_saveSlots));
        this.checkSaveData();
      }
    },
    loadGameData() { this.launchGame('ROGUE'); },
    r_loadSlot(index) {
      this.r_currentSlot = index; const parsed = this.r_saveSlots[index];
      Object.assign(this.$data, {
         r_gameState: parsed.r_gameState, r_player: parsed.r_player, r_gold: parsed.r_gold, r_wave: parsed.r_wave, r_timeLeft: parsed.r_timeLeft,
         r_enemies: parsed.r_enemies, r_bullets: parsed.r_bullets, r_enemyBullets: parsed.r_enemyBullets, r_gems: parsed.r_gems, r_coins: parsed.r_coins,
         r_enemyId: parsed.r_enemyId, r_bulletId: parsed.r_bulletId, r_gemId: parsed.r_gemId, r_coinId: parsed.r_coinId, r_textId: parsed.r_textId
      });
      this.globalKeys = {}; this.r_slashes = []; this.r_floatingTexts = []; 
      this.r_isAiming = false; this.r_isAttacking = false; // Reset States
      this.r_shopItems = { maxHp: { label: '❤️ Max HP +50', cost: 50, run: () => { this.r_player.maxHp += 50; this.r_player.hp += 50; } }, damage: { label: '⚔️ พลังโจมตี +15', cost: 40, run: () => { this.r_player.damage += 15; } }, atkSpeed: { label: '🔥 โจมตีรัวขึ้น 10%', cost: 60, run: () => { this.r_player.atkSpeed *= 0.9; } }, heal: { label: '🩹 ฟื้นฟูเลือดเต็ม', cost: 30, run: () => { this.r_player.hp = this.r_player.maxHp; } }, skillCD: { label: '🌀 สกิลคูลดาวน์เร็วขึ้น 20%', cost: 80, run: () => { this.r_player.skillCD *= 0.8; } }, };
    },
    r_newGameSlot(index) { this.r_currentSlot = index; this.r_gameState = 'SELECT_CHAR'; },
    r_clearCurrentSlot() {
      if (this.r_currentSlot !== -1) {
        this.r_saveSlots[this.r_currentSlot] = null;
        localStorage.setItem('arcade_rogue_slots', JSON.stringify(this.r_saveSlots));
        this.checkSaveData();
      }
    },

    // === Navigation ===
    clearAllIntervals() { clearInterval(this.s_interval); clearInterval(this.r_gameLoop); clearInterval(this.r_spawnTimer); clearInterval(this.r_waveTimer); },
    backToMenu() { this.saveGameData(); this.clearAllIntervals(); this.appState = 'MENU'; this.checkSaveData(); },
    launchGame(gameName) {
      this.clearAllIntervals(); this.appState = gameName;
      if (gameName === 'SNAKE') this.s_gameState = 'SELECT_SNAKE';
      else if (gameName === 'ROGUE') { this.checkSaveData(); this.r_gameState = 'SLOTS'; }
    },
    handleKeydown(e) {
      if (['ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault();
      this.$set(this.globalKeys, e.code, true);
      if (['KeyP', 'Escape'].includes(e.code)) {
        if (this.appState === 'SNAKE' && ['PLAYING', 'PAUSED'].includes(this.s_gameState)) this.s_togglePause();
        else if (this.appState === 'ROGUE' && ['PLAYING', 'PAUSED'].includes(this.r_gameState)) this.r_togglePause();
        return;
      }
      if (this.appState === 'SNAKE') this.s_handleKeydown(e);
      else if (this.appState === 'ROGUE') {
         if (e.code === 'Space') { this.r_isAttacking = true; this.r_playerAttack(); } // กดค้างโจมตี
         else if (e.code === 'KeyE') this.r_playerSkill();
      }
    },
    handleKeyup(e) { 
      this.$set(this.globalKeys, e.code, false); 
      // ปล่อยปุ่ม Space เลิกโจมตี
      if (this.appState === 'ROGUE' && e.code === 'Space') this.r_isAttacking = false;
    },

    // === Snake Game ===
    s_togglePause() { if (this.s_gameState === 'PLAYING') { this.s_gameState = 'PAUSED'; clearInterval(this.s_interval); } else if (this.s_gameState === 'PAUSED') { this.s_gameState = 'PLAYING'; this.s_interval = setInterval(this.s_gameLoop, this.s_speed); } },
    s_getStyle(pos) { return { left: `${pos.x * this.s_cellSize}px`, top: `${pos.y * this.s_cellSize}px`, width: `${this.s_cellSize}px`, height: `${this.s_cellSize}px` }; },
    s_selectSnake(type, speed, name) { this.s_snakeType = type; this.s_baseSpeed = speed; this.s_snakeName = name; this.s_gameState = 'READY'; this.s_setupBoard(); },
    s_setupBoard() { const midX = Math.floor(this.s_gridCols / 2); const midY = Math.floor(this.s_gridRows / 2); this.s_snake = [{ x: midX, y: midY }, { x: midX, y: midY + 1 }, { x: midX, y: midY + 2 }]; this.s_dir = { x: 0, y: -1 }; this.s_nextDir = { x: 0, y: -1 }; this.s_score = 0; this.s_speed = this.s_baseSpeed; this.s_generateFood(); },
    s_startGame() { this.s_gameState = 'PLAYING'; if (this.s_interval) clearInterval(this.s_interval); this.s_interval = setInterval(this.s_gameLoop, this.s_speed); },
    s_gameLoop() { 
      if (this.s_gameState !== 'PLAYING') return; 
      this.s_dir = { ...this.s_nextDir }; const head = this.s_snake[0]; const newHead = { x: head.x + this.s_dir.x, y: head.y + this.s_dir.y }; 
      if (newHead.x < 0 || newHead.x >= this.s_gridCols || newHead.y < 0 || newHead.y >= this.s_gridRows || this.s_snake.some(s => s.x === newHead.x && s.y === newHead.y)) return this.s_gameOver(); 
      this.s_snake.unshift(newHead); 
      if (newHead.x === this.s_food.x && newHead.y === this.s_food.y) { this.s_score += 10; this.s_generateFood(); if (this.s_speed > 50) { this.s_speed -= 3; clearInterval(this.s_interval); this.s_interval = setInterval(this.s_gameLoop, this.s_speed); } } else { this.s_snake.pop(); } 
    },
    s_generateFood() { let newFood; let isOcc = true; while (isOcc) { newFood = { x: Math.floor(Math.random() * this.s_gridCols), y: Math.floor(Math.random() * this.s_gridRows) }; isOcc = this.s_snake.some(s => s.x === newFood.x && s.y === newFood.y); } this.s_food = newFood; },
    s_handleKeydown(e) { 
      if (this.s_gameState === 'READY' && ['Enter', 'Space'].includes(e.code)) return this.s_startGame(); 
      if (['ArrowUp', 'KeyW'].includes(e.code) && this.s_dir.y === 0) this.s_nextDir = { x: 0, y: -1 }; else if (['ArrowDown', 'KeyS'].includes(e.code) && this.s_dir.y === 0) this.s_nextDir = { x: 0, y: 1 }; else if (['ArrowLeft', 'KeyA'].includes(e.code) && this.s_dir.x === 0) this.s_nextDir = { x: -1, y: 0 }; else if (['ArrowRight', 'KeyD'].includes(e.code) && this.s_dir.x === 0) this.s_nextDir = { x: 1, y: 0 }; 
    },
    s_gameOver() { this.s_gameState = 'GAMEOVER'; clearInterval(this.s_interval); },

    // === Rogue Survivor ===
    r_onMouseMove(e) {
      if (this.r_gameState !== 'PLAYING') return;
      const rect = this.$refs.rogueWorld.getBoundingClientRect();
      this.r_mouseX = e.clientX - rect.left;
      this.r_mouseY = e.clientY - rect.top;
      if (this.r_isAiming) { this.r_player.facingLeft = this.r_mouseX < this.r_player.x; }
    },
    r_onMouseDown(e) {
      if (this.r_gameState !== 'PLAYING') return;
      if (e.button === 0) { this.r_isAttacking = true; this.r_playerAttack(); } // คลิกซ้ายค้างโจมตี
      else if (e.button === 2) { this.r_isAiming = true; this.r_player.facingLeft = this.r_mouseX < this.r_player.x; } // คลิกขวาเล็ง
    },
    r_onMouseUp(e) { 
      if (e.button === 0) { this.r_isAttacking = false; } // ปล่อยคลิกซ้าย
      if (e.button === 2) { this.r_isAiming = false; } // ปล่อยคลิกขวา
    },
    r_onMouseLeave() {
      // กันเมาส์หลุดจอแล้วปืนค้าง
      this.r_isAttacking = false;
      this.r_isAiming = false;
    },
    r_togglePause() {
      if (this.r_gameState === 'PLAYING') { this.r_gameState = 'PAUSED'; clearInterval(this.r_gameLoop); clearInterval(this.r_spawnTimer); clearInterval(this.r_waveTimer); this.saveGameData(); } 
      else if (this.r_gameState === 'PAUSED') { this.r_gameState = 'PLAYING'; this.r_gameLoop = setInterval(this.r_update, 1000 / 60); this.r_spawnTimer = setInterval(this.r_spawnEnemy, Math.max(500, 1500 - (this.r_wave * 100))); this.r_waveTimer = setInterval(() => { this.r_timeLeft--; if (this.r_timeLeft <= 0) this.r_finishWave(); }, 1000); }
    },
    r_objectStyle(obj) { const size = (obj.r || 5) * 2; return { left: `${obj.x - (obj.r || 5)}px`, top: `${obj.y - (obj.r || 5)}px`, width: `${size}px`, height: `${size}px` }; },
    r_slashStyle(s) { return { left: `${s.x - s.r}px`, top: `${s.y - s.r}px`, width: `${s.r*2}px`, height: `${s.r*2}px`, opacity: s.life/15 }; },
    
    r_selectChar(charId) {
      this.r_player.charId = charId;
      const p = this.r_player;
      
      p.skillReady = true; p.skillCDTimer = 0; p.lastSkillUse = 0;

      if (charId === 'm1') { p.className = 'นักรบดำ'; p.hp=150; p.maxHp=150; p.speed=2.5; p.damage=14; p.atkSpeed=500; p.weaponType='melee'; p.attackRange=45; p.skillName = 'สับพิฆาต'; p.skillCD = 8; }
      else if (charId === 'm2') { p.className = 'นายพราน'; p.hp=100; p.maxHp=100; p.speed=3.5; p.damage=10; p.atkSpeed=350; p.weaponType='ranged'; p.attackRange=250; p.skillName = 'ม้วนตัวพริ้ว'; p.skillCD = 5; }
      else if (charId === 'm3') { p.className = 'นักเวทย์พรต'; p.hp=80; p.maxHp=80; p.speed=2.5; p.damage=18; p.atkSpeed=600; p.weaponType='ranged'; p.attackRange=200; p.skillName = 'คาถาระเบิด'; p.skillCD = 12; }
      else if (charId === 'f1') { p.className = 'นินจาสาว'; p.hp=110; p.maxHp=110; p.speed=3.8; p.damage=14; p.atkSpeed=400; p.weaponType='melee'; p.attackRange=45; p.skillName = 'วาร์ปมีดบิน'; p.skillCD = 7; }
      else if (charId === 'f2') { p.className = 'นักบวชหญิง'; p.hp=120; p.maxHp=120; p.speed=3.0; p.damage=12; p.atkSpeed=550; p.weaponType='ranged'; p.attackRange=250; p.skillName = 'รัศมีฮีล'; p.skillCD = 15; }
      else if (charId === 'f3') { p.className = 'นักล่าปืน'; p.hp=95; p.maxHp=95; p.speed=3.5; p.damage=15; p.atkSpeed=300; p.weaponType='ranged'; p.attackRange=350; p.skillName = 'กราดยิงลูกซอง'; p.skillCD = 10; }
      
      this.r_gold = 0; this.r_wave = 1; p.level = 1; p.exp = 0; p.nextExp = 100; p.x = 400; p.y = 300;
      this.r_prepareWave();
    },
    r_startNextWave() { if (this.r_gameState === 'SHOP') this.r_wave++; this.r_prepareWave(); },
    r_prepareWave() {
      this.r_gameState = 'PLAYING'; this.r_timeLeft = 30 + (this.r_wave * 2);
      this.r_enemies = []; this.r_bullets = []; this.r_enemyBullets = []; this.r_floatingTexts = []; this.r_slashes = [];
      clearInterval(this.r_gameLoop); clearInterval(this.r_spawnTimer); clearInterval(this.r_waveTimer);
      
      this.r_gameLoop = setInterval(this.r_update, 1000 / 60);
      this.r_spawnTimer = setInterval(this.r_spawnEnemy, Math.max(500, 1500 - (this.r_wave * 100)));
      this.r_waveTimer = setInterval(() => { this.r_timeLeft--; if (this.r_timeLeft <= 0) this.r_finishWave(); }, 1000);
      this.saveGameData();
    },
    r_spawnEnemy() {
      if (this.r_gameState !== 'PLAYING') return;
      const side = Math.floor(Math.random() * 4); let x, y;
      if (side === 0) { x = Math.random() * 800; y = -20; } else if (side === 1) { x = 820; y = Math.random() * 600; }
      else if (side === 2) { x = Math.random() * 800; y = 620; } else { x = -20; y = Math.random() * 600; }
      
      const isBoss = (this.r_wave % 5 === 0) && (Math.random() < 0.1); 
      let type = 'e-zombie'; let spd = 1.0; let hp = 30; let r = 12;

      const rand = Math.random();
      if (isBoss) { type = 'e-boss'; r = 25; hp = 150 + (this.r_wave * 40); spd = 0.9; }
      else if (this.r_wave >= 2 && rand < 0.2) { type = 'e-runner'; spd = 2.8; hp = 15; r = 10; } 
      else if (rand > 0.7) { type = 'e-shooter'; spd = 1.3; hp = 25; r = 12; } 

      this.r_enemies.push({ 
        id: this.r_enemyId++, x, y, r, hp: hp + (this.r_wave * 5), maxHp: hp + (this.r_wave * 5),
        speed: spd + (this.r_wave * 0.02), type, isBoss, facingLeft: false, lastShot: 0
      });
    },
    r_getNearestEnemy() { 
      let nearest = null; let minDist = Infinity;
      this.r_enemies.forEach(e => {
        if (e.x >= 0 && e.x <= 800 && e.y >= 0 && e.y <= 600) {
          const dist = this.r_dist(this.r_player, e);
          if (dist < minDist) { minDist = dist; nearest = e; }
        }
      });
      return nearest; 
    },
    r_playerAttack() {
      if (this.r_gameState !== 'PLAYING') return;
      const now = Date.now();
      const p = this.r_player;

      if (now - (this.r_lastShot || 0) > p.atkSpeed) {
        if (p.weaponType === 'ranged') {
          let angle = p.facingLeft ? Math.PI : 0; 
          
          if (this.r_isAiming) {
            angle = Math.atan2(this.r_mouseY - p.y, this.r_mouseX - p.x);
            p.facingLeft = this.r_mouseX < p.x;
          } else {
            const target = this.r_getNearestEnemy();
            if (target) {
              angle = Math.atan2(target.y - p.y, target.x - p.x); 
              p.facingLeft = target.x < p.x;
            }
          }
          this.r_bullets.push({ id: this.r_bulletId++, x: p.x, y: p.y, vx: Math.cos(angle) * 12, vy: Math.sin(angle) * 12, r: 6 });
        } 
        else if (p.weaponType === 'melee') {
          if (this.r_isAiming) { p.facingLeft = this.r_mouseX < p.x; }
          this.r_slashes.push({ id: this.r_slashId++, x: p.x, y: p.y, r: p.attackRange, life: 15 });
          this.r_enemies.forEach(e => {
            if (this.r_dist(p, e) <= p.attackRange + e.r) {
               e.hp -= p.damage;
               this.r_floatingTexts.push({ id: this.r_textId++, x: e.x, y: e.y - 15, text: p.damage, life: 30 });
            }
          });
        }
        this.r_lastShot = now;
      }
    },
    r_playerSkill() {
       if (this.r_gameState !== 'PLAYING') return;
       const p = this.r_player;
       const now = Date.now();

       if (p.skillReady) {
          let used = false;
          if (p.charId === 'm1') { // นักรบดำ: กระโดดสับ
             this.r_slashes.push({ id: this.r_slashId++, x: p.x, y: p.y, r: 100, life: 25, color: '#ff6b6b' });
             this.r_enemies.forEach(e => {
                if (this.r_dist(p, e) <= 100 + e.r) {
                   const dmg = p.damage * 4;
                   e.hp -= dmg;
                   this.r_floatingTexts.push({ id: this.r_textId++, x: e.x, y: e.y - 20, text: 'CRIT ' + dmg, color: '#f1c40f', life: 40 });
                }
             });
             this.r_floatingTexts.push({ id: this.r_textId++, x: p.x, y: p.y - 20, text: 'สับพิฆาต!', color: '#ff6b6b', life: 30 });
             used = true;
          } 
          else if (p.charId === 'm2') { // นายพราน: ม้วนตัวหลบ
             const dist = 120;
             const angle = p.facingLeft ? Math.PI : 0;
             const targetX = p.x + Math.cos(angle) * dist;
             const targetY = p.y + Math.sin(angle) * dist;
             p.x = Math.max(15, Math.min(785, targetX));
             p.y = Math.max(15, Math.min(585, targetY));
             this.r_slashes.push({ id: this.r_slashId++, x: p.x, y: p.y, r: 40, life: 10, color: '#f1c40f' });
             this.r_floatingTexts.push({ id: this.r_textId++, x: p.x, y: p.y - 20, text: 'ROLL!', color: '#f1c40f', life: 30 });
             used = true;
          } 
          else if (p.charId === 'm3') { // นักเวทย์พรต: คาถาระเบิด
             const target = this.r_getNearestEnemy();
             if (target) {
                this.r_slashes.push({ id: this.r_slashId++, x: target.x, y: target.y, r: 80, life: 20, color: '#3498db' });
                this.r_enemies.forEach(e => {
                   if (this.r_dist(target, e) <= 80 + e.r) {
                      const dmg = p.damage * 3;
                      e.hp -= dmg;
                      this.r_floatingTexts.push({ id: this.r_textId++, x: e.x, y: e.y - 20, text: dmg, color: '#3498db', life: 30 });
                   }
                });
                this.r_floatingTexts.push({ id: this.r_textId++, x: p.x, y: p.y - 20, text: 'ระเบิด!', color: '#3498db', life: 30 });
                used = true;
             }
          } 
          else if (p.charId === 'f1') { // นินจาสาว: วาร์ปมีดบิน
             const target = this.r_getNearestEnemy();
             if (target) {
                p.x = target.x - (p.facingLeft ? -30 : 30);
                p.y = target.y;
                this.r_slashes.push({ id: this.r_slashId++, x: p.x, y: p.y, r: 50, life: 15, color: '#e74c3c' });
                this.r_enemies.forEach(e => {
                    if (this.r_dist(p, e) <= 50 + e.r) {
                       const dmg = p.damage * 2.5;
                       e.hp -= dmg;
                       this.r_floatingTexts.push({ id: this.r_textId++, x: e.x, y: e.y - 15, text: dmg, color: '#e74c3c', life: 30 });
                    }
                });
                this.r_floatingTexts.push({ id: this.r_textId++, x: p.x, y: p.y - 20, text: 'BLINK!', color: '#e74c3c', life: 30 });
                used = true;
             }
          } 
          else if (p.charId === 'f2') { // นักบวชหญิง: รัศมีฮีล
             const healAmt = p.maxHp * 0.4;
             p.hp = Math.min(p.maxHp, p.hp + healAmt);
             this.r_slashes.push({ id: this.r_slashId++, x: p.x, y: p.y, r: 70, life: 30, color: '#2ecc71' });
             this.r_floatingTexts.push({ id: this.r_textId++, x: p.x, y: p.y - 20, text: 'HEAL +' + Math.floor(healAmt), color: '#2ecc71', life: 40 });
             used = true;
          } 
          else if (p.charId === 'f3') { // นักล่าปืน: กราดยิงลูกซอง
             for(let i=0; i<8; i++) {
                const angle = (p.facingLeft ? Math.PI : 0) + (Math.random() - 0.5) * 0.8;
                this.r_bullets.push({ id: this.r_bulletId++, x: p.x, y: p.y, vx: Math.cos(angle) * (10 + Math.random()*4), vy: Math.sin(angle) * (10 + Math.random()*4), r: 5, damageMultiplier: 0.8 });
             }
             this.r_floatingTexts.push({ id: this.r_textId++, x: p.x, y: p.y - 20, text: 'กราดยิง!', color: '#8e44ad', life: 30 });
             used = true;
          }

          if (used) {
             p.skillReady = false;
             p.skillCDTimer = Math.floor(p.skillCD);
             p.lastSkillUse = now;
          }
       }
    },
    r_update() {
      if (this.r_gameState !== 'PLAYING') return;
      const p = this.r_player;

      // Update Skill CD
      if (!p.skillReady) {
         p.skillCDTimer -= 1/60; // Approximate 1 second decrement per second
         if (p.skillCDTimer <= 0) {
            p.skillReady = true;
            p.skillCDTimer = 0;
            this.r_floatingTexts.push({ id: this.r_textId++, x: p.x, y: p.y - 30, text: '[E] Ready!', color: '#f1c40f', life: 30 });
         }
      }

      let dx = 0, dy = 0;
      if ((this.globalKeys['KeyW'] || this.globalKeys['ArrowUp']) && p.y > 0) dy -= p.speed;
      if ((this.globalKeys['KeyS'] || this.globalKeys['ArrowDown']) && p.y < 600) dy += p.speed;
      if ((this.globalKeys['KeyA'] || this.globalKeys['ArrowLeft']) && p.x > 0) { dx -= p.speed; if(!this.r_isAiming) p.facingLeft = true; }
      if ((this.globalKeys['KeyD'] || this.globalKeys['ArrowRight']) && p.x < 800) { dx += p.speed; if(!this.r_isAiming) p.facingLeft = false; }
      p.x += dx; p.y += dy;

      const now = Date.now();
      
      // ถ้ายิงค้าง (คลิกซ้ายหรือ Spacebar) ให้เรียก playerAttack ต่อเนื่อง
      if (this.r_isAttacking) {
        this.r_playerAttack();
      }

      this.r_bullets.forEach((b, i) => { 
        b.x += b.vx; b.y += b.vy; 
        if (b.x < -20 || b.x > 820 || b.y < -20 || b.y > 620) this.r_bullets.splice(i, 1); 
      });

      this.r_enemyBullets.forEach((eb, i) => {
        eb.x += eb.vx; eb.y += eb.vy;
        if (eb.x < -20 || eb.x > 820 || eb.y < -20 || eb.y > 620) this.r_enemyBullets.splice(i, 1);
        if (this.r_dist(eb, p) < eb.r + p.r) {
          p.hp -= 10; 
          this.r_floatingTexts.push({ id: this.r_textId++, x: p.x, y: p.y - 15, text: '-10', color: 'white', life: 30 });
          this.r_enemyBullets.splice(i, 1);
          if (p.hp <= 0) this.r_gameOver();
        }
      });

      this.r_slashes.forEach((s, i) => { if(p.charId !== 'm1' && p.charId !== 'f1' && s.color !== '#3498db' && s.color !== '#2ecc71') { s.x = p.x; s.y = p.y; } s.life -= 1; if (s.life <= 0) this.r_slashes.splice(i, 1); });

      this.r_enemies.forEach((e, ei) => {
        const distToPlayer = this.r_dist(e, p);
        const angle = Math.atan2(p.y - e.y, p.x - e.x);
        e.facingLeft = p.x < e.x;
        
        let movingSpeed = e.speed;
        if (e.type === 'e-shooter' && distToPlayer < 200) {
           movingSpeed = 0; 
           if (now - e.lastShot > 2000) { 
             this.r_enemyBullets.push({ id: this.r_bulletId++, x: e.x, y: e.y, vx: Math.cos(angle) * 5, vy: Math.sin(angle) * 5, r: 5 });
             e.lastShot = now;
           }
        }

        e.x += Math.cos(angle) * movingSpeed; 
        e.y += Math.sin(angle) * movingSpeed; 
        
        if (this.r_dist(e, p) < e.r + p.r - 2) { 
          p.hp -= e.isBoss ? 2.0 : 0.5; 
          if (p.hp <= 0) this.r_gameOver(); 
        }

        if (p.weaponType === 'ranged') {
          this.r_bullets.forEach((b, bi) => {
            if (this.r_dist(e, b) < e.r + b.r) {
              const dmg = p.damage * (b.damageMultiplier || 1);
              e.hp -= dmg; this.r_bullets.splice(bi, 1);
              this.r_floatingTexts.push({ id: this.r_textId++, x: e.x, y: e.y - 10, text: Math.floor(dmg), life: 30 });
            }
          });
        }

        if (e.hp <= 0) {
          const dropCount = e.isBoss ? 8 : (e.type === 'e-shooter' ? 2 : 1);
          for(let i=0; i<dropCount; i++) {
            const ox = (Math.random() - 0.5) * 20; const oy = (Math.random() - 0.5) * 20;
            if (Math.random() > 0.4) this.r_gems.push({ id: this.r_gemId++, x: e.x + ox, y: e.y + oy, r: 6 });
            else this.r_coins.push({ id: this.r_coinId++, x: e.x + ox, y: e.y + oy, r: 6 });
          }
          this.r_enemies.splice(ei, 1);
        }
      });

      this.r_gems.forEach((g, gi) => { if (this.r_dist(g, p) < 60) { g.x += (p.x - g.x) * 0.15; g.y += (p.y - g.y) * 0.15; if (this.r_dist(g, p) < 20) { this.r_gems.splice(gi, 1); this.r_gainExp(30 + this.r_wave*5); } } });
      this.r_coins.forEach((c, ci) => { if (this.r_dist(c, p) < 60) { c.x += (p.x - c.x) * 0.15; c.y += (p.y - c.y) * 0.15; if (this.r_dist(c, p) < 20) { this.r_coins.splice(ci, 1); this.r_gold += (Math.floor(Math.random()*3) + 2); } } });
      this.r_floatingTexts.forEach((t, i) => { t.y -= 1; t.life -= 1; if (t.life <= 0) this.r_floatingTexts.splice(i, 1); });
    },
    r_finishWave() { 
      this.r_gameState = 'SHOP'; 
      clearInterval(this.r_gameLoop); clearInterval(this.r_spawnTimer); clearInterval(this.r_waveTimer); 
      this.r_enemies = []; this.r_enemyBullets = [];
      this.r_player.skillReady = true; this.r_player.skillCDTimer = 0; // Reset Skill on Wave End
      this.r_isAttacking = false; // Reset Attack status
      this.saveGameData();
    },
    r_buyItem(key) { const item = this.r_shopItems[key]; if (this.r_gold >= item.cost) { this.r_gold -= item.cost; item.run(); item.cost = Math.floor(item.cost * 1.3); } },
    r_gainExp(val) {
      this.r_player.exp += val;
      if (this.r_player.exp >= this.r_player.nextExp) {
        this.r_player.level++; this.r_player.exp -= this.r_player.nextExp; this.r_player.nextExp = Math.floor(this.r_player.nextExp * 1.3);
        
        if (this.r_player.level % 5 === 0) {
          this.r_gameState = 'LEVEL_UP';
          this.r_isAttacking = false; // ป้องกันปืนค้างตอนอัปเวล
          const uMaps = [
            { name: 'spd', label: '👟 เดินไวขึ้น', run: () => this.r_player.speed += 0.3 }, 
            { name: 'dmg', label: '⚔️ พลังโจมตีขึ้น', run: () => this.r_player.damage += 5 },
            { name: 'atk', label: '🔥 โจมตีรัวขึ้น', run: () => this.r_player.atkSpeed *= 0.88 }, 
            { name: 'hp', label: '🛡️ Max HP +20', run: () => { this.r_player.maxHp+=20; this.r_player.hp+=20; } },
            { name: 'scd', label: '🌀 สกิลคูลดาวน์เร็วขึ้น', run: () => this.r_player.skillCD *= 0.85 }
          ];
          if(this.r_player.weaponType === 'melee') uMaps.push({ name: 'rng', label: '🗡️ อาวุธกว้างขึ้น', run: () => this.r_player.attackRange += 10 });
          this.r_upgradeOptions = uMaps.sort(() => 0.5 - Math.random()).slice(0, 3);
        }
      }
    },
    r_applyUpgrade(u) { u.run(); this.r_gameState = 'PLAYING'; },
    r_gameOver() { 
      this.r_gameState = 'GAMEOVER'; 
      clearInterval(this.r_gameLoop); clearInterval(this.r_spawnTimer); clearInterval(this.r_waveTimer); 
      this.r_isAttacking = false;
      this.r_clearCurrentSlot(); 
    },
    r_dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Sarabun:wght@400;700&display=swap');

/* Basic Arcade Styles */
.arcade-master { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background-color: #0d1117; color: #fff; font-family: 'Sarabun', sans-serif; user-select: none; overflow: hidden; }
h1, h2, h3 { font-family: 'Press Start 2P', 'Sarabun', cursive; margin-bottom: 10px; }

.top-btn { position: absolute; top: 20px; padding: 10px 15px; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-family: 'Sarabun', sans-serif; z-index: 200; box-shadow: 0 4px 6px rgba(0,0,0,0.3); transition: 0.1s;}
.top-btn:active { transform: translateY(2px); }
.back-btn { left: 20px; background: #34495e; }
.back-btn:hover { background: #e74c3c; }
.pause-btn { right: 20px; background: #f39c12; }
.pause-btn:hover { background: #e67e22; }
.save-btn { margin-bottom: 20px; background: #9b59b6; border-color: #8e44ad; }

/* Menu */
.menu-container { text-align: center; }
.main-title { font-size: 2.5rem; color: #f1c40f; text-shadow: 4px 4px 0 #d35400; margin-bottom: 5px; }
.subtitle { font-size: 1.2rem; color: #aaa; margin-bottom: 30px; }
.game-select-grid { display: flex; gap: 20px; justify-content: center; }
.game-card { background: #1f2937; padding: 25px; border-radius: 16px; width: 240px; cursor: pointer; border: 4px solid #374151; transition: all 0.3s; box-shadow: 0 10px 20px rgba(0,0,0,0.5); }
.game-card:hover { transform: translateY(-10px); border-color: #3498db; }
.game-card.rogue-card:hover { border-color: #e74c3c; }
.card-icon { font-size: 4rem; margin-bottom: 10px; }
.game-card p { font-size: 0.9rem; color: #9ca3af; margin-top:10px;}

.game-area { display: flex; flex-direction: column; align-items: center; position: relative; width: 100%; height: 100vh; padding-top: 30px;}
.game-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.85); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 100; text-align: center; backdrop-filter: blur(3px); }
.action-btn { padding: 10px 20px; background: #2ecc71; border: 3px solid #27ae60; color: white; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1rem; font-family: 'Sarabun', sans-serif; transition: 0.1s; margin-top: 5px; }
.action-btn:hover { transform: scale(1.05); }
.action-btn.retry { background: #3498db; border-color: #2980b9; }
.action-btn.start { background: #f1c40f; border-color: #f39c12; color: #333; }
.controls-hint { margin-top: 15px; color: #888; font-size: 0.9rem; }
.controls-hint-box { background: rgba(0,0,0,0.5); padding: 10px 20px; border-radius: 8px; border: 1px solid #555; text-align: center; margin-top: 15px;}
.controls-hint-box p { margin: 5px 0; color: #f1c40f; font-size: 0.9rem;}

/* Snake Game Styles */
.snake-score-board { margin-bottom: 20px; font-size: 1.3rem; background: #2c3e50; padding: 10px 25px; border-radius: 12px; border: 2px solid #34495e;} 
.snake-board-wrapper { padding: 10px; background-color: #34495e; border-radius: 8px; box-shadow: 0 8px 16px rgba(0,0,0,0.5); } 
.snake-game-board { position: relative; background-color: #1a252f; overflow: hidden; background-image: linear-gradient(#2c3e50 1px, transparent 1px), linear-gradient(90deg, #2c3e50 1px, transparent 1px); background-size: 20px 20px; } 
.s-snake-segment { position: absolute; border-radius: 4px; box-sizing: border-box; } 
.s-snake-segment.green { background-color: #2ecc71; border: 1px solid #27ae60; } .s-snake-segment.green.s-snake-head { background-color: #f1c40f; } 
.s-snake-segment.python { background-color: #e67e22; border: 1px solid #d35400; } .s-snake-segment.python.s-snake-head { background-color: #f39c12; } 
.s-snake-segment.cobra { background-color: #8e44ad; border: 1px solid #2c3e50; } .s-snake-segment.cobra.s-snake-head { background-color: #e74c3c; } 
.s-food { position: absolute; background-color: #e74c3c; border-radius: 50%; transform: scale(0.8); box-shadow: 0 0 8px #e74c3c; } 
.s-python { background-color: #e67e22; border-radius: 50%; } .s-green { background-color: #2ecc71; border-radius: 50%; } .s-cobra { background-color: #8e44ad; border-radius: 50%; }
.snake-selection { width: 500px !important; }

/* Rogue Survivor Styles */
.r-ui-panel { width: 800px; padding: 15px; background: #1f2937; border-bottom: 4px solid #374151; border-radius: 8px 8px 0 0; } 
.r-stats-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 1.1rem; margin-bottom: 8px; align-items: center;} 
.skill-row { margin-bottom: 0; }
.r-exp-bar-bg { width: 100%; height: 12px; background: #111827; border: 2px solid #4b5563; border-radius: 6px; overflow: hidden; margin-bottom: 10px;} 
.r-exp-bar-fill { height: 100%; background: linear-gradient(90deg, #00d2ff, #3a7bd5); transition: width 0.3s; } 
.r-gold-text { color: #f1c40f; text-shadow: 1px 1px 0 #000; } 
.r-timer { font-weight: bold; color: #ff9f43; font-size: 1.1rem; margin-top: 0; text-align: left;} 
.skill-status { font-family: 'Press Start 2P', cursive; font-size: 0.7rem; padding: 5px 10px; border-radius: 6px; border: 2px solid; }
.skill-status.ready { background: #2ecc71; color: #fff; border-color: #27ae60; animation: pulseReady 1.5s infinite; }
.skill-status.cooldown { background: #34495e; color: #aaa; border-color: #2c3e50; }
@keyframes pulseReady { 0% { box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(46, 204, 113, 0); } 100% { box-shadow: 0 0 0 0 rgba(46, 204, 113, 0); } }

.r-game-world { width: 800px; height: 600px; background-color: #1a1a1a; position: relative; overflow: hidden; border: 4px solid #374151; border-radius: 0 0 8px 8px; box-shadow: inset 0 0 50px rgba(0,0,0,0.5); cursor: crosshair; } 
.r-game-world::before { content: ""; position: absolute; inset: 0; opacity: 0.05; background-image: radial-gradient(#fff 1px, transparent 1px); background-size: 20px 20px; }

/* เป้าเล็ง Crosshair */
.r-crosshair { position: absolute; font-size: 24px; transform: translate(-50%, -50%); pointer-events: none; z-index: 50; filter: drop-shadow(0 0 5px rgba(255,0,0,0.8)); }

.sprite { position: absolute; background-size: cover; image-rendering: pixelated; transition: transform 0.1s; background-position: center;} 
.sprite.flip { transform: scaleX(-1); }

/* --- 🌟 ตัวละครชุดใหม่ (New Character Sprites) 🌟 --- */

/* M1: นักรบดำ (ช) */
.m1, .m-knight { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='10' height='10' x='11' y='2' fill='%231a1a1a'/%3E%3Crect width='6' height='4' x='13' y='4' fill='%23e74c3c'/%3E%3Crect width='16' height='12' x='8' y='12' fill='%23333'/%3E%3Crect width='6' height='8' x='8' y='24' fill='%231a1a1a'/%3E%3Crect width='6' height='8' x='18' y='24' fill='%231a1a1a'/%3E%3Crect width='4' height='20' x='24' y='6' fill='%23fff'/%3E%3Crect width='8' height='4' x='22' y='22' fill='%23f1c40f'/%3E%3C/svg%3E"); } 
/* M2: นายพราน (ช) */
.m2, .m-hunter { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='10' height='10' x='11' y='2' fill='%2327ae60'/%3E%3Crect width='16' height='12' x='8' y='12' fill='%23f39c12'/%3E%3Crect width='6' height='8' x='8' y='24' fill='%232ecc71'/%3E%3Crect width='6' height='8' x='18' y='24' fill='%232ecc71'/%3E%3Cpath d='M22,10 A8,8 0 0,1 22,22 M22,16 L28,16' stroke='%23fff' stroke-width='2' fill='none'/%3E%3C/svg%3E"); } 
/* M3: นักเวทย์พรต (ช) */
.m3, .m-sorcerer { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='10' height='10' x='11' y='2' fill='%233498db'/%3E%3Crect width='8' height='4' x='12' y='8' fill='%23fff'/%3E%3Crect width='16' height='12' x='8' y='12' fill='%23fff'/%3E%3Crect width='6' height='8' x='8' y='24' fill='%233498db'/%3E%3Crect width='6' height='8' x='18' y='24' fill='%233498db'/%3E%3Crect width='4' height='22' x='26' y='5' fill='%23d35400'/%3E%3Ccircle cx='28' cy='5' r='3' fill='%233498db'/%3E%3C/svg%3E"); } 

/* 🌟 แก๊งผู้หญิง (ญ) - แก้ไขสัดส่วนให้โค้งเว้า เซ็กซี่ขึ้น (Hourglass, เผยผิว) 🌟 */
/* F1: นินจาสาว (ผมแดงยาว, บิกินี่ท็อปดำ, เอวคอดเผยผิว, กางเกงขาสั้น, บูทยาว, ถือมีดคู่) */
.f1, .f-assassin { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='12' height='14' x='10' y='2' fill='%23c0392b' rx='4'/%3E%3Crect width='8' height='8' x='12' y='4' fill='%23f1c27d' rx='2'/%3E%3Crect width='2' height='1' x='13' y='8' fill='%23111'/%3E%3Crect width='2' height='1' x='17' y='8' fill='%23111'/%3E%3Crect width='12' height='5' x='10' y='13' fill='%231a1a1a'/%3E%3Crect width='6' height='4' x='13' y='17' fill='%23f1c27d'/%3E%3Crect width='12' height='4' x='10' y='21' fill='%231a1a1a'/%3E%3Crect width='14' height='2' x='9' y='21' fill='%23e74c3c'/%3E%3Crect width='4' height='7' x='10' y='25' fill='%23f1c27d'/%3E%3Crect width='4' height='7' x='18' y='25' fill='%23f1c27d'/%3E%3Crect width='4' height='4' x='10' y='28' fill='%231a1a1a'/%3E%3Crect width='4' height='4' x='18' y='28' fill='%231a1a1a'/%3E%3Crect width='2' height='10' x='6' y='14' fill='%23bdc3c7'/%3E%3Crect width='2' height='10' x='24' y='14' fill='%23bdc3c7'/%3E%3C/svg%3E"); }
/* F2: นักบวชหญิง (ผมบลอนด์ยาว, คอร์เซ็ตทองรัดเอวคอด, กระโปรงขาวผ่าข้างโชว์เรียวขา, ถือคทาเวทย์) */
.f2, .f-priestess { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='12' height='20' x='10' y='2' fill='%23f1c40f' rx='4'/%3E%3Crect width='8' height='8' x='12' y='4' fill='%23f1c27d' rx='2'/%3E%3Crect width='2' height='1' x='13' y='8' fill='%23111'/%3E%3Crect width='2' height='1' x='17' y='8' fill='%23111'/%3E%3Crect width='12' height='6' x='10' y='12' fill='%23fff'/%3E%3Crect width='2' height='4' x='15' y='12' fill='%23f1c27d'/%3E%3Crect width='6' height='4' x='13' y='18' fill='%23d35400'/%3E%3Crect width='14' height='6' x='9' y='22' fill='%23fff'/%3E%3Crect width='4' height='10' x='16' y='22' fill='%23f1c27d'/%3E%3Crect width='4' height='6' x='10' y='26' fill='%23fff'/%3E%3Crect width='2' height='24' x='26' y='6' fill='%23f1c40f'/%3E%3Ccircle cx='27' cy='4' r='4' fill='%2300d2ff'/%3E%3C/svg%3E"); }
/* F3: นักล่าปืน (หมวกคาวบอย, เกาะอกแดงโชว์เอว, กางเกงยีนส์ขาสั้นฟิตเปรี๊ยะ, บูทยาว Thigh-highs, ถือปืน) */
.f3, .f-gunner { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='14' height='16' x='9' y='4' fill='%232c3e50' rx='4'/%3E%3Crect width='18' height='3' x='7' y='2' fill='%23d35400' rx='1'/%3E%3Crect width='10' height='4' x='11' y='0' fill='%23d35400'/%3E%3Crect width='8' height='6' x='12' y='5' fill='%23f1c27d' rx='2'/%3E%3Crect width='4' height='2' x='14' y='7' fill='%23111'/%3E%3Crect width='10' height='4' x='11' y='12' fill='%23e74c3c'/%3E%3Crect width='6' height='4' x='13' y='16' fill='%23f1c27d'/%3E%3Crect width='12' height='4' x='10' y='20' fill='%232980b9'/%3E%3Crect width='4' height='3' x='10' y='24' fill='%23f1c27d'/%3E%3Crect width='4' height='3' x='18' y='24' fill='%23f1c27d'/%3E%3Crect width='4' height='6' x='10' y='26' fill='%23111'/%3E%3Crect width='4' height='6' x='18' y='26' fill='%23111'/%3E%3Crect width='12' height='4' x='20' y='14' fill='%237f8c8d'/%3E%3Crect width='4' height='2' x='20' y='18' fill='%23d35400'/%3E%3C/svg%3E"); }

/* Enemies */
.e-zombie { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'%3E%3Crect x='2' y='2' width='6' height='5' fill='%232ecc71'/%3E%3Crect x='3' y='3' width='1' height='1' fill='%23c0392b'/%3E%3Crect x='6' y='3' width='1' height='1' fill='%23c0392b'/%3E%3Crect x='4' y='5' width='2' height='1' fill='%232c3e50'/%3E%3Crect x='2' y='7' width='6' height='3' fill='%2334495e'/%3E%3C/svg%3E"); } 
.e-runner { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'%3E%3Crect x='3' y='2' width='4' height='4' fill='%23e74c3c'/%3E%3Crect x='3' y='3' width='1' height='1' fill='%23000'/%3E%3Crect x='6' y='3' width='1' height='1' fill='%23000'/%3E%3Crect x='4' y='5' width='2' height='1' fill='%23000'/%3E%3Crect x='3' y='6' width='4' height='4' fill='%23000'/%3E%3C/svg%3E"); } 
.e-shooter { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'%3E%3Crect x='2' y='2' width='6' height='4' fill='%2395a5a6'/%3E%3Crect x='2' y='3' width='6' height='1' fill='%23e74c3c'/%3E%3Crect x='2' y='6' width='6' height='4' fill='%232980b9'/%3E%3Crect x='0' y='6' width='2' height='1' fill='%23333'/%3E%3C/svg%3E"); } 
.e-boss { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'%3E%3Crect x='1' y='1' width='8' height='6' fill='%23c0392b'/%3E%3Crect x='2' y='3' width='2' height='1' fill='%23f1c40f'/%3E%3Crect x='6' y='3' width='2' height='1' fill='%23f1c40f'/%3E%3Crect x='3' y='5' width='4' height='1' fill='%23000'/%3E%3Crect x='1' y='7' width='8' height='3' fill='%232c3e50'/%3E%3C/svg%3E"); filter: drop-shadow(0 0 10px red); }

.r-player { z-index: 10; filter: drop-shadow(0 4px 4px rgba(0,0,0,0.5)); transition: transform 0.1s; } 
.r-hp-bar-mini { position: absolute; top: -10px; left: -10%; width: 120%; height: 5px; background: #c0392b; border: 1px solid #000; border-radius: 2px; } 
.r-hp-fill-mini { height: 100%; background: #2ecc71; transition: 0.1s;} 

.r-slash { position: absolute; border: 4px solid #fff; border-radius: 50%; z-index: 5; pointer-events: none; transition: 0.1s; box-shadow: 0 0 15px #fff, inset 0 0 15px #fff; opacity: 1;} 
.r-bullet { position: absolute; background: #fff; border: 2px solid #f1c40f; border-radius: 50%; box-shadow: 0 0 8px #f1c40f; z-index: 15;} 
.enemy-bullet { border-color: #e74c3c; box-shadow: 0 0 8px #e74c3c; background: #ff7979;} 
.r-gem { position: absolute; background: #9b59b6; border: 1px solid #fff; transform: rotate(45deg); box-shadow: 0 0 5px #9b59b6; } 
.r-coin { position: absolute; background: #f1c40f; border-radius: 50%; border: 2px dashed #d35400; animation: spin 2s linear infinite; } 
@keyframes spin { 100% { transform: rotate(360deg); } } 
.r-floating-text { position: absolute; font-weight: bold; font-size: 1.1rem; pointer-events: none; text-shadow: 1px 1px 0 #000, -1px -1px 0 #000; z-index: 20; font-family: 'Press Start 2P', cursive;}

.slots-container { display: flex; gap: 20px; margin-top: 20px; } 
.slot-card { background: #2c3e50; border: 3px solid #34495e; border-radius: 12px; padding: 20px; width: 220px; text-align: left; transition: 0.2s;} 
.slot-card:hover { border-color: #f1c40f; } 
.slot-card h3 { color: #f1c40f; border-bottom: 2px dashed #555; padding-bottom: 5px; margin-bottom: 10px; font-size: 0.9rem;} 
.slot-card p { font-size: 0.9rem; margin-bottom: 5px; } 
.slot-actions { display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap; justify-content: center;} 
.empty-slot { text-align: center; color: #7f8c8d; } 

.r-char-selection-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 20px; width: 650px;} 
.r-char-card { background: #1f2937; padding: 20px 10px; border-radius: 12px; cursor: pointer; border: 3px solid #374151; text-align: center; transition: all 0.2s;} 
.r-char-card h3 { font-size: 0.85rem; margin-bottom: 8px;} 
.r-char-card p { font-size: 0.75rem; color: #aaa; margin:0;} 
.r-char-card:hover { border-color: #00d2ff; background: #2c3e50; transform: translateY(-5px);} 
.preview { position: relative; width: 64px; height: 64px; margin: 0 auto 10px; } 

.r-shop-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; width: 80%; } 
.r-shop-item { padding: 15px; background: #2c3e50; color: white; border: 2px solid #34495e; border-radius: 8px; cursor: pointer; font-family: 'Sarabun', sans-serif; transition: 0.1s;} 
.r-shop-item:hover:not(:disabled) { border-color: #f1c40f; background: #34495e; } 
.r-shop-item:disabled { opacity: 0.4; cursor: not-allowed; } 

.r-upgrade-list { display: flex; flex-direction: column; gap: 12px; width: 350px; margin-top: 20px; } 
.r-upgrade-item { padding: 15px; background: linear-gradient(135deg, #2980b9, #8e44ad); color: white; border: 2px solid #fff; border-radius: 8px; cursor: pointer; font-size: 1.1rem; font-weight: bold; transition: 0.1s;} 
.r-upgrade-item:hover { transform: scale(1.05); box-shadow: 0 0 15px rgba(255,255,255,0.5); }
</style>