// sw.js (Versión con Widgets)

const CACHE_NAME = 'horario-1cv-cache-v90'; // Incrementamos la versión del caché
const urlsToCache = [
    '/', 
    'index.html', 
    'horario.jpg', 
    'manifest.json',
    'widget_template.json', // Agregamos el template del widget a la caché
    'images/icons/icon-192x192.png',
    'schedule-data.js', // ¡Añadimos el horario centralizado a la caché!
    'schedule-utils.js',
    'notification-logic.js',
    'ui-logic.js',
    'script.js',
    'style.css'
];

// Variable global para almacenar el horario una vez cargado.
let scheduleData = null;

/**
 * Carga el horario desde el módulo centralizado.
 * Usa una variable global para cachear el resultado y no importarlo múltiples veces.
 */
async function getSchedule() {
    if (!scheduleData) {
        console.log('SW: Cargando datos del horario por primera vez...');
        // Usamos import() dinámico, que funciona en Service Workers modernos.
        scheduleData = await import('./schedule-data.js');
    }
    return scheduleData;
}

// =================== LÓGICA DE WIDGETS ===================

async function updateWidget() {
    if (!self.widgets) {
        console.log('SW: La API de widgets no está disponible.');
        return;
    }

    // Obtenemos el horario y la duración de la clase de forma asíncrona.
    const { schedule, classDuration } = await getSchedule();
    
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
    // Aprovechamos la sincronización periódica para re-evaluar las notificaciones,
    // lo que hace más robusto el sistema de fallback.
    if (notificationsEnabled && !self.Notification.showTrigger) {
        scheduleNextNotificationFallback();
    }
    event.waitUntil(updateWidget());
  }
});


// =================== LÓGICA DE NOTIFICACIONES DE CLASES ===================

let notificationsEnabled = false;
let notificationTimer = null; // Para el fallback con setTimeout
let notificationLeadTime = 2; // Notificar X minutos antes. Valor por defecto.


/**
 * Lógica de respaldo (fallback) para navegadores que no soportan Notification Triggers.
 * Programa la *próxima* notificación usando setTimeout y se apoya en periodicsync para ser robusto.
 */
async function scheduleNextNotificationFallback() {
    clearTimeout(notificationTimer); // Limpiar cualquier temporizador pendiente

    if (!notificationsEnabled) {
        console.log('SW (Fallback): Notificaciones desactivadas.');
        return;
    }

    const { schedule } = await getSchedule();

    const now = new Date();
    let nextNotificationDetails = null;

    // Buscar la próxima clase en los siguientes 7 días
    for (let i = 0; i < 7; i++) {
        const checkDate = new Date(now);
        checkDate.setDate(now.getDate() + i);
        const dayOfWeek = checkDate.getDay();

        if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Lunes a Viernes
            const todaySchedule = schedule[dayOfWeek - 1];
            for (const classItem of todaySchedule) {
                if (classItem.name === "Receso") continue;

                const classStartTime = new Date(checkDate);
                classStartTime.setHours(classItem.time[0], classItem.time[1], 0, 0);

                const notificationTime = new Date(classStartTime.getTime() - (notificationLeadTime * 60 * 1000));

                if (notificationTime > now) {
                    nextNotificationDetails = {
                        time: notificationTime,
                        title: classItem.name,
                        body: `Tu clase comienza en ${notificationLeadTime} minutos.`
                    };
                    // Rompemos los bucles en cuanto encontramos la más próxima
                    i = 7;
                    break;
                }
            }
        }
    }

    if (nextNotificationDetails) {
        const timeUntilNotification = nextNotificationDetails.time.getTime() - now.getTime();
        console.log(`SW (Fallback): Próxima notificación para "${nextNotificationDetails.title}" programada en ${Math.round(timeUntilNotification / 60000)} minutos.`);

        notificationTimer = setTimeout(() => {
            self.registration.showNotification(nextNotificationDetails.title, {
                body: nextNotificationDetails.body,
                icon: 'images/icons/icon-192x192.png',
                tag: `class-${nextNotificationDetails.time.getTime()}` // Etiqueta única
            });
            // Una vez mostrada, se auto-invoca para programar la siguiente.
            // Se añade un pequeño delay para no volver a programar la misma.
            setTimeout(scheduleNextNotificationFallback, 2000);
        }, timeUntilNotification);
    } else {
        console.log('SW (Fallback): No hay próximas clases para notificar.');
    }
}

/**
 * Orquestador principal de notificaciones.
 * Intenta usar el método moderno (Triggers) y si no puede, usa el fallback (setTimeout).
 */
async function scheduleClassNotifications() {
    // Si el navegador soporta Triggers, usamos el método preferido.
    if (self.Notification.showTrigger) {
        await scheduleClassNotificationsWithTriggers();
    } else {
        // Si no, usamos el método de respaldo.
        console.warn('SW: Notification Triggers no soportado. Usando fallback con setTimeout.');
        await scheduleNextNotificationFallback();
    }
}

