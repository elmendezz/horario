// c:\Users\Admin\Documents\GitHub\horario\script.js

import { schedule, classDuration } from './schedule-data.js'; // Importa el horario cargado dinámicamente
import { fetchTime, initializeUI, updateSchedule, updateClock, isSimulated, updateAnnouncements } from './ui-logic.js';
import { initializeNotifications } from './notification-logic.js';
import { reportError } from './error-logic.js';

// Versión: 40 (Modularizado)

// --- Manejo de Errores Global ---
// Captura errores de JavaScript no controlados en cualquier parte de la aplicación.
window.addEventListener('error', (event) => {
    reportError(event.error, 'Error Global');
});

// Captura promesas rechazadas que no fueron manejadas con un .catch().
window.addEventListener('unhandledrejection', (event) => {
    reportError(event.reason, 'Promesa no controlada');
});

/**
 * Muestra el modal de "Novedades" si la versión ha cambiado.
 */
function showWhatsNewModal() {
    const currentVersion = 'v91'; // Esta debe coincidir con la versión en CACHE_NAME
    const lastSeenVersion = localStorage.getItem('lastSeenVersion');

    if (currentVersion !== lastSeenVersion) {
        const modal = document.getElementById('version-modal');
        const closeBtn = document.getElementById('close-version-modal-btn');

        if (modal && closeBtn) {
            modal.style.display = 'block';

            closeBtn.onclick = () => {
                modal.style.display = 'none';
                localStorage.setItem('lastSeenVersion', currentVersion);
            };
        }
    }
}

/**
 * Muestra un modal para pedir el nombre del usuario si es la primera vez que visita.
 */
function promptForUsernameIfNeeded() {
    const username = localStorage.getItem('username');
    if (!username) {
        const modal = document.getElementById('username-modal');
        const form = document.getElementById('username-form');
        const input = document.getElementById('username-input');

        if (modal && form && input) {
            modal.style.display = 'block';
            input.focus();

            form.onsubmit = (e) => {
                e.preventDefault();
                const newUsername = input.value.trim();
                if (newUsername) {
                    localStorage.setItem('username', newUsername);
                    modal.style.display = 'none';
                    // Actualiza el saludo inmediatamente
                    const userGreetingMenuEl = document.getElementById('user-greeting-menu');
                    if(userGreetingMenuEl) userGreetingMenuEl.innerHTML = `👋 ¡Hola, ${newUsername}!`;
                }
            };
        }
    }
}

/**
 * Gestiona la lógica de actualización del Service Worker, mostrando un toast al usuario.
 */
function manageSWUpdates() {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.getRegistration().then(reg => {
        if (!reg) return;

        // 1. Comprobar si ya hay un SW esperando al cargar la página.
        if (reg.waiting) {
            showUpdateToast(reg.waiting);
            return;
        }

        // 2. Escuchar por nuevas versiones que se instalen.
        reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                    // Si el nuevo SW está instalado y esperando, mostramos el toast.
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        showUpdateToast(newWorker);
                    }
                });
            }
        });
    });

    // 3. Escuchar el cambio de controlador y recargar la página.
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
            window.location.reload();
            refreshing = true;
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // La nueva lógica de actualización del SW reemplaza a la antigua función checkForUpdates.
    manageSWUpdates();

    showWhatsNewModal(); // Mostrar el modal de novedades si es necesario
    promptForUsernameIfNeeded(); // Pedir nombre de usuario si es necesario
    // Inicializar la lógica de tiempo y luego la UI y notificaciones
    fetchTime().then(async () => {
        initializeUI(schedule); // Inicializar todos los componentes de la UI, pasándole el horario
        initializeNotifications(); // Inicializar la lógica de notificaciones

        // Ejecutar una vez de inmediato para evitar el retraso inicial
        await updateSchedule(schedule, classDuration);
        updateClock();
        
        // Configurar los intervalos de actualización
        const updateInterval = isSimulated ? 1000 : 10000; // 1 segundo si es simulado, 10 segundos si es real
        setInterval(() => updateSchedule(schedule, classDuration), updateInterval);
        setInterval(updateClock, 1000); // El reloj se actualiza cada segundo
    }).catch(error => {
        reportError(error, 'Inicialización Principal'); // Usamos nuestro nuevo reportero
        document.getElementById('current-class-display').textContent = "Error al cargar el horario.";
        document.getElementById('teacher-display').textContent = "Por favor, recarga la página.";
    });
});

// Escuchar cambios en los anuncios desde otras pestañas (ej. desde announcements.html)
const announcementChannel = new BroadcastChannel('announcement_channel');
announcementChannel.onmessage = (event) => {
    if (event.data && event.data.type === 'NEW_ANNOUNCEMENT') {
        console.log('Nuevo anuncio detectado, recargando anuncios...');
        // Llamamos a la función unificada para actualizar todo.
        updateAnnouncements();
    }
};

/**
 * Muestra el toast de actualización y configura su botón.
 * @param {ServiceWorker} worker - El nuevo Service Worker que está en estado 'waiting'.
 */
function showUpdateToast(worker) {
    const toast = document.getElementById('update-toast');
    const updateBtn = document.getElementById('update-now-btn');

    if (!toast || !updateBtn) return;

    toast.classList.add('visible');
    updateBtn.onclick = () => {
        worker.postMessage({ type: 'SKIP_WAITING' });
    };
}