const API_BASE = '/api/v1/parking';

// Elements
const countSmall = document.getElementById('count-small');
const countMedium = document.getElementById('count-medium');
const countLarge = document.getElementById('count-large');

const tabs = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

const ciForm = document.getElementById('form-checkin');
const ciResult = document.getElementById('ci-result');
const coForm = document.getElementById('form-checkout');
const coResult = document.getElementById('co-result');

const chatWindow = document.getElementById('chat-window');
const aiForm = document.getElementById('form-ai');
const aiQuery = document.getElementById('ai-query');

let chatHistory = [];

// Fetch Availability
async function fetchAvailability() {
    try {
        const res = await fetch(`${API_BASE}/availability`);
        const data = await res.json();
        
        countSmall.textContent = data.SMALL || 0;
        countMedium.textContent = data.MEDIUM || 0;
        countLarge.textContent = data.LARGE || 0;
    } catch (e) {
        console.error('Failed to fetch availability');
    }
}

// Tab Switching
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        tab.classList.add('active');
        document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
    });
});

// Check-In
ciForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const plate = document.getElementById('ci-plate').value;
    const type = document.getElementById('ci-type').value;
    
    ciResult.className = 'result-message'; // reset
    ciResult.textContent = 'Processing...';
    ciResult.style.display = 'block';

    try {
        const res = await fetch(`${API_BASE}/check-in`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ license_plate: plate, vehicle_type: type })
        });
        const data = await res.json();
        
        if (res.ok) {
            ciResult.className = 'result success';
            ciResult.innerHTML = `<strong>Success!</strong><br><br>Spot allocated: <strong>${data.spot}</strong><br><br>Ticket ID: <code>${data.ticket_id}</code><br><br><em>Save this Ticket ID for checkout!</em>`;
            ciResult.style.display = 'block';
            fetchAvailability();
        } else {
            ciResult.className = 'result-message error';
            ciResult.textContent = data.error || 'Failed to check in';
        }
    } catch (err) {
        ciResult.className = 'result-message error';
        ciResult.textContent = 'Network error occurred.';
    }
});

// Check-Out
coForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const ticket = document.getElementById('co-ticket').value;
    
    coResult.className = 'result-message'; // reset
    coResult.textContent = 'Processing...';
    coResult.style.display = 'block';

    try {
        const res = await fetch(`${API_BASE}/check-out`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticket_id: ticket })
        });
        const data = await res.json();
        
        if (res.ok) {
            coResult.className = 'result-message success';
            coResult.innerHTML = `<strong>Checkout Complete!</strong><br>Plate: ${data.license_plate}<br>Duration: ${data.duration_minutes.toFixed(0)} mins<br>Total Fee: ₹${data.fee.toFixed(2)}`;
            coForm.reset();
            fetchAvailability();
        } else {
            coResult.className = 'result-message error';
            coResult.textContent = data.error || 'Failed to check out';
        }
    } catch (err) {
        coResult.className = 'result-message error';
        coResult.textContent = 'Network error occurred.';
    }
});

// AI Assistant
aiForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = aiQuery.value;
    if (!query) return;

    // Append user message
    appendMessage(query, 'user');
    aiQuery.value = '';

    // Append typing indicator
    const typingId = appendMessage('...', 'ai');

    try {
        const res = await fetch(`${API_BASE}/assistant`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, history: chatHistory })
        });
        const data = await res.json();
        
        const el = document.getElementById(typingId);
        if (res.ok) {
            el.innerHTML = data.answer.replace(/\n/g, '<br>');
            chatHistory.push({ role: 'user', content: query });
            chatHistory.push({ role: 'assistant', content: data.answer });
        } else {
            el.textContent = 'Oops, something went wrong communicating with Groq AI.';
            el.style.color = '#ef4444';
        }
    } catch (err) {
        document.getElementById(typingId).textContent = 'Network error.';
    }
});

function appendMessage(text, role) {
    const id = 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const div = document.createElement('div');
    div.className = `message ${role}`;
    div.id = id;
    div.textContent = text;
    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    return id;
}

// Initial Fetch
fetchAvailability();
// Refresh availability every 5 seconds
setInterval(fetchAvailability, 5000);
