import { nlpService } from './nlp-service.js';

class JarvisUI {
    constructor() {
        this.startBtn = document.getElementById('start-btn');
        this.responseText = document.getElementById('response-text');
        this.waveformContainer = document.querySelector('.waveform-container');
        this.jarvisOrb = document.querySelector('.jarvis-orb');
        this.terminalContent = document.querySelector('.terminal-content');
        this.currentTheme = 'normal';
        this.isListening = false;
        this.recognition = null;
        this.audioContext = null;
        this.analyzer = null;
        this.orbState = 'idle';
        this.orbTransitionDuration = 300; // ms

        this.initialize();
    }

    async initialize() {
        // Initialize Web Speech API
        if ('webkitSpeechRecognition' in window) {
            this.setupSpeechRecognition();
        }

        // Initialize Audio Context for waveform
        this.setupAudioContext();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Show startup animation
        await this.playStartupSequence();
    }

    setupSpeechRecognition() {
        this.recognition = new webkitSpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;

        this.recognition.onresult = async (event) => {
            const text = event.results[0][0].transcript;
            await this.handleVoiceInput(text);
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.startBtn.textContent = 'Activate Jarvis';
            this.updateOrbState('idle');
        };
    }

    setupAudioContext() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyzer = this.audioContext.createAnalyser();
        this.analyzer.fftSize = 256;
    }

    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.toggleListening());
        
        // Theme transition listener
        document.addEventListener('themeChange', (e) => {
            this.transitionTheme(e.detail.theme);
        });
    }

    async playStartupSequence() {
        const overlay = document.querySelector('.startup-overlay');
        
        // Initialize orb state
        this.updateOrbState('processing');
        
        // Play startup sound
        await this.playSound('startup.mp3');
        
        // Transition to idle state
        this.updateOrbState('idle');
        
        // Remove overlay
        overlay.style.animation = 'fadeOut 1s forwards';
        
        // Initialize with welcome message
        this.typeText('Jarvis initialized. Ready to assist.');
    }

    async toggleListening() {
        if (!this.isListening) {
            this.startListening();
        } else {
            this.stopListening();
        }
    }

    async startListening() {
        this.isListening = true;
        this.startBtn.textContent = 'Listening...';
        this.updateOrbState('listening');
        this.startWaveformAnimation();
        
        if (this.recognition) {
            this.recognition.start();
        }
    }

    stopListening() {
        this.isListening = false;
        this.startBtn.textContent = 'Activate Jarvis';
        this.updateOrbState('idle');
        this.stopWaveformAnimation();
        
        if (this.recognition) {
            this.recognition.stop();
        }
    }

    updateOrbState(state) {
        const states = {
            idle: { color: '#4a9eff', pulseSpeed: 2 },
            listening: { color: '#33FF57', pulseSpeed: 1 },
            processing: { color: '#FFBB33', pulseSpeed: 0.5 },
            alert: { color: '#FF3333', pulseSpeed: 0.3 },
            friendly: { color: '#B94FFF', pulseSpeed: 1.5 }
        };

        // Update orb state attribute
        this.jarvisOrb.dataset.state = state;
        this.orbState = state;

        // Adjust animation speeds based on state
        const orbGlow = this.jarvisOrb.querySelector('.orb-glow');
        const orbInner = this.jarvisOrb.querySelector('.orb-inner');
        const orbParticles = this.jarvisOrb.querySelector('.orb-particles');
        
        if (orbGlow && orbInner && orbParticles) {
            orbGlow.style.animationDuration = `${states[state].pulseSpeed}s`;
            orbInner.style.animationDuration = `${states[state].pulseSpeed * 4}s`;
            orbParticles.style.animationDuration = `${states[state].pulseSpeed * 6}s`;
        }
    }

    adjustColor(color, amount) {
        return color.replace(/[\da-f]{2}/gi, x => {
            const num = parseInt(x, 16) + amount;
            return Math.max(0, Math.min(255, num)).toString(16).padStart(2, '0');
        });
    }

    async startWaveformAnimation() {
        if (!this.audioContext) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const source = this.audioContext.createMediaStreamSource(stream);
            source.connect(this.analyzer);
            
            this.updateWaveform();
        } catch (error) {
            console.error('Error accessing microphone:', error);
        }
    }

    stopWaveformAnimation() {
        if (this.audioContext) {
            this.analyzer.disconnect();
        }
    }

    updateWaveform() {
        if (!this.isListening) return;

        const bufferLength = this.analyzer.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyzer.getByteTimeDomainData(dataArray);

        // Update wave elements based on audio data
        const waves = this.waveformContainer.querySelectorAll('.wave');
        waves.forEach((wave, index) => {
            const amplitude = dataArray[index * 10] / 128.0;
            wave.style.transform = `scaleY(${amplitude})`;
        });

        requestAnimationFrame(() => this.updateWaveform());
    }

    async typeText(text) {
        this.responseText.textContent = '';
        const words = text.split(' ');
        
        for (const word of words) {
            this.responseText.textContent += word + ' ';
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }

    async handleVoiceInput(text) {
        // Update orb state to processing
        this.updateOrbState('processing');
        
        // Show command received animation
        this.showRippleEffect();
        
        // Log to terminal
        this.logToTerminal(`User: ${text}`);
        
        // Process with NLP service
        const analysis = await nlpService.analyzeInput(text);
        const response = await nlpService.generateResponse(analysis);
        
        // Update UI based on response mood
        this.updateOrbState(response.mood === 'neutral' ? 'idle' : response.mood);
        await this.typeText(response.text);
        
        // Log Jarvis response
        this.logToTerminal(`Jarvis: ${response.text}`);

        // Return to idle state after a delay if not in a special state
        if (!['listening', 'alert', 'friendly'].includes(this.orbState)) {
            setTimeout(() => this.updateOrbState('idle'), 3000);
        }
    }

    showRippleEffect() {
        const ripple = document.createElement('div');
        ripple.className = 'ripple';
        this.jarvisOrb.appendChild(ripple);
        
        ripple.addEventListener('animationend', () => ripple.remove());
    }

    logToTerminal(message) {
        const log = document.createElement('div');
        log.className = 'terminal-line';
        log.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        this.terminalContent.appendChild(log);
        this.terminalContent.scrollTop = this.terminalContent.scrollHeight;
    }

    async transitionTheme(theme) {
        const container = document.getElementById('jarvis-container');
        container.style.transition = 'all 0.5s ease';
        
        // Remove previous theme
        container.classList.remove(`theme-${this.currentTheme}`);
        
        // Add new theme
        container.classList.add(`theme-${theme}`);
        this.currentTheme = theme;
        
        // Update orb color based on theme
        this.updateOrbState(this.isListening ? 'listening' : 'idle');
    }

    async showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Remove notification after 5 seconds
        setTimeout(() => {
            notification.classList.add('exit');
            setTimeout(() => notification.remove(), 500);
        }, 5000);
    }

    playSound(soundFile) {
        return new Promise((resolve) => {
            const audio = new Audio(soundFile);
            audio.onended = resolve;
            audio.play().catch(console.error);
        });
    }
}

// Initialize Jarvis UI
const jarvis = new JarvisUI();
