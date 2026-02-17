
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '/login.html';
}

const socket = io({
    auth: {
        token: token
    }
});

const statusSpan = document.getElementById('connection-status');
const qrCodeDiv = document.getElementById('qrcode');
const userInfoDiv = document.getElementById('user-info');
const waNameSpan = document.getElementById('wa-name');
const waNumberSpan = document.getElementById('wa-number');
const waLogoutBtn = document.getElementById('wa-logout-btn');
const logoutBtn = document.getElementById('logout-btn');
const apiKeyDisplay = document.getElementById('api-key-display');
const qrLoading = document.getElementById('qr-loading');

// Display API Key (Token for now, ideally strictly API Key)
// In a real app, you'd fetch a separate API Key. Here using JWT for simplicity or fetch profile.
apiKeyDisplay.innerText = token.substring(0, 12) + '...';

const copyTokenBtn = document.getElementById('copy-token-btn');
const copyToast = document.getElementById('copy-toast');

copyTokenBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(token).then(() => {
        // Show feedback
        copyToast.classList.remove('opacity-0');
        setTimeout(() => {
            copyToast.classList.add('opacity-0');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}); 

socket.on('connect', () => {
    console.log('Connected to server via Socket.io');
});

socket.on('connect_error', (err) => {
    console.error('Connection Error:', err.message);
    if(err.message === "Authentication error") {
        alert("Session expired. Please login again.");
        window.location.href = '/login.html';
    }
});

socket.on('wa_status', (data) => {
    console.log('WA Status:', data);
    updateStatus(data.status);
    
    if (data.status === 'connected' && data.user) {
        qrCodeDiv.innerHTML = '';
        userInfoDiv.classList.remove('hidden');
        waNameSpan.innerText = data.user.name || 'User';
        waNumberSpan.innerText = data.user.id || 'Unknown';
        qrLoading.classList.add('hidden');
    } else if (data.status === 'scan_qr') {
        userInfoDiv.classList.add('hidden');
        // qrCodeDiv handled in wa_qr event
    } else {
        userInfoDiv.classList.add('hidden');
        qrCodeDiv.innerHTML = '';
        qrLoading.classList.add('hidden');
    }
});

socket.on('wa_qr', (qr) => {
    console.log('QR Received');
    updateStatus('scan_qr');
    qrLoading.classList.add('hidden');
    QRCode.toCanvas(qr, { margin: 2, scale: 6 }, function (err, canvas) {
        if (err) return console.error(err);
        qrCodeDiv.innerHTML = '';
        qrCodeDiv.appendChild(canvas);
    });
});

socket.on('wa_error', (msg) => {
    alert('WhatsApp Error: ' + msg);
});

waLogoutBtn.addEventListener('click', () => {
    socket.emit('logout_wa');
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
});

function updateStatus(status) {
    statusSpan.className = ''; // Reset
    const baseClasses = 'inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold border transition-all duration-300';
    
    if (status === 'connected') {
        statusSpan.className = `${baseClasses} bg-green-500/10 text-green-400 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.3)]`;
        statusSpan.innerHTML = '<span class="w-2.5 h-2.5 rounded-full bg-green-500 mr-2.5 shadow-[0_0_10px_rgba(34,197,94,0.8)] animate-pulse"></span>Connected';
    } else if (status === 'scan_qr') {
        statusSpan.className = `${baseClasses} bg-blue-500/10 text-blue-400 border-blue-500/30`;
        statusSpan.innerHTML = '<span class="w-2.5 h-2.5 rounded-full bg-blue-500 mr-2.5"></span>Scan QR code';
    } else if (status === 'connecting') {
        statusSpan.className = `${baseClasses} bg-yellow-500/10 text-yellow-400 border-yellow-500/30`;
        statusSpan.innerHTML = '<span class="w-2.5 h-2.5 rounded-full bg-yellow-500 mr-2.5 animate-ping"></span>Connecting...';
    } else {
        statusSpan.className = `${baseClasses} bg-red-500/10 text-red-400 border-red-500/30`;
        statusSpan.innerHTML = '<span class="w-2.5 h-2.5 rounded-full bg-red-500 mr-2.5"></span>Disconnected';
    }
}

// Scheduler Logic Placeholder
const scheduleForm = document.getElementById('schedule-form');
scheduleForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const number = document.getElementById('target-number').value;
    const message = document.getElementById('message-content').value;
    const time = document.getElementById('schedule-time').value;

// ... existing submit handler ...
    try {
        const response = await fetch('/api/schedule', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ number, message, time })
        });
        const data = await response.json();
        if(response.ok) {
            alert('Scheduled successfully!');
            scheduleForm.reset(); // Clear the form
            fetchSchedules(); // Refresh list
        } else {
            alert('Error: ' + data.message);
        }
    } catch(err) {
        console.error(err);
        alert('Failed to schedule');
    }
});

async function fetchSchedules() {
    try {
        const response = await fetch('/api/schedules', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const schedules = await response.json();
        
        const list = document.getElementById('schedule-list');
        list.innerHTML = '';
        
        schedules.forEach(schedule => {
            const li = document.createElement('li');
            li.className = 'p-4 bg-gray-900/50 hover:bg-gray-900 transition-colors flex items-start justify-between group';
            
            const timeFormatted = new Date(schedule.time).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
            let statusColor = 'bg-gray-700 text-gray-300';
            if(schedule.status === 'sent') statusColor = 'bg-green-900/50 text-green-300 border border-green-800';
            if(schedule.status === 'pending') statusColor = 'bg-yellow-900/50 text-yellow-300 border border-yellow-800';
            if(schedule.status === 'failed') statusColor = 'bg-red-900/50 text-red-300 border border-red-800';

            li.innerHTML = `
                <div class="space-y-1">
                    <div class="flex items-center gap-2">
                        <span class="font-mono text-white font-medium">${schedule.number}</span>
                        <span class="text-xs px-2 py-0.5 rounded-full ${statusColor}">${schedule.status}</span>
                    </div>
                    <p class="text-gray-400 text-sm line-clamp-2">${schedule.message}</p>
                    <p class="text-xs text-gray-500 flex items-center gap-1">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        ${timeFormatted}
                    </p>
                </div>
                <button onclick="deleteSchedule('${schedule.id}')" class="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            `;
            list.appendChild(li);
        });
    } catch (error) {
        console.error('Error fetching schedules:', error);
    }
}

async function deleteSchedule(id) {
    if(!confirm('Delete this schedule?')) return;
    try {
        await fetch(`/api/schedule/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchSchedules();
    } catch (error) {
        console.error('Error deleting:', error);
    }
}

// Initial fetch
fetchSchedules();

