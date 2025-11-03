// sw.js (Versión con Widgets)

const CACHE_NAME = 'horario-1cv-cache-v91'; // Incrementamos la versión del caché
const ASSETS_CACHE_NAME = 'assets-cache-v1'; // Nuevo caché para assets dinámicos
import { schedule } from './schedule-data.js';
import { getCurrentAndNextClass } from './schedule-utils.js';
const urlsToCache = [
    '/', 
    'index.html', 
    'horario.jpg', 
    'manifest.json', 
    'widget_template.json',
    'images/icons/icon-192x192.png',
    // Módulos JS principales
    'schedule-data.js',
    'schedule-utils.js',
    'notification-logic.js',
    'ui-logic.js',
    'script.js',
    'offline-logic.js', // <-- AÑADIR EL NUEVO SCRIPT
    'style.css',
    // Páginas estáticas para acceso offline
    'about-us.html',
    'feedback.html',
    'changelog.html',
    'notification-settings.html',
    'offline.html' // <-- AÑADIR LA NUEVA PÁGINA A LA CACHÉ
];

// Variable para el temporizador de notificaciones de fallback.
let notificationTimer;

// =================== LÓGICA DE WIDGETS ===================

async function updateWidget() {
    if (!self.widgets) {
        console.log('SW: La API de widgets no está disponible.');
        return;
    }

    const now = new Date();
    // Usamos la lógica centralizada y robusta para obtener la clase actual y siguiente.
    const { currentClass, nextClass } = await getCurrentAndNextClass(now);
    
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
    event.waitUntil(checkAndShowDueNotifications());
    event.waitUntil(updateWidget());
  }
});


// =================== LÓGICA DE NOTIFICACIONES DE CLASES ===================

let notificationsEnabled = false;
let notificationLeadTime = 2; // Notificar X minutos antes. Valor por defecto.

/**
 * Abre la base de datos IndexedDB.
 */
function openDB() {
    return new Promise((resolve, reject) => {
        const request = self.indexedDB.open('sw-settings-db', 1);
        request.onupgradeneeded = event => {
            const db = event.target.result;
            db.createObjectStore('settings');
        };
        request.onsuccess = event => resolve(event.target.result);
        request.onerror = event => reject(event.target.error);
    });
}

/**
 * Guarda un valor en IndexedDB.
 * @param {string} key
 * @param {any} value
 */
