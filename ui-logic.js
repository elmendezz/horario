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
let lastDisplayedClassName = null; // <-- NUEVA VARIABLE para controlar la animación
let currentActiveClassInfo = null; // Almacenará la clase activa para resaltarla

/**
 * Obtiene la hora actual del servidor o usa una hora simulada.
 */
export async function fetchTime() {
    const timeSource = localStorage.getItem('timeSource') || 'local'; // 'local' es el nuevo valor por defecto
    const simulatedTime = localStorage.getItem('simulatedTime');
    const aviso = document.getElementById('aviso');

    if (simulatedTime) {
        const { day, hour, minute } = JSON.parse(simulatedTime);
        const now = new Date();
        // Ajustar la fecha para que la simulación siempre sea en el futuro si el día ya pasó esta semana
        serverTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + day, hour, minute, 0);
        if (serverTime < now) {
            serverTime.setDate(serverTime.getDate() + 7); // Si el día simulado ya pasó esta semana, simularlo para la próxima
        }
        isSimulated = true;
        if (aviso) aviso.textContent = "🕒 Usando hora simulada.";
    } else if (timeSource === 'internet') {
        try {
            const response = await fetch('https://worldtimeapi.org/api/timezone/America/Tijuana');
            if (!response.ok) throw new Error('La respuesta de la red no fue correcta');
            const data = await response.json();
            serverTime = new Date(data.datetime);
            if (aviso) aviso.textContent = "☁️ Hora sincronizada con internet.";
        } catch (error) {
            reportError(error, 'fetchTime API');
            serverTime = new Date(); // Fallback a la hora local si falla la API
            if (aviso) aviso.textContent = "⚠️ No se pudo sincronizar la hora. Usando hora local.";
        } finally {
            isSimulated = false;
        }
    } else {
        // Por defecto o si timeSource === 'local'
        serverTime = new Date();
        isSimulated = false;
        if (aviso) aviso.textContent = "📱 Usando la hora de tu dispositivo.";
    }

    // Reiniciar el punto de partida para el cálculo del reloj local
    startTime = Date.now();
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
    // Usamos innerHTML para poder animar el separador
    if (clockEl) {
        clockEl.innerHTML = isSimulated ? `Hora Simulada: ${hours}<span class="colon">:</span>${minutes}<span class="colon">:</span>${seconds} ${am_pm}` : `Hora: ${hours}<span class="colon">:</span>${minutes}<span class="colon">:</span>${seconds} ${am_pm}`;
    }

    const countdownEl = document.getElementById('countdown');
    const nextClassCountdownContainer = document.getElementById('next-class-countdown-container');
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
 * Actualiza la información de la clase actual y la siguiente en la UI.
 */
