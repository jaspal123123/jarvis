const startBtn = document.getElementById('start-btn');
const speechDisplay = document.getElementById('speech-display');
const personality = document.getElementById('personality-animation');
const wakeWordAnim = document.getElementById('wake-word-animation');
const remindersDiv = document.getElementById('reminders');
const emailArea = document.getElementById('email-area');
const ytContainer = document.getElementById('youtube-player-container');
const ytPlayer = document.getElementById('youtube-player');
const ytPlay = document.getElementById('yt-play');
const ytPause = document.getElementById('yt-pause');
const ytClose = document.getElementById('yt-close');

let recognition;
let listening = false;
let greeted = false;
let lastTranscript = '';
let synth = window.speechSynthesis;
let speaking = false;
let personalityMode = localStorage.getItem('jarvisPersonality') || 'friendly';
let reminders = JSON.parse(localStorage.getItem('jarvisReminders') || '[]');
let emails = [
  {from: 'Alice', subject: 'Meeting Reminder', body: 'Don\'t forget our meeting at 3pm.'},
  {from: 'Bob', subject: 'Lunch?', body: 'Want to grab lunch tomorrow?'},
  {from: 'System', subject: 'Welcome!', body: 'This is your Jarvis email simulation.'}
];

function speak(text) {
  if (synth.speaking) synth.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1.05;
  utter.pitch = 1.1;
  utter.onstart = () => { speaking = true; };
  utter.onend = () => { speaking = false; };
  synth.speak(utter);
}

function personalityReply(text) {
  if (personalityMode === 'friendly') return text + ' 😊';
  if (personalityMode === 'funny') return text + ' 😄 (Just kidding!)';
  if (personalityMode === 'serious') return 'Certainly. ' + text;
  return text;
}

function setPersonality(mode) {
  personalityMode = mode;
  localStorage.setItem('jarvisPersonality', mode);
}

function showWakeWordAnim() {
  wakeWordAnim.innerHTML = '<div class="dot"></div>';
  wakeWordAnim.style.display = 'flex';
  setTimeout(() => { wakeWordAnim.style.display = 'none'; }, 2000);
}

function showReminders() {
  if (reminders.length === 0) {
    remindersDiv.classList.remove('active');
    remindersDiv.innerHTML = '';
    return;
  }
  remindersDiv.classList.add('active');
  remindersDiv.innerHTML = '<b>Reminders:</b><ul>' + reminders.map(r => `<li>${r.time} - ${r.task}</li>`).join('') + '</ul>';
}

function addReminder(task, time) {
  reminders.push({task, time});
  localStorage.setItem('jarvisReminders', JSON.stringify(reminders));
  showReminders();
}

function checkReminders() {
  const now = new Date();
  const nowStr = now.toTimeString().slice(0,5);
  reminders = reminders.filter(r => {
    if (r.time === nowStr) {
      const msg = `Reminder: ${r.task}`;
      speechDisplay.textContent = msg;
      speak(personalityReply(msg));
      return false;
    }
    return true;
  });
  localStorage.setItem('jarvisReminders', JSON.stringify(reminders));
  showReminders();
}
setInterval(checkReminders, 60000);
showReminders();

function showEmails() {
  emailArea.style.display = 'block';
  emailArea.innerHTML = '<b>Inbox:</b><ul>' + emails.map(e => `<li><b>${e.from}:</b> <i>${e.subject}</i><br>${e.body}</li>`).join('') + '</ul>';
}

function sendEmail(to, message) {
  emails.push({from: 'You', subject: `To ${to}`, body: message});
  emailArea.style.display = 'block';
  emailArea.innerHTML = `<b>Email sent to ${to}:</b><br>${message}`;
  setTimeout(showEmails, 2000);
}