async function setSetting(key, value) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['settings'], 'readwrite');
        const store = transaction.objectStore('settings');
        const request = store.put(value, key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/**
 * Obtiene un valor de IndexedDB.
 * @param {string} key
 */
async function getSetting(key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['settings'], 'readonly');
        const store = transaction.objectStore('settings');
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Lógica de respaldo (fallback) para navegadores que no soportan Notification Triggers.
 * Programa la *próxima* notificación usando setTimeout y se apoya en periodicsync para ser robusto.
 */
async function scheduleNextNotificationFallback() {
    clearTimeout(notificationTimer); // Limpiar cualquier temporizador pendiente
    // En el nuevo modelo, esta función ya no programa con setTimeout.
    // Su propósito es simplemente asegurar que el estado es correcto.
    // La función checkAndShowDueNotifications() se encargará de mostrar las notificaciones.
    console.log('SW (Fallback): Verificando estado de notificaciones. La próxima sincronización mostrará las notificaciones pendientes.');

    if (!notificationsEnabled) {
        console.log('SW (Fallback): Notificaciones desactivadas.');
        return;
    }

    // Simplemente verificamos que todo esté en orden. No se necesita más aquí.
}

/**
 * (NUEVA FUNCIÓN)
 * Esta función se ejecuta periódicamente y al inicio.
 * Comprueba si alguna notificación de clase debería haberse mostrado y la muestra.
 * Es el corazón del nuevo sistema de fallback robusto.
 */
async function checkAndShowDueNotifications() {
    if (!notificationsEnabled || self.Notification.showTrigger) {
        // No hacer nada si las notificaciones están desactivadas o si el navegador usa el método moderno (Triggers).
        return;
    }

    console.log('SW (Fallback Check): Comprobando si hay notificaciones pendientes...');
    const now = new Date();

    for (let i = 0; i < 2; i++) { // Comprobar hoy y mañana
        const checkDate = new Date();
        checkDate.setDate(now.getDate() + i);
        const dayOfWeek = checkDate.getDay();

        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            const daySchedule = schedule[dayOfWeek - 1];
            for (const classItem of daySchedule) {
                if (classItem.name === "Receso") continue;

                const classStartTime = new Date(checkDate);
                classStartTime.setHours(classItem.time[0], classItem.time[1], 0, 0);
                const notificationTime = new Date(classStartTime.getTime() - (notificationLeadTime * 60 * 1000));

                // Comprobar si la notificación debió mostrarse en el último intervalo de chequeo (ej. 15 mins)
                const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
                if (notificationTime > fifteenMinutesAgo && notificationTime <= now) {
                    console.log(`SW (Fallback Check): Mostrando notificación pendiente para ${classItem.name}`);
                    self.registration.showNotification(classItem.name, {
                        body: `Tu clase está por comenzar.`, // Mensaje genérico ya que el tiempo exacto pasó
                        icon: 'images/icons/icon-192x192.png',
                        tag: `class-${classStartTime.getTime()}`
                    });
                }
            }
        }
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

    const now = new Date();
    let scheduledCount = 0;

    // Programar para los próximos 2 días para ser seguros
    for (let i = 0; i < 2; i++) {
        const checkDate = new Date(now);
        checkDate.setDate(now.getDate() + i);
        const dayOfWeek = checkDate.getDay();

        const { nextClass } = await getCurrentAndNextClass(checkDate);

        if (nextClass && nextClass.time) {
            const classStartTime = new Date(checkDate);
            classStartTime.setHours(nextClass.time[0], nextClass.time[1], 0, 0);
            const notificationTime = new Date(classStartTime.getTime() - (notificationLeadTime * 60 * 1000));

            if (notificationTime > now) {
                try {
                    await self.registration.showNotification(nextClass.name, {
                        body: `Tu clase comienza en ${notificationLeadTime} minutos.`,
                        icon: 'images/icons/icon-192x192.png',
                        tag: `class-${classStartTime.getTime()}`,
                        showTrigger: new TimestampTrigger(notificationTime.getTime()),
                    });
                    scheduledCount++;
                } catch (e) {
                    console.error('SW: Error al programar notificación:', e);
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

    if (type === 'GET_VERSION') {
        console.log('SW: Recibida solicitud de versión.');
        event.source.postMessage({ type: 'SW_VERSION', version: CACHE_NAME });
        return;
    }

    if (type === 'SET_NOTIFICATIONS') {
        notificationsEnabled = payload.enabled;
        event.waitUntil(setSetting('notificationsEnabled', notificationsEnabled));
        console.log(`SW: Notificaciones de clase ${notificationsEnabled ? 'ACTIVADAS' : 'DESACTIVADAS'}.`);
        event.waitUntil(scheduleClassNotifications()); // (Re)programar notificaciones al cambiar el estado
    }

    if (type === 'SET_LEAD_TIME') {
        notificationLeadTime = payload.leadTime || 2;
        event.waitUntil(setSetting('notificationLeadTime', notificationLeadTime));
        console.log(`SW: Tiempo de antelación para notificaciones actualizado a ${notificationLeadTime} minutos.`);
        event.waitUntil(scheduleClassNotifications()); // Re-programar con el nuevo tiempo
    }

    if (type === 'SKIP_WAITING') {
        console.log('SW: Recibida orden de activación. Saltando espera...');
        self.skipWaiting();
        return; // Salir después de manejar el mensaje
    }

    if (type === 'TEST_NOTIFICATION') {
        const delaySeconds = event.data.delay || 0;
        console.log(`SW: Solicitud para notificación de prueba en ${delaySeconds}s.`);

        const options = {
            body: 'Si ves esto, las notificaciones funcionan incluso con la app cerrada.',
            icon: 'images/icons/icon-192x192.png',
            tag: 'test-notification'
        };

        if (self.Notification.showTrigger) {
            // Método moderno y fiable
            options.showTrigger = new TimestampTrigger(Date.now() + delaySeconds * 1000);
            event.waitUntil(self.registration.showNotification('¡Notificación de Prueba! 🧪', options));
            console.log('SW: Notificación de prueba programada con TimestampTrigger.');
        } else {
            // Fallback con setTimeout (solo para la prueba, ya que es a corto plazo)
            setTimeout(() => self.registration.showNotification('¡Notificación de Prueba! 🧪', options), delaySeconds * 1000);
            console.log('SW: Notificación de prueba programada con setTimeout (fallback).');
        }
    }

    if (type === 'NEW_ANNOUNCEMENT_PUSH') {
        const { title, content } = payload;
        console.log('SW: Recibida solicitud para notificar nuevo anuncio.');
        event.waitUntil(
            self.registration.showNotification(`📢 Nuevo Anuncio: ${title}`, {
                body: content,
                icon: 'images/icons/icon-192x192.png',
                tag: 'new-announcement' // Etiqueta para agrupar o reemplazar notificaciones de anuncios
            })
        );
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
                return cache.addAll(urlsToCache).catch(err => console.error("SW Sync: Fallo al re-cachear", err));
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
    // Hacemos la instalación más robusta. En lugar de cache.addAll (que falla si un solo recurso no está disponible),
    // abrimos la caché y añadimos los recursos uno por uno, ignorando los fallos.
    // Esto es crucial para que las actualizaciones del SW no fallen si el usuario está offline.
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('SW: Cache abierta, añadiendo recursos principales.');
            const promises = urlsToCache.map(url => {
                return cache.add(url).catch(err => {
                    console.warn(`SW: Fallo al cachear ${url}, pero la instalación continúa.`, err);
                });
            });
            return Promise.all(promises);
        })
    );
    // Ya no llamamos a self.skipWaiting() aquí. Esperaremos a que el usuario lo active.
});

self.addEventListener('activate', event => {
    console.log('SW: Activando nueva versión y limpiando cachés antiguos...');
    event.waitUntil(
        (async () => {
            const cacheWhitelist = [CACHE_NAME, ASSETS_CACHE_NAME];
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames.map(cacheName => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        console.log(`SW: Borrando caché antigua: ${cacheName}`);
                        return caches.delete(cacheName);
                    }
                })
            );

            // Cargar configuración y registrar tareas asíncronas
            await Promise.all([
                getSetting('notificationsEnabled').then(value => { notificationsEnabled = value === true; }),
                getSetting('notificationLeadTime').then(value => { notificationLeadTime = value || 2; }),
                self.registration.periodicSync?.register('update-widget-periodic', { minInterval: 15 * 60 * 1000 })
            ]).catch(e => console.error("SW: Fallo durante la activación:", e));

            await scheduleClassNotifications();
            await checkAndShowDueNotifications();
            
            return self.clients.claim();
        })()
    );
});

