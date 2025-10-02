// sw.js (Versión con Widgets)

const CACHE_NAME = 'horario-1cv-cache-v89';
const urlsToCache = [
    '/', 
    'index.html', 
    'horario.jpg', 
    'manifest.json',
    'widget_template.json', // Agregamos el template del widget a la caché
    'images/icons/icon-192x192.png'
];

// Horario (ya lo tenías, se mantiene igual)
const schedule = [
    [{ time: [12, 30], name: "Cultura Digital I", duration: 50 }, { time: [13, 20], name: "Ingles I", duration: 50 }, { time: [14, 10], name: "Ingles I", duration: 50 }, { time: [15, 0], name: "Receso", duration: 20 }, { time: [15, 20], name: "Humanidades I", duration: 50 }, { time: [16, 10], name: "Lengua y Comunicación I", duration: 50 }, { time: [17, 0], name: "La Materia y sus Interacciones", duration: 50 }],
    [{ time: [13, 20], name: "Cultura Digital I", duration: 50 }, { time: [14, 10], name: "Cultura Digital I", duration: 50 }, { time: [15, 0], name: "Receso", duration: 20 }, { time: [15, 20], name: "Lengua y Comunicación I", duration: 50 }, { time: [16, 10], name: "La Materia y sus Interacciones", duration: 50 }, { time: [17, 0], name: "Ingles I", duration: 50 }],
    [{ time: [14, 10], name: "Humanidades I", duration: 50 }, { time: [15, 0], name: "Receso", duration: 20 }, { time: [15, 20], name: "Humanidades I", duration: 50 }, { time: [16, 10], name: "Pensamiento Matemático I", duration: 50 }, { time: [17, 0], name: "La Materia y sus Interacciones", duration: 50 }],
    [{ time: [14, 10], name: "Humanidades I", duration: 50 }, { time: [15, 0], name: "Receso", duration: 20 }, { time: [15, 20], name: "Pensamiento Matemático I", duration: 50 }, { time: [16, 10], name: "Pensamiento Matemático I", duration: 50 }, { time: [17, 0], name: "Ciencias Sociales I", duration: 50 }],
    [{ time: [13, 20], name: "Formación Socioemocional I", duration: 50 }, { time: [14, 10], name: "Ciencias Sociales I", duration: 50 }, { time: [15, 0], name: "Receso", duration: 20 }, { time: [15, 20], name: "Lengua y Comunicación I", duration: 50 }, { time: [16, 10], name: "La Materia y sus Interacciones", duration: 50 }, { time: [17, 0], name: "Pensamiento Matemático I", duration: 50 }]
];

// =================== LÓGICA DE WIDGETS ===================

async function updateWidget() {
    if (!self.widgets) {
        console.log('SW: La API de widgets no está disponible.');
        return;
    }
    
    const now = new Date();
    const day = now.getDay();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    let currentClass = null;
    let nextClass = null;

    if (day >= 1 && day <= 5) {
        const todaySchedule = schedule[day - 1];
        for (let i = 0; i < todaySchedule.length; i++) {
            const classStartHour = todaySchedule[i].time[0];
            const classStartMinute = todaySchedule[i].time[1];
            const classStartTotalMinutes = classStartHour * 60 + classStartMinute;
            const classEndTotalMinutes = classStartTotalMinutes + classDuration;
            const nowTotalMinutes = currentHour * 60 + currentMinute;

            if (nowTotalMinutes >= classStartTotalMinutes && nowTotalMinutes < classEndTotalMinutes) {
                currentClass = { ...todaySchedule[i], index: i };
                break;
            }
        }

        if (currentClass) {
            if (currentClass.index + 1 < todaySchedule.length) {
                const nextClassStartHour = todaySchedule[currentClass.index + 1].time[0];
                const nextClassStartMinute = todaySchedule[currentClass.index + 1].time[1];
                const recessStartTotalMinutes = recessTime[0] * 60 + recessTime[1];
                 // Check if the next class is after recess
                 if(classEndTotalMinutes <= recessStartTotalMinutes && (nextClassStartHour * 60 + nextClassStartMinute) > recessStartTotalMinutes){
                    nextClass = { name: "Receso", time: recessTime };
                 } else {
                    nextClass = todaySchedule[currentClass.index + 1];
                 }
            } else {
                 nextClass = { name: "Fin de las clases por hoy", time: null };
            }
        } else {
            for (let i = 0; i < todaySchedule.length; i++) {
                const classStartTotalMinutes = todaySchedule[i].time[0] * 60 + todaySchedule[i].time[1];
                if (classStartTotalMinutes > (currentHour * 60 + currentMinute)) {
                    nextClass = todaySchedule[i];
                    break;
                }
            }
        }
    }
    
    const widgetData = {
        currentTitle: currentClass ? "Clase Actual:" : "No hay clase ahora",
        currentSubtitle: currentClass ? currentClass.name : "¡Tiempo libre!",
        nextTitle: nextClass ? "Siguiente:" : " ",
        nextSubtitle: nextClass ? `${nextClass.name}${nextClass.time ? ` a las ${String(nextClass.time[0]).padStart(2, '0')}:${String(nextClass.time[1]).padStart(2, '0')}` : ''}` : "Mañana será otro día."
    };

    const template = await caches.match('widget_template.json');
    if (!template) {
        console.error('SW: No se encontró el template del widget en la caché.');
        return;
    }
    
    const templateContent = await template.text();
    
    try {
        await self.widgets.updateByTag('schedule-widget', {
            template: templateContent,
            data: JSON.stringify(widgetData)
        });
        console.log('SW: Widget actualizado correctamente.');
    } catch (err) {
        console.error('SW: Fallo al actualizar el widget:', err);
    }
}