function handleIntent(transcript) {
  const lower = transcript.toLowerCase();
  // Wake word
  if (/\bjarvis\b/.test(lower)) {
    showWakeWordAnim();
    const reply = personalityReply("Hey there! I'm awake. What can I do for you today?");
    speechDisplay.textContent = reply;
    speak(reply);
    return true;
  }
  // Personality mode
  if (lower.includes('be funny') || lower.includes('funny mode')) {
    setPersonality('funny');
    const reply = 'Switching to funny mode! Ready for some laughs.';
    speechDisplay.textContent = reply;
    speak(reply);
    return true;
  }
  if (lower.includes('be friendly') || lower.includes('friendly mode')) {
    setPersonality('friendly');
    const reply = 'Back to friendly mode! 😊';
    speechDisplay.textContent = reply;
    speak(reply);
    return true;
  }
  if (lower.includes('be serious') || lower.includes('serious mode')) {
    setPersonality('serious');
    const reply = 'Serious mode activated.';
    speechDisplay.textContent = reply;
    speak(reply);
    return true;
  }
  // Web search
  let m;
  if ((m = lower.match(/^search (.+)/))) {
    const q = encodeURIComponent(m[1]);
    const reply = personalityReply(`Searching Google for ${m[1]}`);
    speechDisplay.textContent = reply;
    speak(reply);
    window.open(`https://www.google.com/search?q=${q}`,'_blank');
    return true;
  }
  if ((m = lower.match(/^download pdf about (.+)/))) {
    const q = encodeURIComponent(m[1] + ' filetype:pdf');
    const reply = personalityReply(`Looking for PDFs about ${m[1]}`);
    speechDisplay.textContent = reply;
    speak(reply);
    window.open(`https://www.google.com/search?q=${q}`,'_blank');
    return true;
  }
  if ((m = lower.match(/^what is (.+)/))) {
    const term = m[1];
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`)
      .then(r => r.json())
      .then(data => {
        let desc = data.extract || `Sorry, I couldn't find information about ${term}.`;
        desc = personalityReply(desc);
        speechDisplay.textContent = desc;
        speak(desc);
      });
    return true;
  }
  // YouTube/music
  if ((m = lower.match(/^play (.+) on youtube/))) {
    const song = m[1];
    const reply = personalityReply(`Playing ${song} on YouTube.`);
    speechDisplay.textContent = reply;
    speak(reply);
    // Embed video
    ytContainer.style.display = 'block';
    emailArea.style.display = 'none';
    const q = encodeURIComponent(song);
    ytPlayer.src = `https://www.youtube.com/embed?listType=search&list=${q}&autoplay=1`;
    return true;
  }
  if (lower.includes('pause music') || lower.includes('stop video')) {
    ytPlayer.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
    const reply = personalityReply('Paused the video.');
    speechDisplay.textContent = reply;
    speak(reply);
    return true;
  }
  if (lower.includes('resume music') || lower.includes('play video')) {
    ytPlayer.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
    const reply = personalityReply('Resumed the video.');
    speechDisplay.textContent = reply;
    speak(reply);
    return true;
  }
  // Reminders
  if ((m = lower.match(/^remind me to (.+) at (\d{1,2}:\d{2})/))) {
    const task = m[1];
    const time = m[2];
    addReminder(task, time);
    const reply = personalityReply(`Reminder set for ${time}: ${task}`);
    speechDisplay.textContent = reply;
    speak(reply);
    return true;
  }
  // Email
  if (lower.includes('read my emails')) {
    showEmails();
    const reply = personalityReply('Here are your latest emails.');
    speechDisplay.textContent = reply;
    speak(reply);
    return true;
  }
  if ((m = lower.match(/^send an email to (.+) saying (.+)/))) {
    const to = m[1];
    const msg = m[2];
    sendEmail(to, msg);
    const reply = personalityReply(`Email sent to ${to}.`);
    speechDisplay.textContent = reply;
    speak(reply);
    return true;
  }
  // Time, YouTube, Joke (fallbacks)
  if (lower.includes("what's the time") || lower.includes("what is the time")) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const reply = personalityReply(`It's ${timeStr}.`);
    speechDisplay.textContent = reply;
    speak(reply);
    return true;
  } else if (lower.includes("open youtube")) {
    const reply = personalityReply("Opening YouTube.");
    speechDisplay.textContent = reply;
    speak(reply);
    window.open('https://www.youtube.com', '_blank');
    return true;
  } else if (lower.includes("tell me a joke")) {
    const jokes = [
      "Why did the computer go to the doctor? Because it had a virus!",
      "Why do programmers prefer dark mode? Because light attracts bugs!",
      "Why was the math book sad? Because it had too many problems.",
      "Why did the robot go on vacation? To recharge its batteries!"
    ];
    let joke = jokes[Math.floor(Math.random() * jokes.length)];
    if (personalityMode === 'funny') joke += ' 😂';
    speechDisplay.textContent = joke;
    speak(joke);
    return true;
  }
  if (lower.includes("search")) {
    const query = lower.replace("search", "").trim();
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
    return true;
  }
  if (lower.includes("open twitter")) {
    window.open("https://twitter.com", "_blank");
    return true;
  }
  if (lower.includes("set timer for")) {
    // Parse time, setTimeout, and alert when done
  }
  if (lower.includes("play music")) {
    window.open("https://open.spotify.com/playlist/your_playlist_id", "_blank");
    return true;
  }
  return false;
}

