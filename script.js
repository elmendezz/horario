// c:\Users\Admin\Documents\GitHub\horario\script.js

import { fetchTime, initializeUI, updateSchedule, updateClock, isSimulated } from './ui-logic.js';
import { initializeNotifications } from './notification-logic.js';

// Versión: 40 (Modularizado)

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar la lógica de tiempo y luego la UI y notificaciones
    fetchTime().then(() => {
        initializeUI(); // Inicializar todos los componentes de la UI
        initializeNotifications(); // Inicializar la lógica de notificaciones
        
        // Configurar los intervalos de actualización
        const updateInterval = isSimulated ? 1000 : 10000; // 1 segundo si es simulado, 10 segundos si es real
        setInterval(updateSchedule, updateInterval);
        setInterval(updateClock, 1000); // El reloj se actualiza cada segundo
    }).catch(error => {
        console.error("Error al inicializar la aplicación:", error);
        document.getElementById('current-class-display').textContent = "Error al cargar el horario.";
        document.getElementById('teacher-display').textContent = "Por favor, recarga la página.";
    });
});