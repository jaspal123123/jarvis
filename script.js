// Import core services
import { nlpService } from './nlp-service.js';
import { Config } from './config.js';

// Import voice processing modules
import { WhisperProcessor } from './voice/whisper-processor.js';
import { WakeWordDetector } from './voice/wake-word-detector.js';
import { SpeechSynthesis } from './voice/speech-synthesis.js';

// Import NLP modules
import { IntentClassifier } from './nlp/intent-classifier.js';
import { SentimentAnalyzer } from './nlp/sentiment-analyzer.js';
import { ContextManager } from './nlp/context-manager.js';
import { SelfLearningEngine } from './nlp/self-learning.js';

// Import service modules
import { TaskManager } from './services/task-manager.js';
import { EmailClient } from './services/email-client.js';
import { MediaPlayer } from './services/media-player.js';
import { FileManager } from './services/file-manager.js';
import { WebSearch } from './services/web-search.js';

// Import UI components
import { OrbAnimation } from './ui/orb-animation.js';
import { Waveform } from './ui/waveform.js';
import { Terminal } from './ui/terminal.js';
import { Notification } from './ui/notification.js';
import { AssistantBubble } from './ui/assistant-bubble.js';

// Import storage
import { Database } from './storage/db.js';

class JarvisUI {
    constructor() {
        // UI Elements
        this.startBtn = document.getElementById('start-btn');
        this.responseText = document.getElementById('response-text');
        this.waveformContainer = document.querySelector('.waveform-container');
        this.jarvisOrb = document.querySelector('.jarvis-orb');
        this.terminalContent = document.querySelector('.terminal-content');
        
        // State variables
        this.currentTheme = 'normal';
        this.isListening = false;
        this.isWakeWordActive = false;
        this.isProcessing = false;
        this.orbState = 'idle';
        this.orbTransitionDuration = 300; // ms
        this.hasError = false;
        
        // Audio processing
        this.audioContext = null;
        this.analyzer = null;
        
        // Initialize components
        this.db = new Database();
        this.whisperProcessor = new WhisperProcessor();
        this.wakeWordDetector = new WakeWordDetector();
        this.speechSynthesis = new SpeechSynthesis();
        
        // UI components
        this.orbAnimation = new OrbAnimation(this.jarvisOrb);
        this.waveform = new Waveform(this.waveformContainer);
        this.terminal = new Terminal(this.terminalContent);
        this.notification = new Notification();
        this.assistantBubble = new AssistantBubble();
        
        // Service modules
        this.taskManager = new TaskManager(this.db);
        this.emailClient = new EmailClient();
        this.mediaPlayer = new MediaPlayer();
        this.fileManager = new FileManager();
        this.webSearch = new WebSearch();
        
        // Start initialization
        this.initialize().catch(this.handleStartupError.bind(this));
    }

    async handleStartupError(error) {
        this.hasError = true;
        console.error('Jarvis initialization failed:', error);
        
        // Update UI to show error state
        this.updateOrbState('alert');
        await this.typeText('Initialization failed. Please check the console for details.');
        
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = 'Error: ' + (error.message || 'Failed to initialize Jarvis');
        this.responseText.appendChild(errorMessage);
    }

