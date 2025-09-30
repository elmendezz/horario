// Versión: 39 (Lógica de notificaciones robustecida y unificada)
        
const schedule = [
    // Lunes (1)
    [
        { time: [12, 30], name: "Cultura Digital I", teacher: "Armenta Felix Ana Cristina", duration: 50 },
        { time: [13, 20], name: "Ingles I", teacher: "Falcon Oliovan Andrea Mariel", duration: 50 },
        { time: [14, 10], name: "Ingles I", teacher: "Falcon Oliovan Andrea Mariel", duration: 50 },
        { time: [15, 0], name: "Receso", teacher: "Pausa De 20 Minutos.", duration: 20 },
        { time: [15, 20], name: "Humanidades I", teacher: "Yañez Núñez Lorena Esmeralda", duration: 50 },
        { time: [16, 10], name: "Lengua y Comunicación I", teacher: "Yañez Núñez Lorena Esmeralda", duration: 50 },
        { time: [17, 0], name: "La Materia y sus Interacciones", teacher: "Vara López José Alberto", duration: 50 },
    ],
    // Martes (2)
    [
        
        { time: [13, 20], name: "Cultura Digital I", teacher: "Armenta Felix Ana Cristina", duration: 50 },
        { time: [14, 10], name: "Cultura Digital I", teacher: "Armenta Felix Ana Cristina", duration: 50 },
        { time: [15, 0], name: "Receso", teacher: "Pausa De 20 Minutos.", duration: 20 },
        { time: [15, 20], name: "Lengua y Comunicación I", teacher: "Yañez Núñez Lorena Esmeralda", duration: 50 },
        { time: [16, 10], name: "La Materia y sus Interacciones", teacher: "Vara López José Alberto", duration: 50 },
        { time: [17, 0], name: "Ingles I", teacher: "Falcon Oliovan Andrea Mariel", duration: 50 },
    ],
    // Miércoles (3)
    [
        
        { time: [14, 10], name: "Humanidades I", teacher: "Yañez Núñez Lorena Esmeralda", duration: 50 },
        { time: [15, 0], name: "Receso", teacher: "Pausa De 20 Minutos.", duration: 20 },
        { time: [15, 20], name: "Humanidades I", teacher: "Yañez Núñez Lorena Esmeralda", duration: 50 },
        { time: [16, 10], name: "Pensamiento Matemático I", teacher: "Hernández Vargas Keina Yovanna", duration: 50 },
        { time: [17, 0], name: "La Materia y sus Interacciones", teacher: "Vara López José Alberto", duration: 50 },
    ],
    // Jueves (4)
    [
        
        { time: [14, 10], name: "Humanidades I", teacher: "Yañez Núñez Lorena Esmeralda", duration: 50 },
        { time: [15, 0], name: "Receso", teacher: "Pausa De 20 Minutos.", duration: 20 },
        { time: [15, 20], name: "Pensamiento Matemático I", teacher: "Hernández Vargas Keina Yovanna", duration: 50 },
        { time: [16, 10], name: "Pensamiento Matemático I", teacher: "Hernández Vargas Keina Yovanna", duration: 50 },
        { time: [17, 0], name: "Ciencias Sociales I", teacher: "Yañez Núñez Lorena Esmeralda", duration: 50 },
    ],
    // Viernes (5)
    [
        { time: [13, 20], name: "Formación Socioemocional I", teacher: "Chávez Arriola Luis Mario", duration: 50 },
        { time: [14, 10], name: "Ciencias Sociales I", teacher: "Yañez Núñez Lorena Esmeralda", duration: 50 },
        { time: [15, 0], name: "Receso", teacher: "Pausa De 20 Minutos.", duration: 20 },
        { time: [15, 20], name: "Lengua y Comunicación I", teacher: "Yañez Núñez Lorena Esmeralda", duration: 50 },
        { time: [16, 10], name: "La Materia y sus Interacciones", teacher: "Vara López José Alberto", duration: 50 },
        { time: [17, 0], name: "Pensamiento Matemático I", teacher: "Hernández Vargas Keina Yovanna", duration: 50 },
    ],
];

