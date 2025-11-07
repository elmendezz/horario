// c:\Users\Admin\Documents\GitHub\horario\group-loader.js

/**
 * Envía un mensaje al Service Worker.
 * @param {object} message - El objeto de mensaje a enviar.
 */
function sendMessageToSW(message) {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage(message);
    }
}

// Lista de grupos disponibles.
const GROUPS = ['1A', '1B', '1C', '1D', '1E', '1F', '1AV', '1BV', '1CV', '1DV'];

function showGroupSelectionModal() {
    const modal = document.getElementById('group-selection-modal');
    const groupButtonsContainer = document.getElementById('group-buttons');

    GROUPS.forEach(group => {
        const button = document.createElement('button');
        button.textContent = group;
        button.className = 'styled-button';
        button.style.margin = '5px';
        button.addEventListener('click', () => {
            localStorage.setItem('user-group', group);
            // Informar al Service Worker sobre el grupo seleccionado.
            sendMessageToSW({ type: 'SET_USER_GROUP', payload: { group } });
            // Recargar la página para que se inicialice con el nuevo grupo.
            window.location.reload();
        });
        groupButtonsContainer.appendChild(button);
    });

    modal.style.display = 'flex';
}

/**
 * Carga dinámicamente el horario de un grupo y luego inicia la aplicación principal.
 * @param {string} group - El grupo a cargar (ej. '1CV').
 */
async function loadScheduleAndStartApp(group) {
    try {
        // Informar al Service Worker sobre el grupo actual en cada carga.
        sendMessageToSW({ type: 'SET_USER_GROUP', payload: { group } });

        // 1. Importar dinámicamente los datos del horario.
        const scheduleModule = await import(`./schedule-data-${group}.js`);
        const { schedule, classDuration } = scheduleModule;

        // 2. Importar dinámicamente la función principal de la aplicación.
        const mainAppModule = await import('./script.js');

        // 3. Ejecutar la función principal, pasándole los datos del horario.
        mainAppModule.main(schedule, classDuration);

    } catch (error) {
        console.error(`Error al cargar el horario para el grupo ${group}. Volviendo a la selección.`);
        alert(`No se pudo cargar el horario para el grupo ${group}. Por favor, selecciona otro.`);
        localStorage.removeItem('user-group');
        showGroupSelectionModal();
    };
    document.body.appendChild(script);
}

document.addEventListener('DOMContentLoaded', () => {
    const userGroup = localStorage.getItem('user-group');

    if (userGroup && GROUPS.includes(userGroup)) {
        loadScheduleAndStartApp(userGroup);
    } else {
        showGroupSelectionModal();
    }
});

// Exponer función para cambiar de grupo desde el menú si se necesita
window.changeGroup = () => {
    localStorage.removeItem('user-group');
    window.location.reload();
};