    async initialize() {
        try {
            this.terminal.log('System', 'Initializing Jarvis AI Assistant...');
            
            // Initialize Audio Context for waveform and audio processing
            this.setupAudioContext();
            
            // Initialize database
            this.terminal.log('System', 'Connecting to local database...');
            await this.db.initialize();
            
            // Initialize Whisper for speech recognition
            this.terminal.log('System', 'Loading Whisper speech recognition model...');
            await this.whisperProcessor.initialize();
            
            // Initialize wake word detector
            this.terminal.log('System', 'Initializing wake word detector...');
            await this.wakeWordDetector.initialize();
            this.wakeWordDetector.onWakeWord(() => this.handleWakeWord());
            
            // Initialize speech synthesis
            this.terminal.log('System', 'Setting up speech synthesis...');
            await this.speechSynthesis.initialize();
            
            // Initialize UI components
            this.terminal.log('System', 'Initializing UI components...');
            await this.orbAnimation.initialize();
            await this.waveform.initialize(this.audioContext, this.analyzer);
            await this.assistantBubble.initialize();
            
            // Initialize service modules
            this.terminal.log('System', 'Loading service modules...');
            await this.taskManager.initialize();
            await this.mediaPlayer.initialize();
            await this.fileManager.initialize();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Wait for NLP service to be ready
            this.terminal.log('System', 'Loading NLP models...');
            await nlpService.initialize();
            
            // Load user preferences
            this.terminal.log('System', 'Loading user preferences...');
            await this.loadUserPreferences();
            
            // Show startup animation
            this.terminal.log('System', 'Jarvis is ready!');
            await this.playStartupSequence();
            
            // Start wake word detection if enabled in preferences
            if (Config.voice.enableWakeWord) {
                this.startWakeWordDetection();
            }
        } catch (error) {
            this.terminal.log('Error', `Initialization failed: ${error.message}`);
            throw error; // Propagate to handleStartupError
        }
    }

    async loadUserPreferences() {
        try {
            const preferences = await this.db.getItem('preferences', 'userSettings');
            if (preferences) {
                // Apply user preferences to config
                Object.assign(Config, preferences);
                this.terminal.log('System', 'User preferences loaded');
            } else {
                this.terminal.log('System', 'No user preferences found, using defaults');
            }
        } catch (error) {
            this.terminal.log('Error', `Failed to load preferences: ${error.message}`);
        }
    }
    
    startWakeWordDetection() {
        if (this.isWakeWordActive) return;
        
        this.isWakeWordActive = true;
        this.wakeWordDetector.start();
        this.terminal.log('System', 'Wake word detection activated');
        this.notification.show('Wake word detection active', 'info');
    }
    
    stopWakeWordDetection() {
        if (!this.isWakeWordActive) return;
        
        this.isWakeWordActive = false;
        this.wakeWordDetector.stop();
        this.terminal.log('System', 'Wake word detection deactivated');
    }
    
    async handleWakeWord() {
        // If already listening or processing, ignore wake word
        if (this.isListening || this.isProcessing) return;
        
        this.terminal.log('System', 'Wake word detected: "Jarvis"');
        this.playSound('sounds/wake-word-detected.mp3');
        
        // Show visual feedback
        this.orbAnimation.pulse();
        this.notification.show('I\'m listening...', 'info');
        
        // Start listening
        await this.startListening();
    }
    
    async startWhisperRecognition() {
        try {
            this.isListening = true;
            this.updateOrbState('listening');
            this.waveform.start();
            
            // Start recording
            const audioBlob = await this.whisperProcessor.recordAudio(Config.voice.maxListeningTime);
            
            // Stop visual feedback
            this.isListening = false;
            this.updateOrbState('processing');
            this.waveform.stop();
            
            // Process the audio with Whisper
            this.isProcessing = true;
            this.terminal.log('System', 'Processing speech...');
            const text = await this.whisperProcessor.transcribeAudio(audioBlob);
            
            if (text && text.trim()) {
                this.terminal.log('User', text);
                await this.handleVoiceInput(text);
            } else {
                this.terminal.log('System', 'No speech detected');
                this.updateOrbState('idle');
            }
            
            this.isProcessing = false;
        } catch (error) {
            this.terminal.log('Error', `Speech recognition failed: ${error.message}`);
            this.isListening = false;
            this.isProcessing = false;
            this.updateOrbState('alert');
            setTimeout(() => this.updateOrbState('idle'), 2000);
        }
    }

