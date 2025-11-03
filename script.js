// c:\Users\Admin\Documents\GitHub\horario\script.js

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
 * Comprueba si hay una nueva versión de la aplicación y fuerza la actualización.
 */
async function checkForUpdates() {
    const currentVersion = 'v90'; // La versión actual del código que estás viendo
    const lastCheckedVersion = localStorage.getItem('appVersion');

    // Si la versión del código es más nueva que la guardada, forzamos la actualización.
    // Esto soluciona el caso donde el SW está "atascado" en una versión vieja.
    if (currentVersion !== lastCheckedVersion) {
        console.log(`Nueva versión detectada. Local: ${lastCheckedVersion}, Código: ${currentVersion}. Forzando actualización...`);

        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.getRegistration();
                if (registration) {
                    await registration.unregister();
                    console.log('Service Worker desregistrado para la actualización.');
                }
            } catch (error) {
                reportError(error, 'Fallo al desregistrar SW para actualización');
            }
        }
        
        localStorage.setItem('appVersion', currentVersion);
        alert('¡Hay una nueva actualización! La aplicación se recargará para aplicar los cambios.');
        window.location.reload(); // Forzar recarga para que el nuevo SW tome el control
    }
}

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

document.addEventListener('DOMContentLoaded', () => {
    // checkForUpdates(); // Desactivado temporalmente para dar prioridad al modal de versión
    showWhatsNewModal(); // Mostrar el modal de novedades si es necesario
    promptForUsernameIfNeeded(); // Pedir nombre de usuario si es necesario
    // Inicializar la lógica de tiempo y luego la UI y notificaciones
    fetchTime().then(() => {
        initializeUI(); // Inicializar todos los componentes de la UI
        initializeNotifications(); // Inicializar la lógica de notificaciones

        // Ejecutar una vez de inmediato para evitar el retraso inicial
        updateSchedule();
        updateClock();
        
        // Configurar los intervalos de actualización
        const updateInterval = isSimulated ? 1000 : 10000; // 1 segundo si es simulado, 10 segundos si es real
        setInterval(updateSchedule, updateInterval);
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