/**
 * Programa notificaciones usando el método moderno y preferido: Notification Triggers.
 */
async function scheduleClassNotificationsWithTriggers() {
    // Primero, cancelar todas las notificaciones programadas anteriormente para evitar duplicados.
    const existingNotifications = await self.registration.getNotifications({
        includeTriggered: true
    });
    for (const notification of existingNotifications) {
        if (notification.tag && notification.tag.startsWith('class-')) {
            notification.close();
        }
    }
    console.log('SW: Notificaciones de clase anteriores canceladas.');

    if (!notificationsEnabled) {
        console.log('SW (Triggers): Notificaciones desactivadas, no se programará nada.');
        return; 
    }

    const { schedule } = await getSchedule();

    const now = new Date();
    let scheduledCount = 0;

    // Programar para los próximos 2 días para ser seguros
    for (let i = 0; i < 2; i++) {
        const checkDate = new Date(now);
        checkDate.setDate(now.getDate() + i);
        const dayOfWeek = checkDate.getDay();

        if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Lunes a Viernes
            const todaySchedule = schedule[dayOfWeek - 1];
            for (const classItem of todaySchedule) {
                if (classItem.name === "Receso") continue; // No notificar recesos

                const classStartTime = new Date(checkDate);
                classStartTime.setHours(classItem.time[0], classItem.time[1], 0, 0);

                const notificationTime = new Date(classStartTime.getTime() - (notificationLeadTime * 60 * 1000));

                // Solo programar si la notificación es en el futuro
                if (notificationTime > now) {
                    try {
                        await self.registration.showNotification(classItem.name, {
                            body: `Tu clase comienza en ${notificationLeadTime} minutos.`,
                            icon: 'images/icons/icon-192x192.png',
                            tag: `class-${classStartTime.getTime()}`, // Etiqueta única para cada notificación
                            showTrigger: new TimestampTrigger(notificationTime.getTime()),
                        });
                        scheduledCount++;
                    } catch (e) {
                        console.error('SW: Error al programar notificación:', e);
                    }
                }
            }
        }
    }

    if (scheduledCount > 0) {
        console.log(`SW (Triggers): ${scheduledCount} notificaciones de clase programadas.`);
    } else {
        console.log('SW (Triggers): No hay próximas clases para programar notificaciones.');
    }
}

self.addEventListener('message', event => {
    const { type, payload } = event.data;

    if (type === 'SET_NOTIFICATIONS') {
        notificationsEnabled = payload.enabled;
        console.log(`SW: Notificaciones de clase ${notificationsEnabled ? 'ACTIVADAS' : 'DESACTIVADAS'}.`);
        event.waitUntil(scheduleClassNotifications()); // (Re)programar notificaciones al cambiar el estado
    }

    if (type === 'SET_LEAD_TIME') {
        notificationLeadTime = payload.leadTime || 2;
        console.log(`SW: Tiempo de antelación para notificaciones actualizado a ${notificationLeadTime} minutos.`);
        event.waitUntil(scheduleClassNotifications()); // Re-programar con el nuevo tiempo
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

// =================== LÓGICA DE CLICK EN NOTIFICACIÓN ===================

self.addEventListener('notificationclick', event => {
    console.log('SW: Notificación clickeada', event.notification.tag);
    event.notification.close(); // Cerrar la notificación al ser tocada

    // Esta lógica abre la app. Busca si ya hay una ventana abierta y la enfoca.
    // Si no hay ninguna, abre una nueva.
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            for (let i = 0; i < windowClients.length; i++) {
                const windowClient = windowClients[i];
                if (windowClient.url.endsWith('/') && 'focus' in windowClient) {
                    return windowClient.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
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
            scheduleClassNotifications() // Programar notificaciones al activar
        ])
    );
    return self.clients.claim();
});

self.addEventListener('fetch', event => {
    const request = event.request;

    // Estrategia "Network First, then Cache" para las peticiones a la API (ej. anuncios).
    if (request.url.includes('/api/')) { // Identifica las llamadas a nuestra API
        event.respondWith(
            fetch(request)
                .then(networkResponse => {
                    // Si la red responde, actualizamos la caché con la nueva respuesta
                    // y devolvemos la respuesta de la red.
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, responseClone);
                    });
                    return networkResponse;
                })
                .catch(error => {
                    // Si la red falla (estamos offline), intentamos servir desde la caché como respaldo.
                    console.warn(`SW: Fallo de red para ${request.url}. Intentando desde caché.`);
                    return caches.match(request);
                })
        );
    } else {
        // Estrategia "Cache First" para todos los demás recursos (HTML, CSS, JS, imágenes).
        // Sirve desde la caché si está disponible para una carga súper rápida.
        // Si no está en caché, lo busca en la red.
        event.respondWith(
            caches.match(request).then(cachedResponse => {
                return cachedResponse || fetch(request);
            })
        );
    }
});