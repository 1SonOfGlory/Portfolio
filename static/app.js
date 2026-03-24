const recordBtn = document.getElementById('record-btn');
const sendBtn = document.getElementById('send-btn');
const textInput = document.getElementById('text-input');
const chatHistory = document.getElementById('chat-history');
const statusDiv = document.getElementById('status');

let mediaRecorder;
let audioChunks = [];

// --- ACTION: SCROLL ANIMATIONS ---
document.addEventListener('DOMContentLoaded', () => {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.fade-in-on-scroll');
    animatedElements.forEach(el => observer.observe(el));

    // Feature Tabs Interaction
    const featureItems = document.querySelectorAll('.feature-item');
    featureItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all
            featureItems.forEach(i => i.classList.remove('active'));
            // Add active to clicked
            item.classList.add('active');

            // Optional: You could switch the phone visual here based on data-target
            // const target = item.getAttribute('data-target');
            // updatePhoneVisual(target); 
        });
    });
});

// --- TEXT CHAT ---
sendBtn.addEventListener('click', sendTextMessage);
textInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendTextMessage();
});

async function sendTextMessage() {
    const text = textInput.value.trim();
    if (!text) return;

    addMessage('user', text);
    textInput.value = '';

    // Feature C: Handoff Demonstration Intercept
    if (text.toLowerCase().includes('angry') || text.toLowerCase().includes('human')) {
        setTimeout(() => {
            addMessage('agent', '<div style="color: var(--neon-red); font-weight: 600;"><i class="fa-solid fa-headset"></i> Semantic Handoff Initiated</div>Transferring to a human supervisor (Wait time: ~1 min)...');
            statusDiv.textContent = "";
        }, 600);
        return;
    }

    statusDiv.textContent = "Kasa AI is processing...";

    try {
        const formData = new FormData();
        formData.append('message', text);

        const response = await fetch('/chat', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        addMessage('agent', data.response);
        // Play audio if provided (optional for text chat, but nice)
        if (data.audio_url) {
            playAudio(data.audio_url);
        }
    } catch (err) {
        console.error(err);
        addMessage('agent', "Error connecting to server.");
    } finally {
        statusDiv.textContent = "";
    }
}

// --- VOICE RECORDING ---
recordBtn.addEventListener('mousedown', startRecording);
recordBtn.addEventListener('mouseup', stopRecording);
recordBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startRecording(); }); // Mobile
recordBtn.addEventListener('touchend', (e) => { e.preventDefault(); stopRecording(); }); // Mobile

async function startRecording() {
    statusDiv.textContent = "Listening...";
    recordBtn.classList.add('recording');
    audioChunks = [];

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            // Function wrapper to handle the stop event
            sendAudioToServer();
        };

        mediaRecorder.start();
    } catch (err) {
        console.error("Mic Error:", err);
        statusDiv.textContent = "Microphone access denied.";
        recordBtn.classList.remove('recording');
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        statusDiv.textContent = "Processing...";
        recordBtn.classList.remove('recording');
    }
}

async function sendAudioToServer() {
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    const formData = new FormData();
    formData.append("file", audioBlob, "recording.webm");

    try {
        // Optimistic UI - show waveform or listening state?
        // For now, simple message

        const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.transcription) {
            addMessage('user', data.transcription);

            // Feature C: Handoff Demonstration for Voice
            if (data.transcription.toLowerCase().includes('angry') || data.transcription.toLowerCase().includes('human')) {
                addMessage('agent', '<div style="color: var(--neon-red); font-weight: 600;"><i class="fa-solid fa-headset"></i> Semantic Handoff Initiated</div>Transferring to a human supervisor (Wait time: ~1 min)...');
                statusDiv.textContent = "";
                if (data.audio_url) {
                    // Ideally we play a special audio here, but we just skip the AI response.
                }
                return;
            }
        }

        addMessage('agent', data.response);

        if (data.audio_url) {
            playAudio(data.audio_url);
        }

    } catch (err) {
        console.error(err);
        statusDiv.textContent = "Error processing audio.";
    } finally {
        statusDiv.textContent = "";
    }
}

function addMessage(role, text) {
    const div = document.createElement('div');
    div.className = `message ${role}`;

    // Updated HTML structure for messages
    if (role === 'agent') {
        div.innerHTML = `
            <div class="avatar"><i class="fa-solid fa-cube"></i></div>
            <div class="text">${text}</div>
        `;
    } else {
        div.innerHTML = `
            <div class="text">${text}</div>
            <div class="avatar"><i class="fa-solid fa-user"></i></div>
        `;
    }

    chatHistory.appendChild(div);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function playAudio(url) {
    const audio = new Audio(url);
    audio.play();
}

// --- FEATURE A: USSD SIMULATOR ---
const ussdInput = document.getElementById('ussd-input-val');
const ussdSendBtn = document.getElementById('ussd-send-btn');
const ussdDisplay = document.getElementById('ussd-display');

if (ussdInput && ussdSendBtn && ussdDisplay) {
    let ussdState = 'start';

    ussdSendBtn.addEventListener('click', handleUssdInput);
    ussdInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleUssdInput();
    });

    function handleUssdInput() {
        const val = ussdInput.value.trim().toLowerCase();
        if (!val) return;
        ussdInput.value = '';

        if (val === '*901#') {
            ussdState = 'menu';
            ussdDisplay.innerText = "Welcome to Kasa Bank\n\n1. Check Balance\n2. Transfer\n3. Talk to Kasa AI\n4. Reset PIN";
        } else if (ussdState === 'menu') {
            if (val === '3') {
                ussdState = 'ai';
                ussdDisplay.innerText = "Kasa AI Active. We work completely offline via USSD.\n\nType your issue briefly:";
            } else if (['1', '2', '4'].includes(val)) {
                ussdDisplay.innerText = "Standard service unavailable in demo.\n\n0. Back";
                ussdState = 'error';
            } else {
                ussdDisplay.innerText = "Invalid option.\n\n0. Back";
                ussdState = 'error';
            }
        } else if (ussdState === 'error' && val === '0') {
            ussdState = 'menu';
            ussdDisplay.innerText = "Welcome to Kasa Bank\n\n1. Check Balance\n2. Transfer\n3. Talk to Kasa AI\n4. Reset PIN";
        } else if (ussdState === 'ai') {
            ussdDisplay.innerText = `Processing via Kasa AI...\n\nResult:\nQuery: "${val}"\nResolution: Issue tracked and mapped to account successfully. Reference: K-293\n\n0. Main Menu`;
            ussdState = 'error';
        } else {
            ussdDisplay.innerText = "Unknown command or session expired.\n\nDial *901# to start.";
            ussdState = 'start';
        }
    }
}

