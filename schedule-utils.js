// c:\Users\Admin\Documents\GitHub\horario\schedule-utils.js

import { classDuration } from './schedule-data.js';

// REUSABLE LOGIC FUNCTION
export function getCurrentAndNextClass(date, scheduleToUse) {
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
    
    // If still no next class today, look for the next school day
    if (!nextClass) {
         for (let i = 1; i <= 7; i++) { // Buscar en los próximos 7 días
            const nextDayIndex = (day + i - 1) % 7; // 0=Sun, 1=Mon...
            if (nextDayIndex >= 0 && nextDayIndex <= 4 && scheduleToUse[nextDayIndex] && scheduleToUse[nextDayIndex].length > 0) { // Asegurarse de que el día sea de L-V y el horario exista
                 nextClass = scheduleToUse[nextDayIndex][0];
                 nextClass.isNextDay = true; // Add a flag to indicate it's on a future day
                 break;
            }
        }
    }
    return { currentClass, nextClass, day }; // Retornar también el día
}