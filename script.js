// c:\Users\Admin\Documents\GitHub\horario\script.js

import { 
    fetchTime, 
    updateClock, 
    updateSchedule, 
    initializeUI, 
    isSimulated 
} from './ui-logic.js';

/**
 * Función principal que se ejecuta cuando el DOM está completamente cargado.
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializa todos los componentes de la interfaz de usuario (botones, menús, etc.).
    initializeUI();

    // 2. Función asíncrona para configurar el ciclo de actualización principal.
    async function main() {
        // Obtiene la hora (local, de internet o simulada).
        await fetchTime();
        // Actualiza la información del horario y el reloj una vez al inicio.
        updateSchedule();
        updateClock();

        // 3. Establece los intervalos para actualizaciones periódicas.
        setInterval(updateClock, 1000); // El reloj se actualiza cada segundo.
        setInterval(updateSchedule, isSimulated ? 1000 : 10000); // El horario se actualiza cada 10s (o 1s si es simulado).
    }

    // 4. Inicia el ciclo principal.
    main();
});