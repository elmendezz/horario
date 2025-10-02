// sw.js (Versión con Widgets)

const CACHE_NAME = 'horario-1cv-cache-v8';
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
    [{ time: [12, 30], name: "Cultura Digital I" }, { time: [13, 20], name: "Ingles I" }, { time: [14, 10], name: "Ingles I" }, { time: [15, 20], name: "Humanidades I" }, { time: [16, 10], name: "Lengua y Comunicación I" }, { time: [17, 0], name: "La Materia y sus Interacciones" }],
    [{ time: [13, 20], name: "Cultura Digital I" }, { time: [14, 10], name: "Cultura Digital I" }, { time: [15, 20], name: "Lengua y Comunicación I" }, { time: [16, 10], name: "La Materia y sus Interacciones" }, { time: [17, 0], name: "Ingles I" }],
    [{ time: [14, 10], name: "Humanidades I" }, { time: [15, 20], name: "Humanidades I" }, { time: [16, 10], name: "Pensamiento Matematico I" }, { time: [17, 0], name: "La Materia y sus Interacciones" }],
    [{ time: [14, 10], name: "Humanidades I" }, { time: [15, 20], name: "Pensamiento Matematico I" }, { time: [16, 10], name: "Pensamiento Matematico I" }, { time: [17, 0], name: "Ciencias Sociales I" }],
    [{ time: [13, 20], name: "Formacion Socioemocional I" }, { time: [14, 10], name: "Ciencias Sociales I" }, { time: [15, 20], name: "Lengua y Comunicación I" }, { time: [16, 10], name: "La Materia y sus Interacciones" }, { time: [17, 0], name: "Pensamiento Matematico I" }]
];
const classDuration = 50;
const recessTime = [15, 0];
const recessDuration = 20;

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


// =================== LÓGICA DE NOTIFICACIONES (Tu código existente) ===================

let notificationTimer = null;

self.addEventListener('message', event => {
    if (event.data.type === 'TEST_NOTIFICATION') {
        const delaySeconds = event.data.delay || 0;
        console.log(`SW: Recibida solicitud para notificación de prueba en ${delaySeconds}s.`);
        
        clearTimeout(notificationTimer);
        notificationTimer = setTimeout(() => {
            self.registration.showNotification('¡Notificación de Prueba! 🧪', {
                body: 'Si ves esto, las notificaciones funcionan incluso con la app cerrada.',
                icon: 'images/icons/icon-192x192.png'
            });
            console.log('SW: Notificación de prueba enviada.');
        }, delaySeconds * 1000);
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
                minInterval: 1* 60 * 1000, // Cada 15 minutos
            }).catch(e => console.error('SW: Fallo al registrar la sincronización periódica:', e))
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