class NLPService {
    constructor() {
        this.pipeline = null;
        this.sentimentAnalyzer = null;
        this.initialize();
    }

    async initialize() {
        try {
            // Initialize the pipeline for intent classification
            this.pipeline = await pipeline('text-classification', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
            
            // Initialize sentiment analyzer
            this.sentimentAnalyzer = await pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
        } catch (error) {
            console.error('Error initializing NLP models:', error);
        }
    }

    async analyzeInput(text) {
        try {
            // Analyze intent
            const intent = await this.classifyIntent(text);
            
            // Analyze sentiment
            const sentiment = await this.analyzeSentiment(text);

            return {
                intent,
                sentiment,
                originalText: text
            };
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
        // Basic response generation based on intent and sentiment
        const { intent, sentiment, originalText } = analysis;
        
        let response = '';
        
        // Adjust response based on sentiment
        if (sentiment.label === 'POSITIVE') {
            response += "I sense you're feeling positive! ";
        } else {
            response += "I understand this might be concerning. ";
        }

        // Add intent-based response
        if (intent.label.includes('question')) {
            response += "Let me help you find an answer. ";
        } else if (intent.label.includes('command')) {
            response += "I'll help you with that task. ";
        }

        return response + "How else can I assist you?";
    }
}

export const nlpService = new NLPService();