let serverTime = null;
let startTime = Date.now();
let currentClassEnd = null;
let isSimulated = false;

async function fetchTime() {
    const simulatedTime = localStorage.getItem('simulatedTime');
    if (simulatedTime) {
        const { day, hour, minute } = JSON.parse(simulatedTime);
        const now = new Date();
        serverTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + day, hour, minute, 0);
        if (serverTime < now) {
            serverTime.setDate(serverTime.getDate() + 7);
        }
        isSimulated = true;
    } else {
        try {
            const response = await fetch('http://worldtimeapi.org/api/timezone/America/Tijuana');
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            serverTime = new Date(data.datetime);
        } catch (error) {
            console.error('Error fetching time, using local time:', error);
            serverTime = new Date();
        } finally {
            isSimulated = false;
        }
    }
}

function updateClock() {
    if (!serverTime) return;
    const now = new Date(serverTime.getTime() + (Date.now() - startTime));
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const am_pm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    document.getElementById('clock').textContent = isSimulated ? `Hora Simulada: ${hours}:${minutes}:${seconds} ${am_pm}` : `Hora: ${hours}:${minutes}:${seconds} ${am_pm}`;

    const countdownEl = document.getElementById('countdown');
    if (currentClassEnd) {
        const diff = currentClassEnd - now;
        if (diff > 0) {
            const mins = Math.floor(diff / 60000);
            const secs = Math.floor((diff % 60000) / 1000);
            countdownEl.textContent = `Faltan: ${mins}m ${secs}s para terminar`;
        } else {
            countdownEl.textContent = "Clase finalizada";
        }
    } else {
        const nextClassStartTime = countdownEl.dataset.nextClassStart ? new Date(countdownEl.dataset.nextClassStart) : null;
        if (nextClassStartTime) {
            const diff = nextClassStartTime - now;
            if (diff > 0) {
                const days = Math.floor(diff / 86400000);
                const hoursLeft = Math.floor((diff % 86400000) / 3600000);
                const minsLeft = Math.floor((diff % 3600000) / 60000);
                const secsLeft = Math.floor((diff % 60000) / 1000);
                let countdownText = "Próxima clase en: ";
                if (days > 0) countdownText += `${days}d `;
                countdownText += `${hoursLeft}h ${minsLeft}m ${secsLeft}s`;
                countdownEl.innerHTML = countdownEl.dataset.nextClassTimeDisplay ? `Próxima clase a las ${countdownEl.dataset.nextClassTimeDisplay}<br>${countdownText}` : countdownText;
            } else {
                countdownEl.textContent = "";
            }
        } else {
            countdownEl.textContent = "";
        }
    }
}

