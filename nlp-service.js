import { Database } from './storage/db.js';
import { SpeechSynthesis } from './voice/speech-synthesis.js';
import { Config } from './config.js';

// Import NLP modules
import { IntentClassifier } from './nlp/intent-classifier.js';
import { SentimentAnalyzer } from './nlp/sentiment-analyzer.js';
import { ContextManager } from './nlp/context-manager.js';
import { SelfLearningEngine } from './nlp/self-learning.js';

class NLPService {
    constructor() {
        // Database and storage
        this.db = new Database();
        
        // NLP components
        this.intentClassifier = new IntentClassifier();
        this.sentimentAnalyzer = new SentimentAnalyzer();
        this.contextManager = new ContextManager();
        this.selfLearningEngine = new SelfLearningEngine();
        
        // Speech synthesis
        this.speechSynthesis = new SpeechSynthesis();
        
        // State variables
        this.currentMood = 'neutral';
        this.personality = Config.defaultPersonality;
        
        // Personalities configuration
        this.personalities = {
            friendly: {
                greetings: [
                    "Hey buddy! Jarvis at your service, how can I make your day awesome?",
                    "Hi there! Ready to tackle anything you throw my way!",
                    "Hello friend! What exciting things shall we do today?"
                ],
                responseStyle: 'casual',
                emojis: true,
                pitch: 1.1,
                speed: 1.05
            },
            funny: {
                greetings: [
                    "Beep boop - just kidding, I don't actually beep! What's up?",
                    "Your favorite AI assistant has arrived! Let's have some fun!",
                    "Ready to roll! Though technically I don't roll, I compute... but that's less catchy!"
                ],
                responseStyle: 'humorous',
                emojis: true,
                pitch: 1.2,
                speed: 1.1
            },
            serious: {
                greetings: [
                    "Jarvis online. How may I assist you today?",
                    "Good day. I'm ready to help with any task you require.",
                    "Professional assistance ready. What do you need?"
                ],
                responseStyle: 'formal',
                emojis: false,
                pitch: 0.95,
                speed: 0.95
            }
        };
        this.initialize();
    }

    async initialize() {
        try {
            console.log('Initializing NLP Service...');
            
            // Initialize database
            await this.db.initialize();
            
            // Initialize NLP components
            await this.intentClassifier.initialize();
            await this.sentimentAnalyzer.initialize();
            await this.contextManager.initialize();
            await this.selfLearningEngine.initialize();
            
            // Initialize speech synthesis
            await this.speechSynthesis.initialize();
            
            // Load conversation history
            await this.loadConversationHistory();
            
            // Load user preferences
            await this.loadUserPreferences();
            
            console.log('NLP Service initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing NLP service:', error);
            throw error; // Propagate the error for proper handling
        }
    }

    async loadUserPreferences() {
        try {
            const preferences = await this.db.getItem('preferences', 'userSettings');
            if (preferences) {
                // Apply user preferences
                if (preferences.personality) {
                    this.personality = preferences.personality;
                }
                console.log('User preferences loaded');
            }
        } catch (error) {
            console.error('Error loading user preferences:', error);
        }
    }
    
    async analyzeInput(text) {
        try {
            // First, check for commands using the intent classifier
            const intent = await this.intentClassifier.classify(text);
            
            if (intent.type === 'command') {
                const commandResult = await this.processCommand(text, intent);
                if (commandResult) {
                    // Log the command for learning
                    this.selfLearningEngine.logInteraction({
                        input: text,
                        intent: intent,
                        response: commandResult.response,
                        timestamp: Date.now()
                    });
                    
                    return {
                        type: 'command',
                        result: commandResult,
                        timestamp: Date.now(),
                        originalText: text
                    };
                }
            }

            // Analyze the input
            const sentiment = await this.sentimentAnalyzer.analyze(text);
            const entities = await this.intentClassifier.extractEntities(text);
            const context = this.contextManager.getCurrentContext();
            
            const analysis = {
                intent: intent,
                sentiment: sentiment,
                entities: entities,
                context: context,
                timestamp: Date.now(),
                originalText: text
            };

            // Store conversation in context manager and database
            this.contextManager.updateContext(analysis);
            await this.db.storeConversation(analysis);
            
            // Log the interaction for learning
            this.selfLearningEngine.logInteraction(analysis);

            return analysis;
        } catch (error) {
            console.error('Error analyzing input:', error);
            return {
                type: 'error',
                error: error.message,
                timestamp: Date.now(),
                originalText: text
            };
        }
    }

