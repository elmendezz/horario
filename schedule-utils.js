// c:/Users/Admin/Documents/GitHub/horario/schedule-utils.js

let noClassDays = [];
let lastFetched = 0;

async function getNoClassDays() {
    // Cachear los resultados por 5 minutos para no sobrecargar la API
    if (Date.now() - lastFetched > 5 * 60 * 1000) {
        try {
            // Estrategia "Cache First": intenta obtener de la caché primero para una carga rápida y offline.
            // 'no-cache' le dice al navegador que, aunque use la caché, debe revalidar con la red.
            // El Service Worker interceptará esto y devolverá la caché mientras actualiza en segundo plano.
            const response = await fetch('/api/messages?noClassDays=true', { cache: 'default' });
            if (response.ok) {
                noClassDays = await response.json();
                lastFetched = Date.now();
            }
        } catch (e) {
            console.error("No se pudieron cargar los días sin clases:", e);
        }
    }
    return noClassDays;
}

// REUSABLE LOGIC FUNCTION
export async function getCurrentAndNextClass(date, schedule) {
    // Obtener la duración de la clase del primer elemento que la tenga, o usar 50 por defecto.
    const classDuration = schedule.flat().find(c => c.duration)?.duration || 50;

    const day = date.getDay();
    const currentTotalMinutes = date.getHours() * 60 + date.getMinutes();
    
    let currentClass = null;
    let nextClass = null;
    let foundCurrent = false;

    if (day >= 1 && day <= 5) {
        const todaySchedule = schedule[day - 1];

        // Find current and next class
        for (let i = 0; i < todaySchedule.length; i++) {
            const classItem = todaySchedule[i];
            const classStartMinutes = classItem.time[0] * 60 + classItem.time[1];
            const duration = classItem.duration || classDuration;
            const classEndMinutes = classStartMinutes + duration;

            if (currentTotalMinutes >= classStartMinutes && currentTotalMinutes < classEndMinutes) {
                currentClass = classItem;
                if (i + 1 < todaySchedule.length) {
                    nextClass = todaySchedule[i + 1];
                } else {
                    nextClass = { name: "Fin de clases por hoy", time: null };
                }
                foundCurrent = true;
                break;
            }
        }
        
        // If no current class, find the next one
        if (!foundCurrent) {
            for (const classItem of todaySchedule) {
                 const classStartMinutes = classItem.time[0] * 60 + classItem.time[1];
                 if(classStartMinutes > currentTotalMinutes){
                    nextClass = classItem;
                    break;
                 }
            }
        }
    }
    
    // Comprobar si es un día sin clases
    const holidays = await getNoClassDays();
    const todayStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const holidayInfo = holidays.find(h => h.date === todayStr);
    if (holidayInfo) {
        currentClass = { name: "Día sin clases", teacher: holidayInfo.reason, isHoliday: true };
        foundCurrent = true;
    }

    // If still no next class today, look for the next school day
    if (!nextClass) {
         for (let i = 1; i <= 7; i++) {
            const nextDayIndex = (day + i - 1) % 7; // 0=Sun, 1=Mon...
            const nextDate = new Date(date);
            nextDate.setDate(date.getDate() + i);
            const nextDateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;
            if (nextDayIndex >= 0 && nextDayIndex <= 4 && schedule[nextDayIndex] && schedule[nextDayIndex].length > 0 && !holidays.find(h => h.date === nextDateStr)) {
                 nextClass = schedule[nextDayIndex][0]; // Ensure day is Mon-Fri, schedule exists, and it's not a holiday
                 nextClass.isNextDay = true; // Add a flag to indicate it's on a future day
                 break;
            }
        }
    }
    return { currentClass, nextClass };
}