export async function updateSchedule() {
    if (!serverTime) return;
    const container = document.querySelector('.container');
    const now = new Date(serverTime.getTime() + (Date.now() - startTime));
    const currentClassDisplay = document.getElementById('current-class-display');
    const teacherDisplay = document.getElementById('teacher-display');
    const nextClassDisplay = document.getElementById('next-class-display');
    const countdownEl = document.getElementById('countdown');
    nextClassDisplay.textContent = "Siguiente: Ninguna"; // <-- VALOR POR DEFECTO
    // Ocultar por defecto y solo mostrar cuando sea relevante.
    nextClassDisplay.style.display = 'none';
    
    currentClassEnd = null;
    currentActiveClassInfo = null; // Reiniciar en cada actualización
    countdownEl.dataset.nextClassStart = "";
    container?.classList.remove('is-in-session');
    container?.classList.remove('is-idle-glow');
    const formatTime = (h, m) => `${(h % 12 || 12)}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
    const nextClassCountdownContainer = document.getElementById('next-class-countdown-container');

    const { currentClass, nextClass } = await getCurrentAndNextClass(now, schedule);

    // Determinar el estado y el texto a mostrar
    let newClassName, newTeacherName;
    if (currentClass) {
        newClassName = currentClass.name;
        newTeacherName = currentClass.teacher;
        container?.classList.add(currentClass.isHoliday ? 'is-idle-glow' : 'is-in-session'); // Aplica el efecto visual correcto
        // Solo calcula el tiempo de finalización si NO es un día festivo y tiene una hora definida
        if (!currentClass.isHoliday && currentClass.time) {
            const classStartMinutes = currentClass.time[0] * 60 + currentClass.time[1];
            const classEndMinutes = classStartMinutes + (currentClass.duration || classDuration);
            currentClassEnd = new Date(now);
            currentClassEnd.setHours(Math.floor(classEndMinutes / 60), classEndMinutes % 60, 59, 999);
            currentActiveClassInfo = { ...currentClass, dayIndex: now.getDay() - 1 };
        }
    }

    // Determinar el estado y el texto a mostrar
    if (currentClass) {
        newClassName = currentClass.name;
        newTeacherName = currentClass.teacher;
        nextClassCountdownContainer?.classList.remove('visible'); // Ocultar contador grande
    } else {
        newClassName = "¡Sin Clases!";
        newTeacherName = "Disfruta tu día";
    }

    // --- Lógica para animar palabras SOLO si el texto ha cambiado ---
    if (newClassName !== lastDisplayedClassName) {
        const words = newClassName.split(' ');
        currentClassDisplay.innerHTML = words.map((word, index) => 
            `<span class="word" style="animation-delay: ${index * 0.1}s">${word}</span>`
        ).join('');
        lastDisplayedClassName = newClassName;
    }
    teacherDisplay.textContent = newTeacherName;

    if (nextClass) {
        nextClassDisplay.textContent = `Siguiente: ${nextClass.name}`;
        // Solo mostrar "Siguiente clase" si hay una clase en curso o si la siguiente clase no es para otro día.
        if (currentClass || !nextClass.isNextDay) {
            nextClassDisplay.style.display = 'block';
        }
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
                        [0, 1, 2, 3, 4].map(dayIndex => {
                            const classItem = schedule[dayIndex].find(c => c.time[0] * 60 + c.time[1] === timeInMinutes);
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
        // Actualizar el color de la barra de navegación del sistema
        const themeColorMeta = document.getElementById('theme-color-meta');
        if (themeColorMeta) {
            // Estos colores deben coincidir con --bg-color en style.css
            themeColorMeta.content = theme === 'dark' ? '#131314' : '#f0f0f0';
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
    const tableWrapper = document.querySelector('.table-wrapper');
    showScheduleBtn.addEventListener('click', () => {
        const isVisible = tableWrapper.classList.toggle('visible');
        showScheduleBtn.textContent = isVisible ? 'Ocultar Horario' : 'Mostrar Horario';
        
        if (isVisible) {
            // Aplicar animación escalonada a las filas al mostrar la tabla
            const rows = tableWrapper.querySelectorAll('#schedule-table tr');
            rows.forEach((row, index) => {
                row.style.animationDelay = `${index * 0.05}s`;
            });
            highlightCurrentClassInTable();
            highlightHolidayColumns();
        }
    });
}

/**
 * Inicializa el botón para mostrar las herramientas de desarrollo.
 */
function initializeDevToolsToggle() {
    const devToolsBtn = document.getElementById('show-dev-tools-btn');
    const adminLink = document.createElement('a');
    adminLink.href = 'schedule-admin.html';
    adminLink.className = 'menu-button';
    adminLink.style.color = '#ffc107';
    adminLink.textContent = '📅 Admin. Días sin Clases';

    devToolsBtn.addEventListener('click', () => {
        const password = prompt('Ingresa la contraseña para ver las herramientas de desarrollo:');
        if (password === '1CV') {
            document.getElementById('developer-tools').style.display = 'flex';
            devToolsBtn.style.display = 'none'; // Ocultar el botón después de usarlo
            devToolsBtn.parentElement.appendChild(adminLink); // Añadir el enlace de admin
            alert('Acceso concedido. Herramientas de desarrollo visibles.');
        } else if (password !== null) { // Si el usuario no presionó "Cancelar"
            alert('Contraseña incorrecta.');
        }
    });
}

/**
 * Resalta las columnas de días festivos en la tabla del horario.
 */
async function highlightHolidayColumns() {
    // Limpiar resaltados anteriores
    document.querySelectorAll('#schedule-table .holiday-column').forEach(cell => cell.classList.remove('holiday-column'));

    const holidays = await (await fetch('/api/messages?noClassDays=true')).json();
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalizar a medianoche para comparaciones de día

    // Filtrar solo los elementos que son días festivos válidos (tienen una propiedad 'date')
    const validHolidays = holidays.filter(holiday => holiday && holiday.date);

    validHolidays.forEach(holiday => {
        const holidayDate = new Date(holiday.date.replace(/-/g, '/'));
        const holidayDayOfWeek = holidayDate.getDay(); // 0=Sun, 1=Mon...
        if (holidayDate.getTime() >= today.getTime()) { // Solo para hoy y el futuro
            const columnIndex = holidayDayOfWeek; // 1=Lunes, 2=Martes...
            if (columnIndex >= 1 && columnIndex <= 5) {
                document.querySelectorAll(`#schedule-table tr`).forEach(row => {
                    if (row.cells[columnIndex]) {
                        row.cells[columnIndex].classList.add('holiday-column');
                    }
                });
            }
        }
    });
}