    async processCommand(text, intent) {
        const { command, confidence, entities } = intent;
        
        // Only process if we have high confidence this is a command
        if (confidence < Config.nlp.commandConfidenceThreshold) {
            return null;
        }
        
        try {
            switch (command) {
                case 'changePersonality':
                    const personality = entities.personality || 'friendly';
                    if (this.personalities[personality]) {
                        this.personality = personality;
                        await this.db.setItem('preferences', 'userSettings', { personality });
                        return {
                            command: 'changePersonality',
                            data: { personality },
                            response: `Personality switched to ${personality} mode.`
                        };
                    }
                    break;
                    
                case 'setReminder':
                    const reminderText = entities.text || text.split('remind me to')[1]?.trim() || 'something important';
                    let reminderTime = entities.time || Date.now() + 3600000; // Default 1 hour
                    
                    // If time is a string, parse it
                    if (typeof reminderTime === 'string') {
                        const timeMatch = reminderTime.match(/in (\d+) (minutes?|hours?|days?)/);
                        if (timeMatch) {
                            const [_, amount, unit] = timeMatch;
                            const multiplier = unit.startsWith('minute') ? 60000 :
                                             unit.startsWith('hour') ? 3600000 :
                                             unit.startsWith('day') ? 86400000 : 0;
                            reminderTime = Date.now() + (parseInt(amount) * multiplier);
                        }
                    }
                    
                    return {
                        command: 'setReminder',
                        data: { text: reminderText, time: reminderTime },
                        response: `I'll remind you to ${reminderText} at ${new Date(reminderTime).toLocaleString()}`
                    };
                    
                case 'searchWeb':
                    const query = entities.query || text.split('search for')[1]?.trim() || text;
                    return {
                        command: 'searchWeb',
                        data: { query },
                        response: `Searching the web for "${query}"...`
                    };
                    
                case 'playMusic':
                    const musicQuery = entities.query || text.split('play')[1]?.trim() || 'some music';
                    return {
                        command: 'playMusic',
                        data: { query: musicQuery },
                        response: `Playing ${musicQuery}...`
                    };
                    
                case 'stopMusic':
                    return {
                    
                case 'get_date':
                    result = this.handleDateCommand();
                    break;
                    
                case 'change_personality':
                    result = await this.handlePersonalityCommand(text, entities);
                    break;
                    
                case 'system_status':
                    result = this.handleSystemStatusCommand();
                    break;
                    
                case 'stop_speaking':
                    this.speechSynthesis.stop();
                    result = {
                        response: "I'll be quiet now.",
                        success: true,
                        animation: 'acknowledge'
                    };
                    break;
                    
                case 'volume_control':
                    result = this.handleVolumeCommand(text, entities);
                    break;
                case 'readEmails':
                    const emailFilter = entities.filter || 'unread';
                    return {
                        command: 'readEmails',
                        data: { filter: emailFilter },
                        response: 'Checking your emails...'
                    };
                    
                case 'downloadFile':
                    if (!entities.url) {
                        return {
                            command: 'error',
                            data: { error: 'No URL specified' },
                            response: 'I need a URL to download from.'
                        };
                    }
                    
                    return {
                        command: 'downloadFile',
                        data: {
                            url: entities.url,
                            filename: entities.filename || 'download'
                        },
                        response: `Downloading file from ${entities.url}...`
                    };
                    
                default:
                    // Let the self-learning engine try to handle unknown commands
                    const learnedResponse = await this.selfLearningEngine.handleUnknownCommand(text, intent);
                    if (learnedResponse) {
                        return learnedResponse;
                    }
                    return null;
            }
        } catch (error) {
            console.error('Error processing command:', error);
            return {
                command: 'error',
                data: { error: error.message },
                response: `I encountered an error processing your command: ${error.message}`
            };
        }
        
        return null;
    }

    async generateResponse(analysis) {
        try {
            // Handle error responses
            if (analysis.type === 'error') {
                return {
                    text: `I'm sorry, I encountered an error: ${analysis.error}`,
                    mood: 'alert',
                    animation: 'alert',
                    voice: { pitch: 0.9, speed: 0.9 }
                };
            }
            
            // Handle command responses
            if (analysis.type === 'command') {
                return {
                    text: analysis.result.response,
                    mood: 'professional',
                    animation: 'process',
                    voice: { pitch: 1.0, speed: 1.0 }
                };
            }
            
            // Get the current personality settings
            const personality = this.personalities[this.personality];
            
            // Generate a response using the context manager and self-learning engine
            const responseText = await this.generateConversationResponse(analysis);
            
            // Determine the mood based on sentiment analysis
            const mood = this.determineResponseMood(analysis.sentiment);
            
            // Format the response based on personality
            let formattedText = this.formatResponse(responseText, personality.responseStyle);
            
            // Add emojis if enabled for this personality
            if (personality.emojis) {
                formattedText = this.addEmojis(formattedText);
            }
            
            // Construct the final response object
            const response = {
                text: formattedText,
                mood: mood,
                animation: this.getAppropriateAnimation(mood),
                voice: {
                    pitch: personality.pitch * (mood === 'excited' ? 1.1 : mood === 'empathetic' ? 0.9 : 1.0),
                    speed: personality.speed * (mood === 'excited' ? 1.1 : mood === 'empathetic' ? 0.9 : 1.0)
                }
            };
            
            // Log the response for learning
            this.selfLearningEngine.logResponse(analysis, response);
            
            return response;
        } catch (error) {
            console.error('Error generating response:', error);
            return {
                text: "I'm having trouble formulating a response right now.",
                mood: 'alert',
                animation: 'alert',
                voice: { pitch: 0.9, speed: 0.9 }
            };
        }
    }
    
    async generateConversationResponse(analysis) {
        // First, check if the self-learning engine has a learned response
        const learnedResponse = await this.selfLearningEngine.generateResponse(analysis);
        if (learnedResponse) {
            return learnedResponse;
        }
        
        // Otherwise, use the context manager to generate a response based on context
        const contextualResponse = await this.contextManager.generateResponse(analysis);
        if (contextualResponse) {
            return contextualResponse;
        }
        
        // Fallback to basic intent-based responses
        return this.craftResponse(analysis, this.personalities[this.personality]);
    }

    determineResponseMood(sentiment) {
        if (sentiment.label === 'POSITIVE' && sentiment.score > 0.8) {
            return 'excited';
        } else if (sentiment.label === 'NEGATIVE' && sentiment.score > 0.8) {
            return 'empathetic';
        }
        return 'neutral';
    }

    getAppropriateAnimation(mood) {
        const animations = {
            excited: 'bounce',
            empathetic: 'nod',
            neutral: 'idle',
            professional: 'formal',
            alert: 'alert',
            thinking: 'process'
        };
        return animations[mood || 'neutral'];
    }

    getVoiceModulation() {
        const voiceParams = {
            excited: { pitch: 1.2, speed: 1.1 },
            empathetic: { pitch: 0.9, speed: 0.9 },
            neutral: { pitch: 1.0, speed: 1.0 }
        };
        return voiceParams[this.currentMood];
    }

    async loadConversationHistory() {
        try {
            console.log('Loading conversation history...');
            const history = await this.db.getRecentConversations(Config.nlp.maxHistoryItems || 20);
            await this.contextManager.loadHistory(history);
            console.log(`Loaded ${history.length} conversation items`);
        } catch (error) {
            console.error('Error loading conversation history:', error);
        }
    }

    async setPersonality(personality) {
        if (this.personalities[personality]) {
            this.personality = personality;
            await this.db.setItem('preferences', 'userSettings', { personality });
            return true;
        }
        return false;
    }

    async craftResponse(analysis, personality) {
        const { intent, sentiment, entities, context } = analysis;
        
        // Use Q&A model for general knowledge questions
        if (intent.label === 'question') {
            try {
                const answer = await this.qaModel({
                    question: analysis.originalText,
                    context: this.getRelevantContext(analysis.originalText)
                });
                if (answer.score > 0.7) {
                    return this.formatResponse(answer.answer, personality.responseStyle);
                }
            } catch (error) {
                console.error('Q&A model error:', error);
            }
        }

        // Fallback to sentiment-based response
        if (sentiment.label === 'POSITIVE') {
            return this.formatResponse("I'm glad you're feeling positive! How can I assist you further?", personality.responseStyle);
        } else if (sentiment.label === 'NEGATIVE') {
            return this.formatResponse("I understand this might be frustrating. Let me help you with that.", personality.responseStyle);
        }
        
        return this.formatResponse("I'm here to help. What would you like me to do?", personality.responseStyle);
    }

    formatResponse(text, style) {
        switch (style) {
            case 'casual':
                return text.replace(/\./g, '!').replace(/I am/g, "I'm");
            case 'humorous':
                return text + " 😊";
            case 'formal':
                return text.replace(/!+/g, '.').replace(/gonna/g, "going to");
            default:
                return text;
        }
    }

    addEmojis(text) {
        // Add relevant emojis based on content
        const emojiMap = {
            'help': '💪',
            'search': '🔍',
            'reminder': '⏰',
            'good': '👍',
            'great': '🎉',
            'happy': '😊',
            'sad': '😢',
            'thanks': '🙏'
        };

        Object.keys(emojiMap).forEach(key => {
            if (text.toLowerCase().includes(key)) {
                text += ` ${emojiMap[key]}`;
            }
        });

        return text;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Your initialization code here
});

export const nlpService = new NLPService();