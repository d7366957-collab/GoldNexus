const tg = window.Telegram.WebApp;
tg.expand();
const userId = tg.initDataUnsafe?.user?.id;

function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = (progress * (end - start) + start).toFixed(2);
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}

function loadUserData() {
    if (!userId) return;
    fetch(`/api/user/${userId}`).then(res => res.json()).then(data => {
        animateValue('balance', 0, data.balance, 1500);
    });
    
    fetch('/api/ranking').then(res => res.json()).then(data => {
        document.getElementById('ranking-list').innerHTML = data.map((u, i) => `
            <div class="rank-item"><span>#${i+1} ${u.username}</span><span class="points">${u.referidos} refs</span></div>
        `).join('');
    });

    fetch(`/api/tasks/${userId}`).then(res => res.json()).then(data => {
        const container = document.getElementById('tasks-container');
        container.innerHTML = data.tasks.map(task => {
            const completed = data.completedIds.includes(task.id);
            return `
                <div class="task-card">
                    <div class="task-icon">📢</div>
                    <div class="task-info">
                        <h3>${task.title}</h3>
                        <p class="reward">+${task.reward} USDT</p>
                    </div>
                    <button class="btn-claim" onclick="window.open('${task.link}', '_blank')" ${completed ? 'disabled style="opacity:0.5"' : ''}>
                        ${completed ? '✅' : 'Unirse'}
                    </button>
                </div>
            `;
        }).join('');
    });
}

document.getElementById('checkin-btn').addEventListener('click', () => {
    fetch('/api/checkin', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
    }).then(res => res.json()).then(data => {
        alert(data.message || data.error);
        if (data.success) loadUserData();
    });
});

document.getElementById('withdraw-btn').addEventListener('click', () => {
    const wallet = prompt('Ingresa tu dirección de wallet BEP20:');
    if (!wallet) return;
    const amount = parseFloat(prompt('¿Cuánto deseas retirar? (Mínimo 10 USDT)'));
    if (!amount || amount < 10) return alert('Monto inválido');

    fetch('/api/withdraw', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount, wallet })
    }).then(res => res.json()).then(data => alert(data.message || data.error));
});

loadUserData();
