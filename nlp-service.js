import { Database } from './storage/db.js';
import { VoiceProcessor } from './voice/voice-processor.js';
import { Config } from './config.js';
import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.5.0';

class NLPService {
    constructor() {
        this.pipeline = null;
        this.sentimentAnalyzer = null;
        this.contextMemory = [];
        this.db = new Database();
        this.voiceProcessor = new VoiceProcessor();
        this.currentMood = 'neutral';
        this.personality = Config.defaultPersonality;
        this.qaModel = null;
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
            // Initialize offline models
            this.pipeline = await pipeline('text-classification', Config.nlp.models.classification);
            this.sentimentAnalyzer = await pipeline('sentiment-analysis', Config.nlp.models.sentiment);
            
            // Initialize Q&A model
            this.qaModel = await pipeline('question-answering', 'Xenova/distilbert-base-cased-distilled-squad');
            
            // Load conversation history
            await this.loadConversationHistory();
            
            // Initialize wake word detector
            await this.voiceProcessor.initializeWakeWordDetector();
            
            console.log('NLP Service initialized successfully');
        } catch (error) {
            console.error('Error initializing NLP models:', error);
            throw error; // Propagate the error for proper handling
        }
    }

    async analyzeInput(text) {
        try {
            // First, check for commands
            const commandResult = await this.processCommand(text);
            if (commandResult) {
                return {
                    type: 'command',
                    result: commandResult,
                    timestamp: Date.now(),
                    originalText: text
                };
            }

            const analysis = {
                intent: await this.classifyIntent(text),
                sentiment: await this.analyzeSentiment(text),
                entities: await this.extractEntities(text),
                context: this.getCurrentContext(),
                timestamp: Date.now(),
                originalText: text
            };

            // Store conversation in memory and database
            this.updateContext(analysis);
            await this.db.storeConversation(analysis);

            return analysis;
        } catch (error) {
            console.error('Error analyzing input:', error);
            return null;
        }
    }

    async classifyIntent(text) {
        const result = await this.pipeline(text);
        return result[0];
    }

    async analyzeSentiment(text) {
        const result = await this.sentimentAnalyzer(text);
        return result[0];
    }

    async processCommand(text) {
        const lowerText = text.toLowerCase();
        
        // Check for system commands
        if (lowerText.includes('set personality to')) {
            const personality = lowerText.split('set personality to')[1].trim();
            if (this.personalities[personality]) {
                this.currentPersonality = personality;
                return {
                    action: 'setPersonality',
                    value: personality,
                    response: `Personality switched to ${personality} mode.`
                };
            }
        }
        
        // Check for task-related commands
        if (lowerText.includes('remind me to')) {
            const reminder = lowerText.split('remind me to')[1].trim();
            // Extract time if present
            const timeMatch = reminder.match(/in (\d+) (minutes?|hours?|days?)/);
            let triggerTime = Date.now();
            if (timeMatch) {
                const [_, amount, unit] = timeMatch;
                const multiplier = unit.startsWith('minute') ? 60000 :
                                 unit.startsWith('hour') ? 3600000 :
                                 unit.startsWith('day') ? 86400000 : 0;
                triggerTime += amount * multiplier;
            }
            
            await this.db.scheduleReminder({
                title: 'Reminder',
                message: reminder,
                triggerTime
            });
            
            return {
                action: 'setReminder',
                value: reminder,
                response: `I'll remind you to ${reminder}`
            };
        }
        
        // Check for web-related commands
        if (lowerText.includes('search for')) {
            const query = lowerText.split('search for')[1].trim();
            const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
            return {
                action: 'search',
                value: searchUrl,
                response: `Searching for "${query}" on DuckDuckGo.`
            };
        }
        
        return null;
    }

    async generateResponse(analysis) {
        const { type, result } = analysis;
        
        // Handle command responses
        if (type === 'command') {
            return {
                text: result.response,
                mood: 'professional',
                animation: 'process',
                voice: this.getVoiceModulation()
            };
        }
        
        // Handle conversation responses
        const personality = this.personalities[this.currentPersonality];
        const response = {
            text: await this.craftResponse(analysis, personality),
            mood: this.determineResponseMood(analysis.sentiment),
            animation: this.getAppropriateAnimation(),
            voice: this.getVoiceModulation()
        };

        if (personality.emojis) {
            response.text = this.addEmojis(response.text);
        }

        return response;
    }

    determineResponseMood(sentiment) {
        if (sentiment.label === 'POSITIVE' && sentiment.score > 0.8) {
            return 'excited';
        } else if (sentiment.label === 'NEGATIVE' && sentiment.score > 0.8) {
            return 'empathetic';
        }
        return 'neutral';
    }

    getAppropriateAnimation() {
        const animations = {
            excited: 'bounce',
            empathetic: 'nod',
            neutral: 'idle',
            thinking: 'process'
        };
        return animations[this.currentMood];
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
        const history = await this.db.getRecentConversations(10);
        this.contextMemory = history;
    }

    getCurrentContext() {
        return this.contextMemory.slice(-5);
    }

    updateContext(analysis) {
        this.contextMemory.push(analysis);
        if (this.contextMemory.length > 20) {
            this.contextMemory.shift();
        }
    }

    async extractEntities(text) {
        // Entity recognition for names, dates, locations, etc.
        const entities = await this.pipeline(text, { task: 'ner' });
        return entities;
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

export const nlpService = new NLPService();