function updateSchedule() {
    if (!serverTime) return;
    const now = new Date(serverTime.getTime() + (Date.now() - startTime));
    const dayOfWeek = now.getDay();
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
    const currentClassDisplay = document.getElementById('current-class-display');
    const teacherDisplay = document.getElementById('teacher-display');
    const nextClassDisplay = document.getElementById('next-class-display');
    const countdownEl = document.getElementById('countdown');
    currentClassEnd = null;
    countdownEl.dataset.nextClassStart = "";
    const formatTime = (h, m) => `${(h % 12 || 12)}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;

    let currentClass = "¡Sin Clases!";
    let currentTeacher = "Disfruta tu día";
    let nextClassInfo = { name: "Ninguna" };
    let foundCurrent = false;

    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const todaySchedule = schedule[dayOfWeek - 1];
        for (let i = 0; i < todaySchedule.length; i++) {
            const classItem = todaySchedule[i];
            const classStartMinutes = classItem.time[0] * 60 + classItem.time[1];
            const classEndMinutes = classStartMinutes + classItem.duration;

            if (currentTimeInMinutes >= classStartMinutes && currentTimeInMinutes < classEndMinutes) {
                currentClass = classItem.name;
                currentTeacher = classItem.teacher;
                currentClassEnd = new Date(now);
                currentClassEnd.setHours(Math.floor(classEndMinutes / 60), classEndMinutes % 60, 0, 0);
                if (i + 1 < todaySchedule.length) nextClassInfo = todaySchedule[i + 1];
                else nextClassInfo = { name: "Clases terminadas por hoy." };
                foundCurrent = true;
                break;
            }
        }
        if (!foundCurrent) {
            if (currentTimeInMinutes < (todaySchedule[0].time[0] * 60 + todaySchedule[0].time[1])) {
                currentClass = "Aún no empiezan las clases";
                currentTeacher = "";
                nextClassInfo = todaySchedule[0];
            } else {
                currentClass = "Clases terminadas por hoy.";
                currentTeacher = "";
            }
        }
    }

    if (!foundCurrent) {
        for (let i = 1; i <= 7; i++) {
            const nextDay = (dayOfWeek + i -1) % 7 + 1;
            if (nextDay >= 1 && nextDay <= 5 && schedule[nextDay - 1].length > 0) {
                const nextDaySchedule = schedule[nextDay - 1];
                nextClassInfo = nextDaySchedule[0];
                const nextClassStart = new Date(now);
                nextClassStart.setDate(now.getDate() + (nextDay - dayOfWeek + 7) % 7);
                nextClassStart.setHours(nextClassInfo.time[0], nextClassInfo.time[1], 0, 0);
                countdownEl.dataset.nextClassStart = nextClassStart.toISOString();
                countdownEl.dataset.nextClassTimeDisplay = formatTime(nextClassInfo.time[0], nextClassInfo.time[1]);
                break;
            }
        }
    }

    currentClassDisplay.textContent = currentClass;
    teacherDisplay.textContent = currentTeacher;
    nextClassDisplay.textContent = `Siguiente clase: ${nextClassInfo.name}`;
}

const themeToggle = document.getElementById('theme-toggle');
const htmlElement = document.documentElement;
let savedTheme = localStorage.getItem('theme') || 'dark';
htmlElement.dataset.theme = savedTheme;
themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌑';
themeToggle.addEventListener('click', () => {
    let newTheme = htmlElement.dataset.theme === 'dark' ? 'light' : 'dark';
    htmlElement.dataset.theme = newTheme;
    localStorage.setItem('theme', newTheme);
    themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌑';
});

const showScheduleBtn = document.getElementById('show-schedule-btn');
const scheduleTable = document.getElementById('schedule-table');
const scheduleTableBody = document.getElementById('schedule-table-body');
function renderScheduleTable() {
    scheduleTableBody.innerHTML = '';
    const formatTime = (h, m) => `${(h % 12 || 12)}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`;
    const allTimes = new Set();
    schedule.forEach(day => day.forEach(c => allTimes.add(c.time[0] * 60 + c.time[1])));
    const sortedTimes = Array.from(allTimes).sort((a,b) => a - b);
    
    sortedTimes.forEach(timeInMinutes => {
        if (timeInMinutes === 15 * 60) {
            const recesoRow = document.createElement('tr');
            recesoRow.className = 'receso-row';
            recesoRow.innerHTML = `<td colspan="6">3:00 PM : RECESO DE 20 MIN.</td>`;
            scheduleTableBody.appendChild(recesoRow);
            return;
        }
        const row = document.createElement('tr');
        const hours = Math.floor(timeInMinutes/60), minutes = timeInMinutes%60;
        row.innerHTML = `<td>${formatTime(hours, minutes)}</td>` + 
                        [0,1,2,3,4].map(dayIndex => {
                            const classItem = schedule[dayIndex].find(c => c.time[0]*60 + c.time[1] === timeInMinutes);
                            return `<td>${classItem ? `<strong>${classItem.name}</strong><br>${classItem.teacher}` : ''}</td>`;
                        }).join('');
        scheduleTableBody.appendChild(row);
    });
}
showScheduleBtn.addEventListener('click', () => {
    scheduleTable.classList.toggle('visible');
    showScheduleBtn.textContent = scheduleTable.classList.contains('visible') ? 'Ocultar Horario' : 'Mostrar Horario';
});

const modal = document.getElementById('imageModal');
document.getElementById('next-class-display').addEventListener('click', () => modal.style.display = "block");
document.getElementById('closeModalBtn').addEventListener('click', () => modal.style.display = "none");

// =================== LÓGICA DE NOTIFICACIONES UNIFICADA Y ROBUSTA ===================
function sendMessageToSW(message) {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage(message);
    } else if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(reg => reg.active.postMessage(message));
    }
}

function initializeNotifications() {
    const notificationsBtn = document.getElementById('notifications-btn');
    const iosInstallPrompt = document.getElementById('ios-install-prompt');
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isInStandaloneMode = () => ('standalone' in window.navigator) && (window.navigator.standalone);

    if (isIOS && !isInStandaloneMode()) {
        notificationsBtn.style.display = 'none';
        iosInstallPrompt.style.display = 'block';
        return;
    }

    iosInstallPrompt.style.display = 'none';
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        console.warn('Notificaciones o Service Workers no soportados.');
        return;
    }
    
    navigator.serviceWorker.ready.then(() => {
        console.log('Service Worker listo. Configurando botón de notificaciones.');
        if (localStorage.getItem('notificationsEnabled') === 'true' && Notification.permission === 'granted') {
            notificationsBtn.textContent = '🔔';
            sendMessageToSW({ type: 'SET_NOTIFICATIONS', enabled: true });
        } else {
            notificationsBtn.textContent = '🔕';
            if (Notification.permission !== 'granted') localStorage.setItem('notificationsEnabled', 'false');
        }
        notificationsBtn.style.visibility = 'visible';
    }).catch(error => console.error('Error al inicializar Service Worker:', error));

    notificationsBtn.addEventListener('click', () => {
        if (localStorage.getItem('notificationsEnabled') === 'true' && Notification.permission === 'granted') {
            localStorage.setItem('notificationsEnabled', 'false');
            notificationsBtn.textContent = '🔕';
            sendMessageToSW({ type: 'SET_NOTIFICATIONS', enabled: false });
            console.log('Notificaciones desactivadas.');
        } else {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    localStorage.setItem('notificationsEnabled', 'true');
                    notificationsBtn.textContent = '🔔';
                    sendMessageToSW({ type: 'SET_NOTIFICATIONS', enabled: true });
                    console.log('Permiso concedido. Notificaciones activadas.');
                } else {
                    console.log('Permiso denegado.');
                    alert('No has dado permiso. Puedes cambiarlo en la configuración de tu navegador.');
                }
            });
        }
    });
}

document.getElementById('fullscreen-btn').addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => alert(`Error: ${err.message}`));
    } else {
        document.exitFullscreen();
    }
});

document.getElementById('test-notification-btn').addEventListener('click', () => {
    if (Notification.permission !== 'granted') {
        alert('Primero debes permitir las notificaciones usando el ícono 🔔.');
        return;
    }
    sendMessageToSW({ type: 'TEST_NOTIFICATION', delay: 5 });
    alert('Recibirás una notificación en 5 segundos. Puedes cambiar de app o bloquear la pantalla para verla.');
});

fetchTime().then(() => {
    updateSchedule();
    renderScheduleTable();
    initializeNotifications();
    const updateInterval = isSimulated ? 1000 : 10000;
    setInterval(updateSchedule, updateInterval);
    setInterval(updateClock, 1000);
});