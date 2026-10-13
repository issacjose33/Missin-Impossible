/**
 * MISSION: IMPOSSIBLE — THE UNCLICKABLE ACCEPT BUTTON
 * Interactive Cyber-Espionage Mini-Game
 * Vanilla JavaScript (Zero Dependencies, Web Audio API Sound Synthesis)
 */

(function () {
  'use strict';

  // ==========================================================================
  // Game State & Configuration
  // ==========================================================================
  const CONFIG = {
    maxAttempts: 10,            // Guaranteed surrender threshold
    initialProximity: 110,      // Starting proximity trigger radius (px)
    minProximity: 45,           // Proximity radius as it overheats (px)
    nearMissThreshold: 40,      // Distance that triggers the frantic shake
    cooldownMs: 220,            // Dodge cooldown to avoid erratic rapid teleporting
    arenaPadding: 24            // Padding inside arena boundaries (px)
  };

  const STATE = {
    attempts: 0,
    startTime: null,
    timerInterval: null,
    elapsedMs: 0,
    isSurrendered: false,
    isCompleted: false,
    isAbandoned: false,
    lastDodgeTime: 0,
    soundEnabled: true,
    hasMovedFromDock: false
  };

  // Humorous Taunt Messages
  const TAUNT_MESSAGES = [
    "Target locked. You really think your mouse is fast enough, Agent? Try me.",
    "Too slow, Agent! My grandmother clicks faster than that.",
    "Access denied! Nice try, Ethan Hunt.",
    "You really thought that would work? Error 404: Click Not Found.",
    "Mission status: FAILING. The button has serious trust issues.",
    "I have a black belt in cursor evasion. Step up your game!",
    "Did you really try to sneak up on me? I have 360-degree radar.",
    "Tactical sidestep executed! Better luck next dimension.",
    "Warning: Mouse velocity inadequate. Please recalibrate your index finger.",
    "Almost had me! Wait, no you didn't. Not even close."
  ];

  const OVERHEAT_MESSAGES = [
    "⚠️ THERMAL WARNING: Evasion thrusters are starting to smoke!",
    "⚠️ COOLANT LEAK: Okay, you're surprisingly stubborn, Agent...",
    "⚠️ CRITICAL OVERHEAT: My servos are locking up! I can't dodge much longer!",
    "⚠️ CORE MELTDOWN: System failure imminent! Please, have mercy on my transistors!"
  ];

  const SURRENDER_MESSAGE = 
    "🏳️ SYSTEM OVERHEAT: 100%! I yield, Agent! The button is yours. Click to accept!";

  const FLOATING_WORDS = [
    "TOO SLOW!",
    "NOPE!",
    "WHOOSH!",
    "NICE TRY!",
    "SIKE!",
    "CLOSE CALL!",
    "+1 DODGE",
    "EVADED!",
    "404 CLICK",
    "MISSED ME!"
  ];

  // ==========================================================================
  // DOM Elements Selection
  // ==========================================================================
  const elements = {
    // HUD & Telemetry
    missionTimer: document.getElementById('mission-timer'),
    attemptCounter: document.getElementById('attempt-counter'),
    defenseProgress: document.getElementById('defense-progress'),
    defenseLabel: document.getElementById('defense-label'),
    statusBadge: document.getElementById('status-badge'),
    dialogueText: document.getElementById('dialogue-text'),
    dialogueBanner: document.querySelector('.dialogue-banner-container'),
    soundToggleBtn: document.getElementById('sound-toggle-btn'),
    soundIcon: document.getElementById('sound-icon'),
    soundStatus: document.getElementById('sound-status'),

    // Arena & Buttons
    arenaZone: document.getElementById('arena-zone'),
    buttonDock: document.getElementById('button-dock'),
    acceptBtn: document.getElementById('accept-btn'),
    acceptBtnText: document.getElementById('accept-btn-text'),
    acceptBtnIcon: document.getElementById('accept-btn-icon'),
    declineBtn: document.getElementById('decline-btn'),
    floatTextLayer: document.getElementById('float-text-layer'),

    // Decline Modal
    declineModal: document.getElementById('decline-modal'),
    modalResumeBtn: document.getElementById('modal-resume-btn'),
    modalAbandonBtn: document.getElementById('modal-abandon-btn'),

    // Overlays
    abandonScreen: document.getElementById('abandon-screen'),
    abandonAttempts: document.getElementById('abandon-attempts'),
    abandonTime: document.getElementById('abandon-time'),
    abandonRetryBtn: document.getElementById('abandon-retry-btn'),

    victoryScreen: document.getElementById('victory-screen'),
    victoryAttempts: document.getElementById('victory-attempts'),
    victoryTime: document.getElementById('victory-time'),
    victoryRank: document.getElementById('victory-rank'),
    victoryQuote: document.getElementById('victory-quote'),
    victoryPlayAgainBtn: document.getElementById('victory-play-again-btn'),

    confettiCanvas: document.getElementById('confetti-canvas')
  };

  // ==========================================================================
  // Web Audio Synthesizer (Procedural SFX - 100% Reliable, Zero 404s)
  // ==========================================================================
  class SoundFX {
    constructor() {
      this.ctx = null;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playDodge() {
      if (!STATE.soundEnabled) return;
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sine';
      // Fast pitch swoop down
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.16);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    }

    playNearMiss() {
      if (!STATE.soundEnabled) return;
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.linearRampToValueAtTime(640, now + 0.08);
      osc.frequency.linearRampToValueAtTime(160, now + 0.18);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
    }

    playClick() {
      if (!STATE.soundEnabled) return;
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.06);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    }

    playSurrender() {
      if (!STATE.soundEnabled) return;
      this.init();
      if (!this.ctx) return;

      // Unlocking electronic chime
      [440, 554, 659, 880].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime + (idx * 0.08);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.28);
      });
    }

    playWarning() {
      if (!STATE.soundEnabled) return;
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'square';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.setValueAtTime(180, now + 0.12);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    }

    playVictory() {
      if (!STATE.soundEnabled) return;
      this.init();
      if (!this.ctx) return;

      // Heroic synth brass fanfare: C4, E4, G4, C5 arpeggio and chord
      const notes = [
        { f: 523.25, t: 0.00, d: 0.15 }, // C5
        { f: 659.25, t: 0.14, d: 0.15 }, // E5
        { f: 783.99, t: 0.28, d: 0.18 }, // G5
        { f: 1046.50, t: 0.44, d: 0.60 }  // C6
      ];

      notes.forEach(note => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime + note.t;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.f, now);

        gain.gain.setValueAtTime(0.24, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + note.d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + note.d);
      });
    }
  }

  const audio = new SoundFX();

  // ==========================================================================
  // Mission Timer
  // ==========================================================================
  function startMissionTimer() {
    if (STATE.timerInterval || STATE.isCompleted || STATE.isAbandoned) return;
    STATE.startTime = Date.now() - STATE.elapsedMs;
    STATE.timerInterval = setInterval(updateTimerDisplay, 60);
  }

  function stopMissionTimer() {
    if (STATE.timerInterval) {
      clearInterval(STATE.timerInterval);
      STATE.timerInterval = null;
    }
  }

  function resetMissionTimer() {
    stopMissionTimer();
    STATE.startTime = null;
    STATE.elapsedMs = 0;
    elements.missionTimer.textContent = "00:00.0";
  }

  function updateTimerDisplay() {
    if (!STATE.startTime) return;
    STATE.elapsedMs = Date.now() - STATE.startTime;
    elements.missionTimer.textContent = formatTime(STATE.elapsedMs);
  }

  function formatTime(ms) {
    const totalSec = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;
    const tenths = Math.floor((ms % 1000) / 100);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${tenths}`;
  }

  // ==========================================================================
  // Confetti Particle System
  // ==========================================================================
  class ConfettiCannon {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.particles = [];
      this.animationId = null;
      this.colors = ['#00f2fe', '#4facfe', '#ff0055', '#ffaa00', '#ffc837', '#00ff88', '#ffffff'];
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }

    resize() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }

    launch(count = 140) {
      this.resize();
      this.particles = [];
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: this.canvas.width / 2 + (Math.random() * 200 - 100),
          y: this.canvas.height * 0.45,
          vx: (Math.random() - 0.5) * 18,
          vy: Math.random() * -18 - 8,
          size: Math.random() * 8 + 6,
          color: this.colors[Math.floor(Math.random() * this.colors.length)],
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 12,
          gravity: 0.38,
          drag: 0.96,
          opacity: 1,
          shape: Math.random() > 0.4 ? 'rect' : 'circle'
        });
      }

      if (!this.animationId) {
        this.animate();
      }
    }

    animate() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      let activeParticles = 0;
      for (let p of this.particles) {
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        if (p.y > this.canvas.height * 0.7) {
          p.opacity -= 0.015;
        }

        if (p.opacity > 0) {
          activeParticles++;
          this.ctx.save();
          this.ctx.translate(p.x, p.y);
          this.ctx.rotate((p.rotation * Math.PI) / 180);
          this.ctx.globalAlpha = Math.max(0, p.opacity);
          this.ctx.fillStyle = p.color;

          if (p.shape === 'rect') {
            this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
          } else {
            this.ctx.beginPath();
            this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            this.ctx.fill();
          }
          this.ctx.restore();
        }
      }

      if (activeParticles > 0) {
        this.animationId = requestAnimationFrame(() => this.animate());
      } else {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }

    clear() {
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
      this.particles = [];
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  const confetti = new ConfettiCannon(elements.confettiCanvas);

  // ==========================================================================
  // HUD & Telemetry Updates
  // ==========================================================================
  function updateTelemetry() {
    elements.attemptCounter.textContent = STATE.attempts;

    // Remaining defense calculation
    const defenseRemaining = Math.max(0, 100 - (STATE.attempts * 10));
    elements.defenseProgress.style.width = `${defenseRemaining}%`;

    // Dynamic coloring & diagnostic badges
    elements.defenseProgress.classList.remove('warning', 'critical', 'surrender');
    elements.statusBadge.classList.remove('status-alert', 'status-warning', 'status-danger', 'status-surrendered');

    if (STATE.attempts >= CONFIG.maxAttempts) {
      elements.defenseProgress.classList.add('surrender');
      elements.statusBadge.classList.add('status-surrendered');
      elements.defenseLabel.textContent = "DEFENSE: 0% (TOTAL OVERHEAT)";
      elements.statusBadge.textContent = "SHIELD COLLAPSED (CLICKABLE!)";
    } else if (STATE.attempts >= 8) {
      elements.defenseProgress.classList.add('critical');
      elements.statusBadge.classList.add('status-danger');
      elements.defenseLabel.textContent = `DEFENSE: ${defenseRemaining}% (CRITICAL OVERHEAT)`;
      elements.statusBadge.textContent = "SYSTEM OVERHEATING (80%+)";
    } else if (STATE.attempts >= 5) {
      elements.defenseProgress.classList.add('warning');
      elements.statusBadge.classList.add('status-warning');
      elements.defenseLabel.textContent = `DEFENSE: ${defenseRemaining}% (THERMAL STRAIN)`;
      elements.statusBadge.textContent = "EVASION ENGINES STRAINED";
    } else {
      elements.statusBadge.classList.add('status-alert');
      elements.defenseLabel.textContent = `DEFENSE: ${defenseRemaining}% (IMPENETRABLE)`;
      elements.statusBadge.textContent = "EVASION PROTOCOLS ACTIVE";
    }
  }

  function setDialogue(text, isAlert = false) {
    elements.dialogueText.textContent = `"${text}"`;
    if (isAlert) {
      elements.dialogueBanner.classList.add('taunting');
      setTimeout(() => elements.dialogueBanner.classList.remove('taunting'), 400);
    }
  }

  function spawnFloatingToast(x, y, text) {
    const toast = document.createElement('div');
    toast.className = 'floating-toast';
    toast.textContent = text;
    toast.style.left = `${x}px`;
    toast.style.top = `${y}px`;
    elements.floatTextLayer.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 1000);
  }

  // ==========================================================================
  // Evasion Engine (Core Mechanics)
  // ==========================================================================

  /**
   * Calculates dynamic proximity threshold based on current attempts.
   * Starts high (110px), shrinks progressively to 45px so agent feels close.
   */
  function getCurrentProximityThreshold() {
    if (STATE.attempts >= CONFIG.maxAttempts) return 0;
    const progress = STATE.attempts / CONFIG.maxAttempts; // 0.0 to 1.0
    return CONFIG.initialProximity - (progress * (CONFIG.initialProximity - CONFIG.minProximity));
  }

  /**
   * Calculates safe destination coordinate inside the arena zone.
   * Guarantees button never clips out of the arena or overlaps Decline button.
   */
  function calculateSafePosition(cursorX, cursorY) {
    const dockRect = elements.buttonDock.getBoundingClientRect();
    const btnRect = elements.acceptBtn.getBoundingClientRect();
    const declineRect = elements.declineBtn.getBoundingClientRect();

    const minX = 14;
    const maxX = dockRect.width - btnRect.width - 14;
    const minY = 14;
    const maxY = dockRect.height - btnRect.height - 14;

    // Safety checks in case container is very compact
    const safeMaxX = Math.max(minX, maxX);
    const safeMaxY = Math.max(minY, maxY);

    // Dock-relative cursor position
    const relCursorX = cursorX ? cursorX - dockRect.left : dockRect.width / 2;
    const relCursorY = cursorY ? cursorY - dockRect.top : dockRect.height / 2;

    // Safe boundary box around Decline button
    const declineBox = {
      left: declineRect.left - dockRect.left - 16,
      right: declineRect.right - dockRect.left + 16,
      top: declineRect.top - dockRect.top - 16,
      bottom: declineRect.bottom - dockRect.top + 16
    };

    let bestX = minX + Math.random() * (safeMaxX - minX);
    let bestY = minY + Math.random() * (safeMaxY - minY);
    let maxDistance = -1;

    for (let i = 0; i < 10; i++) {
      const candX = minX + Math.random() * (safeMaxX - minX);
      const candY = minY + Math.random() * (safeMaxY - minY);

      // Check collision with Decline button
      const overlapsDecline = (
        candX + btnRect.width > declineBox.left &&
        candX < declineBox.right &&
        candY + btnRect.height > declineBox.top &&
        candY < declineBox.bottom
      );

      if (overlapsDecline && i < 8) continue;

      const dist = Math.hypot(
        candX + (btnRect.width / 2) - relCursorX, 
        candY + (btnRect.height / 2) - relCursorY
      );
      if (dist > maxDistance) {
        maxDistance = dist;
        bestX = candX;
        bestY = candY;
      }
    }

    return { x: bestX, y: bestY };
  }

  /**
   * Executes the button dodge maneuvers with randomized animations.
   */
  function executeDodge(cursorX, cursorY, isNearMiss = false) {
    const now = Date.now();
    if (now - STATE.lastDodgeTime < CONFIG.cooldownMs) return;
    if (STATE.isSurrendered || STATE.isCompleted || STATE.isAbandoned) return;

    STATE.lastDodgeTime = now;
    startMissionTimer();

    // Increment failed attempt counter
    STATE.attempts++;
    updateTelemetry();

    // Play sounds
    if (isNearMiss) {
      audio.playNearMiss();
    } else {
      audio.playDodge();
    }

    // Capture old button position for floating toast
    const oldBtnRect = elements.acceptBtn.getBoundingClientRect();
    const dockRect = elements.buttonDock.getBoundingClientRect();
    const toastX = oldBtnRect.left - dockRect.left + (oldBtnRect.width / 2);
    const toastY = oldBtnRect.top - dockRect.top + (oldBtnRect.height / 2);

    const randomWord = FLOATING_WORDS[Math.floor(Math.random() * FLOATING_WORDS.length)];
    spawnFloatingToast(toastX, toastY, randomWord);

    // Switch button to absolute positioning within the arena if first move
    if (!STATE.hasMovedFromDock) {
      STATE.hasMovedFromDock = true;
      elements.acceptBtn.style.position = 'absolute';
    }

    // Random dodge animation style
    const anims = ['dodge-teleport', 'dodge-jump', 'dodge-spin'];
    const chosenAnim = anims[Math.floor(Math.random() * anims.length)];
    elements.acceptBtn.classList.remove('dodge-teleport', 'dodge-jump', 'dodge-spin', 'shake-near-miss');

    void elements.acceptBtn.offsetWidth; // Force CSS reflow

    if (isNearMiss) {
      elements.acceptBtn.classList.add('shake-near-miss');
    } else {
      elements.acceptBtn.classList.add(chosenAnim);
    }

    // Calculate new coordinate & apply
    const { x, y } = calculateSafePosition(cursorX, cursorY);
    elements.acceptBtn.style.left = `${Math.round(x)}px`;
    elements.acceptBtn.style.top = `${Math.round(y)}px`;

    // Check if fatigue / overheat states reached
    if (STATE.attempts >= 8 && STATE.attempts < CONFIG.maxAttempts) {
      elements.acceptBtn.classList.add('tired');
    }

    // Check if MAX ATTEMPTS (10) reached -> SURRENDER TIME!
    if (STATE.attempts >= CONFIG.maxAttempts) {
      triggerSurrenderMode();
      return;
    }

    // Update dialogue banter
    if (STATE.attempts >= 8) {
      const msg = OVERHEAT_MESSAGES[Math.min(STATE.attempts - 8, OVERHEAT_MESSAGES.length - 1)];
      setDialogue(msg, true);
    } else if (STATE.attempts >= 5) {
      const msg = OVERHEAT_MESSAGES[0];
      setDialogue(msg, true);
    } else {
      const msg = TAUNT_MESSAGES[STATE.attempts % TAUNT_MESSAGES.length];
      setDialogue(msg, isNearMiss);
    }
  }

  /**
   * SURRENDER MODE (Guaranteed Winnability at 10 Attempts)
   * The button gives up, overheats, turns matrix green, and becomes 100% clickable!
   */
  function triggerSurrenderMode() {
    STATE.isSurrendered = true;

    // Reset animations & apply surrender styling
    elements.acceptBtn.classList.remove('dodge-teleport', 'dodge-jump', 'dodge-spin', 'shake-near-miss', 'tired');
    elements.acceptBtn.classList.add('surrendered');

    // Update Button Labels & Icons
    elements.acceptBtnIcon.textContent = "🏳️";
    elements.acceptBtnText.textContent = "I SURRENDER! CLICK ME! 🔓";

    // Play surrender unlock sound
    audio.playSurrender();

    // Announce surrender in dialogue
    setDialogue(SURRENDER_MESSAGE, true);

    // Spawn victory-ready toast
    const btnRect = elements.acceptBtn.getBoundingClientRect();
    const dockRect = elements.buttonDock.getBoundingClientRect();
    spawnFloatingToast(
      btnRect.left - dockRect.left + (btnRect.width / 2),
      btnRect.top - dockRect.top,
      "DEFENSES CRACKED! CLICK NOW!"
    );
  }

  // ==========================================================================
  // Mouse & Touch Proximity Listeners
  // ==========================================================================

  // Desktop Mouse Movement Proximity
  function handleMouseMove(e) {
    if (STATE.isSurrendered || STATE.isCompleted || STATE.isAbandoned) return;

    const btnRect = elements.acceptBtn.getBoundingClientRect();
    const btnCenterX = btnRect.left + (btnRect.width / 2);
    const btnCenterY = btnRect.top + (btnRect.height / 2);

    const distance = Math.hypot(e.clientX - btnCenterX, e.clientY - btnCenterY);
    const currentThreshold = getCurrentProximityThreshold();

    if (distance < currentThreshold) {
      const isNearMiss = distance < CONFIG.nearMissThreshold;
      executeDodge(e.clientX, e.clientY, isNearMiss);
    }
  }

  // Mobile / Tablet Touch Support
  function handleTouchStart(e) {
    if (STATE.isSurrendered || STATE.isCompleted || STATE.isAbandoned) return;
    if (e.touches && e.touches.length > 0) {
      const touch = e.touches[0];
      const btnRect = elements.acceptBtn.getBoundingClientRect();

      // Check if touch is near or on the button
      const touchDist = Math.hypot(
        touch.clientX - (btnRect.left + btnRect.width / 2),
        touch.clientY - (btnRect.top + btnRect.height / 2)
      );

      // On touch devices, proximity is slightly more generous for finger taps
      if (touchDist < 120) {
        e.preventDefault(); // Prevent accidental click while escaping
        executeDodge(touch.clientX, touch.clientY, true);
      }
    }
  }

  // Keyboard Accessibility (Tabbing to Accept Button)
  function handleAcceptFocus(e) {
    if (STATE.isSurrendered || STATE.isCompleted || STATE.isAbandoned) return;

    // Sneaky tab detection: button jumps away when focused via keyboard!
    setDialogue("Hah! Trying to bypass security with the Tab key? Nice try, Agent!", true);
    executeDodge(null, null, true);
    // Remove focus temporarily so user can't instantly press space/enter
    elements.acceptBtn.blur();
  }

  // ==========================================================================
  // Button Click Handlers
  // ==========================================================================

  // Accept Button Click (VICTORY CONDITION)
  function handleAcceptClick() {
    if (STATE.isCompleted || STATE.isAbandoned) return;

    // Agent succeeded! (Either caught it or clicked after surrender)
    STATE.isCompleted = true;
    stopMissionTimer();

    audio.playClick();
    audio.playVictory();

    // Trigger celebration confetti cannon
    confetti.launch(160);

    // Compute Agent Rank & Badge
    let agentRank = "ETHAN HUNT (S-TIER)";
    let debriefQuote = '"Outstanding reflexes, Agent! You accepted before the button could even overheat. Ethan Hunt would be proud."';

    if (STATE.attempts >= 10) {
      agentRank = "SIEGE MASTER (PERSISTENT)";
      debriefQuote = '"Immense perseverance, Agent! You pushed the rogue button past 100% thermal limits until it surrendered. Terms are accepted!"';
    } else if (STATE.attempts >= 7) {
      agentRank = "007 OPERATIVE (GOLDEN)";
      debriefQuote = '"Brilliant tactical patience, Agent! You broke through high-grade cyber defenses and secured the terms."';
    } else if (STATE.attempts >= 4) {
      agentRank = "CYBER INFILTRATOR";
      debriefQuote = '"Lightning reflexes, Agent! The rogue accept-bot never saw your mouse vector coming."';
    }

    // Populate Victory Screen
    elements.victoryAttempts.textContent = STATE.attempts;
    elements.victoryTime.textContent = formatTime(STATE.elapsedMs);
    elements.victoryRank.textContent = agentRank;
    elements.victoryQuote.textContent = debriefQuote;

    // Display Victory Screen
    elements.victoryScreen.classList.remove('hidden');
  }

  // Decline Button Click
  function handleDeclineClick() {
    if (STATE.isCompleted || STATE.isAbandoned) return;
    audio.playWarning();
    elements.declineModal.classList.remove('hidden');
  }

  // Modal: Try Again (Resume)
  function handleModalResume() {
    audio.playClick();
    elements.declineModal.classList.add('hidden');
    setDialogue("Agent returned to active duty. Resuming mission parameters...", false);
  }

  // Modal: Abandon Mission (Failure)
  function handleModalAbandon() {
    audio.playWarning();
    elements.declineModal.classList.add('hidden');
    STATE.isAbandoned = true;
    stopMissionTimer();

    // Populate Abandon Screen Dossier
    elements.abandonAttempts.textContent = STATE.attempts;
    elements.abandonTime.textContent = formatTime(STATE.elapsedMs);

    // Show Disavowed Failure Screen
    elements.abandonScreen.classList.remove('hidden');
  }

  // Retry / Reset Game
  function resetGame() {
    audio.playClick();
    confetti.clear();

    // Reset State
    STATE.attempts = 0;
    STATE.isSurrendered = false;
    STATE.isCompleted = false;
    STATE.isAbandoned = false;
    STATE.hasMovedFromDock = false;
    STATE.lastDodgeTime = 0;

    resetMissionTimer();

    // Reset Elements
    elements.victoryScreen.classList.add('hidden');
    elements.abandonScreen.classList.add('hidden');
    elements.declineModal.classList.add('hidden');

    elements.acceptBtn.classList.remove(
      'dodge-teleport', 
      'dodge-jump', 
      'dodge-spin', 
      'shake-near-miss', 
      'tired', 
      'surrendered'
    );

    // Reset Position to relative flow in button-dock
    elements.acceptBtn.style.position = '';
    elements.acceptBtn.style.left = '';
    elements.acceptBtn.style.top = '';
    elements.acceptBtn.style.transform = '';

    // Reset Labels
    elements.acceptBtnIcon.textContent = "⚡";
    elements.acceptBtnText.textContent = "Accept";

    // Clear floating toasts
    elements.floatTextLayer.innerHTML = '';

    // Reset Telemetry & Dialogue
    updateTelemetry();
    setDialogue(TAUNT_MESSAGES[0], false);
  }

  // Sound Toggle
  function toggleSound() {
    STATE.soundEnabled = !STATE.soundEnabled;
    if (STATE.soundEnabled) {
      elements.soundIcon.textContent = "🔊";
      elements.soundStatus.textContent = "SFX: ON";
      audio.playClick();
    } else {
      elements.soundIcon.textContent = "🔇";
      elements.soundStatus.textContent = "SFX: OFF";
    }
  }

  // ==========================================================================
  // Event Attachments
  // ==========================================================================
  function initEventListeners() {
    // Mouse Proximity on Arena & Window
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Touch Support for Mobile
    elements.arenaZone.addEventListener('touchstart', handleTouchStart, { passive: false });
    elements.acceptBtn.addEventListener('touchstart', (e) => {
      if (!STATE.isSurrendered) {
        e.preventDefault();
        executeDodge(null, null, true);
      }
    });

    // Keyboard Focus
    elements.acceptBtn.addEventListener('focus', handleAcceptFocus);

    // Click Actions
    elements.acceptBtn.addEventListener('click', handleAcceptClick);
    elements.declineBtn.addEventListener('click', handleDeclineClick);

    // Modal Actions
    elements.modalResumeBtn.addEventListener('click', handleModalResume);
    elements.modalAbandonBtn.addEventListener('click', handleModalAbandon);

    // Screen Overlays Actions
    elements.abandonRetryBtn.addEventListener('click', resetGame);
    elements.victoryPlayAgainBtn.addEventListener('click', resetGame);

    // Audio Controls
    elements.soundToggleBtn.addEventListener('click', toggleSound);

    // Initialize telemetry
    updateTelemetry();
  }

  // Initialize on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEventListeners);
  } else {
    initEventListeners();
  }

})();
