/**
 * UI Integration - Connects all UI components for the Jarvis AI Assistant
 * Creates a cohesive, futuristic Iron Man-style interface
 * Manages interactions between components and the core Jarvis system
 */
import { OrbAnimation } from './ui/orb-animation.js';
import { WaveformVisualizer } from './ui/waveform-visualizer.js';
import { AnimatedBackground } from './ui/animated-background.js';
import { QuickActions } from './ui/quick-actions.js';
import { PersonalitySwitcher } from './ui/personality-switcher.js';
import { Terminal } from './ui/terminal.js';

export class JarvisUI {
    constructor() {
        // Initialize components when DOM is loaded
        document.addEventListener('DOMContentLoaded', this.initialize.bind(this));
    }
    
    /**
     * Initialize all UI components
     */
    async initialize() {
        // Play startup animation
        await this.playStartupSequence();
        
        // Initialize UI components
        this.initAnimatedBackground();
        this.initOrbAnimation();
        this.initWaveformVisualizer();
        this.initQuickActions();
        this.initPersonalitySwitcher();
        this.initTerminal();
        this.initControlButtons();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Log initialization
        this.terminal.log('JARVIS UI initialized successfully', 'system');
        this.terminal.log('All systems online and ready', 'jarvis');
    }
    
    /**
     * Play startup animation sequence
     */
    async playStartupSequence() {
        return new Promise(resolve => {
            // Get elements
            const startupOverlay = document.querySelector('.startup-overlay');
            const progressBar = document.querySelector('.progress-bar');
            const startupText = document.querySelector('.startup-text');
            const startupSound = document.getElementById('startup-sound');
            
            // Update startup text with loading messages
            const loadingMessages = [
                'Initializing core systems...',
                'Loading neural networks...',
                'Calibrating voice recognition...',
                'Establishing local database connection...',
                'Activating UI components...',
                'Running system diagnostics...',
                'All systems nominal.'
            ];
            
            let messageIndex = 0;
            
            // Play startup sound
            if (startupSound) {
                startupSound.play().catch(err => console.log('Audio playback error:', err));
            }
            
            // Animate progress bar with GSAP if available
            if (window.gsap) {
                gsap.to(progressBar, {
                    width: '100%',
                    duration: 3,
                    ease: 'power2.inOut',
                    onUpdate: function() {
                        // Update loading message based on progress
                        const progress = gsap.getProperty(progressBar, 'width') / gsap.getProperty(progressBar.parentNode, 'width');
                        const messageToShow = Math.floor(progress * loadingMessages.length);
                        
                        if (messageToShow !== messageIndex && messageToShow < loadingMessages.length) {
                            messageIndex = messageToShow;
                            startupText.textContent = loadingMessages[messageIndex];
                        }
                    },
                    onComplete: function() {
                        // Fade out overlay
                        gsap.to(startupOverlay, {
                            opacity: 0,
                            duration: 1,
                            delay: 0.5,
                            onComplete: function() {
                                startupOverlay.style.display = 'none';
                                resolve();
                            }
                        });
                    }
                });
            } else {
                // Fallback for no GSAP
                progressBar.style.transition = 'width 3s ease-in-out';
                progressBar.style.width = '100%';
                
                // Update text with setInterval
                const textInterval = setInterval(() => {
                    messageIndex++;
                    if (messageIndex < loadingMessages.length) {
                        startupText.textContent = loadingMessages[messageIndex];
                    } else {
                        clearInterval(textInterval);
                    }
                }, 3000 / loadingMessages.length);
                
                // Hide overlay after animation
                setTimeout(() => {
                    startupOverlay.style.opacity = '0';
                    setTimeout(() => {
                        startupOverlay.style.display = 'none';
                        resolve();
                    }, 1000);
                }, 3500);
            }
        });
    }
    
    /**
     * Initialize animated background
     */
    initAnimatedBackground() {
        this.background = new AnimatedBackground('.animated-background');
    }
    
    /**
     * Initialize orb animation
     */
    initOrbAnimation() {
        this.orbAnimation = new OrbAnimation('.jarvis-orb');
    }
    
    /**
     * Initialize waveform visualizer
     */
    initWaveformVisualizer() {
        this.waveform = new WaveformVisualizer('waveform-canvas');
    }
    
    /**
     * Initialize quick action tiles
     */
    initQuickActions() {
        this.quickActions = new QuickActions('.quick-actions', this.handleQuickAction.bind(this));
    }
    
