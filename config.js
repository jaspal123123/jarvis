export const Config = {
    defaultPersonality: {
        name: 'Jarvis',
        tone: 'professional',
        language: 'en',
        formality: 'formal'
    },
    nlp: {
        models: {
            sentiment: 'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
            classification: 'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
        }
    },
    voice: {
        wakeWord: 'jarvis',
        defaultVoice: 'en-US',
        defaultRate: 1.0,
        defaultPitch: 1.0
    }
};