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

document.addEventListener('DOMContentLoaded', () => {
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