/**
 * FOCUS - Gestão de Tarefas Académicas e Pessoais
 * Lógica da Aplicação (Frontend Vanilla JS)
 */

// --- 1. CONFIGURAÇÕES INICIAIS E ESTADO ---
const STORAGE_KEY = 'focus_tasks_v1';
let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

// Instanciar o som de notificação
const notificationSound = new Audio('/assets/notification.mp3');
notificationSound.volume = 0.5; // Volume a 50% para não ser agressivo

// Pedir permissão para notificações assim que a app carrega
if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission();
}

// --- 2. GESTÃO DE DADOS (LOCALSTORAGE) ---
function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    renderAllViews();
}

// --- 3. NAVEGAÇÃO E INTERFACE ---
const navItems = document.querySelectorAll('.nav-links li');
const views = document.querySelectorAll('.view');
const pageTitle = document.getElementById('page-title');

navItems.forEach(li => {
    li.addEventListener('click', () => {
        const target = li.getAttribute('data-target');
        
        // Atualizar estado ativo na sidebar
        navItems.forEach(item => item.classList.remove('active'));
        li.classList.add('active');
        
        // Trocar visualização (View)
        views.forEach(view => view.classList.add('hidden'));
        document.getElementById(`view-${target}`).classList.remove('hidden');
        
        // Atualizar título da página
        pageTitle.innerText = li.innerText;

        renderAllViews();
    });
});

// Modo Claro / Escuro
const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    themeToggle.innerText = isDark ? '☀️ Tema' : '🌓 Tema';
});

// --- 4. GESTÃO DO MODAL E FORMULÁRIO ---
const modal = document.getElementById('task-modal');
const taskForm = document.getElementById('task-form');

document.getElementById('btn-new-task').addEventListener('click', () => {
    taskForm.reset();
    document.getElementById('task-date').valueAsDate = new Date();
    modal.classList.remove('hidden');
});

document.getElementById('btn-close-modal').addEventListener('click', () => {
    modal.classList.add('hidden');
});

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const newTask = {
        id: Date.now().toString(),
        title: document.getElementById('task-title').value,
        description: document.getElementById('task-desc').value,
        date: document.getElementById('task-date').value,
        time: document.getElementById('task-time').value || null,
        category: document.getElementById('task-category').value,
        priority: document.getElementById('task-priority').value,
        status: 'pendente',
        notified: false,
        createdAt: new Date().toISOString()
    };

    tasks.push(newTask);
    saveTasks();
    modal.classList.add('hidden');
    
    // Feedback visual suave
    showInternalNotification(`Tarefa "${newTask.title}" agendada!`);
});

// --- 5. RENDERIZAÇÃO DINÂMICA (UI COMPONENTS) ---

function renderAllViews() {
    renderDashboard();
    renderTasksList();
    renderCalendar();
}

function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = `task-item ${task.status === 'concluida' ? 'completed' : ''}`;
    
    const priorityColors = { alta: '#ff3b30', media: '#ff9500', baixa: '#34c759' };

    li.innerHTML = `
        <div class="task-info">
            <div style="display:flex; align-items:center; gap:8px;">
                <span style="width:10px; height:10px; border-radius:50%; background:${priorityColors[task.priority]}"></span>
                <h4>${task.title}</h4>
            </div>
            <p>${task.description || 'Sem descrição'}</p>
            <p class="task-meta">
                📅 ${task.date} ${task.time ? '• ⏰ ' + task.time : ''} • 🏷️ ${task.category}
            </p>
        </div>
        <div class="task-actions">
            <button onclick="toggleTaskStatus('${task.id}')" title="Concluir">
                ${task.status === 'concluida' ? '↩️' : '✅'}
            </button>
            <button onclick="deleteTask('${task.id}')" title="Apagar">🗑️</button>
        </div>
    `;
    return li;
}

function renderDashboard() {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter(t => t.date === todayStr);
    const doneTasks = tasks.filter(t => t.status === 'concluida');
    
    document.getElementById('stat-today').innerText = todayTasks.length;
    document.getElementById('stat-done').innerText = doneTasks.length;
    
    const rate = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0;
    document.getElementById('stat-rate').innerText = `${rate}%`;

    const dashList = document.getElementById('dashboard-task-list');
    dashList.innerHTML = '';
    
    if (todayTasks.length === 0) {
        dashList.innerHTML = '<p style="color:var(--text-secondary); padding:20px;">Nada agendado para hoje. Descansa! ✨</p>';
    } else {
        todayTasks.forEach(task => dashList.appendChild(createTaskElement(task)));
    }
}