/**
 * Inicializa la funcionalidad del modal de ayuda para widgets.
 */
function initializeWidgetHelpModal() {
    const openBtn = document.getElementById('add-widget-btn');
    const modal = document.getElementById('widget-help-modal');
    const closeBtn = document.getElementById('close-widget-help-modal-btn');

    if (openBtn && modal && closeBtn) {
        openBtn.addEventListener('click', () => {
            modal.style.display = 'block';
        });
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
}

/**
 * Inicializa la lógica del menú lateral (hamburguesa).
 */
function initializeMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const closeMenuBtn = document.getElementById('close-menu-btn');
    const sideMenu = document.getElementById('side-menu');
    const overlay = document.getElementById('menu-overlay');
    let previouslyFocused = null;

    // Obtiene todos los elementos focusables dentro del menú
    function getFocusableElements(container) {
        const selectors = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';
        return Array.from(container.querySelectorAll(selectors)).filter(el => el.offsetParent !== null);
    }

    function handleKeyDown(e) {
        // Cerrar con Escape
        if (e.key === 'Escape') {
            e.preventDefault();
            closeMenu();
            return;
        }

        // Trap focus dentro del menú
        if (e.key === 'Tab') {
            const focusables = getFocusableElements(sideMenu);
            if (focusables.length === 0) {
                e.preventDefault();
                return;
            }
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            } else if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            }
        }
    }
    
    const openMenu = () => {
        if (!menuToggle) return;
        previouslyFocused = document.activeElement;

        sideMenu.classList.add('open');
        sideMenu.setAttribute('aria-hidden', 'false');
        menuToggle.setAttribute('aria-expanded', 'true');
        overlay.classList.add('open');

        // Aplicar animación escalonada a los botones del menú
        const menuButtons = sideMenu.querySelectorAll('.menu-button');
        menuButtons.forEach((button, index) => {
            button.style.animationDelay = `${index * 0.05}s`;
        });

        // Mover el foco al primer elemento (que ahora es el botón de cerrar)
        const focusables = getFocusableElements(sideMenu);
        if (focusables.length) {
            focusables[0].focus();
        } else {
            sideMenu.focus(); // Fallback por si no hay nada focusable
        }

        document.addEventListener('keydown', handleKeyDown);
    };

    const closeMenu = () => {
        if (!menuToggle) return;
        sideMenu.classList.remove('open');
        sideMenu.setAttribute('aria-hidden', 'true');
        menuToggle.setAttribute('aria-expanded', 'false');
        overlay.classList.remove('open');

        // Resetear la animación para la próxima vez que se abra
        const menuButtons = sideMenu.querySelectorAll('.menu-button');
        menuButtons.forEach((button) => button.style.animationDelay = '');

        document.removeEventListener('keydown', handleKeyDown);

        // Devolver el foco al botón que abrió el menú
        if (previouslyFocused) {
            previouslyFocused.focus();
            previouslyFocused = null;
        }
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
 * Maneja el clic en una reacción de emoji.
 * @param {string} annId - El ID del anuncio.
 * @param {string} emoji - El emoji con el que se reaccionó.
 */
async function handleReaction(annId, emoji) {
    const reactionButton = document.querySelector(`.announcement-card[data-id="${annId}"] .reaction-btn[data-emoji="${emoji}"]`);
    if (reactionButton.classList.contains('reacted')) return; // Prevenir múltiples clics

    reactionButton.classList.add('reacted');
    const countSpan = reactionButton.querySelector('span');
    countSpan.textContent = parseInt(countSpan.textContent, 10) + 1;

    try {
        await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'reaction',
                announcementId: annId,
                emoji: emoji
            })
        });
    } catch (error) {
        console.error('Error al enviar la reacción:', error);
        // Opcional: revertir el cambio visual si la API falla
        countSpan.textContent = parseInt(countSpan.textContent, 10) - 1;
        reactionButton.classList.remove('reacted');
    }
}
/**
 * Carga y muestra los anuncios del administrador.
 */
