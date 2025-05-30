class Database {
    constructor() {
        this.db = null;
        this.stores = {
            conversations: 'conversations',
            tasks: 'tasks',
            reminders: 'reminders',
            preferences: 'preferences',
            moodLogs: 'moodLogs',
            mediaLibrary: 'mediaLibrary',
            calendar: 'calendar'
        };
        this.initialize();
    }

    async initialize() {
        try {
            this.db = await this.openDatabase();
            console.log('Database initialized successfully');
        } catch (error) {
            console.error('Database initialization failed:', error);
        }
    }

    async openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('JarvisDB', 2);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create stores with indexes
                if (!db.objectStoreNames.contains(this.stores.conversations)) {
                    const conversationStore = db.createObjectStore(this.stores.conversations, { keyPath: 'timestamp' });
                    conversationStore.createIndex('sentiment', 'sentiment.label');
                }

                if (!db.objectStoreNames.contains(this.stores.tasks)) {
                    const taskStore = db.createObjectStore(this.stores.tasks, { keyPath: 'id', autoIncrement: true });
                    taskStore.createIndex('priority', 'priority');
                    taskStore.createIndex('dueDate', 'dueDate');
                    taskStore.createIndex('completed', 'completed');
                }

                if (!db.objectStoreNames.contains(this.stores.reminders)) {
                    const reminderStore = db.createObjectStore(this.stores.reminders, { keyPath: 'id', autoIncrement: true });
                    reminderStore.createIndex('triggerTime', 'triggerTime');
                    reminderStore.createIndex('active', 'active');
                }

                if (!db.objectStoreNames.contains(this.stores.moodLogs)) {
                    const moodStore = db.createObjectStore(this.stores.moodLogs, { keyPath: 'timestamp' });
                    moodStore.createIndex('mood', 'mood');
                    moodStore.createIndex('date', 'date');
                }

                if (!db.objectStoreNames.contains(this.stores.preferences)) {
                    db.createObjectStore(this.stores.preferences, { keyPath: 'key' });
                }
            };
        });
    }

    // Task Management Methods
    async addTask({ title, description, priority, dueDate }) {
        return this.addItem(this.stores.tasks, {
            title,
            description,
            priority,
            dueDate,
            completed: false,
            createdAt: Date.now()
        });
    }

    async getUpcomingTasks() {
        const tasks = await this.getAllItems(this.stores.tasks);
        return tasks
            .filter(task => !task.completed)
            .sort((a, b) => a.dueDate - b.dueDate);
    }

    // Reminder Methods
    async scheduleReminder({ title, message, triggerTime }) {
        return this.addItem(this.stores.reminders, {
            title,
            message,
            triggerTime,
            active: true,
            createdAt: Date.now()
        });
    }

    async getActiveReminders() {
        const reminders = await this.getAllItems(this.stores.reminders);
        return reminders.filter(reminder => 
            reminder.active && reminder.triggerTime > Date.now()
        );
    }

    // Mood Tracking Methods
    async logMood({ mood, notes }) {
        const timestamp = Date.now();
        const date = new Date(timestamp).toISOString().split('T')[0];
        return this.addItem(this.stores.moodLogs, {
            mood,
            notes,
            timestamp,
            date
        });
    }

    async getMoodTrends(days = 7) {
        const logs = await this.getAllItems(this.stores.moodLogs);
        const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
        return logs
            .filter(log => log.timestamp > cutoff)
            .sort((a, b) => a.timestamp - b.timestamp);
    }

    // Generic Database Operations
    async addItem(storeName, item) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(item);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllItems(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Keep existing conversation methods
    async storeConversation(analysis) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.stores.conversations], 'readwrite');
            const store = transaction.objectStore(this.stores.conversations);
            const request = store.add(analysis);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getRecentConversations(limit = 10) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.stores.conversations], 'readonly');
            const store = transaction.objectStore(this.stores.conversations);
            const request = store.getAll();
            
            request.onsuccess = () => {
                const conversations = request.result;
                resolve(conversations.slice(-limit));
            };
            
            request.onerror = () => reject(request.error);
        });
    }
}

export { Database };