// YouTube controls
if (ytPlay && ytPause && ytClose) {
  ytPlay.onclick = () => {
    ytPlayer.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
  };
  ytPause.onclick = () => {
    ytPlayer.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
  };
  ytClose.onclick = () => {
    ytContainer.style.display = 'none';
    ytPlayer.src = '';
  };
}

// Speech recognition
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onstart = () => {
    listening = true;
    startBtn.textContent = 'Listening...';
    personality.classList.add('listening');
    greeted = false;
    lastTranscript = '';
  };

  recognition.onend = () => {
    listening = false;
    startBtn.textContent = 'Start Listening';
    personality.classList.remove('listening');
  };

  recognition.onerror = (event) => {
    listening = false;
    startBtn.textContent = 'Start Listening';
    personality.classList.remove('listening');
    speechDisplay.textContent = 'Error: ' + event.error;
  };

  recognition.onresult = (event) => {
    let transcript = '';
    let isFinal = false;
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      transcript += event.results[i][0].transcript;
      if (event.results[i].isFinal) isFinal = true;
    }
    transcript = transcript.trim();
    if (transcript) {
      speechDisplay.textContent = transcript;
      lastTranscript = transcript;
    }
    if (!greeted && transcript.length > 0 && isFinal) {
      greeted = true;
      setTimeout(() => {
        const greeting = personalityReply("Hey buddy! I'm Jarvis — your virtual assistant. How can I help you today?");
        speechDisplay.textContent = greeting;
        speak(greeting);
      }, 400);
    } else if (greeted && isFinal && transcript.length > 0) {
      setTimeout(() => {
        handleIntent(transcript);
      }, 400);
    }
  };

  startBtn.addEventListener('click', () => {
    if (!listening) {
      speechDisplay.textContent = 'Listening...';
      recognition.start();
    } else {
      recognition.stop();
    }
  });
} else {
  startBtn.disabled = true;
  speechDisplay.textContent = 'Speech recognition not supported.';
}

// Animate the personality when listening
const style = document.createElement('style');
style.innerHTML = `
.personality-animation.listening::before {
  animation: pulse 0.6s infinite cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 48px 16px #00ffe799, 0 0 96px 32px #007cf099;
}
`;
document.head.appendChild(style);

// Example: Simulated smart response
function smartReply(input) {
  if (input.includes("how are you")) return "I'm just code, but I'm feeling electric!";
  if (input.includes("your creator")) return "I was created by a brilliant human (that's you!)";
  // ...add more
  return null; // fallback to default
}

const greetings = [
  "Hey there! I'm Jarvis, how can I help you today?",
  "Hello friend! Ready to explore?",
  "Yo! Your personal assistant is live.",
];
// Use: speak(greetings[Math.floor(Math.random() * greetings.length)]); 

function downloadPDF(url) {
  const a = document.createElement('a');
  a.href = url;
  a.download = '';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function saveTextFile(filename, content) {
  const blob = new Blob([content], {type: 'text/plain'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

function typeEffect(element, text, speed=50) {
  let i = 0;
  element.textContent = '';
  const interval = setInterval(() => {
    element.textContent += text[i++];
    if (i >= text.length) clearInterval(interval);
  }, speed);
} 