export async function initializeAnnouncements() {
    const container = document.getElementById('announcements-container');
    if (!container) return;
    container.innerHTML = ''; // Limpiar antes de renderizar
    try {
        const response = await fetch('/api/messages?announcements=true');
        if (!response.ok) throw new Error('Failed to fetch announcements');
        const announcements = await response.json();

        const dismissedAnnouncements = JSON.parse(localStorage.getItem('dismissedAnnouncements')) || [];

        // Mostrar siempre los 3 anuncios más recientes
        const recentAnnouncements = announcements.slice().reverse().slice(0, 3);

        let hasUnread = false;

        if (recentAnnouncements.length > 0) {
            container.innerHTML = '<h2 style="color: var(--accent-color); text-align: center; width: 100%; margin-bottom: 1em;">Anuncios Recientes</h2>';
        }

        recentAnnouncements.forEach(ann => {
            if (dismissedAnnouncements.includes(ann.id)) {
                // No marcar como no leído si ya fue descartado
            } else {
                hasUnread = true;
            }

            const card = document.createElement('div');
            card.className = `announcement-card ${ann.type || 'info'}`;
            card.dataset.id = ann.id;

            const date = ann.timestamp ? new Date(ann.timestamp) : null;
            const formattedDate = date ? date.toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' }) : 'Fecha no disponible';
            const author = ann.author || 'Admin';

            const reactions = ann.reactions || {};
            const reactionsHTML = `
                <div class="reactions-container">
                    <div class="emoji-picker">
                        <button class="reaction-btn" data-emoji="👍">👍 <span>${reactions['👍'] || 0}</span></button>
                        <button class="reaction-btn" data-emoji="❤️">❤️ <span>${reactions['❤️'] || 0}</span></button>
                        <button class="reaction-btn" data-emoji="😂">😂 <span>${reactions['😂'] || 0}</span></button>
                        <button class="reaction-btn" data-emoji="😮">😮 <span>${reactions['😮'] || 0}</span></button>
                    </div>
                    <button class="add-reaction-btn">+</button>
                </div>
            `;

            card.innerHTML = `
                <h3>${ann.title}</h3>
                <p>${ann.content}</p>
                <div class="announcement-footer">
                    ${reactionsHTML}
                    <div class="announcement-meta">
                        <button class="info-btn" aria-label="Información del anuncio">ⓘ</button>
                        <span class="info-tooltip">Publicado por ${author} el ${formattedDate}</span>
                    </div>
                </div>
            `;

            card.querySelector('.add-reaction-btn').addEventListener('click', (e) => {
                e.currentTarget.closest('.reactions-container').classList.toggle('open');
            });

            card.querySelectorAll('.reaction-btn').forEach(btn => {
                btn.addEventListener('click', () => handleReaction(ann.id, btn.dataset.emoji));
            });


            container.appendChild(card);
        });

        // Aplicar animación de entrada escalonada a las tarjetas de anuncios
        const announcementCards = container.querySelectorAll('.announcement-card');
        announcementCards.forEach((card, index) => {
            card.style.animation = `fadeInUp 0.6s ease-out forwards ${index * 0.1}s`;
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
/** * Inicializa el control para cambiar la fuente de la hora (local/internet). */
function initializeTimeSourceToggle() {
    const timeSourceToggle = document.getElementById('time-source-toggle');
    if (!timeSourceToggle) return;

    const updateButtonText = () => {
        const timeSource = localStorage.getItem('timeSource') || 'local';
        timeSourceToggle.innerHTML = timeSource === 'local' 
            ? '☁️ Usar Hora de Internet' 
            : '📱 Usar Hora Local';
    };

    timeSourceToggle.addEventListener('click', () => {
        const currentSource = localStorage.getItem('timeSource') || 'local';
        const newSource = currentSource === 'local' ? 'internet' : 'local';
        localStorage.setItem('timeSource', newSource);
        updateButtonText();
        const sourceName = newSource === 'local' 
            ? 'la hora de tu dispositivo (Local)' 
            : 'la hora de Internet';
        alert(`¡Listo! Ahora se usará ${sourceName}. La página se recargará para aplicar el cambio.`);
        window.location.reload();
    });

    updateButtonText(); // Establecer texto inicial al cargar
}
/** * Inicializa la carga de anuncios en tiempo real (polling). * Los anuncios se mostrarán como toasts en la parte inferior de la página. */
export function initializeLiveAnnouncements() {
    const container = document.getElementById('live-announcements-container');
    if (!container) return;

    // Usar una variable global para que no se reinicie el Set cada vez que se llama.
    if (!window.shownAnnouncementIds) {
        window.shownAnnouncementIds = new Set();
    }
    let shownAnnouncementIds = window.shownAnnouncementIds;

    const fetchAndDisplayAnnouncements = async () => {
        try {
            // Usamos 'no-cache' para asegurarnos de obtener siempre la última versión
            const response = await fetch('/api/messages?announcements=true', { cache: 'no-cache' });
            if (!response.ok) {
                // No lanzamos error para no llenar la consola en cada fallo de polling
                console.warn('Live Announcements: Could not fetch from server.');
                return;
            }
            const announcements = await response.json();
            const dismissedToastIds = JSON.parse(localStorage.getItem('dismissedToastIds')) || [];

            // Tomar solo los 3 anuncios más recientes para evitar una avalancha de toasts.
            const recentAnnouncements = announcements.slice().reverse().slice(0, 3);

            recentAnnouncements.forEach(ann => {
                // Mostrar solo si no se ha mostrado en esta sesión Y no ha sido descartado permanentemente.
                if (!shownAnnouncementIds.has(ann.id) && !dismissedToastIds.includes(ann.id)) {
                    shownAnnouncementIds.add(ann.id);
                    // Solo se mostrará el toast del anuncio más reciente debido al innerHTML = '' en la función.
                    displayAnnouncementToast(ann);
                }
            });

        } catch (error) {
            // Silenciamos el error en la consola para no ser intrusivos
            // console.error("Error polling for live announcements:", error);
        }
    };

    const displayAnnouncementToast = (ann) => {
        // Limpiar toasts anteriores para mostrar solo el más reciente
        container.innerHTML = '';

        const toast = document.createElement('div');
        toast.className = `live-announcement-toast ${ann.type || 'info'}`;
        
        toast.innerHTML = `
            <div class="toast-content">
                <h3>${ann.title}</h3>
                <p>${ann.content}</p>
            </div>
            <button class="toast-dismiss-btn">&times;</button>
            <div class="toast-progress-bar"></div>
        `;

        const dismiss = () => {
            // Guardar el ID de este toast para no volver a mostrarlo.
            const dismissedToastIds = JSON.parse(localStorage.getItem('dismissedToastIds')) || [];
            if (!dismissedToastIds.includes(ann.id)) {
                dismissedToastIds.push(ann.id);
                localStorage.setItem('dismissedToastIds', JSON.stringify(dismissedToastIds));
            }

            toast.classList.add('fade-out');
            // Esperar a que la animación de salida termine antes de remover
            toast.addEventListener('animationend', () => toast.remove(), { once: true });
        };

        toast.querySelector('.toast-dismiss-btn').addEventListener('click', dismiss);
        container.appendChild(toast);

        // El toast se elimina automáticamente después de 2 segundos (sin guardarlo como descartado)
        setTimeout(() => {
            toast.classList.add('fade-out');
            toast.addEventListener('animationend', () => toast.remove(), { once: true });
        }, 2000);
    };

    // Evitar múltiples intervalos si la función se llama de nuevo
    if (!window.announcementInterval) {
        fetchAndDisplayAnnouncements(); // Llamar una vez al inicio
        window.announcementInterval = setInterval(fetchAndDisplayAnnouncements, 30000); // Consultar cada 30 segundos
    } else {
        // Si el intervalo ya existe, solo ejecuta la búsqueda una vez para actualizar.
        fetchAndDisplayAnnouncements();
    }
}
/** * Función unificada para actualizar ambos tipos de anuncios. */
export function updateAnnouncements() {
    initializeAnnouncements();
    initializeLiveAnnouncements();
}

/**
 * Inicializa el botón para registrar manualmente el Service Worker.
 */
function initializeSWRegistrationButton() {
    const registerSWBtn = document.getElementById('register-sw-btn');
    if (!registerSWBtn) return;

    registerSWBtn.addEventListener('click', () => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => {
                    alert(`Service Worker registrado con éxito. Ámbito: ${reg.scope}`);
                    window.location.reload();
                })
                .catch(err => alert(`Fallo en el registro del Service Worker: ${err}`));
        }
    });
}

/**
 * Inicializa el botón para cargar la consola de depuración Eruda bajo demanda.
 * Es ideal para depurar en dispositivos móviles.
 */
function initializeEruda() {
    const showErudaBtn = document.getElementById('show-eruda-console-btn');
    const hideErudaBtn = document.getElementById('hide-eruda-console-btn');
    if (!showErudaBtn || !hideErudaBtn) return;

    // Si Eruda ya está cargado y activo
    if (typeof eruda !== 'undefined') {
        showErudaBtn.textContent = '👁️ Mostrar/Ocultar Consola';
        showErudaBtn.addEventListener('click', () => eruda.toggle());

        // Mostrar el botón de desactivar y asignarle su lógica
        hideErudaBtn.style.display = 'block';
        hideErudaBtn.addEventListener('click', () => {
            localStorage.removeItem('eruda-debug-mode');
            alert('Modo de depuración DESACTIVADO. La página se recargará.');
            window.location.reload();
        });
    } else {
        // Si Eruda no está cargado, el botón principal sirve para activar el modo
        showErudaBtn.addEventListener('click', () => {
            localStorage.setItem('eruda-debug-mode', 'true');
            alert('Modo de depuración ACTIVADO. La página se recargará para iniciar la consola.');
            window.location.reload();
        });
    }
}


/**
 * Función principal para inicializar toda la lógica de la UI.
 */
export function initializeUI() {
    initializeMenu();
    initializeThemeToggle();
    // Llamada unificada para inicializar los anuncios
    updateAnnouncements();
    initializeModal();
    initializeWidgetHelpModal();
    initializeFullscreen();
    initializeCacheControls();
    initializeUser();
    initializeScheduleToggle();
    initializeTimeSourceToggle();
    initializeDevToolsToggle();
    initializeSWRegistrationButton();
    initializeEruda(); // <-- Añadimos la inicialización de Eruda aquí
    renderScheduleTable(); // Renderizar la tabla inicialmente
}

export { isSimulated }; // Exportar para que script.js pueda usarlo en setInterval