self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);

    // Ignorar peticiones que no son http/https (ej. extensiones de chrome)
    if (!request.url.startsWith('http')) {
        return;
    }

    // Ignorar peticiones inyectadas por Vercel para evitar errores offline.
    if (url.hostname.includes('vercel.live')) {
        console.log('SW: Ignorando petición de Vercel Live:', request.url);
        return;
    }

    // Estrategia "Network First, then Cache" para las peticiones a la API (ej. anuncios).
    if (url.pathname.startsWith('/api/')) {
        // No cachear peticiones que no sean GET (como POST, DELETE, etc.)
        if (request.method !== 'GET') {
            return;
        }

        event.respondWith(
            fetch(request)
                .then(networkResponse => {
                    const responseClone = networkResponse.clone();
                    caches.open(ASSETS_CACHE_NAME).then(cache => {
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
        return;
    }

    // Estrategia "Stale-While-Revalidate" para CSS
    if (request.destination === 'style') {
        event.respondWith(
            caches.open(ASSETS_CACHE_NAME).then(cache => {
                return cache.match(request).then(cachedResponse => {
                    const fetchPromise = fetch(request).then(networkResponse => {
                        cache.put(request, networkResponse.clone());
                        return networkResponse;
                    });
                    // Devolver la respuesta de la caché inmediatamente, si existe.
                    return cachedResponse || fetchPromise;
                });
            })
        );
        return;
    }

    // Estrategia "Cache First" para fuentes y otros assets
    if (request.destination === 'font' || request.destination === 'image') {
        event.respondWith(
            caches.match(request).then(cachedResponse => {
                return cachedResponse || fetch(request).then(networkResponse => {
                    const responseClone = networkResponse.clone();
                    caches.open(ASSETS_CACHE_NAME).then(cache => cache.put(request, responseClone));
                    return networkResponse;
                });
            })
        );
        return;
    } else {
        // Estrategia "Cache First" para el resto (HTML, JS, etc. precacheados)
        // Esta es la estrategia más robusta para el "App Shell".
        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                // Si la respuesta está en la caché, la devolvemos inmediatamente.
                if (cachedResponse) {
                    return cachedResponse;
                }
                // Si no está en la caché, intentamos obtenerla de la red.
                return fetch(event.request).catch(() => {
                    // Si la red también falla y es una petición de navegación,
                    // devolvemos la página offline como último recurso.
                    if (event.request.mode === 'navigate') {
                        return caches.match('offline.html');
                    }
                })
            })
        );
    }
});