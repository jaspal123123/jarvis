import { Database } from './storage/db.js';
import { VoiceProcessor } from './voice/voice-processor.js';
import { Config } from './config.js';

class NLPService {
    constructor() {
        this.pipeline = null;
        this.sentimentAnalyzer = null;
        this.contextMemory = [];
        this.db = new Database();
        this.voiceProcessor = new VoiceProcessor();
        this.currentMood = 'neutral';
        this.personality = Config.defaultPersonality;
        this.initialize();
    }

    async initialize() {
        try {
            // Initialize offline models
            this.pipeline = await pipeline('text-classification', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
            this.sentimentAnalyzer = await pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
            
            // Load conversation history
            await this.loadConversationHistory();
            
            // Initialize wake word detector
            await this.voiceProcessor.initializeWakeWordDetector();
        } catch (error) {
            console.error('Error initializing NLP models:', error);
        }
    }

    async analyzeInput(text) {
        try {
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

    async generateResponse(analysis) {
        const { intent, sentiment, entities, context } = analysis;
        
        // Update AI mood based on user's emotional state
        this.currentMood = this.determineResponseMood(sentiment);
        
        // Generate contextually aware response
        const response = {
            text: await this.craftResponse(intent, sentiment, entities, context),
            mood: this.currentMood,
            animation: this.getAppropriateAnimation(),
            voice: this.getVoiceModulation()
        };

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
}

export const nlpService = new NLPService();