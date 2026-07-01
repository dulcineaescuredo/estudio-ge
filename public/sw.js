self.addEventListener('push', function(event) {
  let data = {};
  if (event.data) {
    try { data = event.data.json(); } catch(e) {}
  }
  const title = data.title || 'Estudio GE';
  const options = {
    body: data.body || '',
    data: { url: data.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});
