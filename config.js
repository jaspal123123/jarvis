export const Config = {
    defaultPersonality: {
        name: 'Jarvis',
        tone: 'professional',
        language: 'en',
        formality: 'formal'
    },
    personalities: {
        friendly: {
            greetings: [
                "Hey buddy! Jarvis at your service, how can I make your day awesome?",
                "Hi there! Ready to tackle anything you throw my way!",
                "Hello friend! What exciting things shall we do today?"
            ],
            responseStyle: 'casual',
            emojis: true,
            pitch: 1.1,
            speed: 1.05,
            color: '#4287f5'
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
            speed: 1.1,
            color: '#f542a7'
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
            speed: 0.95,
            color: '#3a3a3a'
        },
        professional: {
            greetings: [
                "Jarvis at your service. How may I assist you professionally today?",
                "Professional mode activated. How can I help you with your work?",
                "Ready to assist with your professional needs. What can I do for you?"
            ],
            responseStyle: 'business',
            emojis: false,
            pitch: 1.0,
            speed: 1.0,
            color: '#2c3e50'
        }
    },
    nlp: {
        models: {
            sentiment: 'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
            classification: 'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
            whisper: 'Xenova/whisper-small',
            qa: 'Xenova/distilbert-base-cased-distilled-squad'
        },
        contextWindowSize: 10,
        selfLearningEnabled: true
    },
    voice: {
        wakeWord: 'jarvis',
        wakeWordModel: 'vosk-model-small-en-us',
        defaultVoice: 'en-US',
        defaultRate: 1.0,
        defaultPitch: 1.0,
        wakeWordSensitivity: 0.7,
        greetingResponses: [
            "Hey buddy, what can I do for you today?",
            "Yo! Jarvis here, always ready to roll!",
            "Hey there! How can I help you right now?",
            "Jarvis at your service! What's on your mind?",
            "Hello! I'm all ears, what do you need?"
        ]
    },
    tasks: {
        reminderCheckInterval: 60000, // 1 minute
        priorityLevels: ['low', 'medium', 'high', 'urgent'],
        defaultPriority: 'medium',
        maxTasksPerList: 100
    },
    media: {
        supportedFormats: ['mp3', 'wav', 'ogg', 'mp4', 'webm'],
        defaultVolume: 0.7,
        playlistFolder: 'playlists',
        cacheSize: 500 // MB
    },
    fileManager: {
        allowedOperations: ['open', 'list', 'search', 'delete'],
        rootFolders: ['downloads', 'documents', 'music', 'pictures', 'videos'],
        tempFolder: 'temp'
    },
    email: {
        checkInterval: 300000, // 5 minutes
        maxCachedEmails: 100,
        summaryLength: 'medium' // short, medium, long
    },
    security: {
        encryptionEnabled: true,
        encryptionAlgorithm: 'AES-GCM',
        voiceAuthEnabled: false,
        privacyMode: 'strict' // relaxed, moderate, strict
    },
    ui: {
        theme: 'dark', // light, dark, auto
        animationsEnabled: true,
        terminalMaxLines: 100,
        waveformSensitivity: 1.0,
        notificationDuration: 5000 // ms
    },
    system: {
        developerMode: false,
        logLevel: 'info', // debug, info, warn, error
        offlineOnly: true,
        autoStart: true,
        startMinimized: false
    },
    knowledgeBase: {
        indexingChunkSize: 1000,
        maxFileSize: 50, // MB
        supportedFormats: ['pdf', 'txt', 'md', 'epub', 'html']
    }
};