function renderTasksList() {
    const list = document.getElementById('main-task-list');
    const searchTerm = document.getElementById('search-task')?.value.toLowerCase() || '';
    list.innerHTML = '';
    
    const filtered = tasks.filter(t => t.title.toLowerCase().includes(searchTerm));
    
    if (filtered.length === 0) {
        list.innerHTML = '<p style="text-align:center; padding:2rem; color:var(--text-secondary);">Nenhuma tarefa encontrada.</p>';
    } else {
        filtered.sort((a, b) => new Date(a.date + ' ' + (a.time || '00:00')) - new Date(b.date + ' ' + (b.time || '00:00')))
                .forEach(task => list.appendChild(createTaskElement(task)));
    }
}

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';

    const grouped = {};
    tasks.forEach(t => {
        if (!grouped[t.date]) grouped[t.date] = [];
        grouped[t.date].push(t);
    });

    const sortedDates = Object.keys(grouped).sort();

    sortedDates.forEach(date => {
        const dayBlock = document.createElement('div');
        dayBlock.className = 'glass p-4 mt-4';
        dayBlock.innerHTML = `<h4>📅 ${date}</h4><ul class="task-list mt-4" id="cal-${date}"></ul>`;
        grid.appendChild(dayBlock);
        
        const ul = document.getElementById(`cal-${date}`);
        grouped[date].forEach(t => ul.appendChild(createTaskElement(t)));
    });
}

// --- 6. AÇÕES DE TAREFA ---
window.toggleTaskStatus = (id) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.status = task.status === 'concluida' ? 'pendente' : 'concluida';
        saveTasks();
    }
};

window.deleteTask = (id) => {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
};

document.getElementById('search-task')?.addEventListener('input', renderTasksList);

// --- 7. EXPORTAÇÃO (FLASK API) ---
window.exportTasks = async () => {
    if (tasks.length === 0) return alert("Não há tarefas para exportar.");
    
    try {
        const res = await fetch('/api/export', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tasks })
        });
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'foco_tarefas.csv';
        a.click();
    } catch (e) {
        alert("Erro ao conectar ao servidor Python para exportar.");
    }
};

// --- 8. SISTEMA DE NOTIFICAÇÕES (LEMBRETES) ---
function playNotificationSound() {
    // Tenta reproduzir o som
    notificationSound.play().catch(error => {
        console.log("O áudio não pôde ser reproduzido automaticamente devido às políticas do browser. Interage com a página primeiro.");
    });
}

function checkReminders() {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    let needsSync = false;

    tasks.forEach(task => {
        if (task.status === 'pendente' && !task.notified && task.time) {
            if (task.date === currentDate && task.time === currentTime) {
                
                // 1. Tocar o Som (Sound Cue)
                playNotificationSound();

                // 2. Notificação de Sistema (Desktop)
                if (Notification.permission === "granted") {
                    new Notification("Focus | Lembrete", {
                        body: `Hora de: ${task.title}`,
                        icon: "/logo.png"
                    });
                }
                
                // 3. Feedback visual interno (Toast)
                showInternalNotification(`⏰ AGORA: ${task.title}`);
                
                task.notified = true;
                needsSync = true;
            }
        }
    });

    if (needsSync) saveTasks();
}

function showInternalNotification(msg) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed; bottom: 20px; right: 20px; 
        background: var(--accent-color); color: white;
        padding: 12px 24px; border-radius: 12px; z-index: 9999;
        box-shadow: var(--shadow); animation: slideIn 0.3s ease-out;
    `;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

// Check reminders every 30 seconds
setInterval(checkReminders, 10000);

// --- 9. CRONÓMETRO POMODORO ---
let timerInterval;
let timeLeft = 25 * 60;

function updateTimerUI() {
    const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const s = (timeLeft % 60).toString().padStart(2, '0');
    document.getElementById('timer-display').innerText = `${m}:${s}`;
}

document.getElementById('btn-timer-start').addEventListener('click', function() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        this.innerText = 'Retomar';
    } else {
        this.innerText = 'Pausar';
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerUI();
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                new Notification("Focus", { body: "Pomodoro Terminado! Faz uma pausa." });
                timeLeft = 25 * 60;
                updateTimerUI();
            }
        }, 1000);
    }
});

document.getElementById('btn-timer-reset').addEventListener('click', () => {
    clearInterval(timerInterval);
    timerInterval = null;
    timeLeft = 25 * 60;
    updateTimerUI();
    document.getElementById('btn-timer-start').innerText = 'Iniciar';
});

// Inicializar aplicação
renderAllViews();