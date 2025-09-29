// sw.js (Versión 5 - Corregida y unificada)

// 1. Define un nombre y versión para tu caché.
const CACHE_NAME = 'horario-1cv-cache-v6'; // <-- VERSIÓN ACTUALIZADA

// 2. Lista de archivos esenciales de tu app.
const urlsToCache = ['/', 'index.html', 'horario.jpg', 'manifest.json', 'images/icons/icon-192x192.png'];

// =================== LÓGICA DE NOTIFICACIONES ===================

let notificationTimer = null;

// **IMPORTANTE**: El horario debe estar aquí porque el SW no puede ver el de index.html
const schedule = [
    // Lunes (1)
    [{ time: [12, 30], name: "Cultura Digital I" }, { time: [13, 20], name: "Ingles I" }, { time: [14, 10], name: "Ingles I" }, { time: [15, 20], name: "Humanidades I" }, { time: [16, 10], name: "Lengua y Comunicación I" }, { time: [17, 0], name: "La Materia y sus Interacciones" }],
    // Martes (2)
    [{ time: [13, 20], name: "Cultura Digital I" }, { time: [14, 10], name: "Cultura Digital I" }, { time: [15, 20], name: "Lengua y Comunicación I" }, { time: [16, 10], name: "La Materia y sus Interacciones" }, { time: [17, 0], name: "Ingles I" }],
    // Miércoles (3)
    [{ time: [14, 10], name: "Humanidades I" }, { time: [15, 20], name: "Humanidades I" }, { time: [16, 10], name: "Pensamiento Matemático I" }, { time: [17, 0], name: "La Materia y sus Interacciones" }],
    // Jueves (4)
    [{ time: [14, 10], name: "Humanidades I" }, { time: [15, 20], name: "Pensamiento Matemático I" }, { time: [16, 10], name: "Pensamiento Matemático I" }, { time: [17, 0], name: "Ciencias Sociales I" }],
    // Viernes (5)
    [{ time: [13, 20], name: "Formación Socioemocional I" }, { time: [14, 10], name: "Ciencias Sociales I" }, { time: [15, 20], name: "Lengua y Comunicación I" }, { time: [16, 10], name: "La Materia y sus Interacciones" }, { time: [17, 0], name: "Pensamiento Matemático I" }]
];

// Función que calcula y programa la próxima notificación
function scheduleNextNotification() {
    clearTimeout(notificationTimer);

    const now = new Date();
    let nextNotificationTime = null;
    let nextClass = null;

    // Buscamos la próxima clase en los próximos 7 días
    for (let i = 0; i < 7; i++) {
        const checkDate = new Date(now);
        checkDate.setDate(now.getDate() + i);
        const dayOfWeek = checkDate.getDay();

        if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Lunes a Viernes
            const todaySchedule = schedule[dayOfWeek - 1];
            for (const classInfo of todaySchedule) {
                const classTime = new Date(checkDate);
                classTime.setHours(classInfo.time[0], classInfo.time[1], 0, 0);

                // La hora para la notificación es 5 minutos antes
                const notificationTime = new Date(classTime.getTime() - 5 * 60 * 1000);

                if (notificationTime > now) {
                    if (!nextNotificationTime || notificationTime < nextNotificationTime) {
                        nextNotificationTime = notificationTime;
                        nextClass = classInfo;
                    }
                }
            }
        }
    }

    if (nextNotificationTime && nextClass) {
        const delay = nextNotificationTime.getTime() - now.getTime();
        console.log(`SW: Próxima notificación programada para "${nextClass.name}" en ${Math.round(delay / 60000)} minutos.`);
        
        notificationTimer = setTimeout(() => {
            self.registration.showNotification('Próxima Clase en 5 Minutos', {
                body: `${nextClass.name} está a punto de comenzar.`,
                icon: 'images/icons/icon-192x192.png' // Icono para la notificación
            });
            // Una vez mostrada, reprogramamos la siguiente
            scheduleNextNotification();
        }, delay);
    } else {
        console.log('SW: No hay más clases para notificar en los próximos 7 días.');
    }
}

// Escuchamos mensajes de la página (VERSIÓN CORREGIDA Y ÚNICA)
self.addEventListener('message', event => {
    // Maneja la activación y desactivación de notificaciones
    if (event.data.type === 'SET_NOTIFICATIONS') {
        if (event.data.enabled) {
            console.log('SW: Activando y programando notificaciones.');
            scheduleNextNotification();
        } else {
            console.log('SW: Desactivando y cancelando notificaciones.');
            clearTimeout(notificationTimer);
        }
    }

    // Maneja la notificación de prueba
    if (event.data.type === 'TEST_NOTIFICATION') {
        const delaySeconds = event.data.delay || 5;
        console.log(`SW: Notificación de prueba programada en ${delaySeconds} segundos.`);
        
        setTimeout(() => {
            self.registration.showNotification('🔔 ¡Notificación de Prueba! 🔔', {
                body: 'Si puedes ver esto, ¡las notificaciones funcionan correctamente!',
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
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(cacheName => cacheName !== CACHE_NAME).map(cacheName => caches.delete(cacheName))
            );
        })
    );
    return self.clients.claim();
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            // Si está en caché, lo devuelve. Si no, lo busca en la red.
            return response || fetch(event.request).then(fetchResponse => {
                // Guarda la nueva respuesta en la caché para futuras visitas
                return caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, fetchResponse.clone());
                    return fetchResponse;
                });
            });
        })
    );
});