// c:\Users\Admin\Documents\GitHub\horario\ui-logic.js

import { reportError } from './error-logic.js';
import { schedule, classDuration } from './schedule-data.js';
import { getCurrentAndNextClass } from './schedule-utils.js';
import { sendMessageToSW } from './notification-logic.js';

// Variables de estado globales para la UI
let serverTime = null;
let startTime = Date.now();
let currentClassEnd = null;
let isSimulated = false;
let currentActiveClassInfo = null; // Almacenará la clase activa para resaltarla

/**
 * Obtiene la hora actual del servidor o usa una hora simulada.
 */
export async function fetchTime() {
    const simulatedTime = localStorage.getItem('simulatedTime');
    if (simulatedTime) {
        const { day, hour, minute } = JSON.parse(simulatedTime);
        const now = new Date();
        // Ajustar la fecha para que la simulación siempre sea en el futuro si el día ya pasó esta semana
        serverTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + day, hour, minute, 0);
        if (serverTime < now) {
            serverTime.setDate(serverTime.getDate() + 7); // Si el día simulado ya pasó esta semana, simularlo para la próxima
        }
        isSimulated = true;
    } else {
        try {
            const response = await fetch('https://worldtimeapi.org/api/timezone/America/Tijuana');
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            serverTime = new Date(data.datetime);
        } catch (error) {
            // Reportar el error para que el desarrollador lo sepa.
            reportError(error, 'fetchTime API');
            // Usar hora local como fallback.
            serverTime = new Date(); // Fallback a la hora local si falla la API
            // Notificar al usuario que algo no está bien.
            const aviso = document.getElementById('aviso');
            if (aviso) aviso.textContent = "⚠️ No se pudo sincronizar la hora. Usando hora local.";
        } finally {
            isSimulated = false;
        }
    }
}

/**
 * Actualiza el reloj en la interfaz de usuario y el contador regresivo.
 */
export function updateClock() {
    if (!serverTime) return;
    const now = new Date(serverTime.getTime() + (Date.now() - startTime));
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const am_pm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // Formato 12 horas
    const clockEl = document.getElementById('clock');
    if (clockEl) clockEl.textContent = isSimulated ? `Hora Simulada: ${hours}:${minutes}:${seconds} ${am_pm}` : `Hora: ${hours}:${minutes}:${seconds} ${am_pm}`;

    const countdownEl = document.getElementById('countdown');
    const nextClassCountdownContainer = document.getElementById('next-class-countdown-container');
    if (currentClassEnd) {
        const diff = currentClassEnd - now;
        if (diff > 0) {
            let finalGlowColor;
            const fiveMinutesInMs = 5 * 60 * 1000;

            if (diff <= fiveMinutesInMs) {
                // Últimos 5 minutos: color rojo de advertencia
                finalGlowColor = '#dc3545';
            } else {
                // Lógica de interpolación normal
                const classStart = new Date(currentClassEnd.getTime() - (currentActiveClassInfo.duration || classDuration) * 60000);
                const totalDuration = currentClassEnd - classStart;
                const elapsed = now - classStart;
                const progress = Math.min(elapsed / totalDuration, 1);
                const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();
                const endColor = '#ffc107'; // Amarillo
                finalGlowColor = interpolateColor(accentColor, endColor, progress);
            }
            
            const container = document.querySelector('.container');
            if (container) {
                container.style.setProperty('--dynamic-glow-color', finalGlowColor);
            }

            const mins = Math.floor(diff / 60000);
            const secs = Math.floor((diff % 60000) / 1000);
            countdownEl.textContent = `Faltan: ${mins}m ${secs}s para terminar`;
        } else {
            countdownEl.textContent = "Clase finalizada";
        }
    } else {
        // Lógica para la cuenta regresiva grande
        const nextClassStartTime = countdownEl.dataset.nextClassStart ? new Date(countdownEl.dataset.nextClassStart) : null;
        if (nextClassStartTime) {
            const diff = nextClassStartTime - now;
            if (diff > 0) {
                const days = Math.floor(diff / 86400000);
                const hours = Math.floor((diff % 86400000) / 3600000);
                const minutes = Math.floor((diff % 3600000) / 60000);
                const seconds = Math.floor((diff % 60000) / 1000);

                document.getElementById('countdown-days').textContent = days;
                document.getElementById('countdown-hours').textContent = hours;
                document.getElementById('countdown-minutes').textContent = minutes;
                document.getElementById('countdown-seconds').textContent = seconds;

                // Ocultar el segmento de días si es 0
                document.getElementById('days-segment').style.display = days > 0 ? 'flex' : 'none';

                nextClassCountdownContainer.classList.add('visible');
                countdownEl.textContent = ''; // Limpiar el contador pequeño
            } else {
                countdownEl.textContent = "";
            }
        } else {
            countdownEl.textContent = "";
            document.getElementById('next-class-time-label').textContent = '';
        }
    }
}

