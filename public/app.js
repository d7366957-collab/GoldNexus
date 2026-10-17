const tg = window.Telegram.WebApp;
tg.expand();
const userId = tg.initDataUnsafe?.user?.id;

function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    if (!obj) return;
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
    
    // Cargar saldo
    fetch(`/api/user/${userId}`).then(res => res.json()).then(data => {
        animateValue('balance', 0, data.balance, 1500);
    }).catch(err => console.log(err));
    
    // Cargar ranking
    fetch('/api/ranking').then(res => res.json()).then(data => {
        document.getElementById('ranking-list').innerHTML = data.map((u, i) => `
            <div class="rank-item"><span>#${i+1} ${u.username}</span><span class="points">${u.referidos} refs</span></div>
        `).join('');
    }).catch(err => console.log(err));

    // Cargar tareas
    fetch(`/api/tasks/${userId}`).then(res => res.json()).then(data => {
        const container = document.getElementById('tasks-container');
        if (data.tasks && data.tasks.length > 0) {
            container.innerHTML = data.tasks.map(task => {
                const completed = data.completedIds.includes(task.id);
                
                // Si ya la completó, mostramos un check. Si no, un botón que abre el link y luego pide verificar
                const buttonHTML = completed 
                    ? `<button class="btn-claim" disabled style="opacity:0.5">✅</button>`
                    : `<button class="btn-claim" onclick="openAndVerify('${task.link}', ${task.id})">Unirse</button>`;

                return `
                    <div class="task-card">
                        <div class="task-icon">📢</div>
                        <div class="task-info">
                            <h3>${task.title}</h3>
                            <p class="reward">+${task.reward} USDT</p>
                        </div>
                        ${buttonHTML}
                    </div>
                `;
            }).join('');
        }
    }).catch(err => console.log(err));
}

// Función para abrir el canal y decirle al bot que verifique
function openAndVerify(link, taskId) {
    // 1. Abrimos el canal de Telegram
    window.open(link, '_blank');
    
    // 2. Le avisamos al bot (vía el WebApp) que el usuario quiere verificar esta tarea
    if (userId) {
        tg.sendData(JSON.stringify({ action: 'verify_task', taskId: taskId, userId: userId }));
    }
}

// Botón de Check-in
document.getElementById('checkin-btn').addEventListener('click', () => {
    if (!userId) return alert("Abre esto desde Telegram");
    fetch('/api/checkin', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
    }).then(res => res.json()).then(data => {
        alert(data.message || data.error);
        if (data.success) loadUserData();
    });
});

// Botón de Retiro
document.getElementById('withdraw-btn').addEventListener('click', () => {
    if (!userId) return alert("Abre esto desde Telegram");
    const wallet = prompt('Ingresa tu dirección de wallet BEP20:');
    if (!wallet) return;
    const amount = parseFloat(prompt('¿Cuánto deseas retirar? (Mínimo 10 USDT)'));
    if (!amount || amount < 10) return alert('Monto inválido, el mínimo es 10 USDT');

    fetch('/api/withdraw', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount, wallet })
    }).then(res => res.json()).then(data => alert(data.message || data.error));
});

loadUserData();
