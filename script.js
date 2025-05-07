// Wait for the DOM to fully load
document.addEventListener("DOMContentLoaded", function () {

    const startBtn = document.getElementById('start-btn');
    const responseText = document.getElementById('response-text');
    const waveform = document.getElementById('waveform');

    let isListening = false;

    // Jarvis Responses
    const jarvisResponses = {
        greeting: ['Hey, hi there! I’m Jarvis, your personal assistant. How can I help today?', 'Hello, friend! What can I do for you today?', 'Greetings! Jarvis at your service, how can I assist you?'],
        help: ['I can help you with lots of things. Just ask me to open apps, tell you the weather, set reminders, and more!', 'Need help? Just let me know what you want to do, and I’ll take care of it!'],
        thanks: ['You’re welcome! I’m always here to assist you.', 'Anytime, my friend. Just let me know if you need anything else!'],
        goodbye: ['Goodbye! Talk to you later.', 'See you soon! Let me know if you need anything.'],
        default: ['I’m sorry, I didn’t quite catch that. Could you please repeat?']
    };

    // Function to start listening for commands
    function startListening() {
        if (isListening) {
            console.log("Already listening...");
            return;
        }

        isListening = true;
        responseText.textContent = 'Listening...';

        // Simulate waveform animation when Jarvis is listening
        waveform.style.animationPlayState = "running";
        
        // Simulate speech recognition (for demo purposes, we'll use setTimeout)
        setTimeout(() => {
            // Random response for demo
            let userCommand = Math.random() < 0.5 ? 'help' : 'greeting';
            processCommand(userCommand);
        }, 3000);
    }

    // Function to process commands
    function processCommand(command) {
        let response = '';
        
        switch (command) {
            case 'greeting':
                response = jarvisResponses.greeting[Math.floor(Math.random() * jarvisResponses.greeting.length)];
                break;
            case 'help':
                response = jarvisResponses.help[Math.floor(Math.random() * jarvisResponses.help.length)];
                break;
            case 'thanks':
                response = jarvisResponses.thanks[Math.floor(Math.random() * jarvisResponses.thanks.length)];
                break;
            case 'goodbye':
                response = jarvisResponses.goodbye[Math.floor(Math.random() * jarvisResponses.goodbye.length)];
                break;
            default:
                response = jarvisResponses.default[0];
                break;
        }

        // Show response after processing command
        responseText.textContent = response;

        // Stop the waveform animation after response
        waveform.style.animationPlayState = "paused";
        isListening = false;
    }

    // Button click event to start listening for Jarvis
    startBtn.addEventListener('click', function () {
        startListening();
    });
});