/**
 * Interpola entre dos colores hexadecimales.
 * @param {string} color1 - Color inicial en formato hex (ej. '#6200ea').
 * @param {string} color2 - Color final en formato hex (ej. '#ffc107').
 * @param {number} factor - Factor de interpolación de 0 a 1.
 * @returns {string} El color interpolado en formato hex.
 */
function interpolateColor(color1, color2, factor) {
    const result = color1.slice(1).match(/.{2}/g).map((hex, i) => {
        const val1 = parseInt(hex, 16);
        const val2 = parseInt(color2.slice(1).match(/.{2}/g)[i], 16);
        const val = Math.round(val1 + factor * (val2 - val1));
        return val.toString(16).padStart(2, '0');
    }).join('');
    return `#${result}`;
}

/**
 * Restablece el color del resplandor al color de acento por defecto.
 */
function resetGlowColor() {
    const container = document.querySelector('.container');
    if (container) container.style.setProperty('--dynamic-glow-color', 'var(--accent-color)');
}

/**
 * Actualiza la información de la clase actual y la siguiente en la UI.
 */
export function updateSchedule() {
    if (!serverTime) return;
    const container = document.querySelector('.container');
    const now = new Date(serverTime.getTime() + (Date.now() - startTime));
    const currentClassDisplay = document.getElementById('current-class-display');
    const teacherDisplay = document.getElementById('teacher-display');
    const nextClassDisplay = document.getElementById('next-class-display');
    const countdownEl = document.getElementById('countdown');
    
    currentClassEnd = null;
    currentActiveClassInfo = null; // Reiniciar en cada actualización
    countdownEl.dataset.nextClassStart = "";
    resetGlowColor(); // Restablecer el color del glow en cada actualización
    container?.classList.remove('is-in-session'); // Quitar la animación por defecto
    container?.classList.remove('no-class-glow'); // Quitar la animación dorada por defecto
    const formatTime = (h, m) => `${(h % 12 || 12)}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
    const nextClassCountdownContainer = document.getElementById('next-class-countdown-container');

    const { currentClass, nextClass } = getCurrentAndNextClass(now);

    if (currentClass) {
        container?.classList.add('is-in-session'); // Añadir la animación si hay clase
        nextClassCountdownContainer?.classList.remove('visible'); // Ocultar contador grande

        currentClassDisplay.textContent = currentClass.name;
        teacherDisplay.textContent = currentClass.teacher;
        const classStartMinutes = currentClass.time[0] * 60 + currentClass.time[1];
        const classEndMinutes = classStartMinutes + (currentClass.duration || classDuration);
        currentClassEnd = new Date(now);
        currentClassEnd.setHours(Math.floor(classEndMinutes / 60), classEndMinutes % 60, 59, 999); // Finaliza al terminar el minuto
        currentActiveClassInfo = { ...currentClass, dayIndex: now.getDay() - 1 };
    } else {
        container?.classList.add('no-class-glow'); // Añadir animación dorada
        currentClassDisplay.textContent = "¡Sin Clases!";
        teacherDisplay.textContent = "Disfruta tu día";
    }

    if (nextClass) {
        nextClassDisplay.textContent = `Siguiente: ${nextClass.name}`;
        if (nextClass.time) {
            const formattedTime = formatTime(nextClass.time[0], nextClass.time[1]);
            document.getElementById('next-class-time-label').textContent = `a las ${formattedTime}`;
            const nextClassStart = new Date(now);
            if (nextClass.isNextDay) {
                // Calculate days until next class day
                const currentDayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
                const nextClassDayOfWeek = schedule.findIndex(daySchedule => daySchedule.includes(nextClass)) + 1; // 1=Mon, 2=Tue...
                let daysToAdd = nextClassDayOfWeek - currentDayOfWeek;
                if (daysToAdd <= 0) daysToAdd += 7; // If next class day is earlier in the week, go to next week
                nextClassStart.setDate(now.getDate() + daysToAdd);
            }
            nextClassStart.setHours(nextClass.time[0], nextClass.time[1], 0, 0);
            countdownEl.dataset.nextClassStart = nextClassStart.toISOString();
            countdownEl.dataset.nextClassTimeDisplay = formattedTime;
        } else {
            countdownEl.dataset.nextClassStart = "";
            countdownEl.dataset.nextClassTimeDisplay = "";
            document.getElementById('next-class-time-label').textContent = '';
        }
    } else {
        nextClassDisplay.textContent = "Siguiente: Ninguna";
    }

    highlightCurrentClassInTable();
}

/**
 * Renderiza la tabla completa del horario.
 */
export function renderScheduleTable() {
    const scheduleTableBody = document.getElementById('schedule-table-body');
    scheduleTableBody.innerHTML = '';
    const formatTime = (h, m) => `${(h % 12 || 12)}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`;
    const allTimes = new Set();
    schedule.forEach(day => day.forEach(c => allTimes.add(c.time[0] * 60 + c.time[1])));
    const sortedTimes = Array.from(allTimes).sort((a,b) => a - b);
    
    sortedTimes.forEach(timeInMinutes => {
        const row = document.createElement('tr');
        row.dataset.time = timeInMinutes;
        const hours = Math.floor(timeInMinutes/60), minutes = timeInMinutes%60;
        row.innerHTML = `<td>${formatTime(hours, minutes)}</td>` + 
                        [0,1,2,3,4].map(dayIndex => {
                            const classItem = schedule[dayIndex].find(c => c.time[0]*60 + c.time[1] === timeInMinutes);
                            return `<td>${classItem ? `<strong>${classItem.name}</strong><br>${classItem.teacher}` : ''}</td>`;
                        }).join('');
        
        if (timeInMinutes === 15 * 60) { // 3:00 PM
            row.classList.add('receso-row');
        }
        scheduleTableBody.appendChild(row);
    });
}

/**
 * Resalta la clase actual en la tabla del horario.
 */
function highlightCurrentClassInTable() {
    document.querySelectorAll('#schedule-table td.current-class-highlight').forEach(cell => {
        cell.classList.remove('current-class-highlight');
    });

    const scheduleTable = document.getElementById('schedule-table');
    if (!currentActiveClassInfo || !scheduleTable.classList.contains('visible')) {
        return;
    }

    const timeToFind = currentActiveClassInfo.time[0] * 60 + currentActiveClassInfo.time[1];
    const dayIndexToFind = currentActiveClassInfo.dayIndex;

    const rows = scheduleTable.getElementsByTagName('tr');
    for (const row of Array.from(rows)) {
        const timeInMinutes = parseInt(row.dataset.time, 10);
        if (timeInMinutes === timeToFind) {
            if (row.cells[dayIndexToFind + 1]) { // +1 porque la primera columna es la hora
                row.cells[dayIndexToFind + 1].classList.add('current-class-highlight');
            }
            break;
        }
    }
}

/**
 * Inicializa el toggle de tema (claro/oscuro).
 */
function initializeThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle-menu');
    const resetThemeBtn = document.getElementById('reset-theme-btn');
    const htmlElement = document.documentElement;

    /**
     * Muestra u oculta el botón de reseteo de tema basado en si hay
     * una preferencia guardada en localStorage.
     */
    const updateResetButtonVisibility = () => {
        if (resetThemeBtn) {
            resetThemeBtn.style.display = localStorage.getItem('theme') ? 'block' : 'none';
        }
    };

    const applyTheme = (theme) => {
        htmlElement.dataset.theme = theme;
        if (themeToggle) {
            themeToggle.innerHTML = theme === 'dark' ? '☀️ Cambiar a Claro' : '🌑 Cambiar a Oscuro';
        }
    };

    const osThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // 1. Priorizar la elección manual del usuario guardada en localStorage.
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        applyTheme(savedTheme);
    } else {
        // 2. Si no hay elección manual, usar la preferencia del sistema operativo.
        applyTheme(osThemeQuery.matches ? 'dark' : 'light');
    }

    // 3. Escuchar cambios en la preferencia del sistema operativo.
    osThemeQuery.addEventListener('change', (e) => {
        // Solo aplicar el cambio si el usuario no ha elegido un tema manualmente.
        if (!localStorage.getItem('theme')) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });

    // 4. Manejar el clic manual en el botón del menú.
    themeToggle?.addEventListener('click', () => {
        const newTheme = htmlElement.dataset.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        updateResetButtonVisibility();
        applyTheme(newTheme);
    });

    // 5. Manejar el clic en el botón de reseteo.
    resetThemeBtn?.addEventListener('click', () => {
        localStorage.removeItem('theme');
        updateResetButtonVisibility();
        const osTheme = osThemeQuery.matches ? 'dark' : 'light';
        applyTheme(osTheme);
        alert('Preferencia de tema eliminada. Ahora se sincronizará con tu sistema.');
    });
}

/**
 * Inicializa la funcionalidad del modal de imagen.
 */
function initializeModal() {
    const modal = document.getElementById('imageModal');
    document.getElementById('next-class-display').addEventListener('click', () => modal.style.display = "block");
    document.getElementById('closeModalBtn').addEventListener('click', () => modal.style.display = "none");
}

/**
 * Inicializa la funcionalidad de pantalla completa.
 */
function initializeFullscreen() {
    document.getElementById('fullscreen-btn').addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => alert(`Error: ${err.message}`));
        } else {
            document.exitFullscreen();
        }
    });
}

/**
 * Inicializa la gestión del nombre de usuario.
 */
function initializeUser() {
    const changeUsernameBtn = document.getElementById('change-username-btn');
    const userGreetingEl = document.getElementById('user-greeting');
    const changeUsernameMenuBtn = document.getElementById('change-username-menu-btn');
    const userGreetingMenuEl = document.getElementById('user-greeting-menu');

    const setUsername = () => {
        const currentUsername = localStorage.getItem('username') || 'invitado';
        const newUsername = prompt('Por favor, ingresa tu nombre o apodo:', currentUsername);

        if (newUsername && newUsername.trim() !== '') {
            const sanitizedUsername = newUsername.trim();
            localStorage.setItem('username', sanitizedUsername);
            displayGreeting(sanitizedUsername);
            alert(`¡Nombre guardado como: ${sanitizedUsername}!`);
        } else if (newUsername !== null) { // Si no presionó "Cancelar"
            alert('El nombre no puede estar vacío.');
        }
    };

    const displayGreeting = (username) => {
        const hour = new Date().getHours();
        let greetingIcon = '👋'; // Icono por defecto

        if (hour >= 5 && hour < 12) {
            greetingIcon = '☀️'; // Mañana
        } else if (hour >= 12 && hour < 19) {
            greetingIcon = '🌇'; // Tarde
        } else {
            greetingIcon = '🌙'; // Noche
        }

        if (username && userGreetingEl) {
            userGreetingEl.textContent = `¡Hola, ${username}!`;
        }
        if (username && userGreetingMenuEl) {
            // Usamos innerHTML para poder añadir el ícono
            userGreetingMenuEl.innerHTML = `${greetingIcon} ¡Hola, ${username}!`;
        }
    };

    changeUsernameBtn?.addEventListener('click', setUsername);
    changeUsernameMenuBtn?.addEventListener('click', setUsername);

    // Mostrar saludo al cargar la página si ya hay un nombre
    const savedUsername = localStorage.getItem('username');
    displayGreeting(savedUsername);
}

/**
 * Inicializa el botón para mostrar/ocultar el horario completo.
 */
function initializeScheduleToggle() {
    const showScheduleBtn = document.getElementById('show-schedule-btn');
    const scheduleTable = document.getElementById('schedule-table');
    showScheduleBtn.addEventListener('click', () => {
        scheduleTable.classList.toggle('visible');
        showScheduleBtn.textContent = scheduleTable.classList.contains('visible') ? 'Ocultar Horario' : 'Mostrar Horario';
        highlightCurrentClassInTable(); // Volver a resaltar al mostrar la tabla
    });
}

/**
 * Inicializa el botón para mostrar las herramientas de desarrollo.
 */
function initializeDevToolsToggle() {
    document.getElementById('show-dev-tools-btn').addEventListener('click', () => {
        const password = prompt('Ingresa la contraseña para ver las herramientas de desarrollo:');
        if (password === '1CV') {
            document.getElementById('developer-tools').style.display = 'flex';
            document.getElementById('show-dev-tools-btn').style.display = 'none'; // Ocultar el botón después de usarlo
            alert('Acceso concedido. Herramientas de desarrollo visibles.');
        } else if (password !== null) { // Si el usuario no presionó "Cancelar"
            alert('Contraseña incorrecta.');
        }
    });
}

/**
 * Inicializa la lógica del menú lateral (hamburguesa).
 */
function initializeMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const closeMenuBtn = document.getElementById('close-menu-btn');
    const sideMenu = document.getElementById('side-menu');
    const overlay = document.getElementById('menu-overlay');

    const openMenu = () => {
        if (!menuToggle) return;
        sideMenu.classList.add('open');
        overlay.classList.add('open');
        menuToggle.textContent = '×'; // Cambiar a 'X'
    };

    const closeMenu = () => {
        if (!menuToggle) return;
        sideMenu.classList.remove('open');
        overlay.classList.remove('open');
        menuToggle.textContent = '☰'; // Volver a '☰'
    };

    menuToggle?.addEventListener('click', openMenu);
    closeMenuBtn?.addEventListener('click', closeMenu);
    overlay?.addEventListener('click', closeMenu);
}

/**
 * Inicializa los controles de caché.
 */
function initializeCacheControls() {
    const clearCacheBtn = document.getElementById('clear-cache-btn');
    clearCacheBtn?.addEventListener('click', async () => {
        if ('caches' in window) {
            const userConfirmed = confirm('¿Estás seguro de que quieres limpiar toda la caché? La aplicación se recargará.');
            if (userConfirmed) {
                const keys = await caches.keys();
                await Promise.all(keys.map(key => caches.delete(key)));
                alert('Caché eliminada. La aplicación se recargará ahora.');
                window.location.reload();
            }
        }
    });
}

/**
 * Carga y muestra los anuncios del administrador.
 */
async function initializeAnnouncements() {
    const container = document.getElementById('announcements-container');
    if (!container) return;

    try {
        const response = await fetch('/api/messages?announcements=true');
        if (!response.ok) throw new Error('Failed to fetch announcements');
        const announcements = await response.json();

        const dismissedAnnouncements = JSON.parse(localStorage.getItem('dismissedAnnouncements')) || [];

        let hasUnread = false;

        announcements.forEach(ann => {
            if (dismissedAnnouncements.includes(ann.id)) {
                return; // No mostrar si ya fue descartado
            }

            hasUnread = true; // Si llegamos aquí, hay al menos un anuncio sin leer

            const card = document.createElement('div');
            card.className = `announcement-card ${ann.type || 'info'}`;
            card.dataset.id = ann.id;

            card.innerHTML = `
                <button class="announcement-dismiss-btn" aria-label="Descartar anuncio">&times;</button>
                <h3>${ann.title}</h3>
                <p>${ann.content}</p>
            `;

            card.querySelector('.announcement-dismiss-btn').addEventListener('click', () => {
                dismissedAnnouncements.push(ann.id);
                localStorage.setItem('dismissedAnnouncements', JSON.stringify(dismissedAnnouncements));
                card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                card.style.opacity = '0';
                card.style.transform = 'scale(0.95)';
                setTimeout(() => card.remove(), 300);
            });

            container.appendChild(card);
        });

        // Añadir la insignia al botón del menú si hay anuncios sin leer
        if (hasUnread) {
            document.getElementById('menu-toggle')?.classList.add('has-unread');
        }
    } catch (error) {
        console.error("Error fetching announcements:", error);
        // No es necesario mostrar un error en la UI, simplemente no se mostrarán anuncios.
    }
}

/**
 * Función principal para inicializar toda la lógica de la UI.
 */
export function initializeUI() {
    initializeMenu();
    initializeThemeToggle();
    initializeAnnouncements();
    initializeModal();
    initializeFullscreen();
    initializeCacheControls();
    initializeUser();
    initializeScheduleToggle();
    initializeDevToolsToggle();
    renderScheduleTable(); // Renderizar la tabla inicialmente
}

export { isSimulated }; // Exportar para que script.js pueda usarlo en setInterval