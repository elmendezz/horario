// c:/Users/Admin/Documents/GitHub/horario/offline-logic.js

import { schedule } from './schedule-data.js';

/**
 * Renderiza la tabla completa del horario en la página offline.
 */
function renderScheduleTable() {
    const scheduleTableBody = document.getElementById('schedule-table-body');
    if (!scheduleTableBody) return;

    scheduleTableBody.innerHTML = '';
    const formatTime = (h, m) => `${(h % 12 || 12)}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
    const allTimes = new Set();
    schedule.forEach(day => day.forEach(c => allTimes.add(c.time[0] * 60 + c.time[1])));
    const sortedTimes = Array.from(allTimes).sort((a, b) => a - b);

    sortedTimes.forEach(timeInMinutes => {
        const row = document.createElement('tr');
        row.dataset.time = timeInMinutes;
        const hours = Math.floor(timeInMinutes / 60), minutes = timeInMinutes % 60;
        row.innerHTML = `<td>${formatTime(hours, minutes)}</td>` +
            [0, 1, 2, 3, 4].map(dayIndex => {
                const classItem = schedule[dayIndex].find(c => c.time[0] * 60 + c.time[1] === timeInMinutes);
                return `<td>${classItem ? `<strong>${classItem.name}</strong><br><small>${classItem.teacher}</small>` : ''}</td>`;
            }).join('');

        if (timeInMinutes === 15 * 60) { // 3:00 PM
            row.classList.add('receso-row');
        }
        scheduleTableBody.appendChild(row);
    });
}

/**
 * Inicializa el botón para mostrar/ocultar el horario.
 */
function initializeScheduleToggle() {
    const showScheduleBtn = document.getElementById('show-schedule-btn');
    const tableWrapper = document.querySelector('.table-wrapper');
    if (!showScheduleBtn || !tableWrapper) return;

    showScheduleBtn.addEventListener('click', () => {
        const isVisible = tableWrapper.classList.toggle('visible');
        showScheduleBtn.textContent = isVisible ? 'Ocultar Horario' : 'Mostrar Horario';
    });
}

// Inicializar todo al cargar el DOM.
document.addEventListener('DOMContentLoaded', () => {
    renderScheduleTable();
    initializeScheduleToggle();
});