    setupAudioContext() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyzer = this.audioContext.createAnalyser();
        this.analyzer.fftSize = 256;
    }

    setupEventListeners() {
        // Main button listener
        this.startBtn.addEventListener('click', () => this.toggleListening());
        
        // Theme transition listener
        document.addEventListener('themeChange', (e) => {
            this.transitionTheme(e.detail.theme);
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+Space to toggle listening
            if (e.ctrlKey && e.code === 'Space') {
                e.preventDefault();
                this.toggleListening();
            }
            
            // Escape to stop listening
            if (e.code === 'Escape' && this.isListening) {
                e.preventDefault();
                this.stopListening();
            }
        });
        
        // Assistant bubble events
        this.assistantBubble.onActivate(() => this.toggleListening());
        
        // Task notification events
        this.taskManager.onTaskDue((task) => {
            this.notification.show(`Task due: ${task.title}`, 'reminder');
            this.speechSynthesis.speak(`Reminder: ${task.title}`);
        });
    }

    async playStartupSound() {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, ctx.currentTime); // A4 note
        oscillator.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.5); // A5 note
        
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.5);
        
        return new Promise(resolve => setTimeout(resolve, 500));
    }

    async playStartupSequence() {
        const overlay = document.querySelector('.startup-overlay');
        
        // Initialize orb state
        this.updateOrbState('processing');
        
        // Play startup sound
        await this.playStartupSound();
        
        // Transition to idle state
        this.updateOrbState('idle');
        
        // Remove overlay
        overlay.style.animation = 'fadeOut 1s forwards';
        
        // Initialize with welcome message
        this.typeText('Jarvis initialized. Ready to assist.');
    }

    async toggleListening() {
        if (this.hasError) {
            this.notification.show('Jarvis is not fully initialized due to errors', 'error');
            return;
        }
        
        if (this.isListening || this.isProcessing) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }

    async startListening() {
        try {
            // Request microphone permission first
            await navigator.mediaDevices.getUserMedia({ audio: true });
            
            this.isListening = true;
            this.startBtn.textContent = 'Listening...';
            this.updateOrbState('listening');
            
            // Start the waveform animation
            this.waveform.start();
            
            // Play a sound to indicate we're listening
            this.playSound('sounds/listening-start.mp3').catch(() => {});
            
            // Use Whisper for speech recognition
            await this.startWhisperRecognition();
        } catch (error) {
            console.error('Microphone access denied:', error);
            this.updateOrbState('alert');
            this.terminal.log('Error', 'Microphone access denied');
            await this.typeText('Please allow microphone access to use voice commands.');
            this.notification.show('Microphone access required', 'error');
        }
    }

    stopListening() {
        this.isListening = false;
        this.startBtn.textContent = 'Activate Jarvis';
        this.updateOrbState('idle');
        this.waveform.stop();
        
        // Stop Whisper recording if active
        this.whisperProcessor.stopRecording();
        
        // Play a sound to indicate we've stopped listening
        this.playSound('sounds/listening-stop.mp3').catch(() => {});
        
        this.terminal.log('System', 'Listening stopped');
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
        try {
            // Update orb state to processing
            this.updateOrbState('processing');
            this.orbAnimation.pulse();
            
            // Show command received animation
            this.showRippleEffect();
            
            // Log to terminal
            this.terminal.log('User', text);
            
            // Process with NLP service
            const analysis = await nlpService.analyzeInput(text);
            
            // Handle command results if this was a command
            if (analysis.type === 'command' && analysis.result) {
                await this.handleCommandResult(analysis.result);
                return;
            }
            
            // Generate response
            const response = await nlpService.generateResponse(analysis);
            
            // Update UI based on response mood
            this.updateOrbState(response.mood === 'neutral' ? 'idle' : response.mood);
            
            // Display the response text
            await this.typeText(response.text);
            
            // Speak the response
            await this.speechSynthesis.speak(response.text, response.mood, response.voice);
            
            // Log Jarvis response
            this.terminal.log('Jarvis', response.text);
            
            // Return to idle state after a delay if not in a special state
            if (!['listening', 'alert', 'friendly'].includes(this.orbState)) {
                setTimeout(() => this.updateOrbState('idle'), 3000);
            }
        } catch (error) {
            this.terminal.log('Error', `Failed to process input: ${error.message}`);
            this.updateOrbState('alert');
            await this.typeText('I encountered an error while processing your request.');
            setTimeout(() => this.updateOrbState('idle'), 2000);
        }
    }

    showRippleEffect() {
        const ripple = document.createElement('div');
        ripple.className = 'ripple';
        this.jarvisOrb.appendChild(ripple);
        
        ripple.addEventListener('animationend', () => ripple.remove());
    }
    
    async handleCommandResult(result) {
        try {
            const { command, data } = result;
            this.terminal.log('System', `Executing command: ${command}`);
            
            switch (command) {
                case 'playMusic':
                    await this.mediaPlayer.playMusic(data.query);
                    await this.typeText(`Playing ${data.query}`);
                    this.terminal.log('Jarvis', `Playing ${data.query}`);
                    break;
                    
                case 'stopMusic':
                    await this.mediaPlayer.stop();
                    await this.typeText('Music stopped');
                    this.terminal.log('Jarvis', 'Music stopped');
                    break;
                    
                case 'setVolume':
                    await this.mediaPlayer.setVolume(data.volume);
                    await this.typeText(`Volume set to ${data.volume}%`);
                    this.terminal.log('Jarvis', `Volume set to ${data.volume}%`);
                    break;
                    
                case 'searchWeb':
                    this.terminal.log('System', `Searching web for: ${data.query}`);
                    const searchResults = await this.webSearch.search(data.query);
                    await this.typeText(searchResults.summary);
                    this.terminal.log('Jarvis', searchResults.summary);
                    break;
                    
                case 'addTask':
                    const task = await this.taskManager.addTask(data.title, data.dueDate, data.priority);
                    await this.typeText(`Task added: ${data.title}`);
                    this.terminal.log('Jarvis', `Task added: ${data.title}`);
                    this.notification.show('Task added', 'success');
                    break;
                    
                case 'listTasks':
                    const tasks = await this.taskManager.getTasks(data.filter);
                    if (tasks.length === 0) {
                        await this.typeText('You have no tasks.');
                        this.terminal.log('Jarvis', 'No tasks found');
                    } else {
                        const taskList = tasks.map(t => `${t.title} (${t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No due date'})`).join('\n');
                        await this.typeText(`Your tasks:\n${taskList}`);
                        this.terminal.log('Jarvis', `Listed ${tasks.length} tasks`);
                    }
                    break;
                    
                case 'setReminder':
                    await this.taskManager.addReminder(data.text, data.time);
                    await this.typeText(`Reminder set for ${new Date(data.time).toLocaleString()}`);
                    this.terminal.log('Jarvis', `Reminder set: ${data.text}`);
                    this.notification.show('Reminder set', 'success');
                    break;
                    
                case 'sendEmail':
                    await this.emailClient.sendEmail(data.to, data.subject, data.body);
                    await this.typeText(`Email sent to ${data.to}`);
                    this.terminal.log('Jarvis', `Email sent to ${data.to}`);
                    this.notification.show('Email sent', 'success');
                    break;
                    
                case 'readEmails':
                    const emails = await this.emailClient.getEmails(data.filter);
                    if (emails.length === 0) {
                        await this.typeText('No emails found.');
                    } else {
                        const emailSummary = emails.map(e => `From: ${e.from}\nSubject: ${e.subject}`).join('\n\n');
                        await this.typeText(`Recent emails:\n${emailSummary}`);
                    }
                    this.terminal.log('Jarvis', `Retrieved ${emails.length} emails`);
                    break;
                    
                case 'downloadFile':
                    await this.fileManager.downloadFile(data.url, data.filename);
                    await this.typeText(`File downloaded: ${data.filename}`);
                    this.terminal.log('Jarvis', `File downloaded: ${data.filename}`);
                    this.notification.show('File downloaded', 'success');
                    break;
                    
                case 'changePersonality':
                    await nlpService.setPersonality(data.personality);
                    await this.typeText(`Personality changed to ${data.personality}`);
                    this.terminal.log('Jarvis', `Personality changed to ${data.personality}`);
                    break;
                    
                default:
                    await this.typeText(`I don't know how to execute the command: ${command}`);
                    this.terminal.log('Error', `Unknown command: ${command}`);
            }
            
            // Return to idle state
            this.updateOrbState('idle');
        } catch (error) {
            this.terminal.log('Error', `Command execution failed: ${error.message}`);
            this.updateOrbState('alert');
            await this.typeText(`I encountered an error while executing your command: ${error.message}`);
            setTimeout(() => this.updateOrbState('idle'), 2000);
        }
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
