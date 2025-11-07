// c:/Users/Admin/Documents/GitHub/horario/teacher-schedule-logic.js

const groupSelect = document.getElementById('group-select');
const viewScheduleBtn = document.getElementById('view-schedule-btn');
const tableWrapper = document.querySelector('.table-wrapper');
const scheduleTitle = document.getElementById('schedule-title');
const scheduleTableBody = document.getElementById('schedule-table-body');

async function loadAndRenderSchedule(group) {
    try {
        // Importar dinámicamente el módulo del horario para el grupo seleccionado
        const scheduleModule = await import(`./schedule-data-${group}.js`);
        const { schedule } = scheduleModule;

        scheduleTitle.textContent = `Horario del Grupo ${group}`;
        renderScheduleTable(schedule);
        tableWrapper.style.display = 'block';
    } catch (error) {
        console.error(`Error al cargar el horario para el grupo ${group}:`, error);
        alert(`No se pudo encontrar el horario para el grupo ${group}.`);
        tableWrapper.style.display = 'none';
    }
}

function renderScheduleTable(schedule) {
    scheduleTableBody.innerHTML = '';
    const formatTime = (h, m) => `${(h % 12 || 12)}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;

    // Obtener todos los horarios únicos y ordenarlos
    const allTimes = new Set();
    schedule.forEach(day => day.forEach(c => {
        if (c.time) allTimes.add(c.time[0] * 60 + c.time[1]);
    }));
    const sortedTimes = Array.from(allTimes).sort((a, b) => a - b);

    sortedTimes.forEach(timeInMinutes => {
        const row = document.createElement('tr');
        const hours = Math.floor(timeInMinutes / 60);
        const minutes = timeInMinutes % 60;
        row.innerHTML = `<td>${formatTime(hours, minutes)}</td>` +
            [0, 1, 2, 3, 4].map(dayIndex => {
                const classItem = schedule[dayIndex]?.find(c => c.time && (c.time[0] * 60 + c.time[1] === timeInMinutes));
                if (classItem) {
                    return `<td><strong>${classItem.name}</strong><br><small>${classItem.teacher}</small></td>`;
                }
                return '<td></td>';
            }).join('');
        scheduleTableBody.appendChild(row);
    });
}

viewScheduleBtn.addEventListener('click', () => {
    const selectedGroup = groupSelect.value;
    if (selectedGroup) {
        loadAndRenderSchedule(selectedGroup);
    }
});