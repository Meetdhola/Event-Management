/* eslint-disable no-restricted-globals */
self.addEventListener('push', function(event) {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            vibrate: [200, 100, 200], // WhatsApp-style vibration
            data: {
                dateOfArrival: Date.now(),
                primaryKey: '1'
            },
            actions: [
                {
                    action: 'explore',
                    title: 'View Mission Details'
                },
                {
                    action: 'close',
                    title: 'Dismiss'
                }
            ],
            tag: 'mission-alert'
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    
    // Default action: focus/open the volunteer dashboard
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            for (let i = 0; i < clientList.length; i++) {
                let client = clientList[i];
                if (client.url.includes('/volunteer-dashboard') && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('/volunteer-dashboard');
            }
        })
    );
});
