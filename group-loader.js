// c:\Users\Admin\Documents\GitHub\horario\group-loader.js

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
            modal.style.display = 'none';
            loadScheduleData(group);
        });
        groupButtonsContainer.appendChild(button);
    });

    modal.style.display = 'flex';
}

// Función para cargar los scripts principales de la aplicación.
function loadMainAppScripts() {
    const scriptsToLoad = [
        'schedule-utils.js',
        'notification-logic.js',
        'ui-logic.js',
        'script.js'
    ];

    scriptsToLoad.forEach(src => {
        const script = document.createElement('script');
        script.type = 'module';
        script.src = src;
        document.body.appendChild(script);
    });
}

function loadScheduleData(group) {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = `schedule-data-${group}.js`;
    script.onload = () => {
        // Una vez que el horario se ha cargado, cargamos el resto de la aplicación.
        loadMainAppScripts();
    };
    script.onerror = () => {
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
        loadScheduleData(userGroup);
    } else {
        showGroupSelectionModal();
    }
});

// Exponer función para cambiar de grupo desde el menú si se necesita
window.changeGroup = () => {
    localStorage.removeItem('user-group');
    window.location.reload();
};