// Event listeners para el ciclo de vida del widget
self.addEventListener('widgetinstall', event => {
    console.log('SW: Widget instalado.', event);
    event.waitUntil(updateWidget());
});

self.addEventListener('widgetclick', event => {
    if (event.action === 'open-app') {
        event.waitUntil(clients.openWindow('/'));
    }
});

// Actualización periódica para mantener el widget al día
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-widget-periodic') {
    event.waitUntil(updateWidget());
  }
});


// =================== LÓGICA DE NOTIFICACIONES DE CLASES ===================

let notificationTimer = null;
let notificationsEnabled = false;
const NOTIFICATION_LEAD_TIME = 2 * 60 * 1000; // Notificar 2 minutos antes

function scheduleNextNotification() {
    clearTimeout(notificationTimer);
    if (!notificationsEnabled) {
        console.log('SW: Notificaciones de clase desactivadas. No se programará ninguna.');
        return;
    }

    const now = new Date();
    let nextClassInfo = null;

    // Buscar la próxima clase en los siguientes 7 días
    for (let i = 0; i < 7; i++) {
        const checkDate = new Date(now);
        checkDate.setDate(now.getDate() + i);
        const dayOfWeek = checkDate.getDay();

        if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Lunes a Viernes
            const todaySchedule = schedule[dayOfWeek - 1];
            for (const classItem of todaySchedule) {
                const classStartTime = new Date(checkDate);
                classStartTime.setHours(classItem.time[0], classItem.time[1], 0, 0);

                if (classStartTime > now) {
                    nextClassInfo = { ...classItem, startTime: classStartTime };
                    // Encontramos la próxima clase, salimos de los bucles
                    i = 7; 
                    break;
                }
            }
        }
    }

    if (nextClassInfo) {
        const notificationTime = new Date(nextClassInfo.startTime.getTime() - NOTIFICATION_LEAD_TIME);
        const timeUntilNotification = notificationTime.getTime() - now.getTime();

        if (timeUntilNotification > 0) {
            console.log(`SW: Próxima notificación programada para "${nextClassInfo.name}" a las ${notificationTime.toLocaleTimeString()}`);
            notificationTimer = setTimeout(() => {
                self.registration.showNotification(nextClassInfo.name, {
                    body: `Tu clase comienza en 2 minutos.`,
                    icon: 'images/icons/icon-192x192.png',
                    tag: 'class-notification' // Usamos una etiqueta para que no se acumulen
                });
                // Volver a programar la siguiente después de esta
                setTimeout(scheduleNextNotification, 60 * 1000); // Esperar 1 min para evitar re-notificar la misma clase
            }, timeUntilNotification);
        } else {
             // Si ya pasó el tiempo de notificación, buscar la siguiente en 1 minuto
             setTimeout(scheduleNextNotification, 60 * 1000);
        }
    } else {
        console.log('SW: No se encontraron próximas clases para notificar.');
    }
}

self.addEventListener('message', event => {
    const { type, payload } = event.data;

    if (type === 'SET_NOTIFICATIONS') {
        notificationsEnabled = payload.enabled;
        console.log(`SW: Notificaciones de clase ${notificationsEnabled ? 'ACTIVADAS' : 'DESACTIVADAS'}.`);
        scheduleNextNotification(); // (Re)programar notificaciones al cambiar el estado
    }

    if (type === 'TEST_NOTIFICATION') {
        const delaySeconds = event.data.delay || 0;
        console.log(`SW: Recibida solicitud para notificación de prueba en ${delaySeconds}s.`);
        
        // Usar un temporizador diferente para la prueba para no interferir
        setTimeout(() => {
            self.registration.showNotification('¡Notificación de Prueba! 🧪', {
                body: 'Si ves esto, las notificaciones funcionan incluso con la app cerrada.',
                icon: 'images/icons/icon-192x192.png',
                tag: 'test-notification'
            });
            console.log('SW: Notificación de prueba enviada.');
        }, delaySeconds * 1000);
    }
});

// =================== LÓGICA DE BACKGROUND SYNC (ONE-OFF) ===================

self.addEventListener('sync', event => {
    console.log('SW: Evento de sincronización de fondo recibido:', event.tag);
    
    if (event.tag === 'update-app-content') {
        console.log('SW: Sincronizando contenido de la app...');
        event.waitUntil(
            caches.open(CACHE_NAME).then(cache => {
                console.log('SW: Re-cacheando archivos principales.');
                // Aquí podrías volver a descargar los archivos importantes
                // para asegurar que la app esté actualizada la próxima vez que se abra.
                return cache.addAll(urlsToCache);
            })
        );
    }
});

// =================== LÓGICA DE INSTALACIÓN Y CACHÉ ===================

self.addEventListener('install', event => {
    console.log('SW: Instalando nueva versión...');
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    console.log('SW: Activando nueva versión y limpiando cachés antiguos...');
    event.waitUntil(
        Promise.all([
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.filter(cacheName => cacheName !== CACHE_NAME).map(cacheName => caches.delete(cacheName))
                );
            }),
            // Registrar la sincronización periódica cuando el SW se activa
            self.registration.periodicSync?.register('update-widget-periodic', {
                minInterval: 15 * 60 * 1000, // Cada 15 minutos
            }).catch(e => console.error('SW: Fallo al registrar la sincronización periódica:', e)),
            scheduleNextNotification() // Programar notificaciones al activar
        ])
    );
    return self.clients.claim();
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request).then(fetchResponse => {
                return caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, fetchResponse.clone());
                    return fetchResponse;
                });
            });
        })
    );
});