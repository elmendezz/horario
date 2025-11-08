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

// Lista de grupos disponibles. Añadimos variantes matutino/vespertino y aliases que aparecen en los datos
const GROUPS = [
    // 1º
    '1A','1B','1C','1D','1E','1F','1AV','1BV','1CV','1DV',
    // 2º
    '2A','2B','2C','2D','2E','2F','2AV','2BV','2CV','2DV','2EV','2FV',
    // 3º
    '3A','3B','3C','3D','3E','3F','3AV','3BV','3CV','3DV','3EV','3FV',
    // 5º
    '5A','5B','5C','5D','5E','5F','5AV','5BV','5CV','5DV','5EV','5FV',
    // Aliases exactos que aparecen en all-horarios (por ejemplo: 3AEV maps a 3AV)
    '3AE','3AEV','3BEV','5AE','5AEV','5BEV'
];

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
}

document.addEventListener('DOMContentLoaded', () => {
    const userGroup = localStorage.getItem('user-group');

    if (userGroup && GROUPS.includes(userGroup)) {
        // Mostrar mensaje de ayuda en la consola para desarrolladores.
        console.log(
            '%c🛠️ Modo Desarrollador: %cPara cambiar de grupo, usa la función %cloadGroup("GRUPO")',
            'color: #89b4f8; font-weight: bold; font-size: 1.1em;',
            'color: #e3e3e3;',
            'color: #f4a78f; font-family: monospace;'
        );

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

/**
 * (NUEVO) Permite cambiar de grupo desde la consola del desarrollador.
 * Uso: loadGroup('1CV')
 * @param {string} group - El nombre del grupo a cargar.
 */
window.loadGroup = (group) => {
    if (GROUPS.includes(group.toUpperCase())) {
        console.log(`Cargando grupo: ${group.toUpperCase()}`);
        localStorage.setItem('user-group', group.toUpperCase());
        window.location.reload();
    } else {
        console.error(`El grupo "${group}" no es válido. Grupos disponibles:`, GROUPS);
    }
};