    /**
     * Initialize personality switcher
     */
    initPersonalitySwitcher() {
        this.personalitySwitcher = new PersonalitySwitcher('.personality-switcher', this.handlePersonalityChange.bind(this));
    }
    
    /**
     * Initialize terminal
     */
    initTerminal() {
        this.terminal = new Terminal('terminal-log');
        
        // Register terminal commands
        this.registerTerminalCommands();
    }
    
    /**
     * Initialize control buttons
     */
    initControlButtons() {
        // Get buttons
        this.micToggle = document.getElementById('mic-toggle');
        this.terminalToggle = document.getElementById('terminal-toggle');
        this.settingsToggle = document.getElementById('settings-toggle');
        
        // Add event listeners
        if (this.micToggle) {
            this.micToggle.addEventListener('click', this.toggleMicrophone.bind(this));
        }
        
        if (this.terminalToggle) {
            this.terminalToggle.addEventListener('click', this.toggleTerminal.bind(this));
        }
        
        if (this.settingsToggle) {
            this.settingsToggle.addEventListener('click', this.toggleSettings.bind(this));
        }
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Terminal controls
        const terminalClose = document.querySelector('.terminal-close');
        const terminalMinimize = document.querySelector('.terminal-minimize');
        const terminalMaximize = document.querySelector('.terminal-maximize');
        
        if (terminalClose) {
            terminalClose.addEventListener('click', () => {
                this.toggleTerminal(false);
            });
        }
        
        if (terminalMinimize) {
            terminalMinimize.addEventListener('click', () => {
                const terminal = document.getElementById('terminal-log');
                terminal.classList.add('minimized');
            });
        }
        
        if (terminalMaximize) {
            terminalMaximize.addEventListener('click', () => {
                const terminal = document.getElementById('terminal-log');
                terminal.classList.toggle('maximized');
            });
        }
        
        // Assistant bubble
        const assistantBubble = document.querySelector('.assistant-bubble');
        if (assistantBubble) {
            assistantBubble.addEventListener('click', () => {
                // Show main UI
                document.getElementById('app').style.display = 'flex';
                assistantBubble.classList.remove('active');
            });
        }
        
        // Camera parallax effect for orb
        const orbContainer = document.querySelector('.orb-container');
        if (orbContainer) {
            orbContainer.addEventListener('mousemove', this.handleOrbParallax.bind(this));
            orbContainer.addEventListener('mouseleave', () => {
                const parallaxElement = document.querySelector('.orb-camera-parallax');
                if (parallaxElement && window.gsap) {
                    gsap.to(parallaxElement, {
                        rotateX: 0,
                        rotateY: 0,
                        duration: 0.5,
                        ease: 'power2.out'
                    });
                }
            });
        }
        
        // Wake word detection (simulated)
        document.addEventListener('keydown', (e) => {
            // Press J key to simulate wake word "Jarvis"
            if (e.key === 'j') {
                this.handleWakeWord();
            }
        });
    }
    
    /**
     * Register terminal commands
     */
    registerTerminalCommands() {
        // Help command
        this.terminal.registerCommand('help', () => {
            this.terminal.log('Available commands:', 'system');
            this.terminal.log('clear - Clear terminal', 'system');
            this.terminal.log('personality [type] - Change personality mode', 'system');
            this.terminal.log('status - Show system status', 'system');
            this.terminal.log('minimize - Minimize terminal', 'system');
            this.terminal.log('maximize - Maximize terminal', 'system');
        }, 'Show available commands');
        
        // Personality command
        this.terminal.registerCommand('personality', (args) => {
            if (args.length > 0) {
                const personality = args[0].toLowerCase();
                if (['friendly', 'funny', 'serious', 'professional'].includes(personality)) {
                    this.personalitySwitcher.setPersonality(personality);
                    this.terminal.log(`Personality changed to ${personality}`, 'success');
                } else {
                    this.terminal.log(`Unknown personality: ${personality}`, 'error');
                    this.terminal.log('Available personalities: friendly, funny, serious, professional', 'system');
                }
            } else {
                this.terminal.log(`Current personality: ${this.personalitySwitcher.getPersonality()}`, 'system');
                this.terminal.log('Available personalities: friendly, funny, serious, professional', 'system');
            }
        }, 'Change or view personality mode');
        
        // Status command
        this.terminal.registerCommand('status', () => {
            this.terminal.log('JARVIS System Status:', 'system');
            this.terminal.log(`Personality: ${this.personalitySwitcher.getPersonality()}`, 'system');
            this.terminal.log('Voice Recognition: Active', 'system');
            this.terminal.log('NLP Engine: Online', 'system');
            this.terminal.log('Local Database: Connected', 'system');
            this.terminal.log('UI Components: Operational', 'system');
        }, 'Show system status');
        
        // Minimize command
        this.terminal.registerCommand('minimize', () => {
            const terminal = document.getElementById('terminal-log');
            terminal.classList.add('minimized');
            this.terminal.log('Terminal minimized', 'system');
        }, 'Minimize terminal');
        
        // Maximize command
        this.terminal.registerCommand('maximize', () => {
            const terminal = document.getElementById('terminal-log');
            terminal.classList.toggle('maximized');
            this.terminal.log('Terminal maximized', 'system');
        }, 'Maximize terminal');
    }
    
    /**
     * Handle quick action click
     * @param {String} command - Command to execute
     */
    handleQuickAction(command) {
        // Log command
        this.terminal.log(`Quick action: ${command}`, 'user');
        
        // Execute command
        switch (command) {
            case 'weather':
                this.showWeather();
                break;
                
            case 'time':
                this.showTime();
                break;
                
            case 'play-music':
                this.playMusic();
                break;
                
            case 'youtube':
                this.openYouTube();
                break;
                
            case 'reminders':
                this.showReminders();
                break;
                
            case 'web-search':
                this.webSearch();
                break;
                
            case 'email':
                this.openEmail();
                break;
                
            case 'more':
                this.showMoreActions();
                break;
                
            default:
                this.terminal.log(`Unknown command: ${command}`, 'error');
        }
    }
    
    /**
     * Handle personality change
     * @param {String} personality - New personality
     */
    handlePersonalityChange(personality) {
        // Log change
        this.terminal.log(`Personality changed to ${personality}`, 'system');
        
        // Update UI
        this.personalitySwitcher.updateUI(personality);
        
        // Update orb
        if (this.orbAnimation) {
            this.orbAnimation.setPersonalityColor(personality);
        }
        
        // Update waveform color
        if (this.waveform) {
            const color = this.personalitySwitcher.getPersonalityColor(personality);
            this.waveform.setColor(color);
        }
        
        // Update background
        if (this.background) {
            const color = this.personalitySwitcher.getPersonalityColor(personality);
            this.background.setThemeColor(color);
        }
        
        // Update quick actions
        if (this.quickActions) {
            this.quickActions.updateTheme(personality);
        }
        
        // Play transition animation
        this.personalitySwitcher.playTransitionAnimation(this.personalitySwitcher.getPersonality(), personality);
    }
    
    /**
     * Handle orb parallax effect
     * @param {MouseEvent} e - Mouse event
     */
    handleOrbParallax(e) {
        const parallaxElement = document.querySelector('.orb-camera-parallax');
        if (!parallaxElement) return;
        
        const orbContainer = document.querySelector('.orb-container');
        const rect = orbContainer.getBoundingClientRect();
        
        // Calculate mouse position relative to container center
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        // Calculate rotation based on mouse position
        const rotateY = ((mouseX - centerX) / (rect.width / 2)) * 10; // Max 10 degrees
        const rotateX = ((centerY - mouseY) / (rect.height / 2)) * 10; // Max 10 degrees
        
        // Apply rotation with GSAP if available
        if (window.gsap) {
            gsap.to(parallaxElement, {
                rotateX,
                rotateY,
                duration: 0.3,
                ease: 'power2.out'
            });
        } else {
            // Fallback without GSAP
            parallaxElement.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        }
    }
    
    /**
     * Handle wake word detection
     */
    handleWakeWord() {
        // Update orb state
        if (this.orbAnimation) {
            this.orbAnimation.setState('listening');
        }
        
        // Activate waveform
        if (this.waveform) {
            this.waveform.setActive(true);
            this.waveform.playActivationAnimation();
        }
        
        // Play wake sound
        const wakeSound = document.getElementById('wake-sound');
        if (wakeSound) {
            wakeSound.play().catch(err => console.log('Audio playback error:', err));
        }
        
        // Log to terminal
        this.terminal.log('Wake word detected: "Jarvis"', 'system');
        
        // Show greeting based on personality
        const personality = this.personalitySwitcher.getPersonality();
        let greeting = '';
        
        switch (personality) {
            case 'friendly':
                greeting = 'Hey Prince! I\'m right here. What can I do for you today?';
                break;
                
            case 'funny':
                greeting = 'Yo boss! Your digital butler is at your service. What\'s cooking?';
                break;
                
            case 'serious':
                greeting = 'Yes, I\'m listening. How may I assist you?';
                break;
                
            case 'professional':
                greeting = 'Hello boss, Jarvis is online and listening. How may I help you?';
                break;
                
            default:
                greeting = 'I\'m listening. How can I help?';
        }
        
        // Display greeting
        this.typeResponse(greeting);
        
        // Return to idle state after a delay
        setTimeout(() => {
            if (this.orbAnimation) {
                this.orbAnimation.setState('idle');
            }
            
            if (this.waveform) {
                this.waveform.setActive(false);
            }
        }, 5000);
    }
    
    /**
     * Toggle microphone
     */
    toggleMicrophone() {
        // Toggle listening state
        const isListening = this.micToggle.classList.toggle('active');
        
        // Update orb state
        if (this.orbAnimation) {
            this.orbAnimation.setState(isListening ? 'listening' : 'idle');
        }
        
        // Update waveform
        if (this.waveform) {
            this.waveform.setActive(isListening);
        }
        
        // Log to terminal
        this.terminal.log(`Microphone ${isListening ? 'activated' : 'deactivated'}`, 'system');
    }
    
    /**
     * Toggle terminal visibility
     * @param {Boolean} show - Whether to show terminal
     */
    toggleTerminal(show) {
        const terminal = document.getElementById('terminal-log');
        
        if (show === undefined) {
            // Toggle if no value provided
            terminal.classList.toggle('active');
        } else {
            // Set to specified value
            if (show) {
                terminal.classList.add('active');
            } else {
                terminal.classList.remove('active');
            }
        }
    }
    
    /**
     * Toggle settings panel
     */
    toggleSettings() {
        // Toggle personality switcher visibility
        const personalitySwitcher = document.querySelector('.personality-switcher');
        
        if (personalitySwitcher) {
            personalitySwitcher.classList.toggle('active');
        }
    }
    
    /**
     * Type response text with animation
     * @param {String} text - Text to type
     */
    typeResponse(text) {
        const responseText = document.getElementById('response-text');
        
        if (!responseText) return;
        
        // Clear previous text
        responseText.textContent = '';
        
        // Use GSAP for typing animation if available
        if (window.gsap) {
            const chars = text.split('');
            let html = '';
            
            chars.forEach(char => {
                html += `<span class="char">${char === ' ' ? '&nbsp;' : char}</span>`;
            });
            
            responseText.innerHTML = html;
            
            gsap.from('.char', {
                opacity: 0,
                duration: 0.05,
                stagger: 0.03,
                ease: 'power1.in'
            });
        } else {
            // Fallback typing animation
            let i = 0;
            const speed = 30;
            
            function typeWriter() {
                if (i < text.length) {
                    responseText.textContent += text.charAt(i);
                    i++;
                    setTimeout(typeWriter, speed);
                }
            }
            
            typeWriter();
        }
    }
    
    // Quick action handlers (placeholders)
    showWeather() {
        this.typeResponse('Current weather: 72°F, Partly Cloudy');
        this.terminal.log('Weather information displayed', 'jarvis');
    }
    
    showTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        const dateString = now.toLocaleDateString();
        
        this.typeResponse(`Current time: ${timeString}\nDate: ${dateString}`);
        this.terminal.log('Time information displayed', 'jarvis');
    }
    
    playMusic() {
        this.typeResponse('Playing your favorite playlist...');
        this.terminal.log('Music playback initiated', 'jarvis');
    }
    
    openYouTube() {
        this.typeResponse('Opening YouTube...');
        this.terminal.log('YouTube requested', 'jarvis');
    }
    
    showReminders() {
        this.typeResponse('You have 2 reminders:\n1. Meeting at 3:00 PM\n2. Call Mom at 5:30 PM');
        this.terminal.log('Reminders displayed', 'jarvis');
    }
    
    webSearch() {
        this.typeResponse('What would you like to search for?');
        this.terminal.log('Web search initiated', 'jarvis');
    }
    
    openEmail() {
        this.typeResponse('Opening email client...\nYou have 3 unread messages.');
        this.terminal.log('Email client requested', 'jarvis');
    }
    
    showMoreActions() {
        this.typeResponse('Additional actions available:\n- Calendar\n- Notes\n- File Manager\n- Voice Typing\n- System Settings');
        this.terminal.log('Additional actions displayed', 